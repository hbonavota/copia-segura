import type { View } from '../context';
import { h, replaceChildren } from '../dom';

/** Lo que una marca de agua consigue y lo que no (RF-13). Siempre visible, sin desplegables. */
export const about: View = (root, { deps, t }) => {
  replaceChildren(
    root,
    h('h2', {}, t('about.title')),
    h(
      'div',
      { class: 'about-columns' },
      h(
        'div',
        {},
        h('h3', {}, t('about.does.title')),
        h(
          'ul',
          {},
          h('li', {}, t('about.does.1')),
          h('li', {}, t('about.does.2')),
          h('li', {}, t('about.does.3')),
        ),
      ),
      h(
        'div',
        {},
        h('h3', {}, t('about.doesnt.title')),
        h('ul', {}, h('li', {}, t('about.doesnt.1')), h('li', {}, t('about.doesnt.2'))),
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
  );
  return () => undefined;
};
