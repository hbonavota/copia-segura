import type { View } from '../context';
import type { MessageKey } from '../i18n';
import { h, replaceChildren } from '../dom';

const FAQ = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

const list = (t: (k: MessageKey) => string, keys: readonly MessageKey[]): HTMLUListElement =>
  h('ul', {}, ...keys.map((k) => h('li', {}, t(k))));

/**
 * Explicación honesta (RF-13), cómo comprobar la privacidad sin leer código y qué distingue a la
 * herramienta (RF-17), y preguntas frecuentes (RF-30).
 */
export const about: View = (root, { deps, t }) => {
  const testUrl = `${deps.links.source}/blob/main/e2e/copia-segura.spec.ts`;
  replaceChildren(
    root,
    h(
      'section',
      {
        class: 'verify',
        dataset: { testid: 'verify' },
        attrs: { 'aria-labelledby': 'verify-title' },
      },
      h('h2', { id: 'verify-title' }, t('verify.title')),
      h('p', { class: 'verify-lead' }, t('verify.lead')),
      h(
        'ol',
        { class: 'verify-steps' },
        h('li', {}, t('verify.step.1')),
        h('li', {}, t('verify.step.2')),
        h(
          'li',
          {},
          t('verify.step.3'),
          ' ',
          h('a', { href: testUrl, rel: 'noopener' }, t('verify.step.3.link')),
          '.',
        ),
      ),
    ),
    h(
      'section',
      {
        class: 'distinct',
        dataset: { testid: 'distinct' },
        attrs: { 'aria-labelledby': 'distinct-title' },
      },
      h('h2', { id: 'distinct-title' }, t('distinct.title')),
      h(
        'dl',
        { class: 'distinct-list' },
        ...(['1', '2', '3', '4', '5', '6'] as const).map((n) =>
          h('div', {}, h('dt', {}, t(`distinct.${n}.title`)), h('dd', {}, t(`distinct.${n}.text`))),
        ),
      ),
    ),
    h('h2', {}, t('about.title')),
    h(
      'div',
      { class: 'about-columns' },
      h(
        'div',
        {},
        h('h3', {}, t('about.does.title')),
        list(t, ['about.does.1', 'about.does.2', 'about.does.3']),
      ),
      h(
        'div',
        {},
        h('h3', {}, t('about.doesnt.title')),
        list(t, ['about.doesnt.1', 'about.doesnt.2']),
      ),
      h(
        'div',
        {},
        h('h3', {}, t('about.privacy.title')),
        h('p', {}, t('about.privacy.1')),
        h('p', {}, t('about.privacy.2')),
        h(
          'p',
          { class: 'links' },
          h('a', { href: deps.links.source, rel: 'noopener' }, t('footer.source')),
          ' · ',
          h('a', { href: deps.links.docs, rel: 'noopener' }, t('footer.docs')),
        ),
      ),
    ),
    h(
      'section',
      { class: 'faq', dataset: { testid: 'faq' }, attrs: { 'aria-labelledby': 'faq-title' } },
      h('h2', { id: 'faq-title' }, t('faq.title')),
      ...FAQ.map((n) =>
        h(
          'details',
          { class: 'faq-item' },
          h('summary', {}, t(`faq.${n}.q`)),
          h('p', {}, t(`faq.${n}.a`)),
        ),
      ),
    ),
  );
  return () => undefined;
};
