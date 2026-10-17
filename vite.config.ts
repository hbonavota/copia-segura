import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Política de seguridad de contenido del HTML publicado (ADR-0005).
 * `connect-src 'self'` es la pieza clave: la página solo puede pedir recursos a su propio origen
 * (los decodificadores de pdf.js y el documento de ejemplo); a ningún otro dominio.
 * Solo se inyecta en el build; el servidor de desarrollo necesita su WebSocket de recarga.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "connect-src 'self'",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "style-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'copia-segura:csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        html.replace(
          '<!-- csp -->',
          `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`,
        ),
    },
  };
}

/** Todos los archivos de `dir`, con rutas relativas y separador `/`. */
function listFiles(dir: string, root = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory()
      ? listFiles(full, root)
      : [relative(root, full).split('\\').join('/')];
  });
}

/**
 * Service worker (ADR-0007): al terminar el build, escribe en `sw.js` la lista de archivos
 * publicados y una versión que depende de su contenido. Cada despliegue cambia `sw.js` y el
 * navegador estrena la versión nueva por sí solo.
 */
function serviceWorkerManifest(): Plugin {
  let outDir = 'dist';
  return {
    name: 'copia-segura:sw',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const swPath = join(outDir, 'sw.js');
      const files = listFiles(outDir).filter((f) => !f.endsWith('.map') && f !== 'sw.js');
      // La versión depende de todos los archivos publicados: cualquier cambio estrena caché.
      const hash = createHash('sha256');
      for (const file of [...files].sort()) {
        hash.update(file);
        hash.update(readFileSync(join(outDir, file)));
      }
      const build = { version: hash.digest('hex').slice(0, 12), files };
      const source = readFileSync(swPath, 'utf8');
      // Un service worker clásico no puede importar módulos: todo debe ir dentro de sw.js.
      if (/^\s*(import|export)\b/m.test(source)) {
        throw new Error('sw.js no puede importar ni exportar nada: src/pwa debe quedar aislado');
      }
      const placeholder = /(["'`])__COPIA_SEGURA_BUILD__\1/;
      if (!placeholder.test(source))
        throw new Error('sw.js: falta el marcador de la lista de archivos');
      writeFileSync(
        swPath,
        source.replace(placeholder, () => JSON.stringify(JSON.stringify(build))),
      );
    },
  };
}

export default defineConfig({
  // En GitHub Pages la app vive bajo /<repositorio>/ (ADR-0006).
  base: process.env.BASE_PATH ?? '/',
  plugins: [contentSecurityPolicy(), serviceWorkerManifest()],
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      // El service worker se construye aparte y se publica con un nombre fijo en la raíz de la app.
      input: { index: 'index.html', sw: 'src/pwa/sw.ts' },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
      },
    },
    // pdf.js se importa de forma diferida en PdfJsReader, así que queda en su propio chunk
    // y solo se descarga cuando el usuario abre un PDF (RNF-02).
  },
  worker: { format: 'es' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/application/**'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
