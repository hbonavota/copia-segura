/// <reference lib="webworker" />
/**
 * Service worker (SPEC-0012, ADR-0007): permite instalar la app y usarla sin conexión.
 *
 * Solo guarda archivos de la propia app (HTML, JS, CSS, fuentes, iconos, módulos de pdf.js). Los
 * documentos del usuario nunca pasan por aquí: se abren como archivos locales, no se piden a
 * ninguna URL. Lo comprueba un test e2e que busca en la caché los bytes de un documento.
 */
import {
  cacheName,
  isStartPage,
  selectPrecache,
  selectWarmup,
  staleCaches,
  strategyFor,
} from './rules';

declare const self: ServiceWorkerGlobalScope;

/** Lo sustituye el build: `{ version, files }` con todos los archivos publicados. */
const BUILD = JSON.parse('__COPIA_SEGURA_BUILD__') as { version: string; files: string[] };
const CACHE = cacheName(BUILD.version);
const scope = (): string => self.registration.scope;
const absolute = (path: string): string => new URL(path, scope()).href;

/**
 * Búsqueda en la caché sin tener en cuenta `Vary`. Los servidores responden `Vary: Origin` o
 * `Vary: Accept-Encoding`, y el navegador pide los módulos con cabeceras distintas de las de la
 * precarga: con `Vary` la caché no los encontraría y la app no arrancaría sin conexión. Los
 * archivos de la app son los mismos sea cual sea la petición.
 */
const LOOKUP: CacheQueryOptions = { ignoreVary: true };

/**
 * Descarga y guarda archivos de la app. `cache: 'reload'` salta la caché HTTP del navegador:
 * GitHub Pages la fija en 10 minutos y, justo tras un despliegue, devolvería el HTML anterior.
 */
async function store(cache: Cache, paths: readonly string[], strict: boolean): Promise<void> {
  const requests = paths.map((path) => new Request(absolute(path), { cache: 'reload' }));
  if (strict) {
    await cache.addAll(requests);
    return;
  }
  // En segundo plano, lo que falle se pedirá la próxima vez que haga falta.
  await Promise.all(requests.map((request) => cache.add(request).catch(() => undefined)));
}

/** ¿Esta caché tiene ya lo de "segundo plano"? (el usuario ha abierto algún documento) */
async function isWarm(cache: Cache): Promise<boolean> {
  const sample = selectWarmup(BUILD.files)[0];
  return sample ? (await cache.match(absolute(sample), LOOKUP)) !== undefined : false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await store(await caches.open(CACHE), selectPrecache(BUILD.files), true);
      // La versión nueva entra en cuanto está lista. Los recursos llevan hash en el nombre: una
      // página nueva nunca recibe uno viejo.
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const stale = staleCaches(await caches.keys(), CACHE);
      // Si la versión anterior estaba completa, la nueva también: una app instalada que ya
      // funcionaba sin conexión sigue haciéndolo tras una actualización.
      let warm = false;
      for (const key of stale) warm ||= await isWarm(await caches.open(key));
      await Promise.all(stale.map((key) => caches.delete(key)));
      await self.clients.claim();
      if (warm) await store(await caches.open(CACHE), selectWarmup(BUILD.files), false);
    })(),
  );
});

// La página avisa cuando el usuario abre su primer documento: entonces se guarda el resto.
self.addEventListener('message', (event) => {
  if ((event.data as { type?: unknown } | null)?.type !== 'warm-up') return;
  event.waitUntil(
    (async () => store(await caches.open(CACHE), selectWarmup(BUILD.files), false))(),
  );
});

self.addEventListener('fetch', (event) => {
  const strategy = strategyFor(event.request, scope());
  if (strategy === 'ignore') return;
  const put = (key: RequestInfo, response: Response): void => {
    // Guardar no puede romper una respuesta que ya ha llegado bien (cuota llena, etc.).
    event.waitUntil(
      caches
        .open(CACHE)
        .then((cache) => cache.put(key, response))
        .catch(() => undefined),
    );
  };
  event.respondWith(
    strategy === 'network-first' ? page(event.request, put) : asset(event.request, put),
  );
});

type Put = (key: RequestInfo, response: Response) => void;

/** Páginas: red primero (versión más reciente); sin conexión, la portada guardada. */
async function page(request: Request, put: Put): Promise<Response> {
  try {
    const response = await fetch(request);
    const facts = {
      status: response.status,
      redirected: response.redirected,
      contentType: response.headers.get('content-type') ?? '',
    };
    if (isStartPage(request.url, scope(), facts)) {
      put(scope(), response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(CACHE);
    return (await cache.match(scope(), LOOKUP)) ?? Response.error();
  }
}

/** Recursos: caché primero; lo que falte se pide y se guarda para la próxima. */
async function asset(request: Request, put: Put): Promise<Response> {
  const cached = await (await caches.open(CACHE)).match(request, LOOKUP);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.status === 200 && response.type === 'basic') put(request, response.clone());
  return response;
}
