import { describe, expect, it } from 'vitest';
import {
  PRESETS,
  composeWatermarkText,
  formatDate,
  layoutWatermark,
  outlineWidth,
  type MeasureText,
} from '../../src/domain';

/** Medidor determinista: cada carácter mide 0,6 em y el alto es 1,2 em. */
const fakeMeasure: MeasureText = (text, fontPx) => ({
  width: text.length * fontPx * 0.6,
  height: fontPx * 1.2,
});

const today = new Date(2026, 9, 17); // 17/10/2026

describe('RF-07 · texto de la marca', () => {
  it('compone texto libre, destinatario, finalidad y fecha separados por puntos medios', () => {
    const text = composeWatermarkText(
      {
        freeText: 'COPIA SOLO VÁLIDA PARA',
        recipient: 'Empresa Ejemplo',
        purpose: 'alta de un servicio',
        includeDate: true,
      },
      today,
    );
    expect(text).toBe('COPIA SOLO VÁLIDA PARA Empresa Ejemplo · alta de un servicio · 17/10/2026');
  });

  it('omite las partes vacías y la fecha si está desactivada', () => {
    expect(
      composeWatermarkText(
        { freeText: '  Solo para  ', recipient: '', purpose: '', includeDate: false },
        today,
      ),
    ).toBe('Solo para');
    expect(
      composeWatermarkText(
        { freeText: '', recipient: '', purpose: 'alta', includeDate: true },
        today,
      ),
    ).toBe('alta · 17/10/2026');
  });

  it('devuelve cadena vacía cuando no hay nada que escribir', () => {
    expect(
      composeWatermarkText({ freeText: '', recipient: '', purpose: '', includeDate: false }, today),
    ).toBe('');
  });

  it('formatea la fecha como dd/mm/aaaa con ceros a la izquierda', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('05/01/2026');
  });
});

describe('RF-07 · mosaico de la marca', () => {
  const output = { width: 1200, height: 760 };

  it('no dibuja nada si el texto está vacío', () => {
    expect(layoutWatermark('', output, PRESETS.normal, fakeMeasure)).toBeNull();
  });

  it('usa un alto de texto proporcional al ancho de salida', () => {
    const layout = layoutWatermark('COPIA', output, PRESETS.normal, fakeMeasure);
    expect(layout?.fontPx).toBe(Math.round((1200 * 4.5) / 100));
  });

  it('cubre un lienzo mayor que la diagonal, para que al girar siga tapando las esquinas', () => {
    const layout = layoutWatermark('COPIA', output, PRESETS.normal, fakeMeasure);
    expect(layout?.canvasSide).toBeGreaterThanOrEqual(Math.hypot(1200, 760));
  });

  it('ninguna región mayor que un paso de la rejilla queda sin texto, en cualquier proporción', () => {
    for (const size of [output, { width: 760, height: 1200 }, { width: 500, height: 500 }]) {
      const layout = layoutWatermark(
        'COPIA SOLO VÁLIDA PARA MOVISTAR',
        size,
        PRESETS.suave,
        fakeMeasure,
      );
      expect(layout).not.toBeNull();
      if (!layout) return;
      const { width: tw, height: th } = fakeMeasure(layout.text, layout.fontPx);
      const stepY = th * PRESETS.suave.spacing;
      const stepX = tw + size.width / 10;
      const half = layout.canvasSide / 2;
      for (let sx = -half; sx <= half; sx += half / 4) {
        for (let sy = -half; sy <= half; sy += half / 4) {
          const near = layout.tiles.some(
            (t) => Math.abs(sx - (t.x + tw / 2)) <= stepX && Math.abs(sy - (t.y + th / 2)) <= stepY,
          );
          expect(near, `punto (${sx}, ${sy}) sin texto cerca`).toBe(true);
        }
      }
    }
  });

  it('desplaza media celda las filas impares', () => {
    const layout = layoutWatermark('COPIA', output, PRESETS.normal, fakeMeasure);
    expect(layout).not.toBeNull();
    if (!layout) return;
    const rows = [...new Set(layout.tiles.map((t) => t.y))].sort((a, b) => a - b);
    const firstX = (y: number): number =>
      Math.min(...layout.tiles.filter((t) => t.y === y).map((t) => t.x));
    const row0 = rows[0];
    const row1 = rows[1];
    expect(row0).toBeDefined();
    expect(row1).toBeDefined();
    if (row0 === undefined || row1 === undefined) return;
    expect(firstX(row1)).toBeLessThan(firstX(row0));
  });

  it('traduce opacidad y borde del estilo', () => {
    const withOutline = layoutWatermark('X', output, PRESETS.normal, fakeMeasure);
    const noOutline = layoutWatermark('X', output, PRESETS.suave, fakeMeasure);
    expect(withOutline?.alpha).toBeCloseTo(0.45);
    expect(withOutline?.outlinePx).toBe(outlineWidth(withOutline?.fontPx ?? 0));
    expect(noOutline?.outlinePx).toBe(0);
  });
});
