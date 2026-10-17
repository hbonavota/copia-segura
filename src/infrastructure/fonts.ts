/**
 * Tipografía de la marca de agua. Solo fuentes del sistema: la CSP no permite descargar ninguna
 * (ADR-0005) y así el resultado no depende de la red.
 */
export const WATERMARK_FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Cadena `font` de canvas para un tamaño dado. La usan el medidor y el rasterizador por igual. */
export function watermarkFont(fontPx: number): string {
  return `600 ${fontPx}px ${WATERMARK_FONT_STACK}`;
}

export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
export type AnyContext2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** Lienzo fuera de pantalla si el navegador lo ofrece; si no, un `<canvas>` sin insertar. */
export function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function context2d(canvas: AnyCanvas): AnyContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no ofrece un contexto 2D de canvas.');
  return ctx;
}
