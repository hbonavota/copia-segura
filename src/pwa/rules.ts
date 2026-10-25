/**
 * Reglas del service worker (SPEC-0012, ADR-0007), puras para poder probarlas sin navegador.
 * Las usan el propio service worker (`sw.ts`) y el build (`vite.config.ts`), que calcula qué se
 * precarga y la versión de la caché.
 */

/** Prefijo de las cachés de la app: así se borran las de versiones anteriores y nada más. */
export const CACHE_PREFIX = 'copia-segura-';

/**
 * Archivos del build que se descargan al instalar el service worker: lo que hace falta para abrir
 * la portada y el editor con fotos sin conexión. El resto (pdf.js, pdf-lib, JSZip, el PDF de
 * ejemplo, fuentes de otros alfabetos) se guarda la primera vez que se usa, para no gastar datos
 * del móvil de quien solo entra a mirar.
 */
export function selectPrecache(paths: readonly string[]): string[] {
  const shell = [
    /^index\.html$/,
    /^theme\.js$/,
    /^favicon\.svg$/,
    /^manifest\.webmanifest$/,
    /^icons\/.+\.png$/,
    /^ejemplo\/tarjeta-ficticia\.jpg$/,
    /^assets\/index-[\w-]+\.(js|css)$/,
    /^assets\/inter-latin(-ext)?-wght-normal-[\w-]+\.woff2$/,
  ];
  return paths
    .map((p) => p.replace(/\\/g, '/'))
    .filter((p) => shell.some((re) => re.test(p)))
    .map((p) => (p === 'index.html' ? './' : p))
    .sort();
}

/**
 * Archivos publicados que no son de la app: para buscadores y redes (SPEC-0014) y las páginas
 * estáticas legales (SPEC-0015). La app nunca los usa, así que no se guardan para usarla sin
 * conexión.
 */
const NOT_APP = new Set([
  '404.html',
  'aviso-legal/index.html',
  'privacidad/index.html',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'og.png',
  'favicon.ico',
]);

/**
 * Lo que se guarda en segundo plano en cuanto el usuario abre su primer documento: el resto de la
 * app (pdf.js y sus recursos, pdf-lib, JSZip, fuentes), para que a partir de ahí todo funcione sin
 * conexión. Quien solo entra a mirar no lo descarga. Nunca entran mapas de código, el propio
 * `sw.js` ni los archivos para buscadores y redes.
 */
export function selectWarmup(paths: readonly string[]): string[] {
  const precached = new Set(selectPrecache(paths));
  return paths
    .map((p) => p.replace(/\\/g, '/'))
    .filter((p) => !p.endsWith('.map') && p !== 'sw.js' && p !== 'index.html')
    .filter((p) => !NOT_APP.has(p) && !p.startsWith('assets/pages-'))
    .filter((p) => !precached.has(p))
    .sort();
}

/** Página que se guarda como portada sin conexión: solo HTML de la propia portada. */
export function isStartPage(
  url: string,
  scope: string,
  response: { readonly status: number; readonly redirected: boolean; readonly contentType: string },
): boolean {
  let path: string;
  let base: string;
  try {
    path = new URL(url).pathname;
    base = new URL(scope).pathname;
  } catch {
    return false;
  }
  return (
    response.status === 200 &&
    !response.redirected &&
    response.contentType.startsWith('text/html') &&
    (path === base || path === `${base}index.html`)
  );
}

export type Strategy = 'network-first' | 'cache-first' | 'ignore';

/**
 * Qué hace el service worker con una petición. Solo toca peticiones `GET` del propio origen; todo
 * lo demás sigue su camino normal (y la CSP impide que haya peticiones a otros dominios). Las
 * páginas van primero a la red, para estrenar cada versión publicada en cuanto hay conexión; los
 * recursos, primero a la caché: sus nombres llevan un hash y no cambian.
 */
export function strategyFor(
  request: { readonly method: string; readonly url: string; readonly mode: string },
  scope: string,
): Strategy {
  if (request.method !== 'GET') return 'ignore';
  let url: URL;
  let base: URL;
  try {
    url = new URL(request.url);
    base = new URL(scope);
  } catch {
    return 'ignore';
  }
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return 'ignore';
  // El propio service worker lo gestiona el navegador; nunca se sirve desde la caché.
  if (url.pathname.endsWith('/sw.js')) return 'ignore';
  return request.mode === 'navigate' ? 'network-first' : 'cache-first';
}

/** Nombre de la caché de una versión. */
export function cacheName(version: string): string {
  return `${CACHE_PREFIX}${version}`;
}

/** Cachés de versiones anteriores que hay que borrar al activar la nueva. */
export function staleCaches(keys: readonly string[], current: string): string[] {
  return keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== current);
}
