import type { AppContext } from '../context';
import { h, replaceChildren } from '../dom';

/**
 * Pie de la página (SPEC-0015): enlaces legales, contacto, código y quién la desarrolla.
 * Igual en la portada y en el editor.
 */
export function siteFooter(root: HTMLElement, ctx: AppContext): () => void {
  const { deps, t } = ctx;
  const { links } = deps;
  const year = new Date().getFullYear();
  const external = (href: string, text: string): HTMLAnchorElement =>
    h(
      'a',
      { href, target: '_blank', rel: 'noopener noreferrer' },
      text,
      h('span', { class: 'visually-hidden' }, ` ${t('footer.newTab')}`),
    );

  replaceChildren(
    root,
    h(
      'nav',
      { class: 'site-footer-nav', attrs: { 'aria-label': t('footer.legalLabel') } },
      h('a', { href: links.legal }, t('footer.legal')),
      h('a', { href: links.privacy }, t('footer.privacy')),
      h('a', { href: links.contact }, t('footer.contact')),
      external(links.source, t('footer.source')),
    ),
    h(
      'p',
      { class: 'site-footer-credit' },
      `© ${year} ${t('app.title')}`,
      h('span', { class: 'site-footer-dot', attrs: { 'aria-hidden': 'true' } }, '·'),
      `${t('footer.developedBy')} `,
      h(
        'a',
        {
          href: links.developer,
          target: '_blank',
          rel: 'noopener',
          dataset: { testid: 'developer' },
        },
        'Orbytia',
        h('span', { class: 'visually-hidden' }, ` ${t('footer.newTab')}`),
      ),
    ),
  );
  return () => replaceChildren(root);
}
