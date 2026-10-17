// Genera las capturas de docs/img/ con el documento ficticio de ejemplo.
// Requiere la app servida (p. ej. `npm run build && npx vite preview --port 4173`):
//   node scripts/screenshots.mjs http://localhost:4173/
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4173/';
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'img');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 860 },
  locale: 'es-ES',
  deviceScaleFactor: 1,
});

await page.goto(base);
await page.screenshot({ path: join(out, 'inicio.png') });

await page.getByTestId('load-example').click();
await page.locator('canvas.preview[data-ready="true"]').waitFor({ timeout: 45_000 });
await page.getByTestId('text-recipient').fill('Movistar');
await page.getByTestId('text-purpose').fill('cambio de titularidad');
const box = await page.getByTestId('overlay').boundingBox();
await page.mouse.move(box.x + box.width * 0.05, box.y + box.height * 0.82);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.97, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(700);
await page.screenshot({ path: join(out, 'editor.png') });

await page.getByTestId('tool-crop').click();
await page.waitForTimeout(700);
await page.screenshot({ path: join(out, 'recorte.png') });

await browser.close();
console.log(`Capturas en ${out}`);
