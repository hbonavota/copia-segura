import type { Archiver } from '../application';

/** ZIP sin compresión: los JPEG ya están comprimidos (RF-10). JSZip se carga bajo demanda. */
export class JsZipArchiver implements Archiver {
  async zip(files: readonly { readonly name: string; readonly blob: Blob }[]): Promise<Blob> {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    for (const { name, blob } of files) zip.file(name, blob);
    return zip.generateAsync({ type: 'blob', compression: 'STORE' });
  }
}
