import {
  composeWatermarkText,
  planCopy,
  type CopyPlan,
  type OutputOptions,
  type Page,
  type PageEdits,
  type WatermarkStyle,
  type WatermarkText,
} from '../../domain';
import type { Bitmap, Clock, Raster, Rasterizer, TextMeasurer } from '../ports';

export interface Rendered {
  readonly raster: Raster;
  readonly plan: CopyPlan;
}

export interface RenderSettings {
  readonly style: WatermarkStyle;
  readonly text: WatermarkText;
  readonly output: OutputOptions;
}

export interface RenderInput extends RenderSettings {
  readonly page: Page;
  readonly edits: PageEdits;
}

/**
 * Produce la copia de una página: compone el texto, calcula el plan (dominio) y lo dibuja
 * (infraestructura). La vista previa y la exportación pasan por aquí, así que ven lo mismo (RF-09).
 */
export class RenderPage {
  constructor(
    private readonly deps: {
      readonly rasterizer: Rasterizer;
      readonly measurer: TextMeasurer;
      readonly clock: Clock;
    },
  ) {}

  watermarkText(text: WatermarkText): string {
    return composeWatermarkText(text, text.includeDate ? this.deps.clock.today() : null);
  }

  plan(input: RenderInput): CopyPlan {
    return planCopy({
      page: input.page,
      edits: input.edits,
      style: input.style,
      text: this.watermarkText(input.text),
      output: input.output,
      measure: (text, fontPx) => this.deps.measurer.measure(text, fontPx),
    });
  }

  async run(input: RenderInput & { readonly bitmap: Bitmap }): Promise<Rendered> {
    const plan = this.plan(input);
    return { raster: await this.deps.rasterizer.render(input.bitmap, plan), plan };
  }
}
