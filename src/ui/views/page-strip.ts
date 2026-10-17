import type { View } from '../context';
import { ICONS, h, icon, replaceChildren } from '../dom';
import { actions, type PageState } from '../store';
import { filePicker } from './dropzone';

const THUMB_SIDE = 160;

/** Miniatura de la página con el giro aplicado (no la copia: solo para reconocerla). */
function thumbnail(page: PageState): HTMLCanvasElement {
  const { rotation } = page.edits;
  const swap = rotation === 90 || rotation === 270;
  const srcW = page.page.size.width;
  const srcH = page.page.size.height;
  const scale = THUMB_SIDE / Math.max(srcW, srcH);
  const w = Math.max(1, Math.round((swap ? srcH : srcW) * scale));
  const hgt = Math.max(1, Math.round((swap ? srcW : srcH) * scale));
  const canvas = h('canvas', { width: w, height: hgt, class: 'thumb' });
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.translate(w / 2, hgt / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(page.bitmap, -srcW / 2, -srcH / 2);
  return canvas;
}

/** Tira de páginas: elegir la activa, quitar, añadir más o abrir la cámara. */
export const pageStrip: View = (root, { store, services, t }) => {
  const picker = filePicker((files) => void services.importFiles(files));
  const thumbs = new Map<string, { element: HTMLElement; key: string }>();
  /** Lo que cambia el aspecto de la miniatura: el giro y si sigue recortada automáticamente. */
  const keyOf = (page: PageState): string =>
    `${page.edits.rotation}/${page.autoCropped && page.edits.crop ? 'auto' : ''}`;

  const item = (page: PageState): HTMLElement => {
    const cached = thumbs.get(page.page.id);
    if (cached?.key === keyOf(page)) return cached.element;
    const element = h(
      'li',
      { class: 'page-item', dataset: { pageId: page.page.id } },
      h(
        'button',
        {
          type: 'button',
          class: 'page-button',
          dataset: { testid: `page-${page.page.label}` },
          on: { click: () => store.update(actions.selectPage(page.page.id)) },
        },
        thumbnail(page),
        h(
          'span',
          { class: 'page-label' },
          page.page.label,
          page.autoCropped && page.edits.crop
            ? h('span', { class: 'badge', title: t('pages.autocrop') }, '⌗')
            : null,
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'icon-button remove',
          attrs: { 'aria-label': `${t('pages.remove')} ${page.page.label}` },
          on: { click: () => services.removePage(page.page.id) },
        },
        icon(ICONS.close),
      ),
    );
    thumbs.set(page.page.id, { element, key: keyOf(page) });
    return element;
  };

  const list = h('ul', { class: 'page-list', attrs: { 'aria-label': t('pages.title') } });

  const render = (): void => {
    const { pages, activePageId, busy } = store.get();
    for (const id of [...thumbs.keys()]) {
      if (!pages.some((p) => p.page.id === id)) thumbs.delete(id);
    }
    replaceChildren(list, ...pages.map(item));
    for (const li of list.children) {
      const el = li as HTMLElement;
      el.classList.toggle('is-active', el.dataset.pageId === activePageId);
      el.querySelector('.page-button')?.setAttribute(
        'aria-current',
        el.dataset.pageId === activePageId ? 'true' : 'false',
      );
      const remove = el.querySelector<HTMLButtonElement>('.remove');
      if (remove) remove.disabled = busy !== null;
    }
  };

  replaceChildren(
    root,
    h('h2', { class: 'panel-title' }, t('pages.title')),
    list,
    h(
      'div',
      { class: 'strip-actions' },
      h(
        'button',
        { type: 'button', class: 'button small', on: { click: () => picker.click() } },
        icon(ICONS.plus),
        t('pages.add'),
      ),
      h(
        'button',
        { type: 'button', class: 'button small', on: { click: () => services.openCamera() } },
        icon(ICONS.camera),
        t('pages.camera'),
      ),
    ),
    picker,
  );
  render();

  const stop = [
    store.select((s) => s.pages, render),
    store.select((s) => s.activePageId, render),
    store.select((s) => s.busy, render),
  ];
  return () => stop.forEach((fn) => fn());
};
