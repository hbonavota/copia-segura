import {
  moveRect,
  rectFromCorners,
  resizeRect,
  type NormalizedRect,
  type PageEdits,
} from '../../domain';
import type { View } from '../context';
import { ICONS, h, icon, replaceChildren } from '../dom';
import {
  actions,
  activePage,
  currentStyle,
  pageToView,
  viewFrame,
  viewToPage,
  type Tool,
} from '../store';

/** Paso de las flechas al mover o redimensionar una zona (RF-27), en fracción de la vista. */
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
  const hint = h('p', { class: 'hint muted', id: 'editor-hint' });
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
  // Las zonas viven en el marco de página: mover y redimensionar se calcula ahí, de modo que una
  // zona que sobresale del recorte no se desplaza al tocarla y nunca sale de la página.

  interface Point {
    readonly x: number;
    readonly y: number;
  }
  type Gesture =
    | { readonly kind: 'draw'; readonly start: Point }
    | {
        readonly kind: 'move' | 'resize';
        readonly index: number;
        readonly start: Point;
        readonly rect: NormalizedRect;
      };
  let gesture: Gesture | null = null;

  /** Punto del puntero en fracciones de la vista previa. */
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
  const pageMasks = (): readonly NormalizedRect[] => activePage(store.get())?.edits.masks ?? [];
  const sameRect = (a: NormalizedRect, b: NormalizedRect): boolean =>
    a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
  const boxAt = (index: number | null): HTMLElement | null =>
    index === null ? null : boxes.querySelector<HTMLElement>(`[data-index="${index}"]`);
  const focusSelected = (): void => {
    boxAt(store.get().selectedMask)?.focus({ preventScroll: true });
  };

  /** Contornos de las zonas sobre la vista previa: se pueden seleccionar, mover y redimensionar. */
  function renderBoxes(): void {
    const state = store.get();
    const masks = state.tool === 'mask' ? pageMasks() : [];
    const focused = document.activeElement;
    const keepFocus = focused instanceof HTMLElement && boxes.contains(focused);
    replaceChildren(
      boxes,
      ...masks.map((rect, index) => {
        const selected = state.selectedMask === index;
        const name = t('mask.item', { n: index + 1 });
        const box = h(
          'div',
          {
            class: 'mask-box',
            tabIndex: 0,
            dataset: {
              testid: `mask-${index + 1}`,
              index: String(index),
              selected: String(selected),
            },
            attrs: {
              role: 'button',
              'aria-label': selected ? `${name} · ${t('mask.selected')}` : name,
              'aria-describedby': 'editor-hint',
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
        place(box, pageToView(state, rect));
        return box;
      }),
    );
    if (keepFocus) {
      if (state.selectedMask === null) overlay.focus({ preventScroll: true });
      else focusSelected();
    }
  }

  const ARROWS: Record<string, readonly [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };

  /** Teclado (RF-27): flechas mueven, Alt + flechas cambian el tamaño, Supr quita, Esc suelta. */
  function onBoxKey(event: KeyboardEvent, index: number): void {
    const rect = pageMasks()[index];
    if (!rect) return;
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      const f = viewFrame(store.get());
      const step = event.shiftKey ? NUDGE_FAST : NUDGE;
      const dx = arrow[0] * step * f.w;
      const dy = arrow[1] * step * f.h;
      const next = event.altKey
        ? resizeRect(rect, rect.x + rect.w + dx, rect.y + rect.h + dy)
        : moveRect(rect, dx, dy);
      if (!sameRect(next, rect)) store.update(actions.updateMask(index, next));
      focusSelected();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      store.update(actions.removeMask(index));
      overlay.focus({ preventScroll: true });
    } else if (event.key === 'Escape') {
      store.update(actions.selectMask(null));
      overlay.focus({ preventScroll: true });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      store.update(actions.selectMask(index));
    }
  }

  /** Dónde quedaría la zona si se soltara ahora, en el marco de página. */
  const preview = (g: Extract<Gesture, { kind: 'move' | 'resize' }>, p: Point): NormalizedRect => {
    const state = store.get();
    if (g.kind === 'move') {
      const f = viewFrame(state);
      return moveRect(g.rect, (p.x - g.start.x) * f.w, (p.y - g.start.y) * f.h);
    }
    const corner = viewToPage(state, { x: p.x, y: p.y, w: 0, h: 0 });
    return resizeRect(g.rect, corner.x, corner.y);
  };

  overlay.tabIndex = -1;
  overlay.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !activePage(store.get())) return;
    const target = event.target as HTMLElement;
    const box = target.closest<HTMLElement>('.mask-box');
    const point = pointAt(event);
    overlay.setPointerCapture(event.pointerId);
    if (box && store.get().tool === 'mask') {
      const index = Number(box.dataset.index);
      const rect = pageMasks()[index];
      if (!rect) return;
      store.update(actions.selectMask(index));
      const kind = target.dataset.handle === 'resize' ? 'resize' : 'move';
      gesture = { kind, index, start: point, rect };
      event.preventDefault();
      return;
    }
    store.update(actions.selectMask(null));
    gesture = { kind: 'draw', start: point };
    showRubber(point, point);
  });

  overlay.addEventListener('pointermove', (event) => {
    if (!gesture) return;
    const p = pointAt(event);
    if (gesture.kind === 'draw') {
      showRubber(gesture.start, p);
      return;
    }
    const box = boxAt(gesture.index);
    if (box) place(box, pageToView(store.get(), preview(gesture, p)));
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
      if (state.tool === 'crop') {
        store.update(actions.setCrop(rect));
        return;
      }
      const before = pageMasks().length;
      store.update(actions.addMask(rect));
      // La zona recién dibujada queda seleccionada: Supr o las flechas actúan sobre ella.
      if (pageMasks().length > before) {
        store.update(actions.selectMask(before));
        focusSelected();
      }
      return;
    }
    const next = preview(g, p);
    // Un clic sin arrastre solo selecciona: no reescribe la zona.
    if (!sameRect(next, g.rect)) store.update(actions.updateMask(g.index, next));
    focusSelected();
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
