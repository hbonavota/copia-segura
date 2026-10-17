import { fitScale, intersect, roundOutward, rotatedSize, toPixels } from './geometry';
import type { CopyPlan, OutputOptions, Page, PageEdits, PixelRect, WatermarkStyle } from './types';
import { layoutWatermark, type MeasureText } from './watermark';

export interface PlanInput {
  readonly page: Page;
  readonly edits: PageEdits;
  readonly style: WatermarkStyle;
  /** Texto ya compuesto (ver `composeWatermarkText`); vacío = sin marca. */
  readonly text: string;
  readonly output: OutputOptions;
  readonly measure: MeasureText;
}

/**
 * Combina página, ediciones, estilo y opciones en un plan de dibujo determinista (SPEC-0004).
 * Orden del pipeline: origen → giro → recorte → escala → máscaras → marca.
 */
export function planCopy(input: PlanInput): CopyPlan {
  const { page, edits, style, text, output, measure } = input;
  const rotated = rotatedSize(page.size, edits.rotation);

  const fullFrame: PixelRect = { x: 0, y: 0, w: rotated.width, h: rotated.height };
  const cropPx = edits.crop ? roundOutward(toPixels(edits.crop, rotated)) : fullFrame;
  const safeCrop = intersect(cropPx, fullFrame) ?? fullFrame;

  const maxSide = Math.max(200, Math.floor(output.maxSide));
  const scale = fitScale({ width: safeCrop.w, height: safeCrop.h }, maxSide);
  const outputSize = {
    width: Math.max(1, Math.round(safeCrop.w * scale)),
    height: Math.max(1, Math.round(safeCrop.h * scale)),
  };

  const masksPx = edits.masks.flatMap((mask) => {
    const inFrame = intersect(toPixels(mask, rotated), safeCrop);
    if (!inFrame) return [];
    return [
      roundOutward({
        x: (inFrame.x - safeCrop.x) * scale,
        y: (inFrame.y - safeCrop.y) * scale,
        w: inFrame.w * scale,
        h: inFrame.h * scale,
      }),
    ];
  });

  return {
    source: page.size,
    rotation: edits.rotation,
    rotated,
    cropPx: safeCrop,
    scale,
    output: outputSize,
    masksPx,
    watermark: layoutWatermark(text, outputSize, style, measure),
    jpegQuality: Math.min(1, Math.max(0.3, output.jpegQuality)),
  };
}
