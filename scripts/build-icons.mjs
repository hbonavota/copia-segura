// Genera los iconos de la app instalable (SPEC-0012) en public/icons/: el sello del nombre sobre
// fondo de papel. `maskable` deja el sello dentro de la zona segura (80 % central) para que
// Android pueda recortar el icono en círculo o en squircle sin cortarlo.
// También el favicon (SVG e ICO) y la imagen para redes sociales `og.png` (SPEC-0014).
//
// Uso: node scripts/build-icons.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const out = join(pub, 'icons');
const RED = '#b4231f';
const PAPER = '#f6f7f9';

/** Sello girado con "COPIA" y "SEGURA" en dos líneas; `scale` controla el margen. */
function svg(size, scale, rounded) {
  const r = rounded ? size * 0.22 : 0;
  const w = size * 0.78 * scale;
  const h = size * 0.5 * scale;
  const stroke = size * 0.045 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${PAPER}"/>
  <g transform="translate(${size / 2} ${size / 2}) rotate(-12)" fill="${RED}"
     font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-weight="800" text-anchor="middle">
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${size * 0.04 * scale}"
          fill="none" stroke="${RED}" stroke-width="${stroke}"/>
    <text y="${-h * 0.04}" font-size="${size * 0.17 * scale}" letter-spacing="${size * 0.012 * scale}">COPIA</text>
    <text y="${h * 0.32}" font-size="${size * 0.105 * scale}" letter-spacing="${size * 0.02 * scale}">SEGURA</text>
  </g>
</svg>`;
}

const icons = [
  ['icon-192.png', 192, 0.86, true],
  ['icon-512.png', 512, 0.86, true],
  ['maskable-512.png', 512, 0.78, false],
  ['apple-touch-icon.png', 180, 0.92, false],
];

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [name, size, scale, rounded] of icons) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg(size, scale, rounded)}</body></html>`,
  );
  await page.screenshot({
    path: join(out, name),
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
  });
}

// Favicon: solo "COPIA", que se lee a 16 px. El SVG para navegadores actuales; el ICO (con PNG
// dentro, 16 y 32 px) para los que piden /favicon.ico por su cuenta.
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="3" y="8" width="26" height="16" rx="2" fill="none" stroke="${RED}" stroke-width="2.5" transform="rotate(-12 16 16)"/><text x="16" y="19.5" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="8" fill="${RED}" transform="rotate(-12 16 16)">COPIA</text></svg>\n`;
writeFileSync(join(pub, 'favicon.svg'), FAVICON);
const pngs = [];
for (const size of [16, 32]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml,${encodeURIComponent(FAVICON)}" width="${size}" height="${size}"></body></html>`,
  );
  pngs.push([
    size,
    await page.screenshot({
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size },
    }),
  ]);
}
writeFileSync(join(pub, 'favicon.ico'), ico(pngs));

// Imagen para redes (1200×630): sello, nombre y qué hace, con la fuente de la app.
const inter = readFileSync(
  join(
    pub,
    '..',
    'node_modules',
    '@fontsource-variable',
    'inter',
    'files',
    'inter-latin-wght-normal.woff2',
  ),
).toString('base64');
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<html><head><style>
  @font-face { font-family: Inter; src: url(data:font/woff2;base64,${inter}) format('woff2'); font-weight: 100 900; }
  body { margin: 0; width: 1200px; height: 630px; background: ${PAPER}; font-family: Inter, sans-serif;
         display: grid; grid-template-columns: 320px 1fr; align-items: center; gap: 48px; padding: 0 72px; box-sizing: border-box; color: #0f172a; }
  h1 { font-size: 76px; letter-spacing: -0.03em; margin: 0 0 20px; font-weight: 800; }
  p { font-size: 34px; line-height: 1.3; margin: 0 0 32px; color: #334155; }
  .url { font-size: 26px; color: #1d4ed8; font-weight: 600; }
  .tags { display: flex; gap: 12px; margin-bottom: 34px; }
  .tags span { white-space: nowrap; font-size: 21px; font-weight: 600; padding: 8px 16px; border-radius: 999px; background: #e2e8f0; color: #1e293b; }
</style></head><body>
  ${svg(320, 1, true)}
  <div>
    <h1>copia segura</h1>
    <p>Marca de agua y zonas tapadas para tu DNI o cualquier documento, sin subirlo a ningún sitio.</p>
    <div class="tags"><span>Sin servidor</span><span>Sin metadatos</span><span>Funciona sin conexión</span></div>
    <div class="url">copia-segura.orbytia.es</div>
  </div>
</body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: join(pub, 'og.png'),
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});

await browser.close();
console.log(`Iconos, favicon e imagen social en ${pub}`);

/** Archivo ICO con imágenes PNG dentro (válido desde Windows Vista y en todos los navegadores). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(([size, png], i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size % 256, e);
    header.writeUInt8(size % 256, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(([, png]) => png)]);
}
