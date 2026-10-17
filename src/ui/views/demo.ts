import { PRESETS, type NormalizedRect, type Page, type PageEdits } from '../../domain';
import type { Bitmap } from '../../application';
import type { AppContext } from '../context';
import type { MessageKey } from '../i18n';
import { h, replaceChildren } from '../dom';
import { defaultText } from '../store';

type Step = 'original' | 'masked' | 'marked' | 'gray';
const STEPS: readonly Step[] = ['original', 'masked', 'marked', 'gray'];

/** Zonas de la tarjeta ficticia: firma, número de trámite y código de barras. */
const DEMO_MASKS: readonly NormalizedRect[] = [
  { x: 0.03, y: 0.69, w: 0.4, h: 0.09 },
  { x: 0.03, y: 0.83, w: 0.45, h: 0.1 },
  { x: 0.55, y: 0.8, w: 0.43, h: 0.14 },
];

/**
 * Demo de la portada (RF-14): la tarjeta ficticia procesada en vivo con el mismo pipeline que la
 * exportación, paso a paso. Se ve el resultado antes de subir nada.
 */
export function demo(root: HTMLElement, { deps, store, t }: AppContext): () => void {
  const canvas = h('canvas', {
    class: 'demo-canvas',
    attrs: { role: 'img', 'aria-label': t('demo.alt') },
  });
  const caption = h('p', { class: 'demo-caption', attrs: { 'aria-live': 'polite' } });
  const tabs = STEPS.map((step, i) =>
    h(
      'button',
      {
        type: 'button',
        class: 'demo-tab',
        id: `demo-tab-${step}`,
        dataset: { testid: `demo-${step}` },
        attrs: { role: 'tab', 'aria-selected': String(i === 0), tabindex: i === 0 ? '0' : '-1' },
        on: {
          click: () => void select(step),
          keydown: (event) => {
            const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (delta === 0) return;
            event.preventDefault();
            const next = STEPS[(i + delta + STEPS.length) % STEPS.length] ?? 'original';
            tabs[STEPS.indexOf(next)]?.focus();
            void select(next);
          },
        },
      },
      t(`demo.tab.${step}`),
    ),
  );
  replaceChildren(
    root,
    h('p', { class: 'demo-title' }, t('demo.title')),
    h(
      'div',
      { class: 'demo-tabs', attrs: { role: 'tablist', 'aria-label': t('demo.title') } },
      ...tabs,
    ),
    h('div', { class: 'demo-stage', attrs: { role: 'tabpanel' } }, canvas),
    caption,
  );

  let source: { bitmap: Bitmap; page: Page } | null = null;
  /** Objeto mutable: el linter no sigue cambios de una variable capturada por clausuras. */
  const life = { disposed: false };
  let token = 0;

  async function load(): Promise<{ bitmap: Bitmap; page: Page } | null> {
    if (source) return source;
    try {
      const response = await fetch(deps.demoImageUrl);
      if (!response.ok) return null;
      const decoded = await deps.decodeImage(await response.blob());
      source = {
        bitmap: decoded.bitmap,
        page: { id: 'demo', label: 'demo', sourceName: 'demo', size: decoded.size },
      };
      return source;
    } catch {
      return null;
    }
  }

  async function select(step: Step): Promise<void> {
    tabs.forEach((tab, i) => {
      const active = STEPS[i] === step;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    caption.textContent = t(`demo.caption.${step}` as MessageKey);
    const current = ++token;
    // Función, no expresión: tras cada `await` el estado puede haber cambiado.
    const stale = (): boolean => life.disposed || current !== token;
    const loaded = await load();
    if (!loaded || stale()) return;
    const locale = store.get().locale;
    const edits: PageEdits = {
      rotation: 0,
      crop: null,
      masks: step === 'original' ? [] : DEMO_MASKS,
    };
    const marked = step === 'marked' || step === 'gray';
    const { raster } = await deps.renderPage.run({
      page: loaded.page,
      bitmap: loaded.bitmap,
      edits,
      style: PRESETS.normal,
      text: marked
        ? {
            ...defaultText(locale),
            recipient: t('mark.recipient.placeholder'),
            purpose: t('mark.purpose.placeholder'),
          }
        : { freeText: '', recipient: '', purpose: '', includeDate: false },
      output: { maxSide: 900, jpegQuality: 0.9, grayscale: step === 'gray' },
    });
    try {
      if (stale()) return;
      const bitmap = await raster.toBitmap();
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
      bitmap.close();
      canvas.dataset.step = step;
    } finally {
      raster.dispose();
    }
  }

  void select('marked');

  return () => {
    life.disposed = true;
    source?.bitmap.close();
  };
}
