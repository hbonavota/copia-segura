import type { Size } from '../domain';
import type { PdfWriter } from '../application';

/** Resolución nominal del PDF: 1200 px de ancho → 20,3 cm, cómodo para imprimir o ver. */
const DPI = 150;
const pxToPt = (px: number): number => (px * 72) / DPI;

/**
 * Genera un PDF con una imagen JPEG por página (RF-10). Sin metadatos de la imagen original.
 * pdf-lib se carga bajo demanda: solo quien exporta a PDF lo descarga (RNF-02).
 */
export class PdfLibWriter implements PdfWriter {
  async write(pages: readonly { readonly jpeg: Blob; readonly size: Size }[]): Promise<Blob> {
    const { PDFDocument } = await import('pdf-lib');
    // Sin `updateMetadata: false`, pdf-lib pone su propio nombre como productor al crear el documento.
    const doc = await PDFDocument.create({ updateMetadata: false });
    const now = new Date();
    doc.setTitle('copia-segura');
    doc.setProducer('copia-segura');
    doc.setCreator('copia-segura');
    doc.setCreationDate(now);
    doc.setModificationDate(now);
    for (const { jpeg, size } of pages) {
      const image = await doc.embedJpg(await jpeg.arrayBuffer());
      const page = doc.addPage([pxToPt(size.width), pxToPt(size.height)]);
      page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    }
    const bytes = await doc.save();
    return new Blob([bytes as BlobPart], { type: 'application/pdf' });
  }
}
