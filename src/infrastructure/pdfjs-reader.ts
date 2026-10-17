import type * as PdfJsModule from 'pdfjs-dist/legacy/build/pdf.mjs';
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist/legacy/build/pdf.mjs';
import { embeddedImageRects, type Matrix, type NormalizedRect, type PdfOp } from '../domain';
import { ImportError, type PdfPageSource, type PdfReader } from '../application';

import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

type PdfJs = typeof PdfJsModule;

/**
 * El worker de pdf.js (donde se analiza el PDF) se arranca desde un `blob:` creado en la propia
 * página y no desde una URL: un worker cargado por URL recibe su política de seguridad de las
 * cabeceras de su respuesta (GitHub Pages no envía ninguna), mientras que un worker `blob:` hereda
 * la CSP del documento. Así `connect-src 'self'` también rige dentro del worker (ADR-0005).
 */
async function loadWorker(): Promise<Worker> {
  const response = await fetch(workerUrl);
  if (!response.ok) throw new Error(`No se pudo cargar el worker de pdf.js (${response.status}).`);
  const blobUrl = URL.createObjectURL(await response.blob());
  try {
    return new Worker(blobUrl, { type: 'module' });
  } finally {
    // El worker ya está creado; la URL solo servía para arrancarlo.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
  }
}

export interface PdfJsReaderOptions {
  /** Lado mayor, en píxeles, al que se rasteriza cada página. */
  readonly maxRenderSide: number;
  /** URL base (con barra final) donde se sirven `wasm/`, `standard_fonts/` e `iccs/` de pdf.js. */
  readonly assetsBaseUrl: string;
}

/**
 * Lee un PDF con pdf.js: rasteriza cada página y localiza sus imágenes incrustadas (RF-01).
 * pdf.js se importa de forma diferida: solo se descarga cuando el usuario abre un PDF (RNF-02).
 */
export class PdfJsReader implements PdfReader {
  private pdfjs: Promise<PdfJs> | null = null;

  constructor(private readonly options: PdfJsReaderOptions) {}

  async read(file: Blob): Promise<PdfPageSource[]> {
    const pdfjs = await this.library();
    const name = file instanceof File ? file.name : 'documento.pdf';
    const task = this.open(pdfjs, new Uint8Array(await file.arrayBuffer()));
    try {
      const doc = await this.load(pdfjs, task, name);
      const pages: PdfPageSource[] = [];
      for (let n = 1; n <= doc.numPages; n += 1) {
        const page = await doc.getPage(n);
        try {
          pages.push(await this.rasterize(pdfjs, page));
        } finally {
          page.cleanup();
        }
      }
      return pages;
    } finally {
      await task.destroy();
    }
  }

