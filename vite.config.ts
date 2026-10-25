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

/**
 * Pie de las páginas estáticas (SPEC-0015): el mismo que el de la app, sin JavaScript. Se escribe
 * una vez aquí y se inyecta donde el HTML tenga `<!-- site-footer -->`, marcando la página actual.
 */
function staticFooter(): Plugin {
  let base = '/';
  const newTab = '<span class="visually-hidden"> (se abre en otra pestaña)</span>';
  return {
    name: 'copia-segura:footer',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) => {
        if (!html.includes('<!-- site-footer -->')) return html;
        const page = (path: string, text: string): string =>
          `<a href="${base}${path}"${ctx.path === `/${path}index.html` ? ' aria-current="page"' : ''}>${text}</a>`;
        const footer = [
          '<footer class="site-footer">',
          '<nav class="site-footer-nav" aria-label="Información legal">',
          page('aviso-legal/', 'Aviso legal'),
          page('privacidad/', 'Privacidad'),
          '<a href="mailto:contacto@orbytia.es">Contacto</a>',
          `<a href="https://github.com/hbonavota/copia-segura" target="_blank" rel="noopener noreferrer">Código fuente${newTab}</a>`,
          '</nav>',
          `<p>© ${new Date().getFullYear()} copia segura<span class="site-footer-dot" aria-hidden="true">·</span>Desarrollado por <a href="https://orbytia.es/" target="_blank" rel="noopener">Orbytia${newTab}</a></p>`,
          '</footer>',
        ].join('');
        return html.replace('<!-- site-footer -->', footer);
      },
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
  plugins: [staticFooter(), contentSecurityPolicy(), serviceWorkerManifest()],
  build: {
    target: 'es2022',
    // Sin mapas de código en la web publicada (SPEC-0014): el código fuente está en el repositorio
    // público, y la web solo sirve lo que el navegador necesita.
    sourcemap: false,
    rollupOptions: {
      // El service worker se construye aparte y se publica con un nombre fijo en la raíz de la app.
      // `404.html` es la página que GitHub Pages sirve para rutas que no existen. Las páginas
      // legales (SPEC-0015) son HTML estático, sin JavaScript, en su propia carpeta.
      input: {
        index: 'index.html',
        notFound: '404.html',
        legal: 'aviso-legal/index.html',
        privacy: 'privacidad/index.html',
        sw: 'src/pwa/sw.ts',
      },
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
