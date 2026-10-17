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
    await expect(page.locator('.dropzone h2')).toHaveText('Suelta tu DNI aquí');
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
    expect(await background(page)).toBe('rgb(11, 13, 16)');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(await background(page)).toBe('rgb(246, 247, 249)');
  });

  test('el interruptor cambia el tema, lo recuerda y vuelve a seguir al sistema', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./');
    const toggle = page.getByRole('switch', { name: 'Modo oscuro' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(await background(page)).toBe('rgb(11, 13, 16)');

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

test.describe('SPEC-0007 · sistema visual y confianza', () => {
  test('RF-21 · la intensidad es un grupo de radio que se maneja con el teclado', async ({
    page,
  }) => {
    await loadExample(page);
    const group = page.getByRole('radiogroup', { name: 'Intensidad' });
    await expect(group.getByRole('radio')).toHaveCount(2);
    await page.getByTestId('preset-normal').focus();
    await afterRender(page, () => page.keyboard.press('ArrowRight'));
    await expect(page.getByTestId('preset-suave')).toBeChecked();
  });

  test('RF-22 · el contador muestra 0 peticiones a otros dominios tras un flujo completo', async ({
    page,
  }) => {
    await loadExample(page);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-pdf').click(),
    ]);
    await download.path();
    const counter = page.getByTestId('trust-counter');
    await expect(counter).toHaveAttribute('data-count', '0');
    await expect(counter).toContainText('peticiones a otros dominios');
    await expect(counter).toHaveAttribute('href', '#verify-title');
  });

  test('RF-23 · al exportar, aviso de éxito y paso de descarga completado', async ({ page }) => {
    await loadExample(page);
    await expect(page.locator('.step[data-step="adjust"]')).toHaveAttribute('aria-current', 'step');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-pdf').click(),
    ]);
    await download.path();
    await expect(page.locator('.notice.is-success')).toContainText('Nada ha salido de tu equipo');
    await expect(page.locator('.step[data-step="download"]')).toHaveClass(/is-done/);
  });
});

test.describe('SPEC-0008 · portada y editor', () => {
  test('RF-24 · la portada no enseña ajustes; el editor sí, con el paso actual marcado', async ({
    page,
  }) => {
    await page.goto('./');
    await expect(page.locator('.inspector')).toBeHidden();
    await expect(page.locator('.step[data-step="upload"]')).toHaveAttribute('aria-current', 'step');
    await loadExample(page);
    await expect(page.locator('.dropzone')).toBeHidden();
    await expect(page.locator('.inspector')).toBeVisible();
    await expect(page.locator('.step[data-step="upload"]')).toHaveClass(/is-done/);
  });

  test('RF-26 · una sugerencia rellena la finalidad', async ({ page }) => {
    await loadExample(page);
    await page.getByTestId('suggest-2').click();
    await expect(page.getByTestId('text-purpose')).toHaveValue('contrato de alquiler');
    await expect(page.getByTestId('composed-text')).toContainText('contrato de alquiler');
  });

  test('RF-26 · con una sola página aparece el hueco para el dorso', async ({ page }) => {
    await loadExample(page);
    await expect(page.getByTestId('add-back')).toBeHidden();
    await page.getByRole('button', { name: 'Quitar página p2' }).click();
    await expect(page.getByTestId('add-back')).toBeVisible();
  });

  test('RF-27 · una zona se mueve arrastrándola y se quita con Supr', async ({ page }) => {
    await loadExample(page);
    await withoutWatermark(page);
    await drag(page, { x: 0.05, y: 0.05 }, { x: 0.25, y: 0.25 });
    expect(isBlack(await previewPixel(page, { x: 0.15, y: 0.15 }))).toBe(true);

    // Arrastrar la zona hacia la derecha: deja de tapar su sitio y tapa el nuevo.
    await drag(page, { x: 0.15, y: 0.15 }, { x: 0.65, y: 0.15 });
    expect(isBlack(await previewPixel(page, { x: 0.15, y: 0.15 }))).toBe(false);
    expect(isBlack(await previewPixel(page, { x: 0.65, y: 0.15 }))).toBe(true);

    await page.getByTestId('mask-1').focus();
    await afterRender(page, () => page.keyboard.press('Delete'));
    expect(isBlack(await previewPixel(page, { x: 0.65, y: 0.15 }))).toBe(false);
    await expect(page.getByTestId('mask-1')).toHaveCount(0);
  });

  test('RF-27 · el tirador cambia el tamaño de la zona', async ({ page }) => {
    await loadExample(page);
    await withoutWatermark(page);
    await drag(page, { x: 0.05, y: 0.05 }, { x: 0.25, y: 0.25 });
    expect(isBlack(await previewPixel(page, { x: 0.4, y: 0.4 }))).toBe(false);
    await page.getByTestId('mask-1').click();
    const handle = await page.getByTestId('mask-1').locator('.mask-handle').boundingBox();
    const box = await page.getByTestId('overlay').boundingBox();
    if (!handle || !box) throw new Error('sin tirador');
    await afterRender(page, async () => {
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5, { steps: 6 });
      await page.mouse.up();
    });
    expect(isBlack(await previewPixel(page, { x: 0.4, y: 0.4 }))).toBe(true);
  });
});

test.describe('SPEC-0009 · pixelado, iPhone y preguntas', () => {
  test('RF-28 · el pixelado sustituye la zona por bloques, no por negro', async ({ page }) => {
    await loadExample(page);
    await withoutWatermark(page);
    const original = await previewPixel(page, { x: 0.3, y: 0.3 });
    await afterRender(page, () => page.getByTestId('redaction-pixelate').check());
    await expect(page.getByTestId('redaction-help')).toContainText('no lo uses sobre números');
    await drag(page, { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 });
    const pixelated = await previewPixel(page, { x: 0.3, y: 0.3 });
    expect(isBlack(pixelated)).toBe(false);
    expect(pixelated).not.toEqual(original);
  });

  test('RF-29 · una foto HEIC que el navegador no abre da un aviso específico', async ({
    page,
  }) => {
    await page.goto('./');
    await page.locator('.dropzone input[type="file"]').setInputFiles({
      name: 'IMG_0001.HEIC',
      mimeType: 'image/heic',
      buffer: Buffer.from('no es una imagen'),
    });
    await expect(page.locator('.notice.is-error')).toContainText('HEIC');
  });

  test('RF-30 · preguntas frecuentes desplegables', async ({ page }) => {
    await page.goto('./');
    const faq = page.getByTestId('faq');
    await expect(faq.locator('details')).toHaveCount(9);
    await faq.locator('summary').first().click();
    await expect(faq.locator('details').first()).toHaveAttribute('open', '');
  });
});
