# Cambios

Formato: [Keep a Changelog](https://keepachangelog.com/es/1.1.0/). Versionado semántico.

## [1.1.1] · 2026-10-17

Revisión técnica del repositorio antes de enseñarlo.

### Corregido

- Textos de privacidad más precisos: la CSP impide peticiones y recursos de otros dominios, no la
  navegación, y el hosting ve la IP al cargar la página. Documentado en ADR-0005 y en el modelo de
  amenazas.
- El despliegue publica exactamente el commit que validó CI y solo tras un push a `main`; los
  permisos de Pages, solo en el job que publica.
- Versión de Node real (22.13+) en `engines` y en la documentación.
- Demo de la portada: una sola carga aunque se pulsen varias pestañas, sin fugas al desmontar y sin
  errores visibles si falla.
- Las plantillas no duplican zonas si se aplican dos veces.
- Errores de exportación y de compartir traducidos; en iOS, aviso para volver a pulsar _Compartir_.
- Ejemplos neutros (sin marcas reales) en la interfaz, los tests y las capturas.

### Añadido

- Test e2e que comprueba que la CSP bloquea de verdad una petición a otro dominio.
- Los e2e corren bajo `/copia-segura/`, igual que en GitHub Pages.
- Acciones de GitHub actualizadas (checkout, setup-node, upload-artifact v7; configure-pages v6;
  upload-pages-artifact v5).
- Insignias de CI, Pages y licencia, captura móvil y estructura del repo en el README en inglés.

## [1.1.0] · 2026-10-17

SPEC-0005: lo que hace distinta a la herramienta, a la vista.

### Añadido

- Demo en la portada: la tarjeta ficticia procesada en vivo, con pestañas Original / Tapado /
  Marca / B/N (RF-14).
- Copia en blanco y negro con la marca en color (RF-15).
- Plantillas de zonas típicas para el DNI de España y de Argentina, frente y dorso (RF-16).
- Apartados _Compruébalo tú_ y _Qué la hace distinta_ en la interfaz y en el README (RF-17).
- Móvil primero: editor delante, barra de exportación fija y botón _Compartir_ con el menú nativo
  (RF-18).

### Corregido

- El atributo `hidden` no ocultaba elementos con `display` propio (la portada seguía visible en
  móvil tras cargar un documento).

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
