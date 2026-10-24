# SPEC-0014 · Publicación profesional: buscadores, redes y build

**Estado:** Implementada · **Fecha:** 2026-10-24 · **Depende de:** SPEC-0003, SPEC-0012, ADR-0008

## Contexto

Revisamos la web publicada con una lista habitual de "señales de que una web se hizo deprisa": URL
de plataforma, código fuente vacío, sin 404, sin datos para buscadores y redes, mapas de código
publicados, errores en consola, _bundle_ gigante… Unas ya estaban resueltas; otras no.

| Señal                      | Estado antes                    | Qué hacemos                                      |
| -------------------------- | ------------------------------- | ------------------------------------------------ |
| URL de plataforma          | Resuelto (ADR-0008)             | —                                                |
| Código fuente vacío        | `<div id="app">` vacío          | Contenido inicial en el HTML (RF-38)             |
| Sin página 404             | La genérica de GitHub           | `404.html` propia (RF-39)                        |
| Todo en Vite y React       | Vite, sin React                 | Decisión consciente (ADR-0003)                   |
| Mismo título en todo       | Solo hay una página             | Título descriptivo (RF-38)                       |
| Sin _meta description_     | Resuelto                        | —                                                |
| Sin imagen OG              | Faltaba                         | `og.png` 1200×630 y Open Graph / Twitter (RF-38) |
| Datos sin estructura       | Faltaba                         | JSON-LD `WebApplication` (RF-38)                 |
| Varios H1 / ningún H1      | Uno al montar, cero antes       | Uno siempre (RF-38)                              |
| Sin canónica               | Faltaba                         | `link rel="canonical"` al dominio propio (RF-38) |
| Sin `llms.txt`             | Faltaba                         | `llms.txt` (RF-39)                               |
| `robots.txt` bloqueando IA | No había `robots.txt`           | `robots.txt` que permite todo (RF-39)            |
| Sin favicon                | Solo SVG en línea               | `favicon.svg` y `favicon.ico` (RF-39)            |
| Sin sitemap                | Faltaba                         | `sitemap.xml` (RF-39)                            |
| Sin atributo de idioma     | Resuelto (cambia con el idioma) | Test (RF-38)                                     |
| Sin texto alternativo      | Resuelto                        | Test (RF-38)                                     |
| Mapas de código publicados | Se publicaban                   | Fuera del build (RF-40)                          |
| Errores en consola         | Ninguno                         | Test (RF-40)                                     |
| _bundle.js_ gigante        | 31 KB gzip al entrar            | Presupuesto en CI (RF-40)                        |

## RF-38 · El HTML se entiende sin ejecutar nada

- El HTML publicado lleva, sin JavaScript: `lang`, un título descriptivo, _meta description_, URL
  canónica (`https://copia-segura.orbytia.es/`, también si se sirve bajo otra ruta), Open Graph y
  Twitter Card con una imagen de 1200×630 del propio dominio, y datos estructurados JSON-LD
  (`WebApplication`, gratuita, idiomas, licencia, repositorio).
- El cuerpo trae un `h1` y dos párrafos que explican qué hace la app: lo leen buscadores, lectores
  de enlaces y quien abra el código fuente. La app los sustituye al arrancar; sin JavaScript se
  añade el aviso de que lo necesita.
- Con la app montada hay **un** `h1`, `<html lang>` sigue al idioma elegido y ninguna imagen carece
  de `alt`.
- El JSON-LD es un bloque de datos, no un script: la CSP (que prohíbe scripts en línea) no lo afecta
  y no genera avisos.

## RF-39 · Archivos para buscadores, redes y rutas que no existen

- `robots.txt` permite todo, incluidos los rastreadores de buscadores con IA (no hay nada privado:
  los documentos nunca llegan al servidor), y apunta al `sitemap.xml`.
- `llms.txt` (formato de llmstxt.org) resume qué es, cómo se usa, sus garantías de privacidad y
  enlaza al código y la documentación.
- `favicon.svg` y `favicon.ico` (16 y 32 px) se generan con `npm run example:icons`, junto con los
  iconos y `og.png`.
- `404.html`: página propia, sin JavaScript, con la misma CSP, tema claro u oscuro según el sistema,
  `noindex` y un enlace a la portada que funciona en la raíz o bajo una subruta.
- El _service worker_ no guarda ninguno de estos archivos para usar sin conexión: no son de la app
  (modifica la lista de RF-36 en ese detalle). El favicon SVG sí, porque lo usa la página.

## RF-40 · Build sin mapas de código y con presupuesto

- La web publicada no incluye mapas de código (`.map`) ni referencias a ellos. El código fuente es
  público en el repositorio; la web sirve solo lo que necesita el navegador.
- Lo que se descarga para abrir la portada tiene presupuesto: **45 KB** de JS y **10 KB** de CSS
  comprimidos con gzip. pdf.js, pdf-lib y JSZip siguen cargándose al usarse.
- `npm run check:dist` comprueba presupuesto, ausencia de mapas y presencia de los archivos de
  RF-39; se ejecuta en CI y antes de cada despliegue.
- Un test e2e abre un documento, lo exporta y exige cero errores y cero avisos en la consola.

## Fuera de alcance

- Varias páginas indexables o una versión por idioma con su URL (`hreflang`): la app es una sola
  página que cambia de idioma sin recargar.
- Renderizado en servidor: no hay servidor, por diseño (ADR-0001).
