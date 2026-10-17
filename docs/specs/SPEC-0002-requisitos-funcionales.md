# SPEC-0002 · Requisitos funcionales

**Estado:** Implementada · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0001

Cada requisito lleva criterios de aceptación en formato _Dado / Cuando / Entonces_. Los tests
unitarios y e2e citan el identificador del requisito que cubren.

## RF-01 · Importar un PDF

El usuario puede abrir un PDF y obtener una página editable por cada página del documento.

- Dado un PDF de N páginas, cuando se importa, entonces aparecen N páginas etiquetadas `p1…pN`.
- Dado un PDF con contraseña, cuando se importa, entonces se informa del motivo y no se añade nada.
- Dado un PDF en el que una página contiene una imagen grande (≥ 5 % del área de la página, p. ej. un
  DNI fotografiado dentro de un A4), cuando se importa, entonces la página se recorta automáticamente
  a esa imagen y el usuario puede deshacer el recorte.
- Dado un PDF con páginas rotadas (`/Rotate`), cuando se importa, entonces cada página se muestra
  como la mostraría un visor de PDF.

## RF-02 · Importar imágenes

El usuario puede abrir una o varias imágenes (JPEG, PNG, WebP; HEIC solo si el navegador lo decodifica).

- Dada una foto JPEG con orientación EXIF, cuando se importa, entonces se muestra con la orientación
  corregida.
- Dadas tres imágenes seleccionadas a la vez, cuando se importan, entonces aparecen tres páginas en el
  orden de selección.
- Dado un archivo que el navegador no puede decodificar, cuando se importa, entonces se muestra un
  mensaje que explica qué formato es y cómo convertirlo, sin bloquear el resto.

## RF-03 · Capturar con la cámara

El usuario puede hacerse una foto sosteniendo el documento desde la propia aplicación.

- Dado que el navegador concede acceso a la cámara, cuando se abre la captura, entonces la vista
  previa se muestra en espejo (para encuadrar) y la foto capturada **no** está en espejo (el texto del
  documento se lee del derecho).
- Dado que el usuario cierra la captura, cuando se cierra, entonces la cámara se apaga (todas las
  pistas detenidas).
- Dado que el navegador deniega el acceso, cuando se intenta capturar, entonces se explica cómo
  conceder el permiso o usar una foto del disco.

## RF-04 · Girar

- Dada una página, cuando el usuario gira 90°, entonces la vista previa gira y las zonas tapadas y el
  recorte giran con el contenido (siguen cubriendo lo mismo).
- Dado un giro, cuando se exporta, entonces el archivo sale con la orientación elegida.

## RF-05 · Recortar

- Dada una página, cuando el usuario dibuja un rectángulo de recorte, entonces la exportación contiene
  solo esa zona y la vista previa atenúa el exterior.
- Dado un recorte, cuando el usuario lo quita, entonces vuelve a exportarse la página completa.

## RF-06 · Tapar zonas

- Dada una página, cuando el usuario dibuja un rectángulo, entonces esa zona queda cubierta de negro
  opaco en la vista previa y en la exportación.
- Dadas varias zonas, cuando el usuario deshace, entonces se elimina la última zona dibujada.
- Dada una zona tapada, cuando se exporta, entonces el píxel original **no** existe en el archivo
  resultante (la zona se pinta sobre los píxeles, no es una capa).

## RF-07 · Marca de agua

Texto diagonal repetido que cubre toda la imagen, con destinatario, finalidad y fecha.

- Dado el texto por defecto, cuando no se edita nada, entonces la marca es
  `COPIA SOLO VÁLIDA PARA <destinatario> · <finalidad> · <fecha de hoy>` con destinatario y
  finalidad vacíos omitidos.
- Dado que el usuario edita el texto libre, cuando escribe, entonces la vista previa se actualiza con
  ese texto (y la fecha, si está activada).
- Dado que el usuario desactiva la fecha, cuando se exporta, entonces el texto no incluye fecha.
- Dado el preset _Normal_, entonces: opacidad 45 %, alto del texto 4,5 % del ancho, separación 2,6
  altos de texto, color rojo, borde blanco. Dado el preset _Suave_: 28 %, 3,5 %, 3,5, gris, sin borde.
- Dado cualquier preset, cuando el usuario ajusta opacidad, tamaño, separación, ángulo, color o
  borde, entonces el ajuste manual prevalece sobre el preset.
- Dada una imagen de cualquier proporción, cuando se aplica la marca, entonces el mosaico cubre toda
  la superficie, incluidas las esquinas (ninguna región mayor que un paso de la rejilla queda sin texto).

## RF-08 · Reducir resolución y eliminar metadatos

- Dado un lado máximo (por defecto 1200 px), cuando se exporta, entonces el lado mayor de cada archivo
  mide como mucho ese valor y la imagen nunca se amplía.
- Dada una foto con EXIF (GPS, modelo, fecha), cuando se exporta, entonces el archivo resultante no
  contiene ningún bloque EXIF, XMP ni ICC de la original.
- Dada una calidad JPEG (por defecto 82), cuando se exporta, entonces se usa esa calidad.

## RF-09 · Vista previa en vivo

- Dado cualquier cambio (texto, preset, zona, giro, recorte, resolución), cuando se produce, entonces
  la vista previa de la página activa se actualiza en menos de 300 ms para una página de 1200 px.
- Dada la vista previa, entonces muestra exactamente lo que se exportará (mismo pipeline).

## RF-10 · Exportar

- Dada una página, cuando el usuario descarga JPG, entonces obtiene `<nombre>-<pN>-copia-segura.jpg`.
- Dadas varias páginas, cuando descarga ZIP, entonces obtiene un ZIP con un JPG por página.
- Dadas varias páginas, cuando descarga PDF, entonces obtiene un único PDF con una página por imagen,
  en orden, con las imágenes ya marcadas y sin metadatos de la original.
- Dada una exportación, entonces no se usa `localStorage`, `IndexedDB` ni caché para el documento.

## RF-11 · Documento de ejemplo

- Dado el botón _Probar con un documento de ejemplo_, cuando se pulsa, entonces se carga un documento
  ficticio de dos páginas incluido en la aplicación (sin red), para probar el flujo completo.

## RF-12 · Idioma

- Dado un navegador en español, entonces la interfaz aparece en español; en cualquier otro idioma, en
  inglés. El usuario puede cambiarlo y la elección se recuerda (es la única preferencia que se guarda).

## RF-13 · Explicación honesta

- Dada la interfaz, entonces un bloque visible explica qué consigue la marca de agua (disuadir, dejar
  rastro, encarecer la reutilización) y qué no (no impide que se use; se puede intentar borrar con
  IA), y recomienda tapar lo que el trámite no necesite y verificar el canal de envío.
