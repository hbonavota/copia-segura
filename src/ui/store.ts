/**
 * Estado de la interfaz: un único objeto inmutable y suscripciones con selector (ADR-0003).
 * Los casos de uso no conocen este store; la interfaz lo usa para saber qué pintar.
 */
import {
  isNegligible,
  templateMasks,
  type TemplateId,
  resolveStyle,
  nextRotation,
  rotateRect,
  rotationDelta,
  type NormalizedRect,
  type OutputOptions,
  type Page,
  type PageEdits,
  type PresetName,
  type Rotation,
  type WatermarkStyle,
  type WatermarkText,
} from '../domain';
import type { Bitmap, ImportedPage } from '../application';
import type { Locale } from './i18n';

export type Tool = 'mask' | 'crop';

export interface PageState {
  readonly page: Page;
  readonly bitmap: Bitmap;
  readonly edits: PageEdits;
  readonly autoCropped: boolean;
}

export interface Notice {
  /** `success`: una exportación terminada (RF-23). */
  readonly kind: 'info' | 'success' | 'error';
  readonly message: string;
}

export interface AppState {
  readonly locale: Locale;
  readonly pages: readonly PageState[];
  readonly activePageId: string | null;
  readonly tool: Tool;
  /** Zona seleccionada de la página activa, para moverla o quitarla (RF-27). */
  readonly selectedMask: number | null;
  /** Ya se ha descargado al menos una copia de las páginas actuales (indicador de pasos, RF-24). */
  readonly exported: boolean;
  readonly preset: PresetName;
  readonly overrides: Partial<WatermarkStyle>;
  readonly text: WatermarkText;
  readonly output: OutputOptions;
  readonly busy: string | null;
  readonly notice: Notice | null;
}

/** Texto inicial de la marca según el idioma; el usuario puede cambiarlo libremente. */
export const DEFAULT_FREE_TEXT: Record<Locale, string> = {
  es: 'COPIA SOLO VÁLIDA PARA',
  en: 'COPY ONLY VALID FOR',
};

export function defaultText(locale: Locale): WatermarkText {
  return { freeText: DEFAULT_FREE_TEXT[locale], recipient: '', purpose: '', includeDate: true };
}

export const DEFAULT_OUTPUT: OutputOptions = { maxSide: 1200, jpegQuality: 0.82 };

export function initialState(locale: Locale): AppState {
  return {
    locale,
    pages: [],
    activePageId: null,
    tool: 'mask',
    selectedMask: null,
    exported: false,
    preset: 'normal',
    overrides: {},
    text: defaultText(locale),
    output: DEFAULT_OUTPUT,
    busy: null,
    notice: null,
  };
}

type Listener<T> = (value: T, previous: T) => void;

export interface Store {
  get(): AppState;
  update(recipe: (state: AppState) => AppState): void;
  /** Llama a `listener` cuando `select(state)` cambia (comparación estricta). */
  select<T>(select: (state: AppState) => T, listener: Listener<T>): () => void;
}

export function createStore(initial: AppState): Store {
  let state = initial;
  const listeners = new Set<(next: AppState, previous: AppState) => void>();
  return {
    get: () => state,
    update(recipe) {
      const previous = state;
      state = recipe(previous);
      if (state === previous) return;
      for (const listener of [...listeners]) listener(state, previous);
    },
    select(select, listener) {
      const wrapped = (next: AppState, previous: AppState): void => {
        const a = select(next);
        const b = select(previous);
        if (a !== b) listener(a, b);
      };
      listeners.add(wrapped);
      return () => listeners.delete(wrapped);
    },
  };
}

// ----------------------------------------------------------------------------- selectores

export function activePage(state: AppState): PageState | null {
  return state.pages.find((p) => p.page.id === state.activePageId) ?? null;
}

/**
 * Zona del marco de página que muestra la vista previa: con la herramienta de tapar, la recortada;
 * con la de recortar, la página entera (SPEC-0004).
 */
export function viewFrame(state: AppState): NormalizedRect {
  const crop = state.tool === 'mask' ? activePage(state)?.edits.crop : null;
  return crop ?? { x: 0, y: 0, w: 1, h: 1 };
}

/** Lleva un rectángulo de la vista previa al marco de página. */
export function viewToPage(state: AppState, rect: NormalizedRect): NormalizedRect {
  const f = viewFrame(state);
  return { x: f.x + rect.x * f.w, y: f.y + rect.y * f.h, w: rect.w * f.w, h: rect.h * f.h };
}

/** Lo contrario de `viewToPage`: dónde se ve en la vista previa una zona de la página. */
export function pageToView(state: AppState, rect: NormalizedRect): NormalizedRect {
  const f = viewFrame(state);
  return { x: (rect.x - f.x) / f.w, y: (rect.y - f.y) / f.h, w: rect.w / f.w, h: rect.h / f.h };
}

/** Preset + ajustes manuales, ya acotados a los límites del dominio (SPEC-0004). */
export function currentStyle(state: AppState): WatermarkStyle {
  return resolveStyle(state.preset, state.overrides);
}

// ----------------------------------------------------------------------------- acciones

