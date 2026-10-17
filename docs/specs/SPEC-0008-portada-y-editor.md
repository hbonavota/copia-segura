# SPEC-0008 · Portada y editor de dos paneles

**Estado:** Implementada · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0002, SPEC-0005, SPEC-0007

## Contexto

Con tres columnas (páginas, documento, ajustes) el documento ocupa un tercio de la pantalla y el
panel de ajustes aparece entero antes de que haya nada que ajustar. Un asistente de pasos tampoco
encaja: con dos o tres ajustes, obligar a avanzar página a página solo añade clics.

## RF-24 · Dos estados: portada y editor

- **Portada** (sin páginas): titular, zona de carga y demo (RF-14). No se muestran controles de la
  marca.
- **Editor** (con páginas): el documento a la izquierda, ocupando la mayor parte del ancho, con la
  tira de páginas debajo; a la derecha un único panel de ajustes con secciones _Marca de agua_,
  _Tapar datos_ y _Salida_.
- Un indicador de pasos _Subir → Ajustar → Descargar_ orienta sin bloquear: marca el paso actual
  (`aria-current="step"`) y los completados.
- El cambio de estado usa _View Transitions_ cuando el navegador la soporta y el usuario no ha
  pedido reducir movimiento; si no, es instantáneo.

## RF-25 · Descargar siempre a mano

- En escritorio el botón principal de descarga queda fijo al pie del panel de ajustes, visible
  aunque se desplace el panel. Las demás salidas (PDF, ZIP, Compartir) van como secundarias.
- En pantallas estrechas se mantiene RF-18: editor primero y barra de descarga fija abajo.

## RF-26 · Sugerencias y frente / dorso

- Bajo _¿Para qué trámite?_ se ofrecen sugerencias de un toque (_apertura de cuenta_, _contrato
  de alquiler_, _alta de línea_, _verificación de identidad_, _proceso de selección_). Pulsar una
  rellena la finalidad; se puede editar después.
- Con una sola página cargada, la tira muestra un hueco _Añadir el dorso_ que abre el selector de
  archivos. Desaparece al haber dos o más páginas.

## RF-27 · Zonas editables

- Con la herramienta _Tapar_, las zonas existentes se ven con su contorno sobre la vista previa.
- Dada una zona, cuando se pulsa, queda seleccionada; arrastrándola se mueve y con el tirador de
  su esquina se cambia el tamaño. Nunca sale de la página.
- Dada una zona seleccionada, `Supr` o `Retroceso` la quitan, las flechas la mueven (con
  `Mayús`, más rápido) y `Esc` deja de seleccionarla. Cada zona es enfocable con el tabulador.
- Pulsar fuera de las zonas dibuja una nueva, como hasta ahora (RF-06).

## Fuera de alcance

- Ranuras fijas para frente y dorso: la tira de páginas ya admite cualquier número de caras y el
  hueco de RF-26 cubre el caso habitual.
