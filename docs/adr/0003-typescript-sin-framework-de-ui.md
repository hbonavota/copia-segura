# ADR-0003 · TypeScript estricto y DOM directo, sin framework de interfaz

**Estado:** Aceptada · **Fecha:** 2026-10-17

## Contexto

La interfaz tiene una sola pantalla: zona de carga, tira de miniaturas, editor con lienzo, panel de
ajustes y barra de exportación. React o Preact la resolverían con comodidad, pero añaden un runtime,
un modelo mental y dependencias que después hay que justificar en una herramienta cuyo argumento
principal es "mira el código, cabe en una tarde".

## Decisión

TypeScript `strict` con Vite como empaquetador, y la interfaz escrita contra el DOM con un pequeño
almacén de estado observable propio (`ui/store.ts`: `get`, `update`, `select`, más las acciones).
Sin React, Preact, Lit ni librerías de componentes.

## Consecuencias

- Bundle de la interfaz muy pequeño y sin runtime de terceros; la única dependencia pesada es
  pdf.js, cargada bajo demanda.
- Los componentes son funciones `mount(el, store, deps)`; la reactividad es explícita (`store.subscribe`).
  Menos magia, algo más de código a mano.
- Si la interfaz creciera (varias pantallas, formularios complejos), esta decisión se revisaría: el
  ADR se sustituiría y solo cambiaría la capa `ui/`, porque la lógica está en `domain` y `application`.
