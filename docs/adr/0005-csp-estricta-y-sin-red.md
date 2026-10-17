# ADR-0005 · CSP estricta: ninguna petición fuera del propio origen

**Estado:** Aceptada (punto 7 modificado por ADR-0007) · **Fecha:** 2026-10-17

## Contexto

"No se envía nada" es la propuesta de valor. Un usuario con conocimientos debe poder comprobarlo
sin leer el código, y un error de un desarrollador (añadir una fuente de Google, un script de
analítica, una llamada a una API) no debe poder romper la promesa en silencio.

## Decisión

1. El `index.html` publicado lleva una _Content Security Policy_ en una etiqueta `<meta>`:
   `default-src 'self'; connect-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:;
worker-src 'self' blob:; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none';
form-action 'none'`. GitHub Pages no permite cabeceras personalizadas, por eso va en el HTML.
   `connect-src 'self'` y no `'none'` porque pdf.js descarga sus decodificadores WebAssembly y las
   fuentes estándar desde nuestro propio origen, y el documento de ejemplo también se sirve de ahí.
   La garantía que importa se mantiene: **ninguna petición `fetch`/XHR ni recurso de otro dominio**.
   El propio origen es GitHub Pages, que ve las peticiones de carga de la página (como cualquier
   hosting), pero el documento nunca viaja en ellas: no hay ningún código que lo envíe.
2. La política se inyecta solo en el build de producción (plugin de Vite): el servidor de desarrollo
   necesita su WebSocket de recarga en caliente.
3. Un test e2e recorre el flujo completo registrando todas las peticiones y falla si alguna sale del
   origen de la página. Es la comprobación de verdad: la CSP es el cinturón; el test, los tirantes.
4. Ningún script en línea: la política no lleva `'unsafe-inline'`. Lo que debe ejecutarse antes de
   pintar (aplicar el tema guardado, RF-19) va en un archivo clásico del propio origen,
   `public/theme.js`.
5. La cabecera muestra los recursos de otros dominios que el navegador registra (RF-22). Es una
   ayuda visible, no la garantía: registra intentos bloqueados por la CSP y no ve los `fetch`
   bloqueados ni las peticiones de los _workers_ (ver SPEC-0007).
6. Las fuentes de la interfaz (Inter, RF-20) se empaquetan con el build y se sirven desde el propio
   origen: `font-src 'self'` no cambia.
7. ~~No hay _service worker_.~~ Sustituido por ADR-0007: hay un _service worker_ propio que guarda
   archivos de la app (nunca el documento) para instalarla y usarla sin conexión.
8. El _worker_ de pdf.js, donde de verdad se analiza el PDF, se arranca desde un `blob:` creado por
   la página y no desde una URL. Un worker cargado por URL recibe su política de las cabeceras de
   su propia respuesta (Pages no envía ninguna); uno `blob:` hereda la del documento. Así la CSP
   también rige dentro del worker.

No se concede `'unsafe-inline'` para estilos: la interfaz posiciona elementos a través del CSSOM
(`element.style`), que la CSP no gobierna, y pdf.js carga fuentes con la API `FontFace`.

## Límites conocidos

- La CSP no gobierna la **navegación** (`location.href`, `window.open`, un enlace pulsado): la
  directiva `navigate-to` se retiró de la especificación. La aplicación no navega por código y sus
  únicos enlaces van al repositorio; el test e2e vigila que ningún flujo genere peticiones a otros
  dominios.
- El hosting (GitHub Pages) recibe la IP del visitante al cargar la página. Eso no lo evita
  ninguna aplicación web; lo que sí garantizamos es que no hay terceros (analítica, fuentes, CDN).

## Consecuencias

- Cualquier intento de cargar un recurso externo falla en producción y aparece en la consola.
- Las fuentes son las del sistema; no se descargan tipografías.
- Si en el futuro hiciera falta una petición (p. ej. comprobar actualizaciones), este ADR tendría que
  sustituirse explícitamente.
