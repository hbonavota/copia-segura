# ADR-0004 · pdf.js para leer PDF y pdf-lib para escribirlo

**Estado:** Aceptada · **Fecha:** 2026-10-17

## Contexto

Hacen falta dos cosas distintas: rasterizar páginas de un PDF de entrada (y localizar sus imágenes
incrustadas) y generar un PDF de salida con las imágenes ya procesadas.

## Decisión

- **Lectura:** `pdfjs-dist` (Mozilla). Es el motor de Firefox, mantiene el soporte de PDFs raros y
  expone `getOperatorList`, que necesitamos para detectar imágenes incrustadas. Se carga en un chunk
  aparte, solo cuando el usuario importa un PDF, y su _worker_ se sirve desde nuestro propio origen.
- **Escritura:** `pdf-lib`. Pequeña, sin dependencias, suficiente para "una imagen JPEG por página".
  No necesitamos texto, fuentes ni formularios.
- **ZIP:** `jszip` para la descarga de varias páginas de una vez.

Alternativas descartadas: `pdfium` vía WebAssembly (más pesado, menos documentado en web);
escribir el PDF a mano (posible, un PDF con solo imágenes JPEG es trivial, pero pdf-lib nos da
validación y mantenimiento gratis).

## Consecuencias

- Tres dependencias de runtime, todas con licencia Apache-2.0 o MIT, todas empaquetadas: ningún
  recurso se carga de un CDN.
- pdf.js cambia su API con cierta frecuencia; el adaptador `PdfJsReader` es el único archivo que la
  conoce.
