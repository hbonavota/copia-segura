import {
  CameraError,
  resolveFacing,
  type Camera,
  type CameraFacing,
  type CameraSession,
  type DecodedImage,
} from '../application';
import { context2d, createCanvas } from './fonts';

/**
 * Cámara del dispositivo vía `getUserMedia` (RF-03, SPEC-0013). La captura se toma del flujo tal
 * cual, sin espejo: el espejo de la cámara frontal es solo un efecto CSS de la vista previa.
 */
export class MediaDevicesCamera implements Camera {
  async count(): Promise<number> {
    if (typeof navigator === 'undefined' || !('mediaDevices' in navigator)) return 0;
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'videoinput').length;
  }

  async start(facing: CameraFacing): Promise<CameraSession> {
    if (typeof navigator === 'undefined' || !('mediaDevices' in navigator)) {
      throw new CameraError('unavailable', 'Este navegador no da acceso a la cámara.');
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // `ideal`, no `exact`: si no hay cámara en esa dirección, el navegador da la que haya.
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
    } catch (error) {
      throw toCameraError(error);
    }
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    try {
      await video.play();
    } catch (error) {
      for (const track of stream.getTracks()) track.stop();
      throw toCameraError(error);
    }
    const reported = stream.getVideoTracks()[0]?.getSettings().facingMode;
    const cameras = await this.count().catch(() => 0);
    return new Session(stream, video, resolveFacing(reported, facing, cameras));
  }
}

class Session implements CameraSession {
  constructor(
    readonly stream: MediaStream,
    private readonly video: HTMLVideoElement,
    readonly facing: CameraFacing,
  ) {}

  async capture(): Promise<DecodedImage> {
    const width = this.video.videoWidth;
    const height = this.video.videoHeight;
    if (width === 0 || height === 0) {
      throw new CameraError('unknown', 'La cámara todavía no ha enviado ninguna imagen.');
    }
    const canvas = createCanvas(width, height);
    context2d(canvas).drawImage(this.video, 0, 0, width, height);
    const bitmap = await createImageBitmap(canvas);
    canvas.width = 0;
    canvas.height = 0;
    return { bitmap, size: { width, height } };
  }

  stop(): void {
    for (const track of this.stream.getTracks()) track.stop();
    this.video.pause();
    this.video.srcObject = null;
  }
}

function toCameraError(error: unknown): CameraError {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return new CameraError('denied', 'El navegador no ha dado permiso para usar la cámara.');
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotReadableError') {
    return new CameraError('unavailable', 'No hay ninguna cámara disponible.');
  }
  return new CameraError('unknown', error instanceof Error ? error.message : undefined);
}