  private library(): Promise<PdfJs> {
    // Build "legacy": la build moderna de pdf.js usa APIs recién estandarizadas que las versiones
    // anteriores de los navegadores aún no tienen (RNF-03).
    this.pdfjs ??= Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), loadWorker()]).then(
      ([pdfjs, worker]) => {
        pdfjs.GlobalWorkerOptions.workerPort = worker;
        return pdfjs;
      },
    );
    return this.pdfjs;
  }

  private open(pdfjs: PdfJs, data: Uint8Array): PDFDocumentLoadingTask {
    const base = this.options.assetsBaseUrl;
    return pdfjs.getDocument({
      data,
      wasmUrl: `${base}wasm/`,
      standardFontDataUrl: `${base}standard_fonts/`,
      iccUrl: `${base}iccs/`,
    });
  }

  private async load(
    pdfjs: PdfJs,
    task: PDFDocumentLoadingTask,
    name: string,
  ): Promise<PDFDocumentProxy> {
    try {
      return await task.promise;
    } catch (error) {
      if (error instanceof pdfjs.PasswordException) {
        throw new ImportError('encrypted', name, 'El PDF está protegido con contraseña.');
      }
      if (error instanceof pdfjs.InvalidPDFException) {
        throw new ImportError('corrupt', name, 'El archivo no es un PDF válido.');
      }
      throw new ImportError('unknown', name, error instanceof Error ? error.message : undefined);
    }
  }

  private async rasterize(pdfjs: PdfJs, page: PDFPageProxy): Promise<PdfPageSource> {
    const base = page.getViewport({ scale: 1 });
    const scale = this.options.maxRenderSide / Math.max(base.width, base.height);
    const viewport = page.getViewport({ scale });
    const width = Math.round(viewport.width);
    const height = Math.round(viewport.height);

    // pdf.js dibuja sobre un <canvas> del DOM (no acepta OffscreenCanvas).
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    await page.render({ canvas, viewport }).promise;

    const transform: unknown = base.transform;
    if (!isMatrix(transform)) throw new ImportError('unknown', 'pdf', 'Viewport inválido.');
    const { embeddedImages, textGlyphs } = await this.analyse(pdfjs, page, transform, base);
    const bitmap = await createImageBitmap(canvas);
    canvas.width = 0;
    canvas.height = 0;
    return { bitmap, size: { width, height }, embeddedImages, textGlyphs };
  }

  /**
   * Recorre la lista de operadores de pdf.js una vez: posiciones de las imágenes (traducidas al
   * vocabulario mínimo del dominio) y número de glifos de texto. Límites conocidos:
   * las imágenes repetidas (`paintImageXObjectRepeat`) y las dibujadas dentro de anotaciones se
   * ignoran; anotaciones y grupos de transparencia solo cuentan como save/restore para que la
   * matriz de transformación siga cuadrando después de ellos. Para fotos de documentos
   * escaneadas o pegadas en una página es más que suficiente.
   */
  private async analyse(
    pdfjs: PdfJs,
    page: PDFPageProxy,
    transform: Matrix,
    size: { width: number; height: number },
  ): Promise<{ embeddedImages: NormalizedRect[]; textGlyphs: number }> {
    const { OPS } = pdfjs;
    const list = await page.getOperatorList();
    const ops: PdfOp[] = [];
    // Texto real de la página (RF-32): los operadores de texto llevan la lista de glifos.
    let textGlyphs = 0;
    list.fnArray.forEach((fn, i) => {
      const args = list.argsArray[i] as unknown[] | null;
      switch (fn) {
        case OPS.showText:
        case OPS.showSpacedText:
        case OPS.nextLineShowText:
        case OPS.nextLineSetSpacingShowText: {
          const glyphs = args?.find(Array.isArray);
          if (Array.isArray(glyphs))
            textGlyphs += glyphs.filter((g) => g !== null && typeof g === 'object').length;
          break;
        }
        case OPS.save:
          ops.push({ kind: 'save' });
          break;
        case OPS.restore:
          ops.push({ kind: 'restore' });
          break;
        case OPS.transform:
          if (isMatrix(args)) ops.push({ kind: 'transform', matrix: args });
          break;
        case OPS.paintFormXObjectBegin: {
          const matrix = args?.[0];
          ops.push({ kind: 'formBegin', matrix: isMatrix(matrix) ? matrix : null });
          break;
        }
        case OPS.paintFormXObjectEnd:
          ops.push({ kind: 'formEnd' });
          break;
        case OPS.beginAnnotation:
        case OPS.beginGroup:
          ops.push({ kind: 'save' });
          break;
        case OPS.endAnnotation:
        case OPS.endGroup:
          ops.push({ kind: 'restore' });
          break;
        case OPS.paintImageXObject:
        case OPS.paintInlineImageXObject:
        case OPS.paintImageMaskXObject:
          ops.push({ kind: 'image' });
          break;
        default:
          break;
      }
    });
    return { embeddedImages: embeddedImageRects(ops, { transform, size }), textGlyphs };
  }
}

function isMatrix(value: unknown): value is Matrix {
  return Array.isArray(value) && value.length === 6 && value.every((v) => typeof v === 'number');
}
