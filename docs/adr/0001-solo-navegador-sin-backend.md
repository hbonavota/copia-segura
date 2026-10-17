# ADR-0001 · Procesado íntegro en el navegador, sin backend

**Estado:** Aceptada · **Fecha:** 2026-10-17

## Contexto

La primera versión de la herramienta era un script Python (Pillow + PyMuPDF) que se ejecutaba en
local. Para que cualquiera pueda usarla sin instalar nada, había dos caminos: un servidor (local o
remoto) con interfaz web, o una aplicación que corra entera en el navegador.

## Decisión

Toda la lógica corre en el navegador. No existe backend ni en producción ni en desarrollo: `npm start`
solo sirve archivos estáticos.

## Consecuencias

- La promesa "el documento no sale de tu dispositivo" es verificable por cualquiera (pestaña _Red_,
  CSP en el HTML, código abierto) y no depende de confiar en quien aloja la página.
- Distribución gratuita e inmutable en GitHub Pages. Con fotos funciona sin conexión una vez
  cargada; pdf.js, pdf-lib y JSZip se descargan del propio origen la primera vez que hacen falta.
- Perdemos PyMuPDF: la extracción de imágenes incrustadas se reimplementa sobre la lista de
  operadores de pdf.js (ver SPEC-0004). Es más código, pero es código nuestro y probado.
- Los formatos de imagen dependen del decodificador del navegador (HEIC solo en Safari). Aceptado y
  comunicado al usuario.
- El script Python original queda fuera del repositorio para no mantener dos motores.
