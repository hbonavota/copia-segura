import type { Size, WatermarkLayout, WatermarkStyle, WatermarkText } from './types';

/** Mide un texto a un tamaño de fuente dado. La infraestructura lo implementa con canvas. */
export type MeasureText = (text: string, fontPx: number) => Size;

/** Fecha en formato `dd/mm/aaaa`, el habitual en España y Argentina. */
export function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

/**
 * Compone el texto final de la marca (RF-07):
 * `<texto libre> <destinatario> · <finalidad> · <fecha>`, omitiendo las partes vacías.
 * Devuelve cadena vacía si no hay nada que escribir.
 */
export function composeWatermarkText(text: WatermarkText, today: Date | null): string {
  const head = [text.freeText, text.recipient]
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(' ');
  const parts = [head, text.purpose.trim()];
  if (text.includeDate && today) parts.push(formatDate(today));
  return parts.filter((s) => s.length > 0).join(' · ');
}

/** Grosor del borde blanco en función del tamaño de fuente. */
export function outlineWidth(fontPx: number): number {
  return Math.max(1, Math.round(fontPx / 18));
}

/**
 * Calcula el mosaico de repeticiones de la marca para una salida de `output` píxeles
 * (SPEC-0004, regla 4). Las posiciones son relativas al centro de la imagen, en el sistema de
 * coordenadas ya girado `angleDeg`; quien dibuja solo tiene que trasladar al centro, girar y
 * escribir el texto en cada posición.
 */
export function layoutWatermark(
  text: string,
  output: Size,
  style: WatermarkStyle,
  measure: MeasureText,
): WatermarkLayout | null {
  if (text.length === 0 || output.width <= 0 || output.height <= 0) return null;

  const fontPx = Math.max(10, Math.round((output.width * style.sizePct) / 100));
  const measured = measure(text, fontPx);
  const textWidth = Math.max(1, Math.ceil(measured.width));
  const textHeight = Math.max(1, Math.ceil(measured.height));

  // Lienzo cuadrado que sigue cubriendo la imagen después de girarlo.
  const canvasSide = Math.ceil(Math.hypot(output.width, output.height) * 1.1);
  const stepY = Math.max(1, Math.round(textHeight * style.spacing));
  const stepX = Math.max(1, textWidth + Math.floor(output.width / 10));
  const half = canvasSide / 2;

  const tiles: { x: number; y: number }[] = [];
  let row = 0;
  for (let y = -textHeight; y < canvasSide + textHeight; y += stepY, row += 1) {
    const offset = row % 2 === 1 ? Math.floor(stepX / 2) : 0;
    for (let x = -textWidth - offset; x < canvasSide + textWidth; x += stepX) {
      tiles.push({ x: x - half, y: y - half });
    }
  }

  return {
    text,
    fontPx,
    angleDeg: style.angleDeg,
    color: style.color,
    alpha: Math.min(1, Math.max(0, style.opacity / 100)),
    outlinePx: style.outline ? outlineWidth(fontPx) : 0,
    canvasSide,
    tiles,
  };
}
