import { describe, expect, it } from 'vitest';
import { countExternal, isExternal } from '../../src/ui/trust';

const ORIGIN = 'https://hbonavota.github.io';

describe('RF-22 · contador de peticiones a otros dominios', () => {
  it('lo del propio origen no cuenta, aunque cambie la ruta', () => {
    expect(isExternal('https://hbonavota.github.io/copia-segura/assets/app.js', ORIGIN)).toBe(
      false,
    );
  });

  it('otro dominio, otro puerto u otro esquema sí cuentan', () => {
    expect(isExternal('https://www.googletagmanager.com/gtag/js', ORIGIN)).toBe(true);
    expect(isExternal('https://hbonavota.github.io:8443/x', ORIGIN)).toBe(true);
    expect(isExternal('http://hbonavota.github.io/x', ORIGIN)).toBe(true);
  });

  it('data: y blob: no salen del equipo', () => {
    expect(isExternal('data:image/png;base64,AAAA', ORIGIN)).toBe(false);
    expect(isExternal(`blob:${ORIGIN}/0f3c`, ORIGIN)).toBe(false);
  });

  it('cuenta solo las externas', () => {
    expect(
      countExternal(
        [`${ORIGIN}/a.js`, 'https://fonts.googleapis.com/css', 'data:,x', 'https://example.com/'],
        ORIGIN,
      ),
    ).toBe(2);
  });
});
