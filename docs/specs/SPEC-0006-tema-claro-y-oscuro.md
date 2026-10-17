# SPEC-0006 · Tema claro y oscuro

**Estado:** Implementada · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0002, SPEC-0003

## Contexto

La interfaz ya seguía el tema del sistema (`prefers-color-scheme`), pero no había forma de elegirlo.
Hay quien tiene el sistema en oscuro y prefiere ver el documento sobre fondo claro (o al revés), y
quien comprueba la copia en un equipo ajeno cuya configuración no controla.

## RF-19 · Interruptor de tema

- Dado que el usuario no ha elegido tema, la página usa el del sistema y lo sigue si cambia
  mientras está abierta.
- Dado el interruptor de la cabecera, cuando se pulsa, entonces la página pasa al tema contrario
  al que se ve y lo recuerda en este navegador.
- Dado que el usuario elige el mismo tema que usa el sistema, entonces se olvida la preferencia y
  la página vuelve a seguir al sistema. Así un interruptor de dos estados cubre también el modo
  automático, sin un tercer botón.
- Dada una preferencia guardada, cuando se recarga la página, entonces se aplica antes del primer
  pintado (sin parpadeo).
- El interruptor es un `button` con `role="switch"` y `aria-checked` (encendido = modo oscuro),
  manejable con teclado y con su nombre traducido.
- Si el navegador no permite guardar (modo privado), el tema cambia igual; solo no se recuerda.

## Restricciones

- Sin `'unsafe-inline'` (ADR-0005): el script que aplica el tema antes de pintar es un archivo
  clásico del propio origen (`public/theme.js`), no un script en línea.
- Cada color se define una vez como par claro / oscuro con `light-dark()`; el tema elegido solo
  cambia `color-scheme`. Lo soportan las dos últimas versiones de los navegadores de RNF-03.
- No afecta a la exportación: la copia es idéntica con cualquier tema.

## Fuera de alcance

- Más temas (alto contraste, sepia). Si se piden, irán en una spec nueva.
