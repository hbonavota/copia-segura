# SPEC-0015 · Pie, aviso legal y privacidad

**Estado:** Implementada · **Fecha:** 2026-10-25 · **Depende de:** SPEC-0007, SPEC-0014

## Contexto

La web no tenía pie ni textos legales: no decía quién está detrás, cómo contactar ni en qué
condiciones se usa. Para una herramienta que pide confianza con documentos de identidad, eso es
tan importante como la propia garantía técnica. Seguimos el modelo de verifiko.es, también de
Orbytia: pie con enlaces legales, contacto y «Desarrollado por Orbytia».

## RF-41 · Pie de página

- La app tiene un pie, igual en la portada y en el editor, con: **Aviso legal**, **Privacidad**,
  **Contacto** (`mailto:contacto@orbytia.es`) y **Código fuente**; y debajo «© _año_ copia segura
  · Desarrollado por **Orbytia**», enlazado a https://orbytia.es/.
- Los enlaces que abren otra pestaña lo anuncian a los lectores de pantalla. El pie se traduce con
  el resto de la app.
- Las páginas estáticas (404, aviso legal, privacidad) llevan el mismo pie, generado en el build
  desde un único sitio, con la página actual marcada (`aria-current`).

## RF-42 · Aviso legal y política de privacidad

- `/aviso-legal/` y `/privacidad/` son HTML estático, sin JavaScript propio (solo `theme.js`, para
  respetar el tema elegido en la app), con la misma CSP, URL canónica y entrada en el `sitemap.xml`.
  En español, con un resumen en inglés al final.
- **Titular y responsable:** Orbytia; contacto: contacto@orbytia.es.
- **Aviso legal:** qué es la herramienta, condiciones de uso (uso lícito, revisar la copia antes de
  enviarla, límites del pixelado y de la marca de agua), garantías y responsabilidad (licencia
  MIT, sin limitar los derechos que reconozca la ley), propiedad intelectual (código MIT,
  bibliotecas con sus licencias, tarjeta de muestra inventada), enlaces externos y legislación
  española.
- **Privacidad:** la herramienta no recoge datos personales; los documentos se procesan en el
  dispositivo y nunca se envían; qué guarda el navegador (las dos preferencias, con sus claves
  exactas, y los archivos de la app para uso sin conexión); alojamiento en GitHub Pages y qué
  registra GitHub; qué pasa si se escribe al correo, con base jurídica, conservación, derechos y
  reclamación ante la AEPD.
- **Sin aviso de cookies:** no hay cookies ni analítica, y lo que se guarda (preferencias que elige
  el usuario y archivos de la propia app) no requiere consentimiento. Un test comprueba que no hay
  cookies y que las claves de `localStorage` que deja la app son exactamente las que nombra la
  política: si la app empieza a guardar algo nuevo, el test obliga a actualizar la política.
- El _service worker_ no guarda estas páginas para uso sin conexión (no son de la app).
