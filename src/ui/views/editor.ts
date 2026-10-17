import { TEMPLATE_IDS, rectFromCorners, type NormalizedRect, type PageEdits } from '../../domain';
import type { View } from '../context';
import { ICONS, h, icon, replaceChildren } from '../dom';
import { actions, activePage, currentStyle, type AppState, type Tool } from '../store';

const STRIP = 0.15;
const STRIPS: Record<'top' | 'bottom' | 'left' | 'right', NormalizedRect> = {
  top: { x: 0, y: 0, w: 1, h: STRIP },
  bottom: { x: 0, y: 1 - STRIP, w: 1, h: STRIP },
  left: { x: 0, y: 0, w: STRIP, h: 1 },
  right: { x: 1 - STRIP, y: 0, w: STRIP, h: 1 },
};

/**
 * Editor de la página activa: vista previa real (mismo plan que la exportación, RF-09),
 * dibujo de zonas a tapar y de recorte con el puntero, giro y deshacer.
 */
export const editor: View = (root, { store, deps, t }) => {
  const canvas = h('canvas', {
    class: 'preview',
    attrs: { role: 'img', 'aria-label': t('editor.preview') },
  });
  const rubber = h('div', { class: 'rubber', hidden: true });
  const cropShade = h('div', { class: 'crop-shade', hidden: true });
  const overlay = h('div', { class: 'overlay', dataset: { testid: 'overlay' } }, cropShade, rubber);
  const stage = h('div', { class: 'stage' }, canvas, overlay);
  const meta = h('p', { class: 'meta muted', dataset: { testid: 'meta' } });
  const hint = h('p', { class: 'hint muted' });
  const status = h('p', { class: 'rendering muted', hidden: true }, t('editor.rendering'));

  const toolButton = (tool: Tool, label: string): HTMLButtonElement =>
    h(
      'button',
      {
        type: 'button',
        class: 'button small tool',
        dataset: { testid: `tool-${tool}` },
        attrs: { 'aria-pressed': 'false' },
        on: { click: () => store.update(actions.setTool(tool)) },
      },
      label,
    );
  const maskButton = toolButton('mask', t('tool.mask'));
  const cropButton = toolButton('crop', t('tool.crop'));
  const undoButton = h(
    'button',
    {
      type: 'button',
      class: 'button small',
      dataset: { testid: 'undo-mask' },
      on: { click: () => store.update(actions.undoMask()) },
    },
    icon(ICONS.undo),
    t('tool.undo'),
  );
  const clearMasksButton = h(
    'button',
    {
      type: 'button',
      class: 'button small',
      on: { click: () => store.update(actions.clearMasks()) },
    },
    icon(ICONS.trash),
    t('tool.clearMasks'),
  );
  const clearCropButton = h(
    'button',
    {
      type: 'button',
      class: 'button small',
      dataset: { testid: 'clear-crop' },
      on: { click: () => store.update(actions.setCrop(null)) },
    },
    t('tool.clearCrop'),
  );
  const rotate = (delta: 90 | -90, label: string, path: string): HTMLButtonElement =>
    h(
      'button',
      {
        type: 'button',
        class: 'button small',
        dataset: { testid: delta > 0 ? 'rotate-right' : 'rotate-left' },
        attrs: { 'aria-label': label, title: label },
        on: { click: () => store.update(actions.rotateActive(delta)) },
      },
      icon(path),
    );
  const stripButtons = (Object.keys(STRIPS) as (keyof typeof STRIPS)[]).map((side) =>
    h(
      'button',
      {
        type: 'button',
        class: 'button small',
        dataset: { testid: `strip-${side}` },
        on: { click: () => store.update(actions.addMask(toPageFrame(STRIPS[side], store.get()))) },
      },
      t(`tool.strip.${side}`),
    ),
  );

  const templateSelect = h(
    'select',
    { dataset: { testid: 'template' }, attrs: { 'aria-label': t('template.label') } },
    ...TEMPLATE_IDS.map((id) => h('option', { value: id }, t(`template.${id}`))),
  );
  const templateButton = h(
    'button',
    {
      type: 'button',
      class: 'button small',
      dataset: { testid: 'apply-template' },
      on: {
        click: () => {
          const id = TEMPLATE_IDS.find((x) => x === templateSelect.value);
          if (id) store.update(actions.applyTemplate(id));
        },
      },
    },
    t('template.apply'),
  );

  replaceChildren(
    root,
    h(
      'div',
      { class: 'toolbar', attrs: { role: 'toolbar', 'aria-label': t('editor.preview') } },
      h('div', { class: 'group', attrs: { role: 'group' } }, maskButton, cropButton),
      h(
        'div',
        { class: 'group', attrs: { role: 'group' } },
        rotate(-90, t('tool.rotateLeft'), ICONS.rotateLeft),
        rotate(90, t('tool.rotateRight'), ICONS.rotateRight),
      ),
      h(
        'div',
        { class: 'group', attrs: { role: 'group' } },
        undoButton,
        clearMasksButton,
        clearCropButton,
      ),
    ),
    hint,
    stage,
    h('div', { class: 'strips' }, h('span', { class: 'muted' }, t('tool.strips')), ...stripButtons),
    h(
      'div',
      { class: 'templates' },
      h('span', { class: 'muted' }, t('template.label')),
      templateSelect,
      templateButton,
      h('span', { class: 'muted small' }, t('template.help')),
    ),
    h('div', { class: 'stage-footer' }, meta, status),
  );

  // ----------------------------------------------------------------------- vista previa

  const ctx2d = canvas.getContext('2d');
  let token = 0;
  let renders = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function renderPreview(): Promise<void> {
    const state = store.get();
    const active = activePage(state);
    if (!active || !ctx2d) return;
    const current = ++token;
    const edits: PageEdits = state.tool === 'crop' ? { ...active.edits, crop: null } : active.edits;
    const slow = setTimeout(() => (status.hidden = false), 250);
    try {
      const { raster } = await deps.renderPage.run({
        page: active.page,
        bitmap: active.bitmap,
        edits,
        style: currentStyle(state),
        text: state.text,
        output: state.output,
      });
      try {
        if (current !== token) return;
        const bitmap = await raster.toBitmap();
        if (current !== token) {
          bitmap.close();
          return;
        }
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        ctx2d.drawImage(bitmap, 0, 0);
        bitmap.close();
        // En modo recorte la vista previa muestra la página entera; el tamaño que se informa es
        // siempre el de la exportación real.
        const exported = deps.renderPage.plan({
          ...active,
          edits: active.edits,
          style: currentStyle(state),
          text: state.text,
          output: state.output,
        });
        meta.textContent = `${exported.output.width} × ${exported.output.height} px`;
        renders += 1;
        canvas.dataset.ready = 'true';
        canvas.dataset.render = String(renders); // contador para los tests e2e
      } finally {
        raster.dispose();
      }
    } catch (error) {
      // Si la página se quitó mientras se dibujaba, el fallo no interesa; si no, se muestra.
      if (current === token && activePage(store.get()) === active) throw error;
    } finally {
      clearTimeout(slow);
      if (current === token) status.hidden = true;
    }
  }

  function schedule(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void renderPreview(), 60);
  }

  // ----------------------------------------------------------------------- herramientas

  function syncToolbar(): void {
    const state = store.get();
    const active = activePage(state);
    const edits = active?.edits;
    maskButton.setAttribute('aria-pressed', String(state.tool === 'mask'));
    cropButton.setAttribute('aria-pressed', String(state.tool === 'crop'));
    undoButton.disabled = !edits || edits.masks.length === 0;
    clearMasksButton.disabled = !edits || edits.masks.length === 0;
    clearCropButton.hidden = !edits?.crop;
    hint.textContent = state.tool === 'crop' ? t('tool.hint.crop') : t('tool.hint.mask');
    overlay.dataset.tool = state.tool;
    const crop = state.tool === 'crop' ? (edits?.crop ?? null) : null;
    cropShade.hidden = !crop;
    if (crop) {
      const c = crop;
      cropShade.style.left = `${c.x * 100}%`;
      cropShade.style.top = `${c.y * 100}%`;
      cropShade.style.width = `${c.w * 100}%`;
      cropShade.style.height = `${c.h * 100}%`;
    }
  }

  /** Un rectángulo dibujado sobre la vista previa, llevado al marco de página (SPEC-0004). */
  function toPageFrame(rect: NormalizedRect, state: AppState): NormalizedRect {
    const crop = state.tool === 'mask' ? activePage(state)?.edits.crop : null;
    if (!crop) return rect;
    return {
      x: crop.x + rect.x * crop.w,
      y: crop.y + rect.y * crop.h,
      w: rect.w * crop.w,
      h: rect.h * crop.h,
    };
  }

  let start: { x: number; y: number } | null = null;
  const pointAt = (event: PointerEvent): { x: number; y: number } => {
    const box = overlay.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
  };
  const showRubber = (a: { x: number; y: number }, b: { x: number; y: number }): void => {
    const r = rectFromCorners(a.x, a.y, b.x, b.y);
    rubber.hidden = false;
    rubber.style.left = `${r.x * 100}%`;
    rubber.style.top = `${r.y * 100}%`;
    rubber.style.width = `${r.w * 100}%`;
    rubber.style.height = `${r.h * 100}%`;
  };

  overlay.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !activePage(store.get())) return;
    overlay.setPointerCapture(event.pointerId);
    start = pointAt(event);
    showRubber(start, start);
  });
  overlay.addEventListener('pointermove', (event) => {
    if (start) showRubber(start, pointAt(event));
  });
  const finish = (event: PointerEvent): void => {
    if (!start) return;
    const state = store.get();
    const rect = toPageFrame(
      rectFromCorners(start.x, start.y, pointAt(event).x, pointAt(event).y),
      state,
    );
    start = null;
    rubber.hidden = true;
    store.update(state.tool === 'crop' ? actions.setCrop(rect) : actions.addMask(rect));
  };
  overlay.addEventListener('pointerup', finish);
  overlay.addEventListener('pointercancel', () => {
    start = null;
    rubber.hidden = true;
  });
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && start) {
      start = null;
      rubber.hidden = true;
    }
  };
  window.addEventListener('keydown', onKey);

  // ----------------------------------------------------------------------- suscripciones

  const refresh = (): void => {
    syncToolbar();
    schedule();
  };
  refresh();
  const stop = [
    store.select((s) => s.pages, refresh),
    store.select((s) => s.activePageId, refresh),
    store.select((s) => s.tool, refresh),
    store.select((s) => s.preset, schedule),
    store.select((s) => s.overrides, schedule),
    store.select((s) => s.text, schedule),
    store.select((s) => s.output, schedule),
  ];
  return () => {
    token += 1;
    if (timer) clearTimeout(timer);
    window.removeEventListener('keydown', onKey);
    stop.forEach((fn) => fn());
  };
};
