// Copia a public/pdfjs/ los recursos que pdf.js carga en tiempo de ejecución (decodificadores
// WebAssembly y fuentes estándar) para servirlos desde nuestro propio origen (ADR-0005).
// Se ejecuta automáticamente antes de `start`, `dev`, `build` y `test:e2e`.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve('pdfjs-dist/package.json'));
const target = join(process.cwd(), 'public', 'pdfjs');

for (const dir of ['wasm', 'standard_fonts', 'iccs']) {
  const from = join(pdfjsRoot, dir);
  if (!existsSync(from)) {
    console.warn(`[pdfjs-assets] no existe ${from}; se omite`);
    continue;
  }
  mkdirSync(join(target, dir), { recursive: true });
  cpSync(from, join(target, dir), { recursive: true });
}
console.log(`[pdfjs-assets] recursos de pdf.js copiados a ${target}`);
