import type { View } from '../context';
import type { Locale } from '../i18n';
import { ICONS, h, icon, replaceChildren } from '../dom';
import { actions } from '../store';
import {
  applyTheme,
  effectiveTheme,
  onSystemThemeChange,
  savedTheme,
  systemPrefersDark,
  toggledPreference,
} from '../theme';

const LOCALES: readonly { code: Locale; label: string }[] = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

/** Cabecera: el nombre como un sello, la frase que explica la herramienta, el idioma y el tema. */
export const header: View = (root, { store, t }) => {
  const languageButtons = LOCALES.map(({ code, label }) =>
    h(
      'button',
      {
        type: 'button',
        class: 'lang',
        attrs: { 'aria-pressed': String(store.get().locale === code), lang: code },
        on: { click: () => store.update(actions.setLocale(code)) },
      },
      label,
    ),
  );

  // Interruptor de tema (RF-19): `role="switch"` encendido = modo oscuro.
  const themeSwitch = h(
    'button',
    {
      type: 'button',
      class: 'theme-switch',
      dataset: { testid: 'theme-switch' },
      attrs: { role: 'switch', 'aria-label': t('app.theme.dark'), title: t('app.theme.dark') },
      on: {
        click: () => {
          applyTheme(toggledPreference(savedTheme(), systemPrefersDark()));
          syncTheme();
        },
      },
    },
    icon(ICONS.sun),
    icon(ICONS.moon),
  );
  const syncTheme = (): void => {
    const dark = effectiveTheme(savedTheme(), systemPrefersDark()) === 'dark';
    themeSwitch.setAttribute('aria-checked', String(dark));
  };
  syncTheme();

  replaceChildren(
    root,
    h(
      'div',
      { class: 'brand' },
      h('h1', { class: 'stamp', attrs: { 'aria-label': t('app.title') } }, t('app.title')),
      h(
        'div',
        { class: 'brand-text' },
        h('p', { class: 'tagline' }, t('app.tagline')),
        h('p', { class: 'local' }, icon(ICONS.shield), h('span', {}, t('app.local'))),
      ),
    ),
    h(
      'div',
      { class: 'header-controls' },
      h(
        'nav',
        { class: 'lang-switch', attrs: { 'aria-label': t('app.language') } },
        ...languageButtons,
      ),
      themeSwitch,
    ),
  );

  const stopWatchingSystem = onSystemThemeChange(syncTheme);
  const unsubscribe = store.select(
    (s) => s.locale,
    (locale) => {
      languageButtons.forEach((b, i) =>
        b.setAttribute('aria-pressed', String(LOCALES[i]?.code === locale)),
      );
    },
  );
  return () => {
    stopWatchingSystem();
    unsubscribe();
  };
};
