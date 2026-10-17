import type { NormalizedRect, PageEdits } from './types';

/**
 * Plantillas de zonas a tapar (RF-16). Las posiciones son relativas a la tarjeta (0–1) y
 * aproximadas: proponen un punto de partida que el usuario revisa y ajusta.
 */
export type TemplateId = 'dni-es-frente' | 'dni-es-dorso' | 'dni-ar-frente' | 'dni-ar-dorso';

export interface TemplateZone {
  /** Qué tapa la zona; la interfaz lo traduce. */
  readonly field: 'can' | 'soporte' | 'firma' | 'mrz' | 'domicilio' | 'tramite' | 'codigo-barras';
  readonly rect: NormalizedRect;
}

export const MASK_TEMPLATES: Readonly<Record<TemplateId, readonly TemplateZone[]>> = {
  // DNI 4.0 (España), frente: número de soporte, firma y CAN (abajo a la derecha).
  'dni-es-frente': [
    { field: 'soporte', rect: { x: 0.38, y: 0.68, w: 0.34, h: 0.1 } },
    { field: 'firma', rect: { x: 0.36, y: 0.79, w: 0.42, h: 0.17 } },
    { field: 'can', rect: { x: 0.78, y: 0.78, w: 0.2, h: 0.14 } },
  ],
  // Dorso: domicilio (parte superior) y zona de lectura mecánica (tercio inferior).
  'dni-es-dorso': [
    { field: 'domicilio', rect: { x: 0.03, y: 0.06, w: 0.62, h: 0.3 } },
    { field: 'mrz', rect: { x: 0, y: 0.66, w: 1, h: 0.34 } },
  ],
  // DNI tarjeta (Argentina), frente: número de trámite y código de barras en la franja inferior.
  'dni-ar-frente': [
    { field: 'tramite', rect: { x: 0.02, y: 0.8, w: 0.5, h: 0.17 } },
    { field: 'codigo-barras', rect: { x: 0.52, y: 0.76, w: 0.46, h: 0.22 } },
  ],
  // Dorso: domicilio y zona de lectura mecánica.
  'dni-ar-dorso': [
    { field: 'domicilio', rect: { x: 0.03, y: 0.05, w: 0.7, h: 0.28 } },
    { field: 'mrz', rect: { x: 0, y: 0.66, w: 1, h: 0.34 } },
  ],
};

export const TEMPLATE_IDS = Object.keys(MASK_TEMPLATES) as TemplateId[];

/**
 * Lleva las zonas de la plantilla al marco de página: si hay recorte se asume que es la tarjeta;
 * si no, la tarjeta ocupa la página entera.
 */
export function templateMasks(id: TemplateId, edits: PageEdits): NormalizedRect[] {
  const card = edits.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  return MASK_TEMPLATES[id].map(({ rect }) => ({
    x: card.x + rect.x * card.w,
    y: card.y + rect.y * card.h,
    w: rect.w * card.w,
    h: rect.h * card.h,
  }));
}
