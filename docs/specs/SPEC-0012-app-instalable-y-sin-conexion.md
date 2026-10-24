# SPEC-0012 · App instalable y sin conexión

**Estado:** Implementada (RF-36 ampliado por SPEC-0014: qué no se guarda) · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0003, ADR-0007

## Contexto

En el móvil, abrir el navegador, buscar la página y esperar a que cargue es fricción para algo que
se hace justo antes de enviar un documento. Instalarla como app la deja en la pantalla de inicio,
se abre sin barra del navegador y, si además funciona sin conexión, la promesa "no sale nada" se
puede comprobar de la forma más sencilla: en modo avión.

Esta spec **modifica RNF-01** (SPEC-0003) en dos frases: ahora hay _service worker_ y la caché del
navegador guarda **archivos de la app**. Lo que no cambia: el documento nunca se guarda en ningún
sitio.

## RF-35 · Instalable

- La página publica un _manifest_ del propio origen con nombre, iconos (192 y 512 px, y uno
  _maskable_ para Android), `display: standalone`, colores de fondo y tema, y `start_url` /
  `scope` relativos, para que funcione en la raíz de un dominio propio o bajo una subruta
  (ADR-0008).
- Dado un navegador que ofrece instalar (Chrome, Edge, Android), la portada muestra **Instalar
  como app**, que abre su diálogo. No aparece si ya se usa instalada ni si el navegador no lo ofrece.
- En iPhone (Safari no ofrece ese aviso) las preguntas frecuentes explican cómo hacerlo: Compartir ›
  Añadir a pantalla de inicio. Hay icono para iOS (`apple-touch-icon`).
- Chrome no debe dar ningún error de instalabilidad.

## RF-36 · Sin conexión

- Un _service worker_ del propio origen guarda en la caché del navegador los archivos de la app:
  - al instalarse, solo lo necesario para abrir la portada y el editor con fotos (unos cientos de
    KB): HTML, el JS y el CSS principales, la fuente latina, iconos, _manifest_ y la tarjeta de la
    demo;
  - el resto (pdf.js y sus recursos, pdf-lib, JSZip, el PDF de ejemplo, fuentes de otros alfabetos),
    **en segundo plano en cuanto el usuario abre su primer documento**: desde ese momento todo
    funciona sin conexión, también abrir PDF y exportar. Quien solo entra a mirar no lo descarga;
  - lo que se pida y no esté guardado se guarda al usarse.
- Si la versión anterior estaba completa, la nueva también se completa al activarse: una app
  instalada que funcionaba sin conexión sigue haciéndolo tras una actualización.
- Como portada sin conexión solo se guarda HTML de la propia portada (no una imagen o el
  _manifest_ abiertos en una pestaña), y las descargas para guardar saltan la caché HTTP del
  navegador, para no mezclar el HTML anterior con los recursos nuevos tras un despliegue.
- Guardar en la caché nunca rompe una respuesta: si falla (cuota llena), la petición sigue su curso.
- Solo atiende peticiones `GET` del propio origen y dentro de la ruta de la app. Las páginas van
  primero a la red (para estrenar cada versión en cuanto hay conexión) y, sin conexión, a la copia
  guardada; los recursos, que llevan un hash en el nombre, primero a la caché.
- Dado un documento abierto o exportado, la caché sigue conteniendo solo archivos publicados: el
  documento no se pide a ninguna URL, así que nunca pasa por el _service worker_. Lo comprueba un
  test e2e que revisa todas las entradas de la caché.
- Cada despliegue cambia la versión de la caché: el navegador instala la nueva y borra las
  anteriores sin que el usuario haga nada.
- En desarrollo (`npm start`) no se registra: serviría archivos viejos.

## Fuera de alcance

- Notificaciones, sincronización en segundo plano o cualquier otra API que necesite un servidor.
- Abrir archivos desde el menú "Compartir" del sistema hacia la app (`share_target`): requiere
  recibir el archivo por una petición `POST`, que el _service worker_ tendría que interceptar y
  guardar; se valorará en una spec propia.
