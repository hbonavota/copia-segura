# ADR-0005 · CSP estricta: ninguna petición fuera del propio origen

**Estado:** Aceptada · **Fecha:** 2026-10-17

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
   Un origen estático no puede recibir datos, así que la garantía que importa se mantiene: **ninguna
   petición a otro dominio**.
2. La política se inyecta solo en el build de producción (plugin de Vite): el servidor de desarrollo
   necesita su WebSocket de recarga en caliente.
3. Un test e2e recorre el flujo completo registrando todas las peticiones y falla si alguna sale del
   origen de la página. Es la comprobación de verdad: la CSP es el cinturón; el test, los tirantes.
4. No hay _service worker_: no hay nada que precargar y evita cualquier duda sobre qué se cachea.
5. El _worker_ de pdf.js, donde de verdad se analiza el PDF, se arranca desde un `blob:` creado por
   la página y no desde una URL. Un worker cargado por URL recibe su política de las cabeceras de
   su propia respuesta (Pages no envía ninguna); uno `blob:` hereda la del documento. Así la CSP
   también rige dentro del worker.

No se concede `'unsafe-inline'` para estilos: la interfaz posiciona elementos a través del CSSOM
(`element.style`), que la CSP no gobierna, y pdf.js carga fuentes con la API `FontFace`.

## Consecuencias

- Cualquier intento de cargar un recurso externo falla en producción y aparece en la consola.
- Las fuentes son las del sistema; no se descargan tipografías.
- Si en el futuro hiciera falta una petición (p. ej. comprobar actualizaciones), este ADR tendría que
  sustituirse explícitamente.