export const actions = {
  addPages:
    (imported: readonly ImportedPage[]) =>
    (state: AppState): AppState => {
      if (imported.length === 0) return state;
      const pages = [...state.pages, ...imported.map((p) => ({ ...p }))];
      const first = imported[0];
      return {
        ...state,
        pages,
        exported: false,
        activePageId: state.activePageId ?? first?.page.id ?? null,
      };
    },

  removePage:
    (id: string) =>
    (state: AppState): AppState => {
      const pages = state.pages.filter((p) => p.page.id !== id);
      const activePageId =
        state.activePageId === id ? (pages[0]?.page.id ?? null) : state.activePageId;
      return { ...state, pages, activePageId, selectedMask: null, exported: false };
    },

  selectPage:
    (id: string) =>
    (state: AppState): AppState =>
      state.activePageId === id ? state : { ...state, activePageId: id, selectedMask: null },

  setTool:
    (tool: Tool) =>
    (state: AppState): AppState =>
      state.tool === tool ? state : { ...state, tool, selectedMask: null },

  selectMask:
    (index: number | null) =>
    (state: AppState): AppState =>
      state.selectedMask === index ? state : { ...state, selectedMask: index },

  setExported:
    (exported: boolean) =>
    (state: AppState): AppState =>
      state.exported === exported ? state : { ...state, exported },

  editActive:
    (recipe: (edits: PageEdits) => PageEdits) =>
    (state: AppState): AppState => {
      const active = activePage(state);
      if (!active) return state;
      const edits = recipe(active.edits);
      if (edits === active.edits) return state;
      return {
        ...state,
        pages: state.pages.map((p) => (p === active ? { ...p, edits } : p)),
      };
    },

  rotateActive: (deltaDeg: 90 | -90): ((state: AppState) => AppState) =>
    actions.editActive((edits) => {
      const rotation: Rotation = nextRotation(edits.rotation, deltaDeg);
      const delta = rotationDelta(edits.rotation, rotation);
      const turn = (r: NormalizedRect): NormalizedRect => (delta === 0 ? r : rotateRect(r, delta));
      return {
        rotation,
        crop: edits.crop ? turn(edits.crop) : null,
        masks: edits.masks.map(turn),
      };
    }),

  addMask: (rect: NormalizedRect): ((state: AppState) => AppState) =>
    actions.editActive((edits) =>
      isNegligible(rect) ? edits : { ...edits, masks: [...edits.masks, rect] },
    ),

  /** Sustituye una zona (moverla o cambiar su tamaño, RF-27). */
  updateMask: (index: number, rect: NormalizedRect): ((state: AppState) => AppState) =>
    actions.editActive((edits) =>
      index < 0 || index >= edits.masks.length || isNegligible(rect)
        ? edits
        : { ...edits, masks: edits.masks.map((m, i) => (i === index ? rect : m)) },
    ),

  /** Quita una zona concreta y deja de seleccionarla (RF-27). */
  removeMask:
    (index: number) =>
    (state: AppState): AppState => {
      const next = actions.editActive((edits) =>
        index < 0 || index >= edits.masks.length
          ? edits
          : { ...edits, masks: edits.masks.filter((_, i) => i !== index) },
      )(state);
      return next === state ? state : { ...next, selectedMask: null };
    },

  undoMask:
    () =>
    (state: AppState): AppState => {
      const next = actions.editActive((edits) =>
        edits.masks.length === 0 ? edits : { ...edits, masks: edits.masks.slice(0, -1) },
      )(state);
      return next === state ? state : { ...next, selectedMask: null };
    },

  clearMasks:
    () =>
    (state: AppState): AppState => {
      const next = actions.editActive((edits) =>
        edits.masks.length === 0 ? edits : { ...edits, masks: [] },
      )(state);
      return next === state ? state : { ...next, selectedMask: null };
    },

  setCrop: (crop: NormalizedRect | null): ((state: AppState) => AppState) =>
    actions.editActive((edits) => (crop && isNegligible(crop) ? edits : { ...edits, crop })),

  /** Añade las zonas de una plantilla a la página activa (RF-16). */
  applyTemplate: (id: TemplateId): ((state: AppState) => AppState) =>
    actions.editActive((edits) => ({
      ...edits,
      masks: [...edits.masks, ...templateMasks(id, edits)],
    })),

  setPreset:
    (preset: PresetName) =>
    (state: AppState): AppState => ({ ...state, preset, overrides: {} }),

  setOverride:
    <K extends keyof WatermarkStyle>(key: K, value: WatermarkStyle[K]) =>
    (state: AppState): AppState => ({ ...state, overrides: { ...state.overrides, [key]: value } }),

  resetOverrides:
    () =>
    (state: AppState): AppState =>
      Object.keys(state.overrides).length === 0 ? state : { ...state, overrides: {} },

  setText:
    (patch: Partial<WatermarkText>) =>
    (state: AppState): AppState => ({ ...state, text: { ...state.text, ...patch } }),

  setOutput:
    (patch: Partial<OutputOptions>) =>
    (state: AppState): AppState => ({ ...state, output: { ...state.output, ...patch } }),

  setLocale:
    (locale: Locale) =>
    (state: AppState): AppState =>
      state.locale === locale ? state : { ...state, locale },

  setBusy:
    (busy: string | null) =>
    (state: AppState): AppState =>
      state.busy === busy ? state : { ...state, busy },

  notify:
    (notice: Notice | null) =>
    (state: AppState): AppState => ({ ...state, notice }),
};
