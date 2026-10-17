/**
 * Tipos del dominio (SPEC-0004). Puros: no conocen el DOM ni ningún formato de archivo.
 */

/** Giro de la página en grados, sentido horario. */
export type Rotation = 0 | 90 | 180 | 270;

export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Rectángulo en coordenadas normalizadas [0, 1] del marco de página
 * (la página ya girada, sin recortar). Siempre con `w` y `h` positivos.
 */
export interface NormalizedRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Rectángulo en píxeles. */
export interface PixelRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Una imagen de origen: página de un PDF, foto o captura de cámara. */
export interface Page {
  readonly id: string;
  /** Etiqueta corta y única dentro del proyecto: `p1`, `foto-2`, `camara-1`. */
  readonly label: string;
  /** Nombre base del archivo de origen, sin extensión. */
  readonly sourceName: string;
  /** Tamaño en píxeles del bitmap de origen, sin girar. */
  readonly size: Size;
}

/** Lo que el usuario ha hecho a una página. Rectángulos en el marco de página. */
export interface PageEdits {
  readonly rotation: Rotation;
  readonly crop: NormalizedRect | null;
  readonly masks: readonly NormalizedRect[];
}

export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** Parámetros visuales de la marca de agua (RF-07). */
export interface WatermarkStyle {
  /** 0–100 */
  readonly opacity: number;
  /** Alto del texto como porcentaje del ancho de salida. */
  readonly sizePct: number;
  /** Separación entre filas, en altos de texto. */
  readonly spacing: number;
  /** Ángulo del texto en grados; positivo = asciende hacia la derecha. */
  readonly angleDeg: number;
  readonly color: RGB;
  /** Borde blanco alrededor del texto, para fondos oscuros. */
  readonly outline: boolean;
}

export type PresetName = 'normal' | 'suave';

/** Piezas con las que se compone el texto de la marca (RF-07). */
export interface WatermarkText {
  readonly freeText: string;
  readonly recipient: string;
  readonly purpose: string;
  readonly includeDate: boolean;
}

export interface OutputOptions {
  /** Lado máximo en píxeles. La imagen nunca se amplía. */
  readonly maxSide: number;
  /** Calidad JPEG, 0–1. */
  readonly jpegQuality: number;
}

/** Mosaico de la marca ya calculado para un tamaño de salida concreto. */
export interface WatermarkLayout {
  readonly text: string;
  readonly fontPx: number;
  readonly angleDeg: number;
  readonly color: RGB;
  /** 0–1 */
  readonly alpha: number;
  readonly outlinePx: number;
  /** Lado del lienzo girado sobre el que se reparten las repeticiones. */
  readonly canvasSide: number;
  /** Posiciones (esquina superior izquierda de cada repetición) relativas al centro de la imagen. */
  readonly tiles: readonly { readonly x: number; readonly y: number }[];
}

/**
 * Plan de dibujo determinista: todo lo que hace falta para producir la copia, sin píxeles.
 * Lo ejecuta la capa de infraestructura (canvas).
 */
export interface CopyPlan {
  readonly source: Size;
  readonly rotation: Rotation;
  /** Tamaño del marco de página (origen girado). */
  readonly rotated: Size;
  /** Zona del marco de página que se conserva, en píxeles del marco. */
  readonly cropPx: PixelRect;
  /** Factor de escala de píxeles del marco a píxeles de salida (≤ 1). */
  readonly scale: number;
  readonly output: Size;
  /** Máscaras en píxeles de salida, ya recortadas a la zona conservada. */
  readonly masksPx: readonly PixelRect[];
  readonly watermark: WatermarkLayout | null;
  readonly jpegQuality: number;
}
