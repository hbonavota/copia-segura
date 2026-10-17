# ADR-0007 · Service worker para instalar la app y usarla sin conexión

**Estado:** Aceptada · **Fecha:** 2026-10-17 · **Modifica:** ADR-0005 (punto 7)

## Contexto

ADR-0005 descartó el _service worker_: "no hay nada que precargar y evita cualquier duda sobre qué
se cachea". SPEC-0012 pide que la app se pueda instalar en el móvil y usar sin conexión. Chrome
permite instalar desde su menú solo con el _manifest_, pero el aviso de instalación y, sobre todo,
abrir la app sin conexión necesitan un _service worker_ que sirva sus archivos desde la caché.

## Decisión

1. Un _service worker_ propio, sin dependencias (`src/pwa/sw.ts`), construido por Vite como una
   entrada aparte y publicado como `sw.js` en la raíz de la app. Al terminar el build se le inyecta
   la lista de archivos publicados y una versión calculada sobre su contenido.
2. Sus reglas son funciones puras (`src/pwa/rules.ts`) con tests unitarios: qué se precarga, qué
   peticiones atiende y qué cachés se borran. `pwa` es una capa aislada: el test de arquitectura
   comprueba que no importa nada de fuera.
3. Solo atiende `GET` del propio origen dentro de la ruta de la app. No hay ninguna regla para
   otros dominios: no los necesita y la CSP de la página los impide igualmente.
4. Precarga mínima; el resto, en segundo plano al abrir el primer documento. Páginas con red
   primero, recursos con caché primero; versión nueva en cada despliegue (`skipWaiting` +
   `clients.claim`), calculada sobre todos los archivos publicados, que borra las anteriores.
5. Las descargas para guardar usan `cache: 'reload'`: GitHub Pages fija 10 minutos de caché HTTP y,
   tras un despliegue, la precarga podría guardar el HTML anterior con recursos nuevos. Lo
   comprobamos con un servidor que imita esas cabeceras.
6. Las búsquedas en la caché ignoran `Vary`: los servidores responden `Vary: Origin` o
   `Vary: Accept-Encoding` y el navegador pide los módulos con cabeceras distintas de las de la
   precarga; respetarlo dejaba la app en blanco sin conexión (lo detectó una prueba con varias
   sesiones en paralelo).
7. El build falla si `sw.js` contiene `import` o `export`: un _service worker_ clásico no puede
   cargar módulos y debe ser autocontenido.
8. Solo en el build publicado. En desarrollo no se registra.

## Consecuencias

- La app se instala y funciona sin conexión: con fotos desde la primera visita; con todo, desde
  que se abre el primer documento.
- Una pestaña que lleve abierta desde antes de un despliegue pierde los módulos que no había
  cargado (también desaparecen del servidor); al recargar, todo vuelve a cuadrar.
- La caché del navegador ya no está vacía: guarda archivos de la app. **Nunca el documento**, que se
  abre como archivo local y no viaja por ninguna URL; un test e2e lo comprueba revisando la caché.
  El modelo de amenazas y RNF-01 (vía SPEC-0012) lo recogen.
- `sw.js` no hereda la CSP de la página (es un script aparte y GitHub Pages no envía cabeceras),
  así que su garantía es su código: no contiene ninguna petición a otro origen y es revisable en
  `src/pwa/`. Las peticiones que hace la página siguen sometidas a la CSP.
- Una actualización publicada llega en la siguiente carga con conexión, sin pasos manuales.
