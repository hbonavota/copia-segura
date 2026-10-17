import type { View } from '../context';
import { ICONS, h, icon, replaceChildren } from '../dom';

/**
 * Descarga (RF-10, RF-25): una acción principal bien visible y el resto de formatos como
 * secundarios. Con varias páginas el ZIP pasa a ser la principal: N descargas seguidas disparan el
 * aviso de "descargas automáticas" del navegador.
 */
export const exportBar: View = (root, { store, services, deps, t }) => {
  const button = (testid: string, onClick: () => void, ...content: (Node | string)[]) =>
    h(
      'button',
      { type: 'button', class: 'button', dataset: { testid }, on: { click: onClick } },
      ...content,
    );
  const label = (): HTMLSpanElement => h('span', {});
  const jpgLabel = label();
  const zipLabel = label();
  const jpg = button(
    'export-jpg',
    () => void services.exportAs('jpg'),
    icon(ICONS.download),
    jpgLabel,
  );
  const zip = button(
    'export-zip',
    () => void services.exportAs('zip'),
    icon(ICONS.download),
    zipLabel,
  );
  const pdf = button('export-pdf', () => void services.exportAs('pdf'), t('export.pdf'));
  pdf.setAttribute('aria-label', t('export.as', { format: 'PDF' }));
  const share = button(
    'export-share',
    () => void services.exportAs('share'),
    icon(ICONS.share),
    t('export.share'),
  );
  share.hidden = !deps.exportCopies.canShare();

  const primary = h('div', { class: 'export-primary' });
  const secondary = h('div', { class: 'export-secondary' });
  replaceChildren(
    root,
    primary,
    h(
      'div',
      { class: 'export-more' },
      h('span', { class: 'muted small' }, t('export.more')),
      secondary,
    ),
  );

  /** Reordenar los botones solo cuando cambia el número de páginas: así no se pierde el foco. */
  let layout: boolean | null = null;
  const sync = (): void => {
    const { pages, busy } = store.get();
    const n = pages.length;
    const many = n > 1;
    jpgLabel.textContent = many ? t('export.jpg.short') : t('export.jpg');
    zipLabel.textContent = many ? t('export.zip.many', { n }) : t('export.zip');
    if (layout !== many) {
      layout = many;
      const main = many ? zip : jpg;
      main.classList.add('primary');
      (many ? jpg : zip).classList.remove('primary');
      jpg.toggleAttribute('aria-label', many);
      if (many) jpg.setAttribute('aria-label', t('export.as', { format: 'JPG' }));
      replaceChildren(primary, main);
      replaceChildren(secondary, ...(many ? [jpg, pdf, share] : [pdf, share]));
    }
    root.classList.toggle('is-busy', busy !== null);
    for (const b of [jpg, zip, pdf, share]) b.disabled = n === 0 || busy !== null;
  };
  sync();
  const stop = [store.select((s) => s.pages, sync), store.select((s) => s.busy, sync)];
  return () => stop.forEach((fn) => fn());
};
