import type { NormalizedRect, PixelRect, Rotation, Size } from './types';

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * Construye un rectángulo normalizado a partir de dos esquinas cualesquiera (p. ej. inicio y fin
 * de un arrastre), lo recorta a [0, 1] y garantiza ancho y alto positivos.
 */
export function rectFromCorners(ax: number, ay: number, bx: number, by: number): NormalizedRect {
  const x0 = clamp01(Math.min(ax, bx));
  const y0 = clamp01(Math.min(ay, by));
  const x1 = clamp01(Math.max(ax, bx));
  const y1 = clamp01(Math.max(ay, by));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Un rectángulo demasiado pequeño para ser intencionado (un clic sin arrastre). */
export function isNegligible(rect: NormalizedRect, minSide = 0.005): boolean {
  return rect.w < minSide || rect.h < minSide;
}

/** Tamaño del marco de página tras aplicar un giro. */
export function rotatedSize(size: Size, rotation: Rotation): Size {
  return rotation === 90 || rotation === 270 ? { width: size.height, height: size.width } : size;
}

export function nextRotation(rotation: Rotation, deltaDeg: 90 | -90): Rotation {
  const next = (((rotation + deltaDeg) % 360) + 360) % 360;
  return next as Rotation;
}

/**
 * Transforma un rectángulo del marco de página cuando la página gira `deltaDeg` en sentido
 * horario, de modo que siga cubriendo el mismo contenido (SPEC-0004, regla 3).
 */
export function rotateRect(rect: NormalizedRect, deltaDeg: 90 | 180 | 270): NormalizedRect {
  switch (deltaDeg) {
    case 90:
      return { x: 1 - rect.y - rect.h, y: rect.x, w: rect.h, h: rect.w };
    case 180:
      return { x: 1 - rect.x - rect.w, y: 1 - rect.y - rect.h, w: rect.w, h: rect.h };
    case 270:
      return { x: rect.y, y: 1 - rect.x - rect.w, w: rect.h, h: rect.w };
  }
}

/** Giro relativo necesario para pasar de `from` a `to`. */
export function rotationDelta(from: Rotation, to: Rotation): 0 | 90 | 180 | 270 {
  return ((((to - from) % 360) + 360) % 360) as 0 | 90 | 180 | 270;
}

/** Factor (≤ 1) para que el lado mayor de `size` no supere `maxSide`. Nunca amplía. */
export function fitScale(size: Size, maxSide: number): number {
  const longest = Math.max(size.width, size.height);
  if (longest <= 0) return 1;
  return Math.min(1, maxSide / longest);
}

/** Convierte un rectángulo normalizado a píxeles de un marco de `frame` píxeles. */
export function toPixels(rect: NormalizedRect, frame: Size): PixelRect {
  return {
    x: rect.x * frame.width,
    y: rect.y * frame.height,
    w: rect.w * frame.width,
    h: rect.h * frame.height,
  };
}

/** Intersección de dos rectángulos en píxeles; `null` si no se solapan. */
export function intersect(a: PixelRect, b: PixelRect): PixelRect | null {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * Redondea un rectángulo hacia fuera (bordes exteriores a píxel entero) para que una máscara nunca
 * deje una línea de píxeles sin cubrir por culpa del redondeo (RF-06).
 */
export function roundOutward(rect: PixelRect): PixelRect {
  const x0 = Math.floor(rect.x);
  const y0 = Math.floor(rect.y);
  const x1 = Math.ceil(rect.x + rect.w);
  const y1 = Math.ceil(rect.y + rect.h);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
