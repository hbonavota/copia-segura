import {
  pixelBlockSize,
  type CopyPlan,
  type PixelRect,
  type Rotation,
  type Size,
  type WatermarkLayout,
} from '../domain';
import type { Bitmap, Raster, Rasterizer } from '../application';
import { context2d, createCanvas, watermarkFont, type AnyCanvas, type AnyContext2D } from './fonts';

/**
 * Ejecuta un `CopyPlan` sobre un canvas. Es la única pieza que pinta píxeles; todo lo que decide
 * qué pintar viene calculado del dominio.
 */
export class CanvasRasterizer implements Rasterizer {
  render(source: Bitmap, plan: CopyPlan): Promise<Raster> {
    const canvas = createCanvas(plan.output.width, plan.output.height);
    const ctx = context2d(canvas);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Origen → giro → recorte → escala (SPEC-0004, regla 2).
    ctx.save();
    ctx.scale(plan.scale, plan.scale);
    ctx.translate(-plan.cropPx.x, -plan.cropPx.y);
    drawRotated(ctx, source, plan.rotation, plan.rotated);
    ctx.restore();

    // 1b. Blanco y negro (RF-15): solo el documento; la marca se dibuja después y conserva su color.
    if (plan.grayscale) toGrayscale(ctx, plan.output);

    // 2. Máscaras: negro opaco sobre los píxeles (RF-06) o pixelado grueso (RF-28).
    if (plan.redaction === 'pixelate') {
      for (const mask of plan.masksPx) pixelate(ctx, mask, plan.output);
    } else {
      ctx.fillStyle = '#000';
      for (const mask of plan.masksPx) ctx.fillRect(mask.x, mask.y, mask.w, mask.h);
    }

    // 3. Marca de agua (RF-07).
    if (plan.watermark) drawWatermark(ctx, plan.watermark, plan.output);

    return Promise.resolve(new CanvasRaster(canvas));
  }
}

function drawRotated(ctx: AnyContext2D, image: Bitmap, rotation: Rotation, rotated: Size): void {
  switch (rotation) {
    case 0:
      ctx.drawImage(image, 0, 0);
      return;
    case 90:
      ctx.translate(rotated.width, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(image, 0, 0);
      return;
    case 180:
      ctx.translate(rotated.width, rotated.height);
      ctx.rotate(Math.PI);
      ctx.drawImage(image, 0, 0);
      return;
    case 270:
      ctx.translate(0, rotated.height);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(image, 0, 0);
      return;
  }
}

/**
 * Pixelado grueso (RF-28): cada bloque se rellena con la media de sus píxeles. La media se calcula
 * aquí, no con el suavizado del navegador (que no promedia igual en todos), así que el resultado
 * es el mismo en cualquier navegador y no queda ningún píxel original dentro de la zona.
 */
function pixelate(ctx: AnyContext2D, mask: PixelRect, output: Size): void {
  const x0 = Math.max(0, mask.x);
  const y0 = Math.max(0, mask.y);
  const w = Math.min(output.width, mask.x + mask.w) - x0;
  const h = Math.min(output.height, mask.y + mask.h) - y0;
  if (w <= 0 || h <= 0) return;
  const block = pixelBlockSize({ x: x0, y: y0, w, h });
  const image = ctx.getImageData(x0, y0, w, h);
  const px = image.data;
  for (let by = 0; by < h; by += block) {
    for (let bx = 0; bx < w; bx += block) {
      const bw = Math.min(block, w - bx);
      const bh = Math.min(block, h - by);
      let r = 0;
      let g = 0;
      let b = 0;
      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          const i = (y * w + x) * 4;
          r += px[i] ?? 0;
          g += px[i + 1] ?? 0;
          b += px[i + 2] ?? 0;
        }
      }
      const n = bw * bh;
      ctx.fillStyle = `rgb(${Math.round(r / n)} ${Math.round(g / n)} ${Math.round(b / n)})`;
      ctx.fillRect(x0 + bx, y0 + by, bw, bh);
    }
  }
}

/** Escala de grises por luminancia Rec. 601, píxel a píxel (no depende de `ctx.filter`). */
function toGrayscale(ctx: AnyContext2D, size: Size): void {
  const image = ctx.getImageData(0, 0, size.width, size.height);
  const px = image.data;
  for (let i = 0; i < px.length; i += 4) {
    const y = Math.round(
      0.299 * (px[i] ?? 0) + 0.587 * (px[i + 1] ?? 0) + 0.114 * (px[i + 2] ?? 0),
    );
    px[i] = y;
    px[i + 1] = y;
    px[i + 2] = y;
  }
  ctx.putImageData(image, 0, 0);
}

function drawWatermark(ctx: AnyContext2D, layout: WatermarkLayout, output: Size): void {
  ctx.save();
  ctx.translate(output.width / 2, output.height / 2);
  // Ángulo positivo = el texto asciende hacia la derecha (antihorario en pantalla).
  const angle = (-layout.angleDeg * Math.PI) / 180;
  ctx.rotate(angle);
  ctx.font = watermarkFont(layout.fontPx);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.globalAlpha = layout.alpha;
  ctx.fillStyle = `rgb(${layout.color.r} ${layout.color.g} ${layout.color.b})`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = layout.outlinePx * 2;
  ctx.strokeStyle = '#fff';

  const textWidth = ctx.measureText(layout.text).width;
  const textHeight = layout.fontPx * 1.3;
  const visible = isVisible(output, angle, textWidth, textHeight);
  for (const tile of layout.tiles) {
    if (!visible(tile.x, tile.y)) continue;
    if (layout.outlinePx > 0) ctx.strokeText(layout.text, tile.x, tile.y);
    ctx.fillText(layout.text, tile.x, tile.y);
  }
  ctx.restore();
}

/**
 * Descarta las repeticiones que, una vez giradas, caen fuera de la imagen: el mosaico cubre un
 * cuadrado mayor que la diagonal y la mayoría de sus celdas no se ven.
 */
function isVisible(
  output: Size,
  angle: number,
  textWidth: number,
  textHeight: number,
): (x: number, y: number) => boolean {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const halfW = output.width / 2;
  const halfH = output.height / 2;
  return (x, y) => {
    const corners = [
      [x, y],
      [x + textWidth, y],
      [x, y + textHeight],
      [x + textWidth, y + textHeight],
    ] as const;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [cx, cy] of corners) {
      const rx = cx * cos - cy * sin;
      const ry = cx * sin + cy * cos;
      minX = Math.min(minX, rx);
      maxX = Math.max(maxX, rx);
      minY = Math.min(minY, ry);
      maxY = Math.max(maxY, ry);
    }
    return maxX >= -halfW && minX <= halfW && maxY >= -halfH && minY <= halfH;
  };
}

class CanvasRaster implements Raster {
  readonly size: Size;

  constructor(private readonly canvas: AnyCanvas) {
    this.size = { width: canvas.width, height: canvas.height };
  }

  toJpeg(quality: number): Promise<Blob> {
    const canvas = this.canvas;
    if (canvas instanceof OffscreenCanvas) {
      return canvas.convertToBlob({ type: 'image/jpeg', quality });
    }
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo codificar el JPEG.'))),
        'image/jpeg',
        quality,
      );
    });
  }

  toBitmap(): Promise<Bitmap> {
    return createImageBitmap(this.canvas);
  }

  dispose(): void {
    // Liberar la memoria del lienzo sin esperar al recolector.
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}
