/** Dobles de los puertos para probar los casos de uso sin navegador. */
import type { CopyPlan, Size } from '../../src/domain';
import type {
  Archiver,
  Bitmap,
  Camera,
  CameraSession,
  Clock,
  DecodedImage,
  Downloader,
  ImageDecoder,
  PdfPageSource,
  PdfReader,
  PdfWriter,
  Raster,
  Rasterizer,
  Sharer,
  TextMeasurer,
} from '../../src/application';

export const fakeBitmap = (size: Size): Bitmap => ({
  width: size.width,
  height: size.height,
  close: () => undefined,
});

export const decoded = (width: number, height: number): DecodedImage => ({
  bitmap: fakeBitmap({ width, height }),
  size: { width, height },
});

export const pdfPage = (
  width: number,
  height: number,
  embeddedImages: PdfPageSource['embeddedImages'] = [],
  textGlyphs = 0,
): PdfPageSource => ({ ...decoded(width, height), embeddedImages, textGlyphs });

export const file = (name: string, type: string): File => new File(['x'], name, { type });

export class FakePdfReader implements PdfReader {
  constructor(private readonly pages: PdfPageSource[] | Error) {}
  read(): Promise<PdfPageSource[]> {
    return this.pages instanceof Error ? Promise.reject(this.pages) : Promise.resolve(this.pages);
  }
}

export class FakeImageDecoder implements ImageDecoder {
  constructor(private readonly result: DecodedImage | Error) {}
  decode(): Promise<DecodedImage> {
    return this.result instanceof Error
      ? Promise.reject(this.result)
      : Promise.resolve(this.result);
  }
}

export const fakeMeasurer: TextMeasurer = {
  measure: (text, fontPx) => ({ width: text.length * fontPx * 0.6, height: fontPx * 1.2 }),
};

export const fixedClock = (date: Date): Clock => ({ today: () => date });

export class FakeRaster implements Raster {
  disposed = false;
  constructor(
    readonly size: Size,
    readonly plan: CopyPlan,
  ) {}
  toJpeg(quality: number): Promise<Blob> {
    return Promise.resolve(new Blob([`jpeg@${quality}`], { type: 'image/jpeg' }));
  }
  toBitmap(): Promise<Bitmap> {
    return Promise.resolve(fakeBitmap(this.size));
  }
  dispose(): void {
    this.disposed = true;
  }
}

export class FakeRasterizer implements Rasterizer {
  readonly rasters: FakeRaster[] = [];
  render(_source: Bitmap, plan: CopyPlan): Promise<Raster> {
    const raster = new FakeRaster(plan.output, plan);
    this.rasters.push(raster);
    return Promise.resolve(raster);
  }
}

export class FakePdfWriter implements PdfWriter {
  pages: { jpeg: Blob; size: Size }[] = [];
  write(pages: readonly { jpeg: Blob; size: Size }[]): Promise<Blob> {
    this.pages = [...pages];
    return Promise.resolve(new Blob(['%PDF-fake'], { type: 'application/pdf' }));
  }
}

export class FakeArchiver implements Archiver {
  entries: { name: string; blob: Blob }[] = [];
  zip(files: readonly { name: string; blob: Blob }[]): Promise<Blob> {
    this.entries = [...files];
    return Promise.resolve(new Blob(['PK-fake'], { type: 'application/zip' }));
  }
}

export class FakeDownloader implements Downloader {
  downloads: { blob: Blob; fileName: string }[] = [];
  download(blob: Blob, fileName: string): void {
    this.downloads.push({ blob, fileName });
  }
}

export class FakeCameraSession implements CameraSession {
  stopped = false;
  readonly stream: MediaStream = {} as MediaStream;
  constructor(private readonly shot: DecodedImage) {}
  capture(): Promise<DecodedImage> {
    return Promise.resolve(this.shot);
  }
  stop(): void {
    this.stopped = true;
  }
}

export class FakeCamera implements Camera {
  constructor(private readonly session: CameraSession | Error) {}
  start(): Promise<CameraSession> {
    return this.session instanceof Error
      ? Promise.reject(this.session)
      : Promise.resolve(this.session);
  }
}

export class FakeSharer implements Sharer {
  shared: { name: string; blob: Blob }[] = [];
  constructor(
    private readonly isAvailable = true,
    private readonly outcome: 'shared' | 'cancelled' = 'shared',
  ) {}
  available(): boolean {
    return this.isAvailable;
  }
  share(files: readonly { name: string; blob: Blob }[]): Promise<'shared' | 'cancelled'> {
    this.shared = [...files];
    return Promise.resolve(this.outcome);
  }
}
