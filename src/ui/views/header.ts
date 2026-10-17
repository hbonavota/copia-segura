import type { View } from '../context';
import type { Locale } from '../i18n';
import { ICONS, h, icon, replaceChildren } from '../dom';
import { actions } from '../store';

const LOCALES: readonly { code: Locale; label: string }[] = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

/** Cabecera: el nombre como un sello, la frase que explica la herramienta y el idioma. */
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
      'nav',
      { class: 'lang-switch', attrs: { 'aria-label': t('app.language') } },
      ...languageButtons,
    ),
  );

  return store.select(
    (s) => s.locale,
    (locale) => {
      languageButtons.forEach((b, i) =>
        b.setAttribute('aria-pressed', String(LOCALES[i]?.code === locale)),
      );
    },
  );
};
