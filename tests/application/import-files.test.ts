import { describe, expect, it } from 'vitest';
import { ImportError, ImportFiles, suggestedCrop } from '../../src/application';
import { FakeImageDecoder, FakePdfReader, decoded, file, pdfPage } from './fakes';

describe('RF-01 · importar un PDF', () => {
  it('crea una página etiquetada p1…pN por cada página del PDF', async () => {
    const importer = new ImportFiles({
      pdfReader: new FakePdfReader([pdfPage(595, 842), pdfPage(842, 595)]),
      imageDecoder: new FakeImageDecoder(decoded(1, 1)),
    });
    const { pages, errors } = await importer.run([file('Mi DNI.pdf', 'application/pdf')]);
    expect(errors).toHaveLength(0);
    expect(pages.map((p) => p.page.label)).toEqual(['p1', 'p2']);
    expect(pages.map((p) => p.page.sourceName)).toEqual(['mi-dni', 'mi-dni']);
    expect(pages[0]?.page.size).toEqual({ width: 595, height: 842 });
    expect(new Set(pages.map((p) => p.page.id)).size).toBe(2);
  });

  it('propone como recorte la imagen grande incrustada en la página', async () => {
    const card = { x: 0.1, y: 0.24, w: 0.8, h: 0.36 };
    const importer = new ImportFiles({
      pdfReader: new FakePdfReader([
        pdfPage(595, 842, [{ x: 0.85, y: 0.02, w: 0.1, h: 0.05 }, card]),
      ]),
      imageDecoder: new FakeImageDecoder(decoded(1, 1)),
    });
    const { pages } = await importer.run([file('dni.pdf', 'application/pdf')]);
    expect(pages[0]?.edits.crop).toEqual(card);
    expect(pages[0]?.autoCropped).toBe(true);
  });

  it('no propone recorte para un escaneo a página completa ni para páginas sin imágenes', () => {
    expect(suggestedCrop([{ x: 0, y: 0, w: 1, h: 1 }])).toBeNull();
    expect(suggestedCrop([{ x: 0.01, y: 0.01, w: 0.985, h: 0.985 }])).toBeNull();
    expect(suggestedCrop([])).toBeNull();
  });

  it('un PDF cifrado se devuelve como error con su motivo y no bloquea los demás archivos', async () => {
    const importer = new ImportFiles({
      pdfReader: new FakePdfReader(new ImportError('encrypted', 'secreto.pdf')),
      imageDecoder: new FakeImageDecoder(decoded(800, 600)),
    });
    const { pages, errors } = await importer.run([
      file('secreto.pdf', 'application/pdf'),
      file('foto.jpg', 'image/jpeg'),
    ]);
    expect(errors.map((e) => [e.code, e.fileName])).toEqual([['encrypted', 'secreto.pdf']]);
    expect(pages.map((p) => p.page.label)).toEqual(['foto-1']);
  });

  it('reconoce un PDF por la extensión aunque el navegador no informe el tipo', async () => {
    const importer = new ImportFiles({
      pdfReader: new FakePdfReader([pdfPage(10, 10)]),
      imageDecoder: new FakeImageDecoder(new Error('no debería llamarse')),
    });
    const { pages } = await importer.run([file('escaneo.PDF', '')]);
    expect(pages[0]?.page.label).toBe('p1');
  });
});

describe('RF-02 · importar imágenes', () => {
  it('numera las fotos en orden de selección, también entre varias importaciones', async () => {
    const importer = new ImportFiles({
      pdfReader: new FakePdfReader([]),
      imageDecoder: new FakeImageDecoder(decoded(4000, 3000)),
    });
    const first = await importer.run([file('a.jpg', 'image/jpeg'), file('b.png', 'image/png')]);
    const second = await importer.run([file('c.webp', 'image/webp')]);
    expect(first.pages.map((p) => p.page.label)).toEqual(['foto-1', 'foto-2']);
    expect(second.pages.map((p) => p.page.label)).toEqual(['foto-3']);
    expect(first.pages[0]?.edits).toEqual({ rotation: 0, crop: null, masks: [] });
  });

  it('envuelve los fallos de decodificación desconocidos en un ImportError', async () => {
    const importer = new ImportFiles({
      pdfReader: new FakePdfReader([]),
      imageDecoder: new FakeImageDecoder(new Error('formato raro')),
    });
    const { errors } = await importer.run([file('raro.heic', 'image/heic')]);
    expect(errors[0]).toBeInstanceOf(ImportError);
    expect(errors[0]?.code).toBe('unknown');
    expect(errors[0]?.message).toContain('formato raro');
  });
});
