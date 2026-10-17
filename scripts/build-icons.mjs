// Genera los iconos de la app instalable (SPEC-0012) en public/icons/: el sello del nombre sobre
// fondo de papel. `maskable` deja el sello dentro de la zona segura (80 % central) para que
// Android pueda recortar el icono en círculo o en squircle sin cortarlo.
//
// Uso: node scripts/build-icons.mjs
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
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
await browser.close();
console.log(`Iconos en ${out}`);
