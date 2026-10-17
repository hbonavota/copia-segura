import type { View } from '../context';
import { ICONS, h, icon, replaceChildren } from '../dom';
import { actions } from '../store';

/** Avisos de la interfaz: resultado de importar o exportar, errores. Uno a la vez. */
export const notice: View = (root, { store, t }) => {
  const render = (): void => {
    const { notice: current, busy } = store.get();
    root.hidden = !current && !busy;
    if (busy) {
      root.className = 'notice is-busy';
      replaceChildren(root, h('p', { attrs: { role: 'status' } }, busy));
      return;
    }
    if (!current) {
      replaceChildren(root);
      return;
    }
    root.className = `notice is-${current.kind}`;
    replaceChildren(
      root,
      h('p', { attrs: { role: current.kind === 'error' ? 'alert' : 'status' } }, current.message),
      h(
        'button',
        {
          type: 'button',
          class: 'icon-button',
          attrs: { 'aria-label': t('notice.close') },
          on: { click: () => store.update(actions.notify(null)) },
        },
        icon(ICONS.close),
      ),
    );
  };
  render();
  const stop = [store.select((s) => s.notice, render), store.select((s) => s.busy, render)];
  return () => stop.forEach((fn) => fn());
};
