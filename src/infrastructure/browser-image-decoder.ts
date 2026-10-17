import { ImportError, type DecodedImage, type ImageDecoder } from '../application';
import { context2d, createCanvas } from './fonts';

/** Lado mayor con el que se conserva una foto en memoria: la salida nunca supera los 2000 px. */
export const MAX_DECODED_SIDE = 2600;

/**
 * Decodifica imágenes con el navegador (RF-02). `createImageBitmap` respeta la orientación EXIF;
 * si falla (formato raro, navegador antiguo) se intenta con un `<img>`, que también la respeta.
 * En ninguno de los dos caminos sobreviven los metadatos: lo que sale es un bitmap. Una foto de
 * 48 Mpx ocuparía ~190 MB sin comprimir, así que se reduce de entrada a un tamaño razonable.
 */
export class BrowserImageDecoder implements ImageDecoder {
  constructor(private readonly maxSide = MAX_DECODED_SIDE) {}

  async decode(file: Blob): Promise<DecodedImage> {
    const name = file instanceof File ? file.name : 'imagen';
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      bitmap = await this.decodeWithElement(file, name);
    }
    const bounded = await this.bound(bitmap);
    return { bitmap: bounded, size: { width: bounded.width, height: bounded.height } };
  }

  private async bound(bitmap: ImageBitmap): Promise<ImageBitmap> {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= this.maxSide) return bitmap;
    const scale = this.maxSide / longest;
    const canvas = createCanvas(
      Math.round(bitmap.width * scale),
      Math.round(bitmap.height * scale),
    );
    const ctx = context2d(canvas);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const reduced = await createImageBitmap(canvas);
    canvas.width = 0;
    canvas.height = 0;
    return reduced;
  }

  private async decodeWithElement(file: Blob, name: string): Promise<ImageBitmap> {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      context2d(canvas).drawImage(img, 0, 0);
      const bitmap = await createImageBitmap(canvas);
      canvas.width = 0;
      canvas.height = 0;
      return bitmap;
    } catch {
      throw new ImportError(
        'unsupported',
        name,
        `El navegador no puede abrir ${name}. Conviértelo a JPG o PNG e inténtalo de nuevo.`,
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
