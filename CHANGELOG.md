# Cambios

Formato: [Keep a Changelog](https://keepachangelog.com/es/1.1.0/). Versionado semántico.

## [1.0.0] · 2026-10-17

Primera versión pública. Reemplaza al script Python original (Pillow + PyMuPDF) por una aplicación
web sin backend.

### Añadido

- Importar PDF (una página editable por página; recorte automático a la imagen incrustada) e
  imágenes JPG/PNG/WebP (RF-01, RF-02).
- Captura con la cámara sin espejo para la foto sosteniendo el documento (RF-03).
- Girar, recortar y tapar zonas dibujando con el puntero o por franjas (RF-04, RF-05, RF-06).
- Marca de agua diagonal repetida con destinatario, finalidad y fecha; presets _Normal_ y _Suave_;
  ajuste fino (RF-07).
- Reducción de resolución y salida sin metadatos (RF-08); vista previa con el mismo pipeline que
  la exportación (RF-09).
- Descarga como JPG, ZIP o PDF (RF-10). Documento ficticio de ejemplo (RF-11). Interfaz en
  español e inglés (RF-12). Explicación de lo que la marca consigue y lo que no (RF-13).
- CSP estricta, heredada también por el worker de pdf.js, sin peticiones fuera del origen,
  verificada por un test e2e (RNF-01).
- Especificaciones, ADR, modelo de amenazas, CI y despliegue a GitHub Pages.
