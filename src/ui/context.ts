import {
  type CaptureFromCamera,
  type ExportCopies,
  type ExportFormat,
  type ImportFiles,
  type RenderPage,
} from '../application';
import type { Translator } from './i18n';
import type { Store } from './store';

/** Casos de uso ya construidos (los adaptadores los elige `main.ts`). */
export interface Dependencies {
  readonly importFiles: ImportFiles;
  readonly renderPage: RenderPage;
  readonly exportCopies: ExportCopies;
  readonly capture: CaptureFromCamera;
  /** URL del documento ficticio de ejemplo, servido desde el propio origen (RF-11). */
  readonly exampleUrl: string;
  /** Enlaces del pie: repositorio y documentación. */
  readonly links: { readonly source: string; readonly docs: string };
}

/** Operaciones de la interfaz que combinan casos de uso con estado y avisos. */
export interface Services {
  importFiles(files: readonly File[]): Promise<void>;
  importExample(): Promise<void>;
  exportAs(format: ExportFormat): Promise<void>;
  /** Quita una página y libera su bitmap. */
  removePage(id: string): void;
  openCamera(): void;
}

export interface AppContext {
  readonly store: Store;
  readonly deps: Dependencies;
  readonly services: Services;
  /** Traductor del idioma activo. Se renueva al cambiar de idioma; las vistas se vuelven a montar. */
  readonly t: Translator;
}

/** Una vista monta su DOM en `root` y devuelve cómo desmontarse. */
export type View = (root: HTMLElement, ctx: AppContext) => () => void;
