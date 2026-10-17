import type { Size } from '../domain';
import type { TextMeasurer } from '../application';
import { context2d, createCanvas, watermarkFont } from './fonts';

/** Mide texto con la misma fuente con la que después se dibuja la marca. */
export class CanvasTextMeasurer implements TextMeasurer {
  private readonly ctx = context2d(createCanvas(1, 1));

  measure(text: string, fontPx: number): Size {
    this.ctx.font = watermarkFont(fontPx);
    const metrics = this.ctx.measureText(text);
    const emBox = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    return {
      width: metrics.width,
      // Con `textBaseline = 'top'` el texto ocupa la caja de la fuente, no solo los glifos.
      height: Number.isFinite(emBox) && emBox > 0 ? emBox : fontPx * 1.2,
    };
  }
}
