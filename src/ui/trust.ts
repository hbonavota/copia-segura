/**
 * Contador de peticiones a otros dominios (RF-22), medido con _Resource Timing_.
 *
 * Límite: el navegador solo registra aquí las peticiones del documento, no las de los workers.
 * La garantía completa la dan la CSP y el test e2e (RNF-01); esto la hace visible.
 */

/** ¿Esta URL ha salido hacia otro origen? `data:` y `blob:` no salen del equipo. */
export function isExternal(url: string, origin: string): boolean {
  if (url.startsWith('data:') || url.startsWith('blob:')) return false;
  try {
    return new URL(url).origin !== origin;
  } catch {
    return false;
  }
}

export function countExternal(urls: readonly string[], origin: string): number {
  return urls.filter((url) => isExternal(url, origin)).length;
}

/**
 * Avisa con el número de peticiones externas ahora y cada vez que cambie.
 * Devuelve la función que deja de observar.
 */
export function watchExternalRequests(onChange: (count: number) => void): () => void {
  const origin = window.location.origin;
  const names = (entries: readonly PerformanceEntry[]): string[] => entries.map((e) => e.name);
  let count = countExternal(names(performance.getEntriesByType('resource')), origin);
  onChange(count);
  if (typeof PerformanceObserver === 'undefined') return () => undefined;
  const observer = new PerformanceObserver((list) => {
    const added = countExternal(names(list.getEntries()), origin);
    if (added === 0) return;
    count += added;
    onChange(count);
  });
  observer.observe({ type: 'resource' });
  return () => observer.disconnect();
}
