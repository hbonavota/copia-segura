import type { NormalizedRect, Size } from './types';

/**
 * Localización de imágenes incrustadas en una página de PDF (RF-01, SPEC-0004).
 *
 * Un PDF dibuja cada imagen como el cuadrado unidad [0,1]×[0,1] transformado por la matriz de
 * transformación vigente (CTM). Reconstruyendo la CTM a lo largo de la lista de operadores se
 * obtiene el rectángulo que ocupa cada imagen. Esta función es pura: recibe operadores ya
 * traducidos a un vocabulario mínimo y devuelve rectángulos normalizados.
 */

/** Matriz afín PDF `[a b c d e f]`: un punto se transforma como `[x y 1] · M`. */
export type Matrix = readonly [number, number, number, number, number, number];

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** Vocabulario mínimo de operadores que afectan a la posición de una imagen. */
export type PdfOp =
  | { readonly kind: 'save' }
  | { readonly kind: 'restore' }
  | { readonly kind: 'transform'; readonly matrix: Matrix }
  | { readonly kind: 'formBegin'; readonly matrix: Matrix | null }
  | { readonly kind: 'formEnd' }
  | { readonly kind: 'image' };

/** `compose(first, then)`: matriz que aplica `first` y después `then`. */
export function compose(first: Matrix, then: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = first;
  const [a2, b2, c2, d2, e2, f2] = then;
  return [
    a1 * a2 + b1 * c2,
    a1 * b2 + b1 * d2,
    c1 * a2 + d1 * c2,
    c1 * b2 + d1 * d2,
    e1 * a2 + f1 * c2 + e2,
    e1 * b2 + f1 * d2 + f2,
  ];
}

export function applyToPoint(m: Matrix, x: number, y: number): readonly [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

/** Caja envolvente (en el espacio destino) del cuadrado unidad transformado por `m`. */
function unitSquareBounds(m: Matrix): { x0: number; y0: number; x1: number; y1: number } {
  const corners = [
    applyToPoint(m, 0, 0),
    applyToPoint(m, 1, 0),
    applyToPoint(m, 1, 1),
    applyToPoint(m, 0, 1),
  ];
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  return {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
  };
}

/**
 * Recorre los operadores reconstruyendo la CTM (como hace un rasterizador) y devuelve, para cada
 * imagen pintada, su rectángulo en coordenadas normalizadas de la página mostrada.
 *
 * @param ops       operadores de la página, en orden
 * @param viewport  matriz que lleva el espacio de usuario del PDF a píxeles de la página mostrada
 *                  (incluye el giro `/Rotate` de la página) y tamaño de esa página en píxeles
 */
export function embeddedImageRects(
  ops: readonly PdfOp[],
  viewport: { readonly transform: Matrix; readonly size: Size },
): NormalizedRect[] {
  const stack: Matrix[] = [];
  let ctm: Matrix = IDENTITY;
  const rects: NormalizedRect[] = [];

  for (const op of ops) {
    switch (op.kind) {
      case 'save':
        stack.push(ctm);
        break;
      case 'restore':
        ctm = stack.pop() ?? IDENTITY;
        break;
      case 'transform':
        ctm = compose(op.matrix, ctm);
        break;
      case 'formBegin':
        stack.push(ctm);
        if (op.matrix) ctm = compose(op.matrix, ctm);
        break;
      case 'formEnd':
        ctm = stack.pop() ?? IDENTITY;
        break;
      case 'image': {
        const device = compose(ctm, viewport.transform);
        const b = unitSquareBounds(device);
        const rect = clampRect({
          x: b.x0 / viewport.size.width,
          y: b.y0 / viewport.size.height,
          w: (b.x1 - b.x0) / viewport.size.width,
          h: (b.y1 - b.y0) / viewport.size.height,
        });
        if (rect) rects.push(rect);
        break;
      }
    }
  }
  return rects;
}

function clampRect(r: NormalizedRect): NormalizedRect | null {
  const x0 = Math.max(0, r.x);
  const y0 = Math.max(0, r.y);
  const x1 = Math.min(1, r.x + r.w);
  const y1 = Math.min(1, r.y + r.h);
  if (!(x1 > x0 && y1 > y0)) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * De entre las imágenes de una página, la mayor que ocupe al menos `minAreaFraction` del área;
 * es la que se propone como recorte inicial (RF-01). `null` si ninguna cualifica.
 */
export function largestEmbeddedImage(
  rects: readonly NormalizedRect[],
  minAreaFraction = 0.05,
): NormalizedRect | null {
  let best: NormalizedRect | null = null;
  for (const r of rects) {
    const area = r.w * r.h;
    if (area < minAreaFraction) continue;
    if (!best || area > best.w * best.h) best = r;
  }
  return best;
}
