import { describe, expect, it } from 'vitest';
import {
  fitScale,
  intersect,
  isNegligible,
  moveRect,
  pixelBlockSize,
  resizeRect,
  nextRotation,
  rectFromCorners,
  rotateRect,
  rotatedSize,
  rotationDelta,
  roundOutward,
  toPixels,
} from '../../src/domain';

/** Comparación de rectángulos tolerante al redondeo de coma flotante. */
const rectCloseTo = (r: { x: number; y: number; w: number; h: number }): Record<string, unknown> =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [k, expect.closeTo(v, 10) as unknown]));

describe('RF-05/RF-06 · rectángulos dibujados por el usuario', () => {
  it('normaliza un arrastre en cualquier dirección a un rectángulo con ancho y alto positivos', () => {
    expect(rectFromCorners(0.8, 0.6, 0.2, 0.1)).toEqual(
      rectCloseTo({ x: 0.2, y: 0.1, w: 0.6, h: 0.5 }),
    );
  });

  it('recorta a [0, 1] un arrastre que se sale de la página', () => {
    const r = rectFromCorners(-0.3, 0.5, 1.4, 1.2);
    expect(r).toEqual({ x: 0, y: 0.5, w: 1, h: 0.5 });
  });

  it('considera despreciable un clic sin arrastre', () => {
    expect(isNegligible(rectFromCorners(0.5, 0.5, 0.501, 0.7))).toBe(true);
    expect(isNegligible(rectFromCorners(0.1, 0.1, 0.3, 0.3))).toBe(false);
  });
});

describe('RF-04 · giro', () => {
  it('intercambia ancho y alto en giros de 90 y 270', () => {
    expect(rotatedSize({ width: 300, height: 200 }, 90)).toEqual({ width: 200, height: 300 });
    expect(rotatedSize({ width: 300, height: 200 }, 180)).toEqual({ width: 300, height: 200 });
  });

  it('avanza y retrocede en pasos de 90 dando la vuelta', () => {
    expect(nextRotation(270, 90)).toBe(0);
    expect(nextRotation(0, -90)).toBe(270);
    expect(rotationDelta(270, 90)).toBe(180);
    expect(rotationDelta(90, 0)).toBe(270);
  });

  it('una máscara en la esquina superior izquierda pasa a la superior derecha al girar 90° horario', () => {
    const mask = { x: 0, y: 0, w: 0.2, h: 0.1 };
    expect(rotateRect(mask, 90)).toEqual({ x: 0.9, y: 0, w: 0.1, h: 0.2 });
  });

  it('cuatro giros de 90° devuelven el rectángulo original (sigue cubriendo lo mismo)', () => {
    const mask = { x: 0.1, y: 0.2, w: 0.3, h: 0.15 };
    let r = mask;
    for (let i = 0; i < 4; i += 1) r = rotateRect(r, 90);
    expect(r.x).toBeCloseTo(mask.x);
    expect(r.y).toBeCloseTo(mask.y);
    expect(r.w).toBeCloseTo(mask.w);
    expect(r.h).toBeCloseTo(mask.h);
  });

  it('girar 270° equivale a girar 90° tres veces, y 180° a dos', () => {
    const mask = { x: 0.1, y: 0.2, w: 0.3, h: 0.15 };
    const thrice = rotateRect(rotateRect(rotateRect(mask, 90), 90), 90);
    expect(rotateRect(mask, 270)).toEqual(rectCloseTo(thrice));
    expect(rotateRect(mask, 180)).toEqual(rectCloseTo(rotateRect(rotateRect(mask, 90), 90)));
  });
});

describe('RF-08 · escala de salida', () => {
  it('reduce al lado máximo y nunca amplía', () => {
    expect(fitScale({ width: 3000, height: 1900 }, 1200)).toBeCloseTo(0.4);
    expect(fitScale({ width: 800, height: 600 }, 1200)).toBe(1);
    expect(fitScale({ width: 0, height: 0 }, 1200)).toBe(1);
  });
});

describe('píxeles', () => {
  it('convierte un rectángulo normalizado a píxeles del marco', () => {
    expect(toPixels({ x: 0.5, y: 0.25, w: 0.1, h: 0.5 }, { width: 1000, height: 400 })).toEqual({
      x: 500,
      y: 100,
      w: 100,
      h: 200,
    });
  });

  it('interseca rectángulos y devuelve null si no se tocan', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    expect(intersect(a, { x: 5, y: 5, w: 10, h: 10 })).toEqual({ x: 5, y: 5, w: 5, h: 5 });
    expect(intersect(a, { x: 10, y: 0, w: 5, h: 5 })).toBeNull();
  });

  it('redondea hacia fuera para no dejar líneas sin tapar (RF-06)', () => {
    expect(roundOutward({ x: 10.4, y: 3.6, w: 5.2, h: 2.1 })).toEqual({ x: 10, y: 3, w: 6, h: 3 });
  });
});

describe('RF-27 · mover y redimensionar zonas', () => {
  const r = { x: 0.2, y: 0.3, w: 0.4, h: 0.2 };

  it('mueve conservando el tamaño', () => {
    expect(moveRect(r, 0.1, -0.1)).toEqual(rectCloseTo({ x: 0.3, y: 0.2, w: 0.4, h: 0.2 }));
  });

  it('se queda pegada al borde en lugar de salir de la página', () => {
    expect(moveRect(r, 1, 1)).toEqual(rectCloseTo({ x: 0.6, y: 0.8, w: 0.4, h: 0.2 }));
    expect(moveRect(r, -1, -1)).toEqual(rectCloseTo({ x: 0, y: 0, w: 0.4, h: 0.2 }));
  });

  it('redimensiona desde la esquina inferior derecha sin mover la superior izquierda', () => {
    expect(resizeRect(r, 0.9, 0.7)).toEqual(rectCloseTo({ x: 0.2, y: 0.3, w: 0.7, h: 0.4 }));
  });

  it('no baja del tamaño mínimo ni sale del marco', () => {
    expect(resizeRect(r, 0, 0)).toEqual(rectCloseTo({ x: 0.2, y: 0.3, w: 0.01, h: 0.01 }));
    expect(resizeRect(r, 5, 5)).toEqual(rectCloseTo({ x: 0.2, y: 0.3, w: 0.8, h: 0.7 }));
  });
});

describe('RF-28 · bloque del pixelado', () => {
  it('es la mitad del lado corto de la zona', () => {
    expect(pixelBlockSize({ x: 0, y: 0, w: 400, h: 60 })).toBe(30);
    expect(pixelBlockSize({ x: 0, y: 0, w: 61, h: 300 })).toBe(31);
  });

  it('nunca baja de 16 px', () => {
    expect(pixelBlockSize({ x: 0, y: 0, w: 200, h: 10 })).toBe(16);
  });
});
