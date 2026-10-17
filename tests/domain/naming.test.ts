import { describe, expect, it } from 'vitest';
import { baseName, outputFileName, pageLabel } from '../../src/domain';

describe('RF-10 · nombres de archivo', () => {
  it('limpia el nombre de origen: sin extensión, sin acentos ni espacios, en minúsculas', () => {
    expect(baseName('DNI Hernán (frente).PDF')).toBe('dni-hernan-frente');
    expect(baseName('IMG_1234.jpeg')).toBe('img_1234');
    expect(baseName('....')).toBe('documento');
  });

  it('compone <nombre>-<etiqueta>-copia-segura.<ext>', () => {
    expect(outputFileName('dni', 'p1', 'jpg')).toBe('dni-p1-copia-segura.jpg');
    expect(outputFileName('dni', null, 'pdf')).toBe('dni-copia-segura.pdf');
    expect(outputFileName('documentos', null, 'zip')).toBe('documentos-copia-segura.zip');
  });

  it('etiqueta páginas de PDF, fotos y capturas de forma distinguible', () => {
    expect(pageLabel('pdf', 2)).toBe('p2');
    expect(pageLabel('image', 1)).toBe('foto-1');
    expect(pageLabel('camera', 3)).toBe('camara-3');
  });
});
