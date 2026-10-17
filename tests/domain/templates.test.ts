import { describe, expect, it } from 'vitest';
import { MASK_TEMPLATES, TEMPLATE_IDS, templateMasks, type PageEdits } from '../../src/domain';

const noEdits: PageEdits = { rotation: 0, crop: null, masks: [] };

describe('RF-16 · plantillas de zonas', () => {
  it('ofrece frente y dorso del DNI de España y de Argentina', () => {
    expect(TEMPLATE_IDS.sort()).toEqual([
      'dni-ar-dorso',
      'dni-ar-frente',
      'dni-es-dorso',
      'dni-es-frente',
    ]);
  });

  it('todas las zonas quedan dentro de la tarjeta', () => {
    for (const zones of Object.values(MASK_TEMPLATES)) {
      for (const { rect } of zones) {
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.w).toBeLessThanOrEqual(1 + 1e-9);
        expect(rect.y + rect.h).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });

  it('sin recorte, la tarjeta es la página entera', () => {
    expect(templateMasks('dni-es-dorso', noEdits)).toEqual(
      MASK_TEMPLATES['dni-es-dorso'].map((z) => z.rect),
    );
  });

  it('con recorte, las zonas se colocan dentro del recorte', () => {
    const crop = { x: 0.1, y: 0.2, w: 0.5, h: 0.4 };
    const [mrz] = templateMasks('dni-es-dorso', { ...noEdits, crop }).slice(-1);
    expect(mrz?.x).toBeCloseTo(0.1);
    expect(mrz?.y).toBeCloseTo(0.2 + 0.66 * 0.4);
    expect(mrz?.w).toBeCloseTo(0.5);
    expect(mrz?.h).toBeCloseTo(0.34 * 0.4);
  });
});
