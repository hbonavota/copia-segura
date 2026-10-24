import { pageLabel } from '../../domain';
import type { Camera, CameraFacing, CameraSession } from '../ports';
import { NO_EDITS, type ImportedPage } from './import-files';

/**
 * Cámara con la que se abre la captura (SPEC-0013): la trasera, que es la que se usa para
 * fotografiar un papel o una tarjeta (más resolución y enfoque). En un portátil con una sola
 * cámara el navegador da esa.
 */
export const DEFAULT_FACING: CameraFacing = 'environment';

export function oppositeFacing(facing: CameraFacing): CameraFacing {
  return facing === 'user' ? 'environment' : 'user';
}

/**
 * Qué cámara se está usando de verdad. El navegador lo informa en los móviles; las webcams no
 * suelen decirlo y, si es la única cámara, mira al usuario (no se puede pedir la trasera).
 */
export function resolveFacing(
  reported: string | undefined,
  requested: CameraFacing,
  cameras: number,
): CameraFacing {
  if (reported === 'user' || reported === 'environment') return reported;
  return cameras > 1 ? requested : 'user';
}

/**
 * Captura una foto con la cámara del dispositivo (RF-03, SPEC-0013). La sesión la abre y cierra la
 * interfaz (necesita mostrar la vista previa); aquí se convierte el fotograma capturado en una
 * página.
 */
export class CaptureFromCamera {
  private count = 0;

  constructor(private readonly deps: { readonly camera: Camera }) {}

  start(facing: CameraFacing = DEFAULT_FACING): Promise<CameraSession> {
    return this.deps.camera.start(facing);
  }

  /** ¿Tiene sentido ofrecer cambiar de cámara? Solo si hay más de una. */
  async canSwitch(): Promise<boolean> {
    try {
      return (await this.deps.camera.count()) > 1;
    } catch {
      return false;
    }
  }

  /** Apaga la cámara en uso y enciende la otra. La anterior se apaga antes: el móvil no deja dos. */
  switchCamera(session: CameraSession): Promise<CameraSession> {
    session.stop();
    return this.deps.camera.start(oppositeFacing(session.facing));
  }

  async capture(session: CameraSession): Promise<ImportedPage> {
    const shot = await session.capture();
    this.count += 1;
    return {
      page: {
        id: `camera-${this.count}`,
        label: pageLabel('camera', this.count),
        sourceName: 'captura',
        size: shot.size,
      },
      bitmap: shot.bitmap,
      edits: NO_EDITS,
      autoCropped: false,
    };
  }
}
