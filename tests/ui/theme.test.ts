import { describe, expect, it } from 'vitest';
import { effectiveTheme, parseTheme, toggledPreference } from '../../src/ui/theme';

describe('RF-19 · tema claro y oscuro', () => {
  it('solo reconoce los valores guardados válidos', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme(null)).toBeNull();
    expect(parseTheme('sepia')).toBeNull();
  });

  it('sin preferencia sigue al sistema', () => {
    expect(effectiveTheme(null, true)).toBe('dark');
    expect(effectiveTheme(null, false)).toBe('light');
  });

  it('la preferencia gana al sistema', () => {
    expect(effectiveTheme('light', true)).toBe('light');
    expect(effectiveTheme('dark', false)).toBe('dark');
  });

  it('pulsar el interruptor fija el tema contrario al que se ve', () => {
    expect(toggledPreference(null, false)).toBe('dark');
    expect(toggledPreference(null, true)).toBe('light');
  });

  it('volver al tema del sistema borra la preferencia', () => {
    expect(toggledPreference('dark', false)).toBeNull();
    expect(toggledPreference('light', true)).toBeNull();
  });

  it('dos pulsaciones dejan la página como estaba', () => {
    for (const systemDark of [true, false]) {
      const once = toggledPreference(null, systemDark);
      expect(toggledPreference(once, systemDark)).toBeNull();
    }
  });
});
