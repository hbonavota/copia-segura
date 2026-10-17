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
import { watchExternalRequests } from '../trust';

const LOCALES: readonly { code: Locale; label: string }[] = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

/**
 * Cabecera: el nombre como un sello, los pasos (RF-24), el contador de peticiones a otros dominios
 * (RF-22), el idioma y el tema (RF-19).
 */
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

  // Pasos (RF-24): orientan, no bloquean.
  const STEPS = ['upload', 'adjust', 'download'] as const;
  const stepItems = STEPS.map((step, i) =>
    h(
      'li',
      { class: 'step', dataset: { step } },
      h('span', { class: 'step-dot', attrs: { 'aria-hidden': 'true' } }, String(i + 1)),
      h('span', { class: 'step-label' }, t(`steps.${step}`)),
      h('span', { class: 'visually-hidden step-done' }, ` (${t('steps.done')})`),
    ),
  );
  const syncSteps = (): void => {
    const { pages, exported } = store.get();
    const current = pages.length === 0 ? 0 : exported ? 2 : 1;
    stepItems.forEach((li, i) => {
      const done = i < current || (exported && i === 2);
      li.classList.toggle('is-done', done);
      const doneText = li.querySelector<HTMLElement>('.step-done');
      if (doneText) doneText.hidden = !done;
      if (i === current) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
  };
  syncSteps();

  // Contador de peticiones a otros dominios (RF-22). En el móvil solo se ve la cifra.
  const trustNumber = h('span', { class: 'trust-number' });
  const trustText = h('span', { class: 'trust-text' });
  const trust = h(
    'a',
    {
      class: 'trust',
      href: '#verify-title',
      title: t('trust.counter.title'),
      dataset: { testid: 'trust-counter' },
    },
    icon(ICONS.shield),
    trustNumber,
    trustText,
  );
  const stopWatchingRequests = watchExternalRequests((n) => {
    trustNumber.textContent = String(n);
    trustText.textContent = n === 1 ? t('trust.counter.one') : t('trust.counter.many');
    trust.setAttribute('aria-label', `${n} ${trustText.textContent}. ${t('trust.counter.title')}`);
    trust.dataset.count = String(n);
    trust.classList.toggle('is-warning', n > 0);
  });

  replaceChildren(
    root,
    h('h1', { class: 'stamp', attrs: { 'aria-label': t('app.title') } }, t('app.title')),
    h(
      'div',
      { class: 'stepper' },
      h('ol', { attrs: { 'aria-label': t('steps.label') } }, ...stepItems),
    ),
    h(
      'div',
      { class: 'header-controls' },
      trust,
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
  const stopSteps = [
    store.select((st) => st.pages.length, syncSteps),
    store.select((st) => st.exported, syncSteps),
  ];
  return () => {
    stopWatchingSystem();
    stopWatchingRequests();
    unsubscribe();
    stopSteps.forEach((fn) => fn());
  };
};
