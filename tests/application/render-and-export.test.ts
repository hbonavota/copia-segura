import { describe, expect, it } from 'vitest';
import { PRESETS, type Page, type PageEdits } from '../../src/domain';
import {
  CaptureFromCamera,
  CameraError,
  ExportCopies,
  RenderPage,
  collectionName,
  uniqueFileNames,
  type ExportItem,
  type RenderSettings,
} from '../../src/application';
import {
  FakeArchiver,
  FakeCamera,
  FakeCameraSession,
  FakeDownloader,
  FakePdfWriter,
  FakeRasterizer,
  decoded,
  fakeBitmap,
  fakeMeasurer,
  fixedClock,
} from './fakes';

const page = (id: string, label: string, sourceName = 'dni'): Page => ({
  id,
  label,
  sourceName,
  size: { width: 3000, height: 1900 },
});
const noEdits: PageEdits = { rotation: 0, crop: null, masks: [] };
const settings: RenderSettings = {
  style: PRESETS.normal,
  text: {
    freeText: 'COPIA SOLO VÁLIDA PARA',
    recipient: 'Movistar',
    purpose: '',
    includeDate: true,
  },
  output: { maxSide: 1200, jpegQuality: 0.82 },
};

function renderPage(rasterizer = new FakeRasterizer()): RenderPage {
  return new RenderPage({
    rasterizer,
    measurer: fakeMeasurer,
    clock: fixedClock(new Date(2026, 9, 17)),
  });
}

describe('RF-07/RF-09 · RenderPage', () => {
  it('compone el texto con la fecha del reloj y lo pone en el plan', () => {
    const plan = renderPage().plan({ page: page('1', 'p1'), edits: noEdits, ...settings });
    expect(plan.watermark?.text).toBe('COPIA SOLO VÁLIDA PARA Movistar · 17/10/2026');
  });

  it('la vista previa y la exportación usan el mismo plan', async () => {
    const rasterizer = new FakeRasterizer();
    const rp = renderPage(rasterizer);
    const input = {
      page: page('1', 'p1'),
      edits: noEdits,
      bitmap: fakeBitmap({ width: 3000, height: 1900 }),
      ...settings,
    };
    const rendered = await rp.run(input);
    expect(rasterizer.rasters[0]?.plan).toEqual(rp.plan(input));
    expect(rendered.plan).toEqual(rp.plan(input));
  });
});

