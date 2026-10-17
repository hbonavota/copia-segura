// Genera las tarjetas ficticias de ejemplo (frente y dorso, 1600 × 1010 px, proporción ID-1) en
// scripts/ejemplo/ y copia el frente a public/ejemplo/tarjeta-ficticia.jpg para la demo (RF-14).
//
// Es un documento de identidad INVENTADO: "República de Ejemplo", datos de muestra, retrato
// ilustrado (no una persona real) y sello MUESTRA. Tiene los elementos de una tarjeta real
// (fondo de seguridad, chip, firma, CAN, zona de lectura mecánica) para que la demo sea creíble,
// pero no reproduce el diseño, los escudos ni las imágenes de ningún documento oficial.
//
// Uso: node scripts/build-cards.mjs && npm run example:build
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'ejemplo');
const W = 1600;
const H = 1010;

const SANS = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'OCR B', 'DejaVu Sans Mono', 'Courier New', monospace";
const INK = '#1d2733';
const LABEL = '#5a6b7d';
const BLUE = '#2b4c6f';

/** Roseta de guilloche (hipotrocoide): el fondo de seguridad de las tarjetas reales. */
function rosette(cx, cy, R, r, d, turns, steps = 2400) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns;
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join('L')}`;
}

/** Ondas finas horizontales. */
function waves(y0, count, gap, amp, period) {
  let out = '';
  for (let k = 0; k < count; k++) {
    const y = y0 + k * gap;
    let d = `M0,${y}`;
    for (let x = 0; x <= W; x += 8) {
      d += `L${x},${(y + amp * Math.sin((x / period) * Math.PI * 2 + k * 0.6)).toFixed(1)}`;
    }
    out += `<path d="${d}"/>`;
  }
  return out;
}

const background = `
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#e3efec"/>
      <stop offset="0.5" stop-color="#f4eedf"/>
      <stop offset="1" stop-color="#e7e3f1"/>
    </linearGradient>
    <linearGradient id="stripe" x1="0" x2="1">
      <stop offset="0" stop-color="#2f7d76"/>
      <stop offset="0.6" stop-color="#c9a24a"/>
      <stop offset="1" stop-color="#7d5aa6"/>
    </linearGradient>
    <linearGradient id="chip" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#e9cf86"/>
      <stop offset="1" stop-color="#b8913c"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g fill="none" stroke="#2f7d76" stroke-opacity="0.16" stroke-width="1.2">
    <path d="${rosette(1180, 470, 330, 61, 120, 61)}"/>
  </g>
  <g fill="none" stroke="#7d5aa6" stroke-opacity="0.13" stroke-width="1.1">
    <path d="${rosette(380, 640, 260, 47, 96, 47)}"/>
  </g>
  <g fill="none" stroke="#c9a24a" stroke-opacity="0.18" stroke-width="1">
    ${waves(200, 26, 31, 7, 220)}
  </g>`;

const chip = (x, y, w, h) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="url(#chip)" stroke="#9c7a2e" stroke-width="2"/>
  <g stroke="#9c7a2e" stroke-width="2" fill="none">
    <path d="M${x + w / 3},${y} V${y + h} M${x + (2 * w) / 3},${y} V${y + h}"/>
    <path d="M${x},${y + h / 3} H${x + w / 3} M${x + (2 * w) / 3},${y + h / 3} H${x + w}"/>
    <path d="M${x},${y + (2 * h) / 3} H${x + w / 3} M${x + (2 * w) / 3},${y + (2 * h) / 3} H${x + w}"/>
    <rect x="${x + w / 3}" y="${y + h / 4}" width="${w / 3}" height="${h / 2}" rx="8"/>
  </g>`;

/** Retrato ilustrado: no es una persona real. */
const portrait = (x, y, w, h, ghost = false) => {
  const g = ghost ? 'opacity="0.22" filter="url(#gray)"' : '';
  return `
  <svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 440 580" ${g}>
    <defs>
      <linearGradient id="pbg${ghost ? 'g' : ''}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e4ebf2"/><stop offset="1" stop-color="#c9d4df"/>
      </linearGradient>
    </defs>
    ${ghost ? '' : `<rect width="440" height="580" fill="url(#pbg)"/>`}
    <path d="M40,580 C52,470 120,420 220,412 C320,420 388,470 400,580 Z" fill="#34465c"/>
    <path d="M178,350 L178,425 C200,446 240,446 262,425 L262,350 Z" fill="#cfa587"/>
    <path d="M196,430 L220,468 L244,430" fill="#e9eef3"/>
    <path d="M118,250 C104,120 168,74 222,74 C296,74 342,130 330,262 C340,330 340,380 360,430 C318,420 300,380 300,330 L146,330 C140,382 120,418 80,430 C104,380 116,320 118,250 Z" fill="#4a3426"/>
    <ellipse cx="222" cy="252" rx="92" ry="118" fill="#dcb397"/>
    <path d="M134,214 C150,140 206,118 262,128 C292,140 312,170 312,214 C276,170 210,160 134,214 Z" fill="#4a3426"/>
    <path d="M176,236 q16,-9 32,0 M236,236 q16,-9 32,0" stroke="#5b4335" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="192" cy="256" r="6" fill="#3b2b22"/><circle cx="252" cy="256" r="6" fill="#3b2b22"/>
    <path d="M222,262 q-8,30 4,36" stroke="#b98e74" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M198,320 q24,14 48,0" stroke="#a5655a" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>`;
};

