/**
 * Tema claro / oscuro (RF-19). Por defecto la página sigue al sistema; el interruptor fija una
 * preferencia que se recuerda. Elegir lo mismo que ya usa el sistema borra la preferencia, para
 * que la página vuelva a seguirlo si el sistema cambia.
 *
 * `public/theme.js` aplica la preferencia guardada antes del primer pintado (sin parpadeo): usa
 * la misma clave y los mismos valores que este módulo.
 */
export type Theme = 'light' | 'dark';

export const THEME_KEY = 'copia-segura.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Valor guardado → preferencia válida, o `null` si no hay o no se reconoce. */
export function parseTheme(value: string | null): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

/** El tema que se ve: la preferencia si la hay; si no, el del sistema. */
export function effectiveTheme(preference: Theme | null, systemDark: boolean): Theme {
  return preference ?? (systemDark ? 'dark' : 'light');
}

/**
 * Preferencia tras pulsar el interruptor: el tema contrario al que se ve, o `null` (seguir al
 * sistema) si ese tema coincide con el del sistema.
 */
export function toggledPreference(preference: Theme | null, systemDark: boolean): Theme | null {
  const next: Theme = effectiveTheme(preference, systemDark) === 'dark' ? 'light' : 'dark';
  return next === (systemDark ? 'dark' : 'light') ? null : next;
}

/* ------------------------------------------------------------------ navegador */

export function savedTheme(): Theme | null {
  try {
    return parseTheme(localStorage.getItem(THEME_KEY));
  } catch {
    return null;
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

/** Aplica la preferencia al documento y la recuerda (o la olvida si es `null`). */
export function applyTheme(preference: Theme | null): void {
  const root = document.documentElement;
  if (preference) root.dataset.theme = preference;
  else delete root.dataset.theme;
  try {
    if (preference) localStorage.setItem(THEME_KEY, preference);
    else localStorage.removeItem(THEME_KEY);
  } catch {
    // Sin almacenamiento (modo privado): el tema se aplica pero no se recuerda.
  }
}

/** Avisa cuando cambia el tema del sistema. Devuelve la función que deja de escuchar. */
export function onSystemThemeChange(listener: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
