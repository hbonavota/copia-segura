import { expect, test, type Download, type Page } from '@playwright/test';
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
    await page.getByTestId('text-recipient').fill('Empresa Ejemplo');
    await page.getByTestId('text-purpose').fill('alta de un servicio');
    await expect(page.getByTestId('composed-text')).toContainText(
      'COPIA SOLO VÁLIDA PARA Empresa Ejemplo · alta de un servicio',
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

  test('la política de seguridad bloquea de verdad una petición a otro dominio', async ({
    page,
  }) => {
    await page.goto('./');
    const outcome = await page.evaluate(async () => {
      const violation = new Promise<string>((resolve) =>
        document.addEventListener('securitypolicyviolation', (e) => resolve(e.effectiveDirective), {
          once: true,
        }),
      );
      const request = fetch('https://example.com/').then(
        () => 'enviada',
        () => 'bloqueada',
      );
      return { request: await request, directive: await violation };
    });
    expect(outcome).toEqual({ request: 'bloqueada', directive: 'connect-src' });
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
    await page.goto('./');
    await expect(page.locator('.dropzone h2')).toHaveText('Arrastra aquí tu DNI');
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('.dropzone h2')).toHaveText('Drop your ID here');
    await page.reload();
    await expect(page.locator('.dropzone h2')).toHaveText('Drop your ID here');
    // El texto inicial de la marca sigue al idioma con el que arranca la sesión.
    await expect(page.getByTestId('text-freeText')).toHaveValue('COPY ONLY VALID FOR');
  });
});

test.describe('RF-19 · tema claro y oscuro', () => {
  const background = (page: Page) =>
    page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

  test('sin elegir nada sigue el tema del sistema', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./');
    const toggle = page.getByRole('switch', { name: 'Modo oscuro' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(await background(page)).toBe('rgb(22, 24, 27)');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(await background(page)).toBe('rgb(242, 241, 236)');
  });

  test('el interruptor cambia el tema, lo recuerda y vuelve a seguir al sistema', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./');
    const toggle = page.getByRole('switch', { name: 'Modo oscuro' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(await background(page)).toBe('rgb(22, 24, 27)');

    // Se aplica antes de que arranque la aplicación (public/theme.js), así que no parpadea.
    await page.reload({ waitUntil: 'commit' });
    await page.waitForSelector('html[data-theme="dark"]', { state: 'attached' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Volver al tema del sistema borra la preferencia: si el sistema cambia, la página lo sigue.
    await toggle.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    expect(await page.evaluate(() => localStorage.getItem('copia-segura.theme'))).toBeNull();
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('SPEC-0005 · portada, B/N, plantillas, verificable, móvil', () => {
  test('RF-14 · la portada muestra la demo y sus pestañas cambian el paso', async ({ page }) => {
    await page.goto('./');
    const canvas = page.locator('.demo-canvas');
    await expect(canvas).toHaveAttribute('data-step', 'marked');
    await page.getByTestId('demo-original').click();
    await expect(canvas).toHaveAttribute('data-step', 'original');
    await page.getByTestId('demo-original').press('ArrowRight');
    await expect(canvas).toHaveAttribute('data-step', 'masked');
    await expect(page.getByTestId('demo-masked')).toHaveAttribute('aria-selected', 'true');
  });

  test('RF-15 · en blanco y negro el documento queda en grises', async ({ page }) => {
    await loadExample(page);
    await withoutWatermark(page);
    await afterRender(page, () => page.getByTestId('grayscale').check());
    const [r, g, b] = await previewPixel(page, { x: 0.5, y: 0.03 });
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(2);
  });

  test('RF-16 · aplicar una plantilla tapa sus zonas y se deshace zona a zona', async ({
    page,
  }) => {
    await loadExample(page);
    await withoutWatermark(page);
    await page.getByTestId('template').selectOption('dni-es-dorso');
    await afterRender(page, () => page.getByTestId('apply-template').click());
    expect(isBlack(await previewPixel(page, { x: 0.5, y: 0.85 }))).toBe(true);
    await afterRender(page, () => page.getByTestId('undo-mask').click());
    expect(isBlack(await previewPixel(page, { x: 0.5, y: 0.85 }))).toBe(false);
  });

  test('RF-17 · explica cómo verificarlo y qué la hace distinta', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByTestId('verify')).toContainText('Compruébalo tú');
    await expect(page.getByTestId('verify').getByRole('link')).toHaveAttribute(
      'href',
      /e2e\/copia-segura\.spec\.ts$/,
    );
    await expect(page.getByTestId('distinct').locator('dt')).toHaveCount(6);
  });

  test('RF-18 · en móvil el editor va antes que las páginas y los ajustes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loadExample(page);
    const editor = await page.locator('.editor').boundingBox();
    const pages = await page.locator('.pages').boundingBox();
    const settings = await page.locator('.settings').boundingBox();
    expect(editor && pages && settings).toBeTruthy();
    expect(editor!.y).toBeLessThan(pages!.y);
    expect(pages!.y).toBeLessThan(settings!.y);
  });
});