const field = (x, y, label, value, size = 34) => `
  <text x="${x}" y="${y}" font-family="${SANS}" font-size="19" font-weight="600" letter-spacing="2" fill="${LABEL}">${label}</text>
  ${[]
    .concat(value)
    .map(
      (v, i) =>
        `<text x="${x}" y="${y + 40 + i * 40}" font-family="${SANS}" font-size="${size}" font-weight="600" fill="${INK}">${v}</text>`,
    )
    .join('')}`;

const header = (subtitle) => `
  <g transform="translate(60,42)">
    <path d="M0,0 H86 V62 C86,98 60,116 43,124 C26,116 0,98 0,62 Z" fill="${BLUE}"/>
    <path d="M10,10 H76 V60 C76,88 56,104 43,110 C30,104 10,88 10,60 Z" fill="none" stroke="#c9a24a" stroke-width="3"/>
    <text x="43" y="74" text-anchor="middle" font-family="${SANS}" font-size="34" font-weight="800" fill="#f4eedf">EJ</text>
  </g>
  <text x="172" y="78" font-family="${SANS}" font-size="24" font-weight="600" letter-spacing="4" fill="${BLUE}">REPÚBLICA DE EJEMPLO</text>
  <text x="172" y="128" font-family="${SANS}" font-size="44" font-weight="800" letter-spacing="1" fill="${BLUE}">${subtitle}</text>
  <rect x="0" y="176" width="${W}" height="8" fill="url(#stripe)"/>
  <g transform="translate(1390,92) rotate(-8)">
    <rect x="-150" y="-40" width="300" height="80" rx="10" fill="none" stroke="#a3201c" stroke-width="5"/>
    <text x="0" y="16" text-anchor="middle" font-family="${SANS}" font-size="44" font-weight="800" letter-spacing="6" fill="#a3201c">MUESTRA</text>
  </g>`;

const front = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><filter id="gray"><feColorMatrix type="saturate" values="0"/></filter></defs>
  ${background}
  ${header('DOCUMENTO DE IDENTIDAD')}
  <text x="560" y="250" font-family="${SANS}" font-size="44" font-weight="700" letter-spacing="2" fill="${INK}">Nº 00000000-X</text>
  ${portrait(60, 230, 440, 600)}
  ${field(560, 320, 'APELLIDOS', ['MUESTRA', 'EJEMPLO'])}
  ${field(560, 460, 'NOMBRE', 'LUCÍA')}
  ${field(560, 560, 'SEXO', 'F')}
  ${field(700, 560, 'NACIONALIDAD', 'EJM')}
  ${field(940, 560, 'FECHA DE NACIMIENTO', '01 01 1990')}
  ${field(620, 712, 'Nº SOPORTE', 'ABC123456')}
  ${field(900, 712, 'VÁLIDO HASTA', '01 01 2035')}
  ${portrait(1290, 250, 200, 273, true)}
  ${chip(1300, 560, 170, 120)}
  <text x="590" y="826" font-family="${SANS}" font-size="17" font-weight="600" letter-spacing="2" fill="${LABEL}">FIRMA</text>
  <path d="M640,930 C660,880 690,872 700,900 C708,922 690,944 676,926 C664,908 720,860 748,872 C770,882 744,930 766,928 C790,926 806,872 830,880 C848,886 832,924 852,922 C900,918 930,868 980,880 C1010,888 990,920 1020,916 C1060,910 1100,890 1150,896"
        fill="none" stroke="#1b2a6b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="1270" y="826" font-family="${SANS}" font-size="17" font-weight="600" letter-spacing="2" fill="${LABEL}">CAN</text>
  <text x="1270" y="890" font-family="${MONO}" font-size="56" font-weight="700" fill="${INK}">123456</text>
  <text x="60" y="918" font-family="${SANS}" font-size="20" font-weight="600" letter-spacing="1" fill="${LABEL}">MUESTRA SIN VALIDEZ</text>
  <text x="60" y="948" font-family="${SANS}" font-size="20" font-weight="600" letter-spacing="1" fill="${LABEL}">DOCUMENTO FICTICIO</text>
</svg>`;

const mrz = [
  'IDEJM000000000X0&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;',
  '9001017F3501017EJM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;6',
  'MUESTRA&lt;EJEMPLO&lt;&lt;LUCIA&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;',
];

const back = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><filter id="gray"><feColorMatrix type="saturate" values="0"/></filter></defs>
  ${background}
  ${field(60, 90, 'DOMICILIO', ['C/ DEL EJEMPLO 1, 2º A', '00000 CIUDAD FICTICIA', 'PROVINCIA DE MUESTRA'], 36)}
  ${field(60, 330, 'LUGAR DE NACIMIENTO', 'VILLA EJEMPLO', 36)}
  ${field(60, 470, 'EXPEDIDO EN', 'OFICINA DE MUESTRA', 32)}
  ${chip(1150, 110, 230, 165)}
  ${portrait(1250, 330, 200, 273, true)}
  <rect x="0" y="668" width="${W}" height="${H - 668}" fill="#f6f5f0" fill-opacity="0.92"/>
  ${mrz
    .map(
      (line, i) =>
        `<text x="90" y="${770 + i * 90}" font-family="${MONO}" font-size="62" letter-spacing="9" fill="${INK}">${line}</text>`,
    )
    .join('')}
</svg>`;

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (const [name, svg] of [
  ['frente', front],
  ['dorso', back],
]) {
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({
    path: join(outDir, `${name}.jpg`),
    type: 'jpeg',
    quality: 92,
    clip: { x: 0, y: 0, width: W, height: H },
  });
}
await browser.close();
copyFileSync(
  join(outDir, 'frente.jpg'),
  join(here, '..', 'public', 'ejemplo', 'tarjeta-ficticia.jpg'),
);
console.log(`Tarjetas en ${outDir} y demo en public/ejemplo/tarjeta-ficticia.jpg`);
