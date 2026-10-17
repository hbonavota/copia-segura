import {
  MASK_TEMPLATES,
  PRESETS,
  type NormalizedRect,
  type Page,
  type PageEdits,
} from '../../domain';
import type { Bitmap } from '../../application';
import type { AppContext } from '../context';
import type { MessageKey } from '../i18n';
import { h, replaceChildren } from '../dom';
import { defaultText } from '../store';

type Step = 'original' | 'masked' | 'marked' | 'gray';
const STEPS: readonly Step[] = ['original', 'masked', 'marked', 'gray'];

/**
 * Zonas de la tarjeta ficticia: número de soporte, firma y CAN. Son las de la plantilla del DNI
 * (RF-16): la tarjeta de muestra sigue esa disposición, así que la demo enseña la plantilla real.
 */
const DEMO_MASKS: readonly NormalizedRect[] = MASK_TEMPLATES['dni-es-frente'].map((z) => z.rect);

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
        attrs: {
          role: 'tab',
          'aria-controls': 'demo-panel',
          'aria-selected': String(i === 0),
          tabindex: i === 0 ? '0' : '-1',
        },
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
    h(
      'div',
      {
        class: 'demo-stage',
        id: 'demo-panel',
        attrs: { role: 'tabpanel', 'aria-labelledby': 'demo-tab-marked' },
      },
      canvas,
    ),
    caption,
  );

  type Source = { bitmap: Bitmap; page: Page } | null;
  /** Objeto mutable: el linter no sigue cambios de una variable capturada por clausuras. */
  const life = { disposed: false };
  let token = 0;
  /** Una sola descarga aunque se pulsen varias pestañas antes de que termine. */
  let loading: Promise<Source> | null = null;

  async function fetchSource(): Promise<Source> {
    try {
      const response = await fetch(deps.demoImageUrl);
      if (!response.ok) return null;
      const decoded = await deps.decodeImage(await response.blob());
      if (life.disposed) {
        decoded.bitmap.close(); // la vista se desmontó mientras cargaba
        return null;
      }
      return {
        bitmap: decoded.bitmap,
        page: { id: 'demo', label: 'demo', sourceName: 'demo', size: decoded.size },
      };
    } catch {
      return null;
    }
  }

  const load = (): Promise<Source> => (loading ??= fetchSource());

  async function select(step: Step): Promise<void> {
    tabs.forEach((tab, i) => {
      const active = STEPS[i] === step;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    canvas.parentElement?.setAttribute('aria-labelledby', `demo-tab-${step}`);
    caption.textContent = t(`demo.caption.${step}` as MessageKey);
    const current = ++token;
    // Función, no expresión: tras cada `await` el estado puede haber cambiado.
    const stale = (): boolean => life.disposed || current !== token;
    // Con un documento cargado la portada está oculta: no hace falta dibujar.
    if (store.get().pages.length > 0) return;
    const loaded = await load();
    if (!loaded || stale()) return;
    const locale = store.get().locale;
    const edits: PageEdits = {
      rotation: 0,
      crop: null,
      masks: step === 'original' ? [] : DEMO_MASKS,
    };
    const marked = step === 'marked' || step === 'gray';
    let rendered: Awaited<ReturnType<typeof deps.renderPage.run>>;
    try {
      rendered = await deps.renderPage.run({
        page: loaded.page,
        bitmap: loaded.bitmap,
        edits,
        style: PRESETS.normal,
        text: marked
          ? {
              ...defaultText(locale),
              recipient: t('demo.recipient'),
              purpose: t('demo.purpose'),
            }
          : { freeText: '', recipient: '', purpose: '', includeDate: false },
        output: { maxSide: 900, jpegQuality: 0.9, grayscale: step === 'gray' },
      });
    } catch {
      // La demo es decorativa: si falla, se queda el texto y no se molesta con un error.
      return;
    }
    const { raster } = rendered;
    try {
      if (stale()) return;
      const bitmap = await raster.toBitmap();
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
      bitmap.close();
      const changed = canvas.dataset.step !== undefined && canvas.dataset.step !== step;
      canvas.dataset.step = step;
      // Fundido corto al cambiar de paso (SPEC-0007), salvo que se pida reducir movimiento.
      if (changed && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        canvas.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      }
    } finally {
      raster.dispose();
    }
  }

  void select('marked');

  return () => {
    life.disposed = true;
    void loading?.then((source) => source?.bitmap.close());
  };
}
