import { describe, expect, it } from 'vitest';
import type { Bitmap } from '../../src/application';
import type { NormalizedRect } from '../../src/domain';
import { actions, initialState, pageToView, viewToPage, type AppState } from '../../src/ui/store';

const crop: NormalizedRect = { x: 0.1, y: 0.2, w: 0.5, h: 0.4 };
const a: NormalizedRect = { x: 0.2, y: 0.3, w: 0.1, h: 0.1 };
const b: NormalizedRect = { x: 0.4, y: 0.4, w: 0.1, h: 0.1 };

function withPage(masks: readonly NormalizedRect[] = [a, b]): AppState {
  const state = initialState('es');
  return actions.addPages([
    {
      page: { id: 'p', label: 'p1', sourceName: 'doc', size: { width: 100, height: 100 } },
      bitmap: {} as Bitmap,
      edits: { rotation: 0, crop, masks },
      autoCropped: false,
    },
  ])(state);
}

const masksOf = (state: AppState): readonly NormalizedRect[] => state.pages[0]?.edits.masks ?? [];

describe('RF-27 · zonas editables en el estado', () => {
  it('mover una zona la sustituye en su sitio', () => {
    const moved = { ...a, x: 0.5 };
    expect(masksOf(actions.updateMask(0, moved)(withPage()))).toEqual([moved, b]);
  });

  it('ignora índices que no existen y zonas degeneradas', () => {
    const state = withPage();
    expect(actions.updateMask(5, a)(state)).toBe(state);
    expect(actions.updateMask(0, { ...a, w: 0 })(state)).toBe(state);
  });

  it('quitar una zona la elimina y deja de seleccionarla', () => {
    const selected = actions.selectMask(1)(withPage());
    const next = actions.removeMask(1)(selected);
    expect(masksOf(next)).toEqual([a]);
    expect(next.selectedMask).toBeNull();
  });

  it('deshacer, vaciar, cambiar de herramienta o de página quitan la selección', () => {
    const selected = actions.selectMask(0)(withPage());
    expect(actions.undoMask()(selected).selectedMask).toBeNull();
    expect(actions.clearMasks()(selected).selectedMask).toBeNull();
    expect(actions.setTool('crop')(selected).selectedMask).toBeNull();
  });

  it('vista previa y marco de página son transformaciones inversas', () => {
    const state = withPage();
    const view = pageToView(state, a);
    const back = viewToPage(state, view);
    for (const key of ['x', 'y', 'w', 'h'] as const) expect(back[key]).toBeCloseTo(a[key], 10);
  });

  it('con la herramienta de recorte la vista previa es la página entera', () => {
    const state = actions.setTool('crop')(withPage());
    expect(pageToView(state, a)).toEqual(a);
  });
});

describe('RF-24 · indicador de pasos', () => {
  it('añadir o quitar páginas obliga a volver a descargar', () => {
    const exported = actions.setExported(true)(withPage());
    expect(actions.removePage('p')(exported).exported).toBe(false);
  });
});
