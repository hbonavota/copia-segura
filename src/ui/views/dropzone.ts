import type { View } from '../context';
import { ICONS, h, icon, replaceChildren } from '../dom';
import { demo } from './demo';

export const ACCEPTED_TYPES = 'application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif';

/** Selector de archivos nativo, reutilizado por la zona de carga y la tira de páginas. */
export function filePicker(onFiles: (files: File[]) => void): HTMLInputElement {
  return h('input', {
    type: 'file',
    multiple: true,
    accept: ACCEPTED_TYPES,
    hidden: true,
    on: {
      change: (event) => {
        const input = event.currentTarget as HTMLInputElement;
        onFiles([...(input.files ?? [])]);
        input.value = '';
      },
    },
  });
}

/** Estado vacío: el primer paso. Ocupa el sitio del editor hasta que hay una página. */
export const dropzone: View = (root, ctx) => {
  const { services, t } = ctx;
  const picker = filePicker((files) => void services.importFiles(files));
  const demoRoot = h('figure', { class: 'demo', dataset: { testid: 'demo' } });
  replaceChildren(
    root,
    h(
      'div',
      { class: 'dropzone-inner' },
      icon(ICONS.file),
      h('h2', {}, t('drop.title')),
      h('p', { class: 'muted' }, t('drop.hint')),
      h(
        'div',
        { class: 'actions' },
        h(
          'button',
          { type: 'button', class: 'button primary', on: { click: () => picker.click() } },
          t('drop.choose'),
        ),
        h('span', { class: 'muted' }, t('drop.or')),
        h(
          'button',
          { type: 'button', class: 'button', on: { click: () => services.openCamera() } },
          icon(ICONS.camera),
          t('drop.camera'),
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'link-button',
          dataset: { testid: 'load-example' },
          on: { click: () => void services.importExample() },
        },
        t('drop.example'),
      ),
      picker,
    ),
    demoRoot,
  );
  return demo(demoRoot, ctx);
};
