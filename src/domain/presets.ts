import type { PresetName, RGB, WatermarkStyle } from './types';

/** Colores con nombre que ofrece la interfaz. */
export const NAMED_COLORS: Readonly<Record<'rojo' | 'gris' | 'negro' | 'azul', RGB>> = {
  rojo: { r: 170, g: 0, b: 0 },
  gris: { r: 95, g: 95, b: 95 },
  negro: { r: 0, g: 0, b: 0 },
  azul: { r: 0, g: 45, b: 140 },
};

/** Dos puntos de partida (RF-07): bien visible, o discreta pero legible. */
export const PRESETS: Readonly<Record<PresetName, WatermarkStyle>> = {
  normal: {
    opacity: 45,
    sizePct: 4.5,
    spacing: 2.6,
    angleDeg: 30,
    color: NAMED_COLORS.rojo,
    outline: true,
  },
  suave: {
    opacity: 28,
    sizePct: 3.5,
    spacing: 3.5,
    angleDeg: 30,
    color: NAMED_COLORS.gris,
    outline: false,
  },
};

/** Límites de cada parámetro; fuera de ellos la marca deja de servir o de verse. */
export const STYLE_LIMITS = {
  opacity: { min: 5, max: 100 },
  sizePct: { min: 1.5, max: 12 },
  spacing: { min: 1.2, max: 8 },
  angleDeg: { min: -90, max: 90 },
} as const;

const clampTo = (value: number, range: { min: number; max: number }): number =>
  Number.isFinite(value) ? Math.min(range.max, Math.max(range.min, value)) : range.min;

/**
 * Estilo final: el preset elegido con los ajustes manuales por encima, y todo dentro de límites.
 * Los ajustes manuales prevalecen sobre el preset (RF-07).
 */
export function resolveStyle(
  preset: PresetName,
  overrides: Partial<WatermarkStyle> = {},
): WatermarkStyle {
  const base = PRESETS[preset];
  const merged: WatermarkStyle = { ...base, ...overrides };
  return {
    ...merged,
    opacity: clampTo(merged.opacity, STYLE_LIMITS.opacity),
    sizePct: clampTo(merged.sizePct, STYLE_LIMITS.sizePct),
    spacing: clampTo(merged.spacing, STYLE_LIMITS.spacing),
    angleDeg: clampTo(merged.angleDeg, STYLE_LIMITS.angleDeg),
  };
}

/** `#rrggbb` → RGB. Devuelve `null` si no es un color válido. */
export function parseHexColor(hex: string): RGB | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const digits = match?.[1];
  if (!digits) return null;
  const value = Number.parseInt(digits, 16);
  return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff };
}

export function toHexColor(color: RGB): string {
  const part = (v: number): string => Math.round(v).toString(16).padStart(2, '0');
  return `#${part(color.r)}${part(color.g)}${part(color.b)}`;
}
