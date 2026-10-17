import {
  baseName,
  largestEmbeddedImage,
  pageLabel,
  type NormalizedRect,
  type Page,
  type PageEdits,
} from '../../domain';
import {
  ImportError,
  type Bitmap,
  type ImageDecoder,
  type PdfPageSource,
  type PdfReader,
} from '../ports';

export interface ImportedPage {
  readonly page: Page;
  readonly bitmap: Bitmap;
  readonly edits: PageEdits;
  /** `true` si el recorte inicial se propuso automáticamente (RF-01). */
  readonly autoCropped: boolean;
}

export interface ImportResult {
  readonly pages: ImportedPage[];
  readonly errors: ImportError[];
}

export const NO_EDITS: PageEdits = { rotation: 0, crop: null, masks: [] };

/** Una imagen que cubre casi toda la página no merece recorte (es un escaneo a página completa). */
const FULL_PAGE_AREA = 0.97;

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export function suggestedCrop(embeddedImages: readonly NormalizedRect[]): NormalizedRect | null {
  const largest = largestEmbeddedImage(embeddedImages);
  if (!largest) return null;
  if (largest.w * largest.h >= FULL_PAGE_AREA) return null;
  return largest;
}

/**
 * Importa PDFs e imágenes y los convierte en páginas editables (RF-01, RF-02).
 * Los errores no bloquean: cada archivo que falla se devuelve en `errors` con su motivo.
 */
export class ImportFiles {
  private nextId = 1;
  private photoCount = 0;

  constructor(
    private readonly deps: { readonly pdfReader: PdfReader; readonly imageDecoder: ImageDecoder },
  ) {}

  async run(files: readonly File[]): Promise<ImportResult> {
    const pages: ImportedPage[] = [];
    const errors: ImportError[] = [];
    for (const file of files) {
      try {
        pages.push(...(isPdf(file) ? await this.importPdf(file) : [await this.importImage(file)]));
      } catch (error) {
        errors.push(
          error instanceof ImportError
            ? error
            : new ImportError(
                'unknown',
                file.name,
                error instanceof Error ? error.message : undefined,
              ),
        );
      }
    }
    return { pages, errors };
  }

  private async importPdf(file: File): Promise<ImportedPage[]> {
    const sources = await this.deps.pdfReader.read(file);
    const sourceName = baseName(file.name);
    return sources.map((source, index) => this.pdfPage(source, sourceName, index + 1));
  }

  private pdfPage(source: PdfPageSource, sourceName: string, pageNumber: number): ImportedPage {
    const crop = suggestedCrop(source.embeddedImages);
    return {
      page: {
        id: this.id(),
        label: pageLabel('pdf', pageNumber),
        sourceName,
        size: source.size,
      },
      bitmap: source.bitmap,
      edits: { ...NO_EDITS, crop },
      autoCropped: crop !== null,
    };
  }

  private async importImage(file: File): Promise<ImportedPage> {
    const decoded = await this.deps.imageDecoder.decode(file);
    this.photoCount += 1;
    return {
      page: {
        id: this.id(),
        label: pageLabel('image', this.photoCount),
        sourceName: baseName(file.name),
        size: decoded.size,
      },
      bitmap: decoded.bitmap,
      edits: NO_EDITS,
      autoCropped: false,
    };
  }

  private id(): string {
    const id = `page-${this.nextId}`;
    this.nextId += 1;
    return id;
  }
}
