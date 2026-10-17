/**
 * Raíz de composición (ADR-0002): el único sitio que conoce a la vez los adaptadores de
 * infraestructura y los casos de uso. Todo lo demás recibe lo que necesita por parámetro.
 */
import { CaptureFromCamera, ExportCopies, ImportFiles, RenderPage } from '../application';
import {
  AnchorDownloader,
  BrowserImageDecoder,
  CanvasRasterizer,
  CanvasTextMeasurer,
  JsZipArchiver,
  MediaDevicesCamera,
  PdfJsReader,
  PdfLibWriter,
  SystemClock,
  WebShareSharer,
} from '../infrastructure';
import { mountApp, savedLocale } from './app';
import { detectLocale, type Locale } from './i18n';
import { createStore, initialState } from './store';
import './styles.css';

const base = import.meta.env.BASE_URL;
// Absoluta: el worker de pdf.js arranca desde un blob: y no puede resolver rutas relativas.
const pdfjsAssets = new URL(`${base}pdfjs/`, window.location.href).href;
const REPOSITORY = 'https://github.com/hbonavota/copia-segura';

const renderPage = new RenderPage({
  rasterizer: new CanvasRasterizer(),
  measurer: new CanvasTextMeasurer(),
  clock: new SystemClock(),
});

const imageDecoder = new BrowserImageDecoder();

const deps = {
  importFiles: new ImportFiles({
    pdfReader: new PdfJsReader({ maxRenderSide: 2600, assetsBaseUrl: pdfjsAssets }),
    imageDecoder,
  }),
  decodeImage: (blob: Blob) => imageDecoder.decode(blob),
  demoImageUrl: `${base}ejemplo/tarjeta-ficticia.jpg`,
  renderPage,
  exportCopies: new ExportCopies({
    renderPage,
    pdfWriter: new PdfLibWriter(),
    archiver: new JsZipArchiver(),
    downloader: new AnchorDownloader(),
    sharer: new WebShareSharer(),
  }),
  capture: new CaptureFromCamera({ camera: new MediaDevicesCamera() }),
  exampleUrl: `${base}ejemplo/documento-ficticio.pdf`,
  links: { source: REPOSITORY, docs: `${REPOSITORY}/blob/main/docs/arquitectura.md` },
};

const saved = savedLocale();
const locale: Locale = saved === 'es' || saved === 'en' ? saved : detectLocale(navigator.languages);
const root = document.getElementById('app');
if (!root) throw new Error('Falta el elemento #app en index.html');
mountApp(root, createStore(initialState(locale)), deps);
