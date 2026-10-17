# SPEC-0010 · Cualquier documento, no solo el DNI

**Estado:** Implementada · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0007, SPEC-0008

## Contexto

La herramienta siempre ha aceptado cualquier imagen o PDF: un pasaporte, una nómina, un contrato,
una factura, un extracto o una captura de pantalla. Con los textos de SPEC-0007 todo hablaba del
DNI y ese diferencial dejó de verse: quien llega con una nómina en PDF no sabe que también le sirve.
El DNI sigue siendo el caso principal, así que se mantiene como ejemplo, no como límite.

## RF-31 · Cualquier documento, a la vista

- El titular, la zona de carga, la descripción de la página y los README hablan de "documento" o
  "documentos"; el DNI aparece como el primer ejemplo, no como el único.
- Bajo el titular, la portada enumera ejemplos de lo que acepta: _DNI_, _pasaporte_, _nómina_,
  _contrato_, _factura_ y _cualquier PDF o imagen_. Es una lista informativa, no un selector: no
  cambia nada del procesado.
- La zona de carga indica que admite PDF de una o varias páginas y fotos.
- Las plantillas de zonas típicas siguen siendo del DNI (RF-16) y lo dicen en su nombre.

## RF-32 · Un documento que no es un DNI funciona igual

- Dada una imagen cualquiera (por ejemplo, la foto de una nómina), cuando se carga, entonces se
  abre como una página más, la marca de agua la cruza entera y se exporta con el nombre del archivo
  de origen.
- Un PDF de texto de varias páginas se abre página a página; el recorte automático solo actúa si una
  página es, en esencia, una foto incrustada (RF-01), así que no recorta un documento de texto.

## Fuera de alcance

- Plantillas de zonas para otros documentos (nóminas, pasaportes): cada formato es distinto y una
  plantilla equivocada da una falsa sensación de seguridad.
