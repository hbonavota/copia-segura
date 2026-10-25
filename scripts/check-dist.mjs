// Comprueba la web ya construida (SPEC-0014) antes de publicarla:
// - lo que descarga la portada cabe en el presupuesto (el resto se carga al usarlo);
// - no se publican mapas de código;
// - están los archivos para buscadores, redes y rutas que no existen.
//
// Uso: npm run build && node scripts/check-dist.mjs
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = 'dist';
/** KB comprimidos con gzip, lo que viaja por la red. */
const BUDGET = { js: 45, css: 10 };
const REQUIRED = [
  '404.html',
  'aviso-legal/index.html',
  'privacidad/index.html',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'og.png',
  'favicon.ico',
  'favicon.svg',
  'manifest.webmanifest',
];

const errors = [];
const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [relative(dist, full)];
  });
const kb = (file) => gzipSync(readFileSync(join(dist, file))).length / 1024;

const html = readFileSync(join(dist, 'index.html'), 'utf8');
const entries = [
  ...html.matchAll(/(?:src|href)="\/?(?:[^"]*\/)?(assets\/index-[\w-]+\.(js|css))"/g),
];
for (const kind of ['js', 'css']) {
  const own = entries.filter(([, , ext]) => ext === kind).map(([, file]) => file);
  if (own.length === 0) errors.push(`index.html no carga ningún ${kind} principal`);
  const size = own.reduce((sum, file) => sum + kb(file), 0);
  const line = `${kind.toUpperCase()} inicial: ${size.toFixed(1)} KB gzip (máximo ${BUDGET[kind]} KB)`;
  if (size > BUDGET[kind]) errors.push(line);
  else console.log(`✓ ${line}`);
}

const all = files(dist);
const maps = all.filter((f) => f.endsWith('.map'));
if (maps.length > 0) errors.push(`mapas de código publicados: ${maps.join(', ')}`);
else console.log('✓ sin mapas de código');

const missing = REQUIRED.filter((f) => !existsSync(join(dist, f)));
if (missing.length > 0) errors.push(`faltan: ${missing.join(', ')}`);
else console.log(`✓ ${REQUIRED.join(', ')}`);

if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}
