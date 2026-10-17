import { CameraError, type CameraSession } from '../../application';
import type { AppContext } from '../context';
import type { MessageKey } from '../i18n';
import { h, replaceChildren } from '../dom';
import { actions } from '../store';

const ERROR_KEYS: Record<CameraError['code'], MessageKey> = {
  denied: 'camera.error.denied',
  unavailable: 'camera.error.unavailable',
  unknown: 'camera.error.unknown',
};

/**
 * Diálogo de captura (RF-03). La vista previa va en espejo para encuadrar; la foto no.
 * Devuelve la función que lo abre; la registra `services.openCamera`.
 */
export function cameraDialog(
  root: HTMLElement,
  ctx: AppContext,
): { open: () => void; dispose: () => void } {
  const { store, deps, t } = ctx;
  const video = h('video', {
    class: 'camera-preview',
    autoplay: true,
    muted: true,
    playsInline: true,
  });
  const status = h('p', { class: 'muted', attrs: { role: 'status' } });
  const shoot = h(
    'button',
    { type: 'button', class: 'button primary', disabled: true },
    t('camera.shoot'),
  );
  const cancel = h('button', { type: 'button', class: 'button' }, t('camera.cancel'));
  const dialog = h(
    'dialog',
    { class: 'camera-dialog' },
    h('h2', {}, t('camera.title')),
    h('p', { class: 'muted' }, t('camera.help')),
    video,
    status,
    h('div', { class: 'actions' }, shoot, cancel),
  );
  replaceChildren(root, dialog);

  let session: CameraSession | null = null;
  /** Cada apertura tiene su número; una sesión que llega tarde (diálogo ya cerrado) se apaga. */
  let opening = 0;

  const close = (): void => {
    opening += 1;
    session?.stop();
    session = null;
    video.srcObject = null;
    if (dialog.open) dialog.close();
  };

  const open = async (): Promise<void> => {
    close();
    const attempt = opening;
    status.textContent = t('camera.starting');
    shoot.disabled = true;
    dialog.showModal();
    try {
      const started = await deps.capture.start();
      if (attempt !== opening || !dialog.open) {
        // El usuario canceló mientras el navegador pedía permiso: la cámara no se queda encendida.
        started.stop();
        return;
      }
      session = started;
      video.srcObject = session.stream;
      status.textContent = '';
      shoot.disabled = false;
    } catch (error) {
      if (attempt !== opening) return;
      const code = error instanceof CameraError ? error.code : 'unknown';
      const message = error instanceof Error ? error.message : String(error);
      close();
      store.update(actions.notify({ kind: 'error', message: t(ERROR_KEYS[code], { message }) }));
    }
  };

  shoot.addEventListener('click', () => {
    if (!session) return;
    shoot.disabled = true;
    void deps.capture
      .capture(session)
      .then((imported) => {
        store.update(actions.addPages([imported]));
        store.update(actions.selectPage(imported.page.id));
        close();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        store.update(
          actions.notify({ kind: 'error', message: t('camera.error.unknown', { message }) }),
        );
        close();
      });
  });
  cancel.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    session?.stop();
    session = null;
  });

  return { open: () => void open(), dispose: close };
}
