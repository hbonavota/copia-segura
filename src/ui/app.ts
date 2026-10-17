import type { AppContext, Dependencies } from './context';
import { h, replaceChildren } from './dom';
import { translator } from './i18n';
import { createServices } from './services';
import { actions, type Store } from './store';
import { about } from './views/about';
import { cameraDialog } from './views/camera-dialog';
import { dropzone } from './views/dropzone';
import { editor } from './views/editor';
import { exportBar } from './views/export-bar';
import { header } from './views/header';
import { notice } from './views/notice';
import { pageStrip } from './views/page-strip';
import { settings } from './views/settings';

const LOCALE_KEY = 'copia-segura.locale';

/**
 * Monta la aplicación completa. Al cambiar de idioma se desmontan y vuelven a montar las vistas
 * (el estado vive en el store, así que no se pierde nada).
 */
export function mountApp(root: HTMLElement, store: Store, deps: Dependencies): void {
  const regions = {
    header: h('header', { class: 'app-header' }),
    notice: h('div', { class: 'notice', hidden: true }),
    pages: h('aside', { class: 'panel pages' }),
    dropzone: h('section', { class: 'dropzone' }),
    editor: h('section', { class: 'editor' }),
    settings: h('aside', { class: 'panel settings' }),
    exportBar: h('footer', { class: 'export-bar' }),
    about: h('section', { class: 'about' }),
    camera: h('div', {}),
  };
  replaceChildren(
    root,
    regions.header,
    regions.notice,
    h(
      'main',
      { class: 'workspace' },
      regions.pages,
      h('div', { class: 'center' }, regions.dropzone, regions.editor),
      regions.settings,
    ),
    regions.exportBar,
    regions.about,
    regions.camera,
  );

  const services = createServices(store, deps, () => translator(store.get().locale));
  let unmount: (() => void)[] = [];

  const mountAll = (): void => {
    unmount.forEach((fn) => fn());
    const ctx: AppContext = { store, deps, services, t: translator(store.get().locale) };
    document.documentElement.lang = ctx.store.get().locale;
    document.title = `${ctx.t('app.title')} · ${ctx.t('app.tagline')}`;
    const camera = cameraDialog(regions.camera, ctx);
    services.registerCamera(camera.open);
    unmount = [
      header(regions.header, ctx),
      notice(regions.notice, ctx),
      pageStrip(regions.pages, ctx),
      dropzone(regions.dropzone, ctx),
      editor(regions.editor, ctx),
      settings(regions.settings, ctx),
      exportBar(regions.exportBar, ctx),
      about(regions.about, ctx),
      camera.dispose,
    ];
  };

  const syncEmptyState = (): void => {
    const empty = store.get().pages.length === 0;
    regions.dropzone.hidden = !empty;
    regions.editor.hidden = empty;
    root.classList.toggle('is-empty', empty);
  };

  mountAll();
  syncEmptyState();
  store.select((s) => s.pages.length === 0, syncEmptyState);
  store.select(
    (s) => s.locale,
    (locale) => {
      try {
        localStorage.setItem(LOCALE_KEY, locale);
      } catch {
        // Sin almacenamiento disponible (modo privado): el idioma simplemente no se recuerda.
      }
      mountAll();
    },
  );

  // Arrastrar y soltar en cualquier punto de la página.
  root.addEventListener('dragover', (event) => {
    event.preventDefault();
    root.classList.add('is-dragging');
  });
  root.addEventListener('dragleave', () => root.classList.remove('is-dragging'));
  root.addEventListener('drop', (event) => {
    event.preventDefault();
    root.classList.remove('is-dragging');
    const files = [...(event.dataTransfer?.files ?? [])];
    if (files.length > 0) void services.importFiles(files);
  });

  // Un error no capturado se muestra, no se pierde en la consola.
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
    store.update(actions.notify({ kind: 'error', message }));
  });
}

export function savedLocale(): string | null {
  try {
    return localStorage.getItem(LOCALE_KEY);
  } catch {
    return null;
  }
}
