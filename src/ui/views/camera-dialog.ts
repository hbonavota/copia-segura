import { CameraError, type CameraFacing, type CameraSession } from '../../application';
import type { AppContext } from '../context';
import type { MessageKey } from '../i18n';
import { h, icon, ICONS, replaceChildren } from '../dom';
import { actions } from '../store';

const ERROR_KEYS: Record<CameraError['code'], MessageKey> = {
  denied: 'camera.error.denied',
  unavailable: 'camera.error.unavailable',
  unknown: 'camera.error.unknown',
};

const TEXTS: Record<CameraFacing, { title: MessageKey; help: MessageKey; using: MessageKey }> = {
  environment: {
    title: 'camera.back.title',
    help: 'camera.back.help',
    using: 'camera.using.back',
  },
  user: { title: 'camera.title', help: 'camera.help', using: 'camera.using.front' },
};

/**
 * Diálogo de captura (RF-03, SPEC-0013). Se abre con la cámara trasera y, si hay más de una,
 * permite cambiar a la frontal. La vista previa de la frontal va en espejo para encuadrar; la foto
 * nunca. Devuelve la función que lo abre; la registra `services.openCamera`.
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
  // Sobre la vista previa, como en la cámara del móvil.
  const flip = h(
    'button',
    {
      type: 'button',
      class: 'camera-flip',
      dataset: { testid: 'camera-switch' },
      hidden: true,
      title: t('camera.switch'),
      attrs: { 'aria-label': t('camera.switch') },
    },
    icon(ICONS.flip),
  );
  const title = h('h2', { id: 'camera-title' });
  const help = h('p', { class: 'muted' });
  const dialog = h(
    'dialog',
    { class: 'camera-dialog', attrs: { 'aria-labelledby': 'camera-title' } },
    title,
    help,
    h('div', { class: 'camera-frame' }, video, flip),
    status,
    h('div', { class: 'actions' }, cancel, shoot),
  );
  replaceChildren(root, dialog);

  /** Textos y espejo según la cámara en uso. */
  const show = (facing: CameraFacing): void => {
    title.textContent = t(TEXTS[facing].title);
    help.textContent = t(TEXTS[facing].help);
    video.classList.toggle('is-mirrored', facing === 'user');
    video.dataset.facing = facing;
  };
  show('environment');

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

  /** Enciende una cámara (al abrir o al cambiar). `previous` se apaga antes de pedir la otra. */
  const start = async (previous: CameraSession | null): Promise<void> => {
    const attempt = opening;
    status.textContent = t('camera.starting');
    shoot.disabled = true;
    flip.disabled = true;
    session = null;
    try {
      const started = previous
        ? await deps.capture.switchCamera(previous)
        : await deps.capture.start();
      if (attempt !== opening || !dialog.open) {
        // El usuario canceló mientras el navegador pedía permiso: la cámara no se queda encendida.
        started.stop();
        return;
      }
      session = started;
      video.srcObject = session.stream;
      show(session.facing);
      // Tras el permiso, el navegador ya dice cuántas cámaras hay.
      flip.hidden = !(await deps.capture.canSwitch());
      if (attempt !== opening) return;
      status.textContent = previous ? t(TEXTS[session.facing].using) : '';
      shoot.disabled = false;
      flip.disabled = false;
    } catch (error) {
      if (attempt !== opening) return;
      const code = error instanceof CameraError ? error.code : 'unknown';
      const message = error instanceof Error ? error.message : String(error);
      close();
      store.update(actions.notify({ kind: 'error', message: t(ERROR_KEYS[code], { message }) }));
    }
  };

  const open = (): void => {
    close();
    show('environment');
    flip.hidden = true;
    dialog.showModal();
    void start(null);
  };

  flip.addEventListener('click', () => {
    if (session) void start(session);
  });

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

  return { open, dispose: close };
}
