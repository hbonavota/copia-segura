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

/**
 * Portada (RF-24): titular con los tipos de documento que acepta (RF-31), zona de carga con las señales de confianza (RF-23) y la demo (RF-14).
 * Ocupa el sitio del editor hasta que hay una página.
 */
export const dropzone: View = (root, ctx) => {
  const { services, t } = ctx;
  const picker = filePicker((files) => void services.importFiles(files));
  const demoRoot = h('figure', { class: 'demo', dataset: { testid: 'demo' } });
  replaceChildren(
    root,
    h(
      'div',
      { class: 'hero' },
      h('p', { class: 'hero-title' }, t('hero.title')),
      h('p', { class: 'hero-sub' }, t('hero.sub')),
      // Lo que acepta (RF-31): informativo, no cambia el procesado.
      h(
        'ul',
        { class: 'kinds', dataset: { testid: 'kinds' }, attrs: { 'aria-label': t('hero.kinds') } },
        ...(['1', '2', '3', '4', '5', '6'] as const).map((n) => h('li', {}, t(`kind.${n}`))),
      ),
    ),
    h(
      'div',
      { class: 'landing-grid' },
      h(
        'div',
        { class: 'drop-card' },
        h(
          'div',
          { class: 'dropzone-inner' },
          h('span', { class: 'drop-icon' }, icon(ICONS.upload)),
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
        h(
          'ul',
          { class: 'trust-list', dataset: { testid: 'trust-list' } },
          ...(['trust.local', 'trust.noTracking', 'trust.open'] as const).map((key) =>
            h('li', {}, icon(ICONS.check), t(key)),
          ),
        ),
      ),
      demoRoot,
    ),
  );
  return demo(demoRoot, ctx);
};
