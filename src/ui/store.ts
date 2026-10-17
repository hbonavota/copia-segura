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
  readonly kind: 'info' | 'error';
  readonly message: string;
}

export interface AppState {
  readonly locale: Locale;
  readonly pages: readonly PageState[];
  readonly activePageId: string | null;
  readonly tool: Tool;
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
      return { ...state, pages, activePageId: state.activePageId ?? first?.page.id ?? null };
    },

  removePage:
    (id: string) =>
    (state: AppState): AppState => {
      const pages = state.pages.filter((p) => p.page.id !== id);
      const activePageId =
        state.activePageId === id ? (pages[0]?.page.id ?? null) : state.activePageId;
      return { ...state, pages, activePageId };
    },

  selectPage:
    (id: string) =>
    (state: AppState): AppState =>
      state.activePageId === id ? state : { ...state, activePageId: id },

  setTool:
    (tool: Tool) =>
    (state: AppState): AppState =>
      state.tool === tool ? state : { ...state, tool },

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

  undoMask: (): ((state: AppState) => AppState) =>
    actions.editActive((edits) =>
      edits.masks.length === 0 ? edits : { ...edits, masks: edits.masks.slice(0, -1) },
    ),

  clearMasks: (): ((state: AppState) => AppState) =>
    actions.editActive((edits) => (edits.masks.length === 0 ? edits : { ...edits, masks: [] })),

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
