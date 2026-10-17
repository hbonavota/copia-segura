import { describe, expect, it } from 'vitest';
import {
  NAMED_COLORS,
  PRESETS,
  STYLE_LIMITS,
  parseHexColor,
  resolveStyle,
  toHexColor,
} from '../../src/domain';

describe('RF-07 · presets de la marca', () => {
  it('Normal: opacidad 45, tamaño 4,5 %, separación 2,6, rojo, con borde', () => {
    expect(PRESETS.normal).toMatchObject({
      opacity: 45,
      sizePct: 4.5,
      spacing: 2.6,
      color: NAMED_COLORS.rojo,
      outline: true,
    });
  });

  it('Suave: opacidad 28, tamaño 3,5 %, separación 3,5, gris, sin borde', () => {
    expect(PRESETS.suave).toMatchObject({
      opacity: 28,
      sizePct: 3.5,
      spacing: 3.5,
      color: NAMED_COLORS.gris,
      outline: false,
    });
  });

  it('un ajuste manual prevalece sobre el preset', () => {
    const style = resolveStyle('suave', { opacity: 22, outline: true });
    expect(style.opacity).toBe(22);
    expect(style.outline).toBe(true);
    expect(style.sizePct).toBe(PRESETS.suave.sizePct);
  });

  it('acota los valores fuera de rango en vez de aceptarlos', () => {
    const style = resolveStyle('normal', { opacity: 500, sizePct: 0, spacing: -3, angleDeg: 400 });
    expect(style.opacity).toBe(STYLE_LIMITS.opacity.max);
    expect(style.sizePct).toBe(STYLE_LIMITS.sizePct.min);
    expect(style.spacing).toBe(STYLE_LIMITS.spacing.min);
    expect(style.angleDeg).toBe(STYLE_LIMITS.angleDeg.max);
  });

  it('trata NaN como el mínimo del rango', () => {
    expect(resolveStyle('normal', { opacity: Number.NaN }).opacity).toBe(STYLE_LIMITS.opacity.min);
  });
});

describe('colores', () => {
  it('convierte entre #rrggbb y RGB en ambos sentidos', () => {
    expect(parseHexColor('#aa0000')).toEqual({ r: 170, g: 0, b: 0 });
    expect(parseHexColor('5F5F5F')).toEqual({ r: 95, g: 95, b: 95 });
    expect(toHexColor({ r: 0, g: 45, b: 140 })).toBe('#002d8c');
  });

  it('rechaza cadenas que no son colores', () => {
    expect(parseHexColor('rojo')).toBeNull();
    expect(parseHexColor('#fff')).toBeNull();
  });
});
