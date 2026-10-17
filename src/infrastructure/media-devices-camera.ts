import { CameraError, type Camera, type CameraSession, type DecodedImage } from '../application';
import { context2d, createCanvas } from './fonts';

/**
 * Cámara del dispositivo vía `getUserMedia` (RF-03). La captura se toma del flujo tal cual,
 * sin espejo: el espejo es solo un efecto CSS de la vista previa.
 */
export class MediaDevicesCamera implements Camera {
  async start(): Promise<CameraSession> {
    if (typeof navigator === 'undefined' || !('mediaDevices' in navigator)) {
      throw new CameraError('unavailable', 'Este navegador no da acceso a la cámara.');
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
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
    return new Session(stream, video);
  }
}

class Session implements CameraSession {
  constructor(
    readonly stream: MediaStream,
    private readonly video: HTMLVideoElement,
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
