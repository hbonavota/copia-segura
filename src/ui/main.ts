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
import { listenForInstall } from './install';
import { createStore, initialState } from './store';
// Inter alojada en el propio origen (RF-20): Vite la sirve como un recurso más del build.
import '@fontsource-variable/inter/wght.css';
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
const store = createStore(initialState(locale));
mountApp(root, store, deps);

// App instalable y sin conexión (SPEC-0012, ADR-0007). Solo en el build publicado: en desarrollo
// un service worker serviría archivos viejos. Se registra tras la carga para no competir con ella.
listenForInstall();
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // Sin service worker la app funciona igual; solo no se instala ni va sin conexión.
    });
  });
  // Con el primer documento abierto, el resto de la app se guarda en segundo plano para que
  // abrir PDF y exportar también funcionen sin conexión (RF-36).
  const stopWarmUp = store.select(
    (s) => s.pages.length > 0,
    (opened) => {
      if (!opened) return;
      stopWarmUp();
      void navigator.serviceWorker.ready.then((registration) =>
        registration.active?.postMessage({ type: 'warm-up' }),
      );
    },
  );
}