describe('RF-10 · ExportCopies', () => {
  function exporter() {
    const rasterizer = new FakeRasterizer();
    const pdfWriter = new FakePdfWriter();
    const archiver = new FakeArchiver();
    const downloader = new FakeDownloader();
    const useCase = new ExportCopies({
      renderPage: renderPage(rasterizer),
      pdfWriter,
      archiver,
      downloader,
    });
    return { useCase, rasterizer, pdfWriter, archiver, downloader };
  }
  const items: ExportItem[] = [
    { page: page('1', 'p1'), bitmap: fakeBitmap({ width: 3000, height: 1900 }), edits: noEdits },
    {
      page: page('2', 'p2'),
      bitmap: fakeBitmap({ width: 3000, height: 1900 }),
      edits: { ...noEdits, rotation: 90 },
    },
  ];

  it('JPG: descarga un archivo por página con su nombre', async () => {
    const { useCase, downloader } = exporter();
    const summary = await useCase.run({ items, format: 'jpg', ...settings });
    expect(summary.files).toEqual(['dni-p1-copia-segura.jpg', 'dni-p2-copia-segura.jpg']);
    expect(downloader.downloads.map((d) => d.fileName)).toEqual(summary.files);
    expect(downloader.downloads[0]?.blob.type).toBe('image/jpeg');
  });

  it('ZIP: un único archivo con un JPG por página', async () => {
    const { useCase, archiver, downloader } = exporter();
    const summary = await useCase.run({ items, format: 'zip', ...settings });
    expect(summary.files).toEqual(['dni-copia-segura.zip']);
    expect(archiver.entries.map((e) => e.name)).toEqual([
      'dni-p1-copia-segura.jpg',
      'dni-p2-copia-segura.jpg',
    ]);
    expect(downloader.downloads).toHaveLength(1);
  });

  it('PDF: una página por imagen, en orden y con el tamaño de salida', async () => {
    const { useCase, pdfWriter, downloader } = exporter();
    await useCase.run({ items, format: 'pdf', ...settings });
    expect(pdfWriter.pages.map((p) => p.size)).toEqual([
      { width: 1200, height: 760 },
      { width: 760, height: 1200 },
    ]);
    expect(downloader.downloads[0]?.fileName).toBe('dni-copia-segura.pdf');
  });

  it('libera cada raster después de codificarlo y usa la calidad del plan (acotada)', async () => {
    const { useCase, rasterizer, downloader } = exporter();
    await useCase.run({ items, format: 'jpg', ...settings });
    expect(rasterizer.rasters.every((r) => r.disposed)).toBe(true);
    expect(await downloader.downloads[0]?.blob.text()).toBe('jpeg@0.82');

    const clamped = exporter();
    await clamped.useCase.run({
      items,
      format: 'jpg',
      ...settings,
      output: { maxSide: 1200, jpegQuality: 5 },
    });
    expect(await clamped.downloader.downloads[0]?.blob.text()).toBe('jpeg@1');
  });

  it('dos archivos con el mismo nombre no pisan sus páginas en el ZIP', async () => {
    const { useCase, archiver } = exporter();
    const twice = [
      ...items,
      ...items.map((i) => ({ ...i, page: { ...i.page, id: `${i.page.id}b` } })),
    ];
    await useCase.run({ items: twice, format: 'zip', ...settings });
    expect(archiver.entries.map((e) => e.name)).toEqual([
      'dni-p1-copia-segura.jpg',
      'dni-p2-copia-segura.jpg',
      'dni-p1-copia-segura-2.jpg',
      'dni-p2-copia-segura-2.jpg',
    ]);
    expect(uniqueFileNames(['a.jpg', 'a.jpg', 'a.jpg', 'b.jpg'])).toEqual([
      'a.jpg',
      'a-2.jpg',
      'a-3.jpg',
      'b.jpg',
    ]);
  });

  it('sin páginas no exporta nada', async () => {
    const { useCase, downloader } = exporter();
    expect(await useCase.run({ items: [], format: 'pdf', ...settings })).toEqual({ files: [] });
    expect(downloader.downloads).toHaveLength(0);
  });

  it('usa el nombre común si todas las páginas vienen del mismo archivo y uno genérico si no', () => {
    expect(collectionName(items)).toBe('dni');
    expect(collectionName([items[0]!, { ...items[1]!, page: page('3', 'foto-1', 'img_1') }])).toBe(
      'documentos',
    );
  });
});

describe('RF-03 · CaptureFromCamera', () => {
  it('convierte la captura en una página camara-N sin ediciones', async () => {
    const session = new FakeCameraSession(decoded(1280, 720));
    const useCase = new CaptureFromCamera({ camera: new FakeCamera(session) });
    const started = await useCase.start();
    const imported = await useCase.capture(started);
    expect(imported.page.label).toBe('camara-1');
    expect(imported.page.sourceName).toBe('captura');
    expect(imported.page.size).toEqual({ width: 1280, height: 720 });
    expect(imported.edits.masks).toHaveLength(0);
    expect((await useCase.capture(started)).page.label).toBe('camara-2');
  });

  it('propaga el error de permiso denegado para que la interfaz lo explique', async () => {
    const useCase = new CaptureFromCamera({ camera: new FakeCamera(new CameraError('denied')) });
    await expect(useCase.start()).rejects.toMatchObject({ code: 'denied' });
  });
});
