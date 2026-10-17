/**
 * Puertos: lo que la aplicación necesita del mundo exterior, como interfaces.
 * La infraestructura los implementa; los tests usan dobles.
 */
import type { CopyPlan, NormalizedRect, Size } from '../domain';

/**
 * Imagen decodificada, opaca para los casos de uso: solo la reciben de un puerto y se la pasan a
 * otro. En el navegador es un `ImageBitmap`; nunca se llama a sus métodos desde esta capa.
 */
export type Bitmap = ImageBitmap;

export interface DecodedImage {
  readonly bitmap: Bitmap;
  readonly size: Size;
}

export interface PdfPageSource extends DecodedImage {
  /** Rectángulos de las imágenes incrustadas en la página, normalizados a la página mostrada. */
  readonly embeddedImages: readonly NormalizedRect[];
}

export interface PdfReader {
  /** Rasteriza cada página. Lanza `ImportError` si el PDF está cifrado o dañado. */
  read(file: Blob): Promise<PdfPageSource[]>;
}

export interface ImageDecoder {
  /** Decodifica una imagen respetando la orientación EXIF. Lanza `ImportError` si no puede. */
  decode(file: Blob): Promise<DecodedImage>;
}

/** Resultado de dibujar un plan: píxeles listos para mostrar o codificar. */
export interface Raster {
  readonly size: Size;
  toJpeg(quality: number): Promise<Blob>;
  toBitmap(): Promise<Bitmap>;
  dispose(): void;
}

export interface Rasterizer {
  render(source: Bitmap, plan: CopyPlan): Promise<Raster>;
}

export interface TextMeasurer {
  measure(text: string, fontPx: number): Size;
}

export interface PdfWriter {
  write(pages: readonly { readonly jpeg: Blob; readonly size: Size }[]): Promise<Blob>;
}

export interface Archiver {
  zip(files: readonly { readonly name: string; readonly blob: Blob }[]): Promise<Blob>;
}

export interface Downloader {
  download(blob: Blob, fileName: string): void;
}

export interface CameraSession {
  /** Flujo de vídeo para la vista previa (la interfaz lo muestra en espejo). */
  readonly stream: MediaStream;
  /** Captura el fotograma actual tal cual lo ve la cámara: sin espejo (RF-03). */
  capture(): Promise<DecodedImage>;
  stop(): void;
}

export interface Camera {
  /** Lanza `CameraError` si no hay cámara o el usuario deniega el permiso. */
  start(): Promise<CameraSession>;
}

export interface Clock {
  today(): Date;
}

export type ImportErrorCode = 'encrypted' | 'corrupt' | 'unsupported' | 'unknown';

export class ImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    readonly fileName: string,
    message?: string,
  ) {
    super(message ?? `${fileName}: ${code}`);
    this.name = 'ImportError';
  }
}

export type CameraErrorCode = 'denied' | 'unavailable' | 'unknown';

export class CameraError extends Error {
  constructor(
    readonly code: CameraErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'CameraError';
  }
}
