/**
 * Instalar como app (SPEC-0012, RF-35). Chrome, Edge y Android avisan con `beforeinstallprompt`
 * cuando la página se puede instalar; se guarda el evento para lanzarlo desde un botón propio.
 * Safari (iPhone) no lo emite: allí se instala con Compartir › Añadir a pantalla de inicio, y lo
 * explican las preguntas frecuentes.
 */

/** Evento no estándar de Chromium; no está en los tipos del DOM. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(available: boolean) => void>();
const notify = (): void => listeners.forEach((fn) => fn(deferred !== null));

/** Empieza a escuchar. Se llama una vez al arrancar: el evento puede llegar antes que las vistas. */
export function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // sin la barra automática: el usuario decide desde el botón
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

/** ¿Se está usando ya como app instalada? */
export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

/** Avisa de si se puede instalar ahora y cada vez que cambie. Devuelve cómo dejar de escuchar. */
export function watchInstall(listener: (available: boolean) => void): () => void {
  listeners.add(listener);
  listener(deferred !== null);
  return () => listeners.delete(listener);
}

/** Abre el diálogo de instalación del navegador. El evento solo vale para una vez. */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  if (!event) return;
  deferred = null;
  try {
    await event.prompt();
    await event.userChoice;
  } catch {
    // El navegador puede rechazarlo (p. ej. si ya no es instalable): no hay nada que hacer.
  }
  notify();
}
