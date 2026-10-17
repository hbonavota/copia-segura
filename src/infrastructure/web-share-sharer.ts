import type { Sharer } from '../application';

/** Menú de compartir del sistema con la Web Share API nivel 2 (RF-18). */
export class WebShareSharer implements Sharer {
  available(): boolean {
    if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false;
    const probe = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'probe.jpg', {
      type: 'image/jpeg',
    });
    return navigator.canShare({ files: [probe] });
  }

  async share(
    files: readonly { readonly name: string; readonly blob: Blob }[],
  ): Promise<'shared' | 'cancelled'> {
    const payload = files.map(({ name, blob }) => new File([blob], name, { type: blob.type }));
    try {
      await navigator.share({ files: payload });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      throw error;
    }
  }
}
