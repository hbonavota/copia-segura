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

export default defineConfig({
  // En GitHub Pages la app vive bajo /<repositorio>/ (ADR-0006).
  base: process.env.BASE_PATH ?? '/',
  plugins: [contentSecurityPolicy()],
  build: {
    target: 'es2022',
    sourcemap: true,
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
