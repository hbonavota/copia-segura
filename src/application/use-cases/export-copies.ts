import { outputFileName, type Page, type PageEdits } from '../../domain';
import type { Archiver, Bitmap, Downloader, PdfWriter, Sharer } from '../ports';
import type { RenderPage, RenderSettings } from './render-page';

/** `share` entrega los JPG al menú de compartir del sistema en vez de descargarlos (RF-18). */
export type ExportFormat = 'jpg' | 'zip' | 'pdf' | 'share';

export interface ExportItem {
  readonly page: Page;
  readonly bitmap: Bitmap;
  readonly edits: PageEdits;
}

export interface ExportInput extends RenderSettings {
  readonly items: readonly ExportItem[];
  readonly format: ExportFormat;
}

export interface ExportSummary {
  /** Nombres de los archivos entregados al usuario. */
  readonly files: readonly string[];
}

/**
 * Nombres de archivo sin repetir: dos PDF con el mismo nombre producen `dni-p1`, `dni-p1-2`…
 * Sin esto, un ZIP perdería páginas en silencio.
 */
export function uniqueFileNames(names: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    if (count === 1) return name;
    const dot = name.lastIndexOf('.');
    return `${name.slice(0, dot)}-${count}${name.slice(dot)}`;
  });
}

/** Nombre común cuando todas las páginas vienen del mismo archivo; genérico si no. */
export function collectionName(items: readonly ExportItem[]): string {
  const names = new Set(items.map((i) => i.page.sourceName));
  const [only] = names;
  return names.size === 1 && only ? only : 'documentos';
}

/**
 * Exporta las copias (RF-10): un JPG por página, un ZIP con todos, o un PDF de varias páginas.
 * Cada página se dibuja con el mismo plan que la vista previa.
 */
export class ExportCopies {
  constructor(
    private readonly deps: {
      readonly renderPage: RenderPage;
      readonly pdfWriter: PdfWriter;
      readonly archiver: Archiver;
      readonly downloader: Downloader;
      readonly sharer?: Sharer;
    },
  ) {}

  /** ¿Se puede ofrecer "Compartir"? */
  canShare(): boolean {
    return this.deps.sharer?.available() ?? false;
  }

  async run(input: ExportInput): Promise<ExportSummary> {
    if (input.items.length === 0) return { files: [] };
    const rendered = await this.renderAll(input);
    switch (input.format) {
      case 'jpg':
        return this.deliverJpegs(rendered);
      case 'zip':
        return this.deliverZip(rendered, collectionName(input.items));
      case 'pdf':
        return this.deliverPdf(rendered, collectionName(input.items));
      case 'share':
        return this.deliverShare(rendered);
    }
  }

  private async renderAll(
    input: ExportInput,
  ): Promise<{ page: Page; jpeg: Blob; size: { width: number; height: number } }[]> {
    const results = [];
    for (const item of input.items) {
      const { raster, plan } = await this.deps.renderPage.run({
        page: item.page,
        edits: item.edits,
        bitmap: item.bitmap,
        style: input.style,
        text: input.text,
        output: input.output,
      });
      try {
        results.push({
          page: item.page,
          jpeg: await raster.toJpeg(plan.jpegQuality),
          size: raster.size,
        });
      } finally {
        raster.dispose();
      }
    }
    return results;
  }

  private jpegNames(rendered: readonly { page: Page }[]): string[] {
    return uniqueFileNames(
      rendered.map(({ page }) => outputFileName(page.sourceName, page.label, 'jpg')),
    );
  }

  private deliverJpegs(rendered: { page: Page; jpeg: Blob }[]): ExportSummary {
    const files = this.jpegNames(rendered);
    rendered.forEach(({ jpeg }, i) => {
      const name = files[i];
      if (name) this.deps.downloader.download(jpeg, name);
    });
    return { files };
  }

  private async deliverZip(
    rendered: { page: Page; jpeg: Blob }[],
    collection: string,
  ): Promise<ExportSummary> {
    const names = this.jpegNames(rendered);
    const entries = rendered.map(({ jpeg }, i) => ({
      name: names[i] ?? `pagina-${i + 1}.jpg`,
      blob: jpeg,
    }));
    const zip = await this.deps.archiver.zip(entries);
    const name = outputFileName(collection, null, 'zip');
    this.deps.downloader.download(zip, name);
    return { files: [name] };
  }

  private async deliverShare(rendered: { page: Page; jpeg: Blob }[]): Promise<ExportSummary> {
    const sharer = this.deps.sharer;
    if (!sharer?.available()) throw new Error('Este navegador no permite compartir archivos.');
    const names = this.jpegNames(rendered);
    const files = rendered.map(({ jpeg }, i) => ({
      name: names[i] ?? `pagina-${i + 1}.jpg`,
      blob: jpeg,
    }));
    const outcome = await sharer.share(files);
    return { files: outcome === 'shared' ? names : [] };
  }

  private async deliverPdf(
    rendered: { jpeg: Blob; size: { width: number; height: number } }[],
    collection: string,
  ): Promise<ExportSummary> {
    const pdf = await this.deps.pdfWriter.write(rendered);
    const name = outputFileName(collection, null, 'pdf');
    this.deps.downloader.download(pdf, name);
    return { files: [name] };
  }
}
