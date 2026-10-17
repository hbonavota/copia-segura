import { pageLabel } from '../../domain';
import type { Camera, CameraSession } from '../ports';
import { NO_EDITS, type ImportedPage } from './import-files';

/**
 * Captura una foto con la cámara del dispositivo (RF-03). La sesión la abre y cierra la interfaz
 * (necesita mostrar la vista previa); aquí se convierte el fotograma capturado en una página.
 */
export class CaptureFromCamera {
  private count = 0;

  constructor(private readonly deps: { readonly camera: Camera }) {}

  start(): Promise<CameraSession> {
    return this.deps.camera.start();
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
