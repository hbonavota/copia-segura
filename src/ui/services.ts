import type { ImportError } from '../application';
import { type ExportFormat } from '../application';
import type { Dependencies, Services } from './context';
import type { MessageKey, Translator } from './i18n';
import { actions, currentStyle, type Store } from './store';

const IMPORT_ERROR_KEYS: Record<ImportError['code'], MessageKey> = {
  encrypted: 'import.error.encrypted',
  corrupt: 'import.error.corrupt',
  unsupported: 'import.error.unsupported',
  unknown: 'import.error.unknown',
};

/**
 * Orquesta casos de uso con el estado de la interfaz: marca "ocupado", añade páginas, avisa de
 * errores. `openCamera` lo registra el diálogo de cámara cuando se monta.
 */
export function createServices(
  store: Store,
  deps: Dependencies,
  t: () => Translator,
): Services & { registerCamera(open: () => void): void } {
  let openCameraDialog: () => void = () => undefined;
  /** Varias operaciones pueden solaparse (p. ej. dos arrastres); "ocupado" dura hasta la última. */
  let inFlight = 0;
  const begin = (label: string): void => {
    inFlight += 1;
    store.update(actions.setBusy(label));
  };
  const end = (): void => {
    inFlight -= 1;
    if (inFlight === 0) store.update(actions.setBusy(null));
  };

  async function importFiles(files: readonly File[]): Promise<void> {
    if (files.length === 0) return;
    begin(t()('import.working', { n: files.length }));
    try {
      const { pages, errors } = await deps.importFiles.run(files);
      store.update(actions.addPages(pages));
      const first = pages[0];
      if (first) store.update(actions.selectPage(first.page.id));
      if (errors.length > 0) {
        const message = errors
          .map((e) => t()(IMPORT_ERROR_KEYS[e.code], { file: e.fileName, message: e.message }))
          .join(' ');
        store.update(actions.notify({ kind: 'error', message }));
      } else if (pages.some((p) => p.autoCropped)) {
        store.update(actions.notify({ kind: 'info', message: t()('import.autocrop') }));
      } else {
        store.update(
          actions.notify({ kind: 'info', message: t()('import.done', { n: pages.length }) }),
        );
      }
    } finally {
      end();
    }
  }

  async function importExample(): Promise<void> {
    let blob: Blob;
    try {
      const response = await fetch(deps.exampleUrl);
      if (!response.ok) throw new Error(String(response.status));
      blob = await response.blob();
    } catch {
      store.update(actions.notify({ kind: 'error', message: t()('import.error.example') }));
      return;
    }
    await importFiles([new File([blob], 'documento-ficticio.pdf', { type: 'application/pdf' })]);
  }

  function removePage(id: string): void {
    const page = store.get().pages.find((p) => p.page.id === id);
    if (!page) return;
    store.update(actions.removePage(id));
    // El bitmap puede ocupar decenas de MB: se libera en cuanto la vista previa ha dejado de usarlo
    // (su redibujado se agrupa en 60 ms). Mientras hay una exportación en curso no se puede quitar.
    setTimeout(() => page.bitmap.close(), 1000);
  }

  async function exportAs(format: ExportFormat): Promise<void> {
    const state = store.get();
    if (state.pages.length === 0) {
      store.update(actions.notify({ kind: 'error', message: t()('export.none') }));
      return;
    }
    begin(t()('export.working'));
    try {
      // Dejar que el navegador pinte "Generando…" antes de bloquear el hilo con el dibujo.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const summary = await deps.exportCopies.run({
        items: state.pages.map((p) => ({ page: p.page, bitmap: p.bitmap, edits: p.edits })),
        style: currentStyle(state),
        text: state.text,
        output: state.output,
        format,
      });
      // Cancelar el menú de compartir no es un error: no se avisa de nada (RF-18).
      if (summary.files.length > 0) {
        store.update(
          actions.notify({
            kind: 'info',
            message: t()(format === 'share' ? 'export.shared' : 'export.done', {
              files: summary.files.join(', '),
            }),
          }),
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      store.update(actions.notify({ kind: 'error', message }));
    } finally {
      end();
    }
  }

  return {
    importFiles,
    importExample,
    exportAs,
    removePage,
    openCamera: () => openCameraDialog(),
    registerCamera: (open) => {
      openCameraDialog = open;
    },
  };
}
