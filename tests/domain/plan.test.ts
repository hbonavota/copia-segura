import { describe, expect, it } from 'vitest';
import {
  PRESETS,
  planCopy,
  type Page,
  type PageEdits,
  type PlanInput,
  type MeasureText,
} from '../../src/domain';

const measure: MeasureText = (text, fontPx) => ({
  width: text.length * fontPx * 0.6,
  height: fontPx * 1.2,
});

const page: Page = {
  id: 'page-1',
  label: 'p1',
  sourceName: 'dni',
  size: { width: 3000, height: 1900 },
};

const noEdits: PageEdits = { rotation: 0, crop: null, masks: [] };

function plan(overrides: Partial<PlanInput> = {}): ReturnType<typeof planCopy> {
  return planCopy({
    page,
    edits: noEdits,
    style: PRESETS.normal,
    text: 'COPIA',
    output: { maxSide: 1200, jpegQuality: 0.82 },
    measure,
    ...overrides,
  });
}

describe('RF-08 · tamaño de salida', () => {
  it('reduce el lado mayor a maxSide manteniendo la proporción', () => {
    const p = plan();
    expect(p.output).toEqual({ width: 1200, height: 760 });
    expect(p.scale).toBeCloseTo(0.4);
  });

  it('nunca amplía una imagen pequeña', () => {
    const small = plan({ page: { ...page, size: { width: 640, height: 480 } } });
    expect(small.output).toEqual({ width: 640, height: 480 });
    expect(small.scale).toBe(1);
  });

  it('acota la calidad JPEG a un rango útil', () => {
    expect(plan({ output: { maxSide: 1200, jpegQuality: 1.7 } }).jpegQuality).toBe(1);
    expect(plan({ output: { maxSide: 1200, jpegQuality: 0 } }).jpegQuality).toBe(0.3);
  });
});

describe('RF-04 · giro en el plan', () => {
  it('la salida de una página girada 90° es vertical', () => {
    const p = plan({ edits: { ...noEdits, rotation: 90 } });
    expect(p.rotated).toEqual({ width: 1900, height: 3000 });
    expect(p.output).toEqual({ width: 760, height: 1200 });
  });
});

describe('RF-05 · recorte en el plan', () => {
  it('conserva solo la zona recortada y la escala a maxSide', () => {
    const p = plan({ edits: { ...noEdits, crop: { x: 0.1, y: 0.1, w: 0.5, h: 0.5 } } });
    expect(p.cropPx).toEqual({ x: 300, y: 190, w: 1500, h: 950 });
    expect(p.output).toEqual({ width: 1200, height: 760 });
  });

  it('un recorte que se sale del marco se limita a la página', () => {
    const p = plan({ edits: { ...noEdits, crop: { x: 0.9, y: 0.9, w: 0.5, h: 0.5 } } });
    expect(p.cropPx.x + p.cropPx.w).toBeLessThanOrEqual(3000);
    expect(p.cropPx.y + p.cropPx.h).toBeLessThanOrEqual(1900);
  });
});

describe('RF-06 · máscaras en el plan', () => {
  it('convierte las máscaras a píxeles de salida, redondeando hacia fuera', () => {
    const p = plan({ edits: { ...noEdits, masks: [{ x: 0.5, y: 0.5, w: 0.25, h: 0.1 }] } });
    expect(p.masksPx).toEqual([{ x: 600, y: 380, w: 300, h: 76 }]);
  });

  it('las máscaras se recortan a la zona conservada y se desplazan con el recorte', () => {
    const p = plan({
      edits: {
        ...noEdits,
        crop: { x: 0.5, y: 0, w: 0.5, h: 1 },
        masks: [
          { x: 0.4, y: 0.1, w: 0.2, h: 0.1 }, // a caballo del borde del recorte
          { x: 0, y: 0, w: 0.1, h: 0.1 }, // fuera del recorte
        ],
      },
    });
    expect(p.masksPx).toHaveLength(1);
    const [mask] = p.masksPx;
    expect(mask?.x).toBe(0);
    expect(mask?.w).toBeGreaterThan(0);
  });
});

describe('RF-09 · determinismo', () => {
  it('mismas entradas, mismo plan', () => {
    expect(plan()).toEqual(plan());
  });

  it('sin texto no hay marca', () => {
    expect(plan({ text: '' }).watermark).toBeNull();
  });
});
