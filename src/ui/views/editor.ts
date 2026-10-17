import {
  moveRect,
  rectFromCorners,
  resizeRect,
  type NormalizedRect,
  type PageEdits,
} from '../../domain';
import type { View } from '../context';
import { ICONS, h, icon, replaceChildren } from '../dom';
import { actions, activePage, currentStyle, pageToView, viewToPage, type Tool } from '../store';

/** Paso de las flechas al mover una zona con el teclado (RF-27), en fracción de la vista. */
const NUDGE = 0.005;
const NUDGE_FAST = 0.05;

/**
 * Editor de la página activa: vista previa real (mismo plan que la exportación, RF-09), dibujo de
 * zonas a tapar y de recorte con el puntero, zonas editables (RF-27), giro y deshacer.
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
  const boxes = h('div', { class: 'mask-boxes' });
  overlay.append(boxes);

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
    h('div', { class: 'stage-wrap' }, stage),
    h('div', { class: 'stage-footer' }, hint, meta, status),
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

  // ----------------------------------------------------------------------- zonas (RF-27)

  interface Point {
    x: number;
    y: number;
  }
  type Gesture =
    | { kind: 'draw'; start: Point }
    | { kind: 'move'; index: number; start: Point; rect: NormalizedRect }
    | { kind: 'resize'; index: number; rect: NormalizedRect };
  let gesture: Gesture | null = null;

  const pointAt = (event: PointerEvent): Point => {
    const box = overlay.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
  };
  const place = (el: HTMLElement, r: NormalizedRect): void => {
    el.style.left = `${r.x * 100}%`;
    el.style.top = `${r.y * 100}%`;
    el.style.width = `${r.w * 100}%`;
    el.style.height = `${r.h * 100}%`;
  };
  const showRubber = (a: Point, b: Point): void => {
    rubber.hidden = false;
    place(rubber, rectFromCorners(a.x, a.y, b.x, b.y));
  };
  const hideRubber = (): void => {
    rubber.hidden = true;
  };

  /** Zonas de la página activa en coordenadas de la vista previa. */
  const viewMasks = (): NormalizedRect[] => {
    const state = store.get();
    return (activePage(state)?.edits.masks ?? []).map((m) => pageToView(state, m));
  };

  /** Contornos de las zonas sobre la vista previa: se pueden seleccionar, mover y redimensionar. */
  function renderBoxes(): void {
    const state = store.get();
    const masks = state.tool === 'mask' ? viewMasks() : [];
    const focused = document.activeElement;
    const keepFocus = focused instanceof HTMLElement && boxes.contains(focused);
    replaceChildren(
      boxes,
      ...masks.map((rect, index) => {
        const box = h(
          'div',
          {
            class: 'mask-box',
            tabIndex: 0,
            dataset: { testid: `mask-${index + 1}`, index: String(index) },
            attrs: {
              role: 'button',
              'aria-label': t('mask.item', { n: index + 1 }),
              'aria-pressed': String(state.selectedMask === index),
            },
            on: {
              focus: () => store.update(actions.selectMask(index)),
              keydown: (event) => onBoxKey(event, index),
            },
          },
          h('span', {
            class: 'mask-handle',
            dataset: { handle: 'resize' },
            attrs: { 'aria-hidden': 'true', title: t('mask.resize', { n: index + 1 }) },
          }),
        );
        place(box, rect);
        return box;
      }),
    );
    if (keepFocus && state.selectedMask !== null) {
      boxes.querySelector<HTMLElement>(`[data-index="${state.selectedMask}"]`)?.focus();
    }
  }

  function onBoxKey(event: KeyboardEvent, index: number): void {
    const rect = viewMasks()[index];
    if (!rect) return;
    const step = event.shiftKey ? NUDGE_FAST : NUDGE;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      store.update(actions.updateMask(index, viewToPage(store.get(), moveRect(rect, ...move))));
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      store.update(actions.removeMask(index));
      overlay.focus();
    } else if (event.key === 'Escape') {
      store.update(actions.selectMask(null));
      (event.currentTarget as HTMLElement).blur();
    }
  }

  overlay.tabIndex = -1;
  overlay.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !activePage(store.get())) return;
    const target = event.target as HTMLElement;
    const box = target.closest<HTMLElement>('.mask-box');
    const point = pointAt(event);
    overlay.setPointerCapture(event.pointerId);
    if (box && store.get().tool === 'mask') {
      const index = Number(box.dataset.index);
      const rect = viewMasks()[index];
      if (!rect) return;
      store.update(actions.selectMask(index));
      gesture =
        target.dataset.handle === 'resize'
          ? { kind: 'resize', index, rect }
          : { kind: 'move', index, start: point, rect };
      event.preventDefault();
      return;
    }
    store.update(actions.selectMask(null));
    gesture = { kind: 'draw', start: point };
    showRubber(point, point);
  });

  /** Dónde quedaría la zona si se soltara ahora (en la vista previa). */
  const preview = (g: Exclude<Gesture, { kind: 'draw' }>, p: Point): NormalizedRect =>
    g.kind === 'move'
      ? moveRect(g.rect, p.x - g.start.x, p.y - g.start.y)
      : resizeRect(g.rect, p.x, p.y);

  overlay.addEventListener('pointermove', (event) => {
    if (!gesture) return;
    const p = pointAt(event);
    if (gesture.kind === 'draw') {
      showRubber(gesture.start, p);
      return;
    }
    const box = boxes.querySelector<HTMLElement>(`[data-index="${gesture.index}"]`);
    if (box) place(box, preview(gesture, p));
  });

  const finish = (event: PointerEvent): void => {
    const g = gesture;
    if (!g) return;
    gesture = null;
    const state = store.get();
    const p = pointAt(event);
    if (g.kind === 'draw') {
      hideRubber();
      const rect = viewToPage(state, rectFromCorners(g.start.x, g.start.y, p.x, p.y));
      store.update(state.tool === 'crop' ? actions.setCrop(rect) : actions.addMask(rect));
      return;
    }
    const next = preview(g, p);
    if (next.x === g.rect.x && next.y === g.rect.y && next.w === g.rect.w && next.h === g.rect.h) {
      boxes.querySelector<HTMLElement>(`[data-index="${g.index}"]`)?.focus();
      return;
    }
    store.update(actions.updateMask(g.index, viewToPage(state, next)));
  };
  overlay.addEventListener('pointerup', finish);
  overlay.addEventListener('pointercancel', () => {
    gesture = null;
    hideRubber();
    renderBoxes();
  });
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && gesture) {
      gesture = null;
      hideRubber();
      renderBoxes();
    }
  };
  window.addEventListener('keydown', onKey);

  // ----------------------------------------------------------------------- suscripciones

  const refresh = (): void => {
    syncToolbar();
    renderBoxes();
    schedule();
  };
  refresh();
  const stop = [
    store.select((s) => s.pages, refresh),
    store.select((s) => s.activePageId, refresh),
    store.select((s) => s.tool, refresh),
    store.select((s) => s.selectedMask, renderBoxes),
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
