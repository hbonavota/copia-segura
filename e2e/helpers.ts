import { readFileSync } from 'node:fs';
import { expect, type Download, type Page } from '@playwright/test';

/** Carga el documento de ejemplo y espera a que la vista previa esté dibujada (RF-11). */
export async function loadExample(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTestId('load-example').click();
  await page.locator('canvas.preview[data-ready="true"]').waitFor({ timeout: 45_000 });
}

/** Número de veces que se ha dibujado la vista previa (lo expone el editor en `data-render`). */
export function renderCount(page: Page): Promise<number> {
  return page
    .locator('canvas.preview')
    .getAttribute('data-render')
    .then((v) => Number(v ?? 0));
}

/** Ejecuta `action` y espera a que la vista previa se haya vuelto a dibujar después. */
export async function afterRender(page: Page, action: () => Promise<unknown>): Promise<void> {
  const before = await renderCount(page);
  await action();
  await expect.poll(() => renderCount(page), { timeout: 15_000 }).toBeGreaterThan(before);
}

/**
 * Quita la marca de agua (texto vacío y sin fecha). La marca se dibuja encima de las zonas
 * tapadas, así que para comprobar el negro de una zona hay que medir sin ella: dónde cae el texto
 * depende de las fuentes del sistema, y en otra máquina puede caer justo en el píxel medido.
 */
export async function withoutWatermark(page: Page): Promise<void> {
  await afterRender(page, () => page.getByTestId('text-freeText').fill(''));
  await afterRender(page, () => page.getByTestId('include-date').uncheck());
}

/** Negro, con la tolerancia que deja la compresión JPEG. */
export function isBlack([r, g, b]: readonly [number, number, number]): boolean {
  return Math.max(r, g, b) <= 16;
}

/** Arrastra sobre la vista previa entre dos puntos dados en fracción del lienzo. */
export async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  const box = await page.getByTestId('overlay').boundingBox();
  if (!box) throw new Error('La vista previa no está visible');
  await afterRender(page, async () => {
    await page.mouse.move(box.x + box.width * from.x, box.y + box.height * from.y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * to.x, box.y + box.height * to.y, { steps: 6 });
    await page.mouse.up();
  });
}

/** Color (r, g, b) de un punto de un JPEG, decodificándolo en el navegador (sin dependencias). */
export async function jpegPixel(
  page: Page,
  bytes: Buffer,
  at: { x: number; y: number },
): Promise<[number, number, number]> {
  return page.evaluate(
    async ({ base64, x, y }) => {
      const binary = atob(base64);
      const data = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([data], { type: 'image/jpeg' }));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('sin canvas');
      ctx.drawImage(bitmap, 0, 0);
      const px = ctx.getImageData(
        Math.floor(bitmap.width * x),
        Math.floor(bitmap.height * y),
        1,
        1,
      ).data;
      return [px[0] ?? 0, px[1] ?? 0, px[2] ?? 0] as [number, number, number];
    },
    { base64: bytes.toString('base64'), x: at.x, y: at.y },
  );
}

/** Color (r, g, b) de un punto de la vista previa, en fracción del lienzo. */
export async function previewPixel(
  page: Page,
  at: { x: number; y: number },
): Promise<[number, number, number]> {
  return page.evaluate(({ x, y }) => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas.preview');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) throw new Error('sin canvas');
    const data = ctx.getImageData(
      Math.floor(canvas.width * x),
      Math.floor(canvas.height * y),
      1,
      1,
    ).data;
    return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
  }, at);
}

export async function downloadBytes(download: Download): Promise<Buffer> {
  const path = await download.path();
  if (!path) throw new Error('La descarga no tiene ruta');
  return readFileSync(path);
}

/** Dimensiones de un JPEG leyendo su marcador SOF, y si contiene segmentos EXIF (APP1). */
export function inspectJpeg(bytes: Buffer): { width: number; height: number; hasExif: boolean } {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('No es un JPEG');
  let offset = 2;
  let hasExif = false;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`Marcador inválido en ${offset}`);
    const marker = bytes[offset + 1] ?? 0;
    const length = bytes.readUInt16BE(offset + 2);
    if (marker === 0xe1) hasExif = true;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
        hasExif,
      };
    }
    offset += 2 + length;
  }
  throw new Error('JPEG sin marcador SOF');
}
