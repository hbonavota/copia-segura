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
    await expect(page.locator('.dropzone h2')).toHaveText('Suelta tu documento aquí');
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('.dropzone h2')).toHaveText('Drop your document here');
    await page.reload();
    await expect(page.locator('.dropzone h2')).toHaveText('Drop your document here');
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
    await expect(counter).toContainText('recursos de otros dominios');
    await expect(counter).toHaveAttribute('href', '#verify-title');
  });

  test('RF-22 · un recurso de otro dominio sube el contador y lo pone en aviso', async ({
    page,
  }) => {
    await page.goto('./');
    const counter = page.getByTestId('trust-counter');
    await expect(counter).toHaveAttribute('data-count', '0');
    // La CSP lo bloquea, pero el navegador registra el intento: el contador no lo esconde.
    await page.evaluate(() => {
      const img = document.createElement('img');
      img.src = 'https://example.com/pixel.png';
      document.body.append(img);
    });
    await expect(counter).toHaveAttribute('data-count', '1');
    await expect(counter).toHaveClass(/is-warning/);
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

  test('RF-24 · sin desplazamiento lateral en móvil, tablet y escritorio', async ({ page }) => {
    const overflow = (): Promise<number> =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
    const widths = [320, 360, 390, 768, 1024, 1280];
    await page.goto('./');
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      expect(await overflow(), `portada a ${width} px`).toBeLessThanOrEqual(0);
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadExample(page);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      expect(await overflow(), `editor a ${width} px`).toBeLessThanOrEqual(0);
    }
  });

  test('RF-24 · al cargar un documento el foco pasa al editor', async ({ page }) => {
    await page.goto('./');
    await page.getByTestId('load-example').focus();
    await page.keyboard.press('Enter');
    await page.locator('canvas.preview[data-ready="true"]').waitFor({ timeout: 45_000 });
    await expect(page.locator('.editor button').first()).toBeFocused();
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

    // Tras arrastrar, la zona sigue seleccionada y con el foco: Supr la quita directamente.
    await expect(page.getByTestId('mask-1')).toBeFocused();
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

test.describe('RF-27 · zonas con teclado y con recorte', () => {
  test('flechas mueven, Alt + flechas redimensionan y Esc suelta sin perder el foco', async ({
    page,
  }) => {
    await loadExample(page);
    await withoutWatermark(page);
    await drag(page, { x: 0.05, y: 0.05 }, { x: 0.25, y: 0.25 });
    const zone = page.getByTestId('mask-1');
    await expect(zone).toBeFocused();
    const left = async (): Promise<number> => (await zone.boundingBox())?.x ?? 0;
    const width = async (): Promise<number> => (await zone.boundingBox())?.width ?? 0;

    const x0 = await left();
    await afterRender(page, () => page.keyboard.press('Shift+ArrowRight'));
    expect(await left()).toBeGreaterThan(x0);

    const w0 = await width();
    await afterRender(page, () => page.keyboard.press('Alt+Shift+ArrowRight'));
    expect(await width()).toBeGreaterThan(w0);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('overlay')).toBeFocused();
  });

  test('una zona que sobresale del recorte no se mueve al pulsarla', async ({ page }) => {
    await loadExample(page);
    // Página A4 entera: una zona en la esquina, fuera de donde quedará el recorte.
    await afterRender(page, () => page.getByTestId('clear-crop').click());
    await drag(page, { x: 0.02, y: 0.02 }, { x: 0.6, y: 0.2 });
    // Recortar dejando fuera parte de la zona.
    await afterRender(page, () => page.getByTestId('tool-crop').click());
    await drag(page, { x: 0.3, y: 0.1 }, { x: 0.9, y: 0.6 });
    await afterRender(page, () => page.getByTestId('tool-mask').click());

    const zone = page.getByTestId('mask-1');
    const before = await zone.boundingBox();
    const render = await page.locator('canvas.preview').getAttribute('data-render');
    // Clic en la parte visible de la zona (el resto queda fuera del recorte).
    const box = await page.getByTestId('overlay').boundingBox();
    if (!box) throw new Error('sin vista previa');
    await page.mouse.click(box.x + box.width * 0.1, box.y + box.height * 0.1);
    await expect(zone).toHaveAttribute('data-selected', 'true');
    expect(await zone.boundingBox()).toEqual(before);
    // Un clic sin arrastre solo selecciona: no cambia las zonas ni vuelve a dibujar.
    await page.waitForTimeout(200);
    expect(await page.locator('canvas.preview').getAttribute('data-render')).toBe(render);
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
    // Zona de 480 × 303 px en la salida → bloques de 152 px desde (120, 76). Dos puntos del mismo
    // bloque, (360, 190) y (372, 197), tienen exactamente el mismo color: la media del bloque.
    expect(await previewPixel(page, { x: 0.31, y: 0.26 })).toEqual(
      await previewPixel(page, { x: 0.3, y: 0.25 }),
    );
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

test.describe('SPEC-0010 · cualquier documento', () => {
  /** PNG generado en el navegador: una "nómina" blanca con un logo de color. */
  async function pngOf(page: Page, width: number, height: number): Promise<Buffer> {
    const dataUrl = await page.evaluate(
      ([w, hgt]) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = hgt;
        const ctx = c.getContext('2d');
        if (!ctx) throw new Error('sin canvas');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, hgt);
        ctx.fillStyle = '#2a6f97';
        ctx.fillRect(w * 0.08, hgt * 0.05, w * 0.3, hgt * 0.1);
        return c.toDataURL('image/png');
      },
      [width, height] as const,
    );
    return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64');
  }

  test('RF-31 · la portada dice qué documentos acepta, no solo el DNI', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByTestId('kinds').locator('li')).toHaveText([
      'DNI',
      'Pasaporte',
      'Nómina',
      'Contrato',
      'Factura',
      'Cualquier PDF o imagen',
    ]);
    await expect(page.locator('.dropzone h2')).toHaveText('Suelta tu documento aquí');
  });

  test('RF-32 · una imagen cualquiera recibe la marca y sale con su nombre', async ({ page }) => {
    await page.goto('./');
    await page.locator('.dropzone input[type="file"]').setInputFiles({
      name: 'nomina-octubre.png',
      mimeType: 'image/png',
      buffer: await pngOf(page, 900, 1270),
    });
    await page.locator('canvas.preview[data-ready="true"]').waitFor({ timeout: 45_000 });
    await expect(page.locator('.page-item')).toHaveCount(1);
    // La marca cruza la página en blanco: alguna fila tiene píxeles rojizos.
    const marked = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('canvas.preview');
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return false;
      const px = ctx.getImageData(0, Math.floor(canvas.height * 0.6), canvas.width, 1).data;
      for (let i = 0; i < px.length; i += 4) {
        if ((px[i] ?? 0) - (px[i + 2] ?? 0) > 40) return true;
      }
      return false;
    });
    expect(marked).toBe(true);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-jpg').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^nomina-octubre-.*copia-segura\.jpg$/);
  });

  test('RF-32 · un PDF de texto con logo no se recorta al logo', async ({ page }) => {
    await page.goto('./');
    const pdf = await PDFDocument.create();
    const sheet = pdf.addPage([595, 842]);
    const logo = await pdf.embedPng(await pngOf(page, 300, 120));
    sheet.drawImage(logo, { x: 50, y: 690, width: 220, height: 110 });
    const lines = [
      'NOMINA DE EJEMPLO - EMPRESA FICTICIA S.L.',
      'Trabajador: Persona Ficticia - Periodo: octubre',
      'Salario base, complementos, retenciones y liquido a percibir.',
      'Documento de prueba generado por el test e2e de copia segura.',
    ];
    lines.forEach((line, i) => sheet.drawText(line, { x: 50, y: 620 - i * 24, size: 12 }));
    await page.locator('.dropzone input[type="file"]').setInputFiles({
      name: 'nomina.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(await pdf.save()),
    });
    await page.locator('canvas.preview[data-ready="true"]').waitFor({ timeout: 45_000 });
    // Página A4 entera (vertical), sin el aviso de recorte automático.
    await expect(page.getByTestId('meta')).toHaveText(/8\d\d × 1200 px/);
    await expect(page.locator('.notice')).not.toContainText('recortado automáticamente');
  });
});
