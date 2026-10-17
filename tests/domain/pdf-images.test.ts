import { describe, expect, it } from 'vitest';
import {
  IDENTITY,
  applyToPoint,
  compose,
  embeddedImageRects,
  largestEmbeddedImage,
  type Matrix,
  type PdfOp,
} from '../../src/domain';

/** Transformación de pdf.js para una página A4 sin rotar, escala 1: voltea el eje Y. */
const A4_UPRIGHT = {
  transform: [1, 0, 0, -1, 0, 842] as Matrix,
  size: { width: 595, height: 842 },
};

/** Página apaisada (842×595) con /Rotate 90, tal como la muestra pdf.js: intercambia los ejes. */
const LANDSCAPE_ROTATED_90 = {
  transform: [0, 1, 1, 0, 0, 0] as Matrix,
  size: { width: 595, height: 842 },
};

const image = (matrix: Matrix): PdfOp[] => [
  { kind: 'save' },
  { kind: 'transform', matrix },
  { kind: 'image' },
  { kind: 'restore' },
];

describe('matrices PDF', () => {
  it('compose(first, then) aplica primero una y luego la otra', () => {
    const translate: Matrix = [1, 0, 0, 1, 10, 20];
    const scale: Matrix = [2, 0, 0, 3, 0, 0];
    // trasladar y después escalar: (1,1) → (11,21) → (22,63)
    expect(applyToPoint(compose(translate, scale), 1, 1)).toEqual([22, 63]);
    // escalar y después trasladar: (1,1) → (2,3) → (12,23)
    expect(applyToPoint(compose(scale, translate), 1, 1)).toEqual([12, 23]);
  });

  it('la identidad no cambia nada', () => {
    const m: Matrix = [2, 1, 0.5, 3, 7, 9];
    expect(compose(m, IDENTITY)).toEqual(m);
    expect(compose(IDENTITY, m)).toEqual(m);
  });
});

describe('RF-01 · imágenes incrustadas en una página de PDF', () => {
  it('localiza una imagen dibujada con cm sobre una página A4', () => {
    // 475×300 puntos, esquina inferior izquierda en (60, 342)
    const [rect] = embeddedImageRects(image([475, 0, 0, 300, 60, 342]), A4_UPRIGHT);
    expect(rect?.x).toBeCloseTo(60 / 595);
    expect(rect?.y).toBeCloseTo((842 - 642) / 842);
    expect(rect?.w).toBeCloseTo(475 / 595);
    expect(rect?.h).toBeCloseTo(300 / 842);
  });

  it('respeta el giro de la página (/Rotate 90)', () => {
    const [rect] = embeddedImageRects(image([762, 0, 0, 515, 40, 40]), LANDSCAPE_ROTATED_90);
    expect(rect?.x).toBeCloseTo(40 / 595);
    expect(rect?.y).toBeCloseTo(40 / 842);
    expect(rect?.w).toBeCloseTo(515 / 595);
    expect(rect?.h).toBeCloseTo(762 / 842);
  });

  it('acumula transformaciones anidadas y las deshace con restore', () => {
    const ops: PdfOp[] = [
      { kind: 'save' },
      { kind: 'transform', matrix: [1, 0, 0, 1, 100, 100] }, // desplaza
      { kind: 'save' },
      { kind: 'transform', matrix: [200, 0, 0, 100, 0, 0] }, // tamaño
      { kind: 'image' },
      { kind: 'restore' },
      { kind: 'transform', matrix: [50, 0, 0, 50, 0, 0] },
      { kind: 'image' },
      { kind: 'restore' },
    ];
    const [first, second] = embeddedImageRects(ops, A4_UPRIGHT);
    expect(first?.x).toBeCloseTo(100 / 595);
    expect(first?.w).toBeCloseTo(200 / 595);
    expect(second?.x).toBeCloseTo(100 / 595);
    expect(second?.w).toBeCloseTo(50 / 595);
  });

  it('aplica la matriz de un Form XObject y la retira al terminar', () => {
    const ops: PdfOp[] = [
      { kind: 'formBegin', matrix: [1, 0, 0, 1, 50, 0] },
      { kind: 'transform', matrix: [100, 0, 0, 100, 0, 0] },
      { kind: 'image' },
      { kind: 'formEnd' },
      { kind: 'transform', matrix: [100, 0, 0, 100, 0, 0] },
      { kind: 'image' },
    ];
    const [inside, outside] = embeddedImageRects(ops, A4_UPRIGHT);
    expect(inside?.x).toBeCloseTo(50 / 595);
    expect(outside?.x).toBeCloseTo(0);
  });

  it('un restore sin save no rompe nada', () => {
    const ops: PdfOp[] = [{ kind: 'restore' }, ...image([100, 0, 0, 100, 0, 0])];
    expect(embeddedImageRects(ops, A4_UPRIGHT)).toHaveLength(1);
  });

  it('recorta a la página una imagen que se sale y descarta la que queda fuera', () => {
    const [partly] = embeddedImageRects(image([400, 0, 0, 400, 400, 600]), A4_UPRIGHT);
    expect(partly).toBeDefined();
    expect((partly?.x ?? 0) + (partly?.w ?? 0)).toBeCloseTo(1);
    expect(partly?.y).toBeCloseTo(0);
    expect(embeddedImageRects(image([100, 0, 0, 100, 700, 0]), A4_UPRIGHT)).toHaveLength(0);
  });
});

describe('RF-01 · recorte propuesto', () => {
  it('elige la imagen mayor que ocupe al menos el 5 % de la página e ignora logos', () => {
    const logo = { x: 0.85, y: 0.02, w: 0.1, h: 0.05 };
    const card = { x: 0.1, y: 0.24, w: 0.8, h: 0.36 };
    const stamp = { x: 0.6, y: 0.7, w: 0.25, h: 0.25 };
    expect(largestEmbeddedImage([logo, stamp, card])).toEqual(card);
    expect(largestEmbeddedImage([logo])).toBeNull();
    expect(largestEmbeddedImage([])).toBeNull();
  });
});
