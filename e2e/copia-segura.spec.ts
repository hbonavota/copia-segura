import { expect, test, type Download } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import {
  afterRender,
  downloadBytes,
  drag,
  inspectJpeg,
  isBlack,
  jpegPixel,
  loadExample,
  previewPixel,
  withoutWatermark,
} from './helpers';

test.describe('RF-11 / RF-01 · documento de ejemplo', () => {
  test('carga dos páginas y recorta automáticamente la tarjeta que hay dentro del A4', async ({
    page,
  }) => {
    await loadExample(page);
    await expect(page.locator('.page-item')).toHaveCount(2);
    await expect(page.locator('.notice')).toContainText('recortado automáticamente');
    // La tarjeta de ejemplo mide 1600×1010: recortada y reducida sale apaisada, no como un A4.
    await expect(page.getByTestId('meta')).toHaveText(/1200 × 7\d\d px/);
  });
});

test.describe('RF-06 · tapar zonas', () => {
  test('una zona dibujada queda negra en la vista previa y se puede deshacer', async ({ page }) => {
    await loadExample(page);
    await withoutWatermark(page);
    const before = await previewPixel(page, { x: 0.3, y: 0.9 });
    expect(before.some((channel) => channel > 60)).toBe(true);

    await drag(page, { x: 0.05, y: 0.82 }, { x: 0.55, y: 0.97 });
    expect(isBlack(await previewPixel(page, { x: 0.3, y: 0.9 }))).toBe(true);

    await afterRender(page, () => page.getByTestId('undo-mask').click());
    const after = await previewPixel(page, { x: 0.3, y: 0.9 });
    expect(after.some((channel) => channel > 60)).toBe(true);
  });

  test('en el archivo exportado el píxel original no existe: la zona es negra', async ({
    page,
  }) => {
    await loadExample(page);
    await withoutWatermark(page);
    await drag(page, { x: 0.05, y: 0.82 }, { x: 0.55, y: 0.97 });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-jpg').click(),
    ]);
    const bytes = await downloadBytes(download);
    expect(isBlack(await jpegPixel(page, bytes, { x: 0.3, y: 0.9 }))).toBe(true);
    const untouched = await jpegPixel(page, bytes, { x: 0.3, y: 0.3 });
    expect(untouched.some((channel) => channel > 60)).toBe(true);
  });

  test('las franjas se tapan desde botones, sin ratón (RNF-04)', async ({ page }) => {
    await loadExample(page);
    await withoutWatermark(page);
    await page.getByTestId('strip-bottom').focus();
    await afterRender(page, () => page.keyboard.press('Enter'));
    expect(isBlack(await previewPixel(page, { x: 0.5, y: 0.95 }))).toBe(true);
  });
});

test.describe('RF-04 · giro', () => {
  test('girar intercambia ancho y alto de la salida', async ({ page }) => {
    await loadExample(page);
    await afterRender(page, () => page.getByTestId('rotate-right').click());
    await expect(page.getByTestId('meta')).toHaveText(/7\d\d × 1200 px/);
  });
});

test.describe('RF-05 · recorte', () => {
  test('quitar el recorte automático vuelve a exportar la página A4 entera', async ({ page }) => {
    await loadExample(page);
    await afterRender(page, () => page.getByTestId('clear-crop').click());
    // A4 vertical reducido a 1200 px de alto.
    await expect(page.getByTestId('meta')).toHaveText(/8\d\d × 1200 px/);
  });
});

test.describe('RF-07 / RF-08 / RF-10 · exportación', () => {
  test('el JPG descargado tiene el tamaño pedido, sin EXIF y con el nombre esperado', async ({
    page,
  }) => {
    await loadExample(page);
    await page.getByTestId('text-recipient').fill('Movistar');
    await page.getByTestId('text-purpose').fill('cambio de titularidad');
    await expect(page.getByTestId('composed-text')).toContainText(
      'COPIA SOLO VÁLIDA PARA Movistar · cambio de titularidad',
    );
    await afterRender(page, () => page.getByTestId('max-side').selectOption('800'));

    const downloads: Download[] = [];
    page.on('download', (download) => downloads.push(download));
    await page.getByTestId('export-jpg').click();
    await expect.poll(() => downloads.length).toBe(2);
    expect(downloads.map((d) => d.suggestedFilename()).sort()).toEqual([
      'documento-ficticio-p1-copia-segura.jpg',
      'documento-ficticio-p2-copia-segura.jpg',
    ]);

    const first = downloads[0];
    if (!first) throw new Error('sin descargas');
    const jpeg = inspectJpeg(await downloadBytes(first));
    expect(Math.max(jpeg.width, jpeg.height)).toBe(800);
    expect(jpeg.hasExif).toBe(false);
  });

  test('el PDF descargado tiene una página por imagen', async ({ page }) => {
    await loadExample(page);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-pdf').click(),
    ]);
    expect(download.suggestedFilename()).toBe('documento-ficticio-copia-segura.pdf');
    // Al cargar, pdf-lib también reescribe el productor salvo que se le pida lo contrario.
    const pdf = await PDFDocument.load(await downloadBytes(download), { updateMetadata: false });
    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getProducer()).toBe('copia-segura');
  });
});

test.describe('RNF-01 · privacidad', () => {
  test('ninguna petición sale del origen durante el flujo completo', async ({ page, baseURL }) => {
    // Un `blob:` creado por la página pertenece a su mismo origen (así arranca el worker de pdf.js).
    const origin = new URL(baseURL ?? 'http://localhost').origin;
    const foreign: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) foreign.push(request.url());
    });
    await loadExample(page);
    await drag(page, { x: 0.1, y: 0.1 }, { x: 0.3, y: 0.3 });
    await afterRender(page, () => page.getByTestId('preset-suave').check());
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-pdf').click(),
    ]);
    await download.path();
    expect(foreign).toEqual([]);
  });

  test('el HTML publicado lleva la política de seguridad y no guarda el documento', async ({
    page,
  }) => {
    await loadExample(page);
    const csp = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("default-src 'self'");
    const stored = await page.evaluate(() => Object.keys(localStorage));
    expect(stored.filter((key) => key !== 'copia-segura.locale')).toEqual([]);
  });
});

test.describe('RF-12 · idioma', () => {
  test('cambia a inglés y lo recuerda al recargar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.dropzone h2')).toHaveText('Arrastra aquí tu DNI');
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('.dropzone h2')).toHaveText('Drop your ID here');
    await page.reload();
    await expect(page.locator('.dropzone h2')).toHaveText('Drop your ID here');
    // El texto inicial de la marca sigue al idioma con el que arranca la sesión.
    await expect(page.getByTestId('text-freeText')).toHaveValue('COPY ONLY VALID FOR');
  });
});
