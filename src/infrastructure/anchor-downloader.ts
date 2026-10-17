import type { Downloader } from '../application';

/** Entrega un archivo al usuario con un enlace `download` efímero. */
export class AnchorDownloader implements Downloader {
  download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    // El navegador necesita un instante para iniciar la descarga antes de liberar la URL.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
