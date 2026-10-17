import type { View } from '../context';
import { ICONS, h, icon, replaceChildren } from '../dom';

/** Botones de descarga (RF-10). ZIP solo tiene sentido con más de una página. */
export const exportBar: View = (root, { store, services, deps, t }) => {
  const jpg = h(
    'button',
    {
      type: 'button',
      class: 'button primary',
      dataset: { testid: 'export-jpg' },
      on: { click: () => void services.exportAs('jpg') },
    },
    icon(ICONS.download),
    h('span', {}, t('export.jpg')),
  );
  const zip = h(
    'button',
    {
      type: 'button',
      class: 'button',
      dataset: { testid: 'export-zip' },
      on: { click: () => void services.exportAs('zip') },
    },
    icon(ICONS.download),
    t('export.zip'),
  );
  const pdf = h(
    'button',
    {
      type: 'button',
      class: 'button',
      dataset: { testid: 'export-pdf' },
      on: { click: () => void services.exportAs('pdf') },
    },
    icon(ICONS.download),
    t('export.pdf'),
  );
  const share = h(
    'button',
    {
      type: 'button',
      class: 'button',
      dataset: { testid: 'export-share' },
      hidden: !deps.exportCopies.canShare(),
      on: { click: () => void services.exportAs('share') },
    },
    icon(ICONS.share),
    t('export.share'),
  );
  replaceChildren(root, jpg, zip, pdf, share);

  const sync = (): void => {
    const { pages, busy } = store.get();
    const n = pages.length;
    const label = jpg.querySelector('span');
    if (label) label.textContent = n > 1 ? t('export.jpg.many', { n }) : t('export.jpg');
    // Con varias páginas, N descargas seguidas disparan el aviso de "descargas automáticas" del
    // navegador: el ZIP pasa a ser la opción principal.
    zip.hidden = n < 2;
    zip.classList.toggle('primary', n > 1);
    jpg.classList.toggle('primary', n <= 1);
    if (n > 1 && root.firstElementChild !== zip) root.prepend(zip);
    if (n <= 1 && root.firstElementChild !== jpg) root.prepend(jpg);
    for (const button of [jpg, zip, pdf, share]) button.disabled = n === 0 || busy !== null;
  };
  sync();
  const stop = [store.select((s) => s.pages, sync), store.select((s) => s.busy, sync)];
  return () => stop.forEach((fn) => fn());
};
