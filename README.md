# copia segura

[![CI](https://github.com/hbonavota/copia-segura/actions/workflows/ci.yml/badge.svg)](https://github.com/hbonavota/copia-segura/actions/workflows/ci.yml)
[![Pages](https://github.com/hbonavota/copia-segura/actions/workflows/deploy-pages.yml/badge.svg)](https://hbonavota.github.io/copia-segura/)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)

**Prepara una copia limitada de tu DNI, o de cualquier documento, sin que salga de tu navegador.** Marca de agua con
destinatario, finalidad y fecha; zonas tapadas; resolución reducida; sin metadatos. Sin servidor,
sin cuenta, sin instalar nada.

[English version](README.en.md) · [Probar la aplicación](https://hbonavota.github.io/copia-segura/) · [Cómo está hecha](docs/arquitectura.md)

![Portada de copia segura: zona de carga, demo paso a paso con un documento ficticio y ajustes de la marca](docs/img/inicio.png)

## Por qué

Cada vez que una empresa pide "una foto del DNI", una nómina o un contrato (cambio de titularidad,
alta, verificación, alquiler…) entregas una copia íntegra y reutilizable de tus datos, con los
metadatos de la foto incluidos. Si esa copia se filtra, no hay forma de demostrar a quién la diste ni para qué.

Las agencias de protección de datos recomiendan entregar **copias limitadas**: con una marca que
diga a quién, para qué y cuándo; con los datos que el trámite no necesita tapados; y con la
resolución justa. Hacerlo a mano es tedioso, y las webs de "añadir marca de agua" te piden subir el
documento a un servidor ajeno, que es justo lo que quieres evitar.

## Qué hace

|                   |                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entrada**       | Cualquier documento: DNI, pasaporte, nómina, contrato, factura… Un PDF (cada página es editable; si la página es un A4 con la foto del documento dentro, se recorta sola; si tiene texto propio, como una nómina, se deja entera), fotos JPG/PNG/WebP, o una captura con la cámara para la foto sosteniendo el documento (sin espejo). La portada enseña el resultado, paso a paso, con un documento ficticio antes de subir nada. |
| **Edición**       | Tapar zonas dibujando con el ratón o el dedo, por franjas con botones o con plantillas de zonas típicas (DNI de España y de Argentina, frente y dorso); moverlas y redimensionarlas, también con teclado; en negro o pixelado grueso; recortar, girar, deshacer.                                                                                                                                                                   |
| **Marca de agua** | Texto editable: `COPIA SOLO VÁLIDA PARA <destinatario> · <finalidad> · <fecha>`. Dos intensidades (_Visible_ y _Discreta_) y ajuste fino de opacidad, tamaño, separación, ángulo, color y borde. El mosaico cruza toda la imagen, también las esquinas.                                                                                                                                                                            |
| **Salida**        | JPG por página, ZIP, un PDF de varias páginas o el menú de compartir del móvil. Blanco y negro opcional. Lado máximo configurable (1200 px por defecto), sin EXIF, XMP ni perfil de color de la foto original.                                                                                                                                                                                                                     |
| **Interfaz**      | Español e inglés; tema claro u oscuro (sigue al del sistema o el que elijas, y lo recuerda).                                                                                                                                                                                                                                                                                                                                       |
| **Privacidad**    | Todo ocurre en el navegador. La página no puede hacer peticiones a otros dominios (lo impone su _Content Security Policy_) y no guarda el documento en ningún sitio. Un contador en la cabecera muestra en vivo los recursos de otros dominios que registra el navegador (cero) y un test e2e registra todas las de un flujo completo y falla si alguna sale del origen.                                                           |

Y lo que **no** hace, dicho en la propia interfaz: una marca de agua disuade y deja rastro, pero no
impide que alguien use la copia, y se puede intentar borrar con herramientas de _inpainting_. Los
detalles están en el [modelo de amenazas](docs/amenazas.md).

<p align="center"><img src="docs/img/movil.png" alt="En el móvil: el editor delante y la barra de descarga fija abajo" width="300"></p>

## Qué la hace distinta

Hay otras webs que prometen procesar el documento "en local". La diferencia está en que aquí no
hace falta creérselo:

|                                      | copia segura                                                                                                                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sin terceros**                     | Ni analítica, ni fuentes de Google, ni CDN. La página solo habla con el servidor que la aloja (GitHub Pages), y solo para cargarse; el documento nunca sale del navegador.                                        |
| **Verificable, no prometido**        | Una _Content Security Policy_ impide a la página pedir datos o cargar recursos de otros dominios (también dentro del worker que analiza el PDF), y un test e2e lo comprueba en cada cambio. El código es público. |
| **Cualquier documento**              | DNI, pasaporte, nómina, contrato o cualquier PDF o imagen, de una o muchas páginas; recorta sola la tarjeta de un escaneo y exporta todo junto en PDF o ZIP.                                                      |
| **Sin metadatos y resolución justa** | Quita ubicación, modelo de móvil y fecha de la foto; limita el tamaño para que sirva para leer, no para falsificar.                                                                                               |
| **Zonas típicas en un clic**         | Plantillas para el DNI de España y de Argentina (frente y dorso).                                                                                                                                                 |
| **Blanco y negro**                   | El documento en grises con la marca en color.                                                                                                                                                                     |
| **Honesta sobre sus límites**        | Explica qué consigue una marca de agua y qué no, en vez de prometer una seguridad que no existe.                                                                                                                  |

La propia aplicación incluye un apartado **Compruébalo tú** con los tres pasos para verificarlo sin
leer código: pestaña _Red_ de las herramientas de desarrollo, la política de seguridad en el código
fuente de la página, y el test que lo comprueba.

## Usarla

La forma más simple es abrir la [versión publicada](https://hbonavota.github.io/copia-segura/):
no se instala nada. Con fotos funciona sin conexión una vez cargada; abrir un PDF o exportar a
PDF/ZIP descarga la primera vez los módulos correspondientes, siempre desde el propio origen.

En local, con Node 22.13 o superior (`.nvmrc`):

```bash
git clone https://github.com/hbonavota/copia-segura.git
cd copia-segura
npm install
npm start          # abre http://localhost:5173
```

`npm start` solo levanta un servidor de archivos estáticos: no hay backend ni en desarrollo.

## Cómo está hecha

Es un proyecto pensado también como muestra de forma de trabajar: **Spec-Driven Development** y
**arquitectura limpia** en una aplicación pequeña de verdad.

- **Especificación primero.** `docs/specs/` contiene la visión, los requisitos funcionales (`RF-xx`)
  con criterios de aceptación _Dado / Cuando / Entonces_, los no funcionales (`RNF-xx`) y el modelo
  de dominio. Los tests citan el requisito que cubren (`describe('RF-07 · marca de agua')`), así
  que cualquier línea de código se puede trazar hasta la razón por la que existe.
- **Decisiones registradas.** `docs/adr/` explica por qué no hay backend, por qué no hay framework
  de interfaz, por qué pdf.js y pdf-lib, y qué garantiza la CSP.
- **Cuatro capas con la dependencia en un solo sentido**, comprobada por un test:

  ```
  ui  →  application  →  domain          infrastructure implementa los puertos de application
  ```

  `domain/` es puro (geometría de la marca, giro de rectángulos, detección de imágenes en PDF a
  partir de la lista de operadores) y se prueba sin navegador. `application/` tiene los casos de
  uso y los puertos. `infrastructure/` son los adaptadores (pdf.js, canvas, pdf-lib, JSZip,
  `getUserMedia`). `ui/` es TypeScript contra el DOM, sin React: un almacén de estado observable
  mínimo y vistas que se montan y desmontan.

- **Tres niveles de prueba.** Unitarias en `domain` y `application` con dobles de los puertos
  (Vitest, ≥ 90 % de líneas y ≥ 85 % de ramas); un test de arquitectura que analiza los imports; y e2e con Playwright
  contra el build de producción, CSP incluida.
- **CI y despliegue.** Cada push pasa lint, typecheck, formato, tests, build y e2e. `main` se publica
  en GitHub Pages solo si CI está en verde.

Más detalle y un diagrama en [`docs/arquitectura.md`](docs/arquitectura.md).

### Estructura

```
docs/
  specs/          SPEC-0001…0010: visión, requisitos, RNF, dominio, diferencial, tema, rediseño, cualquier documento
  adr/            decisiones de arquitectura
  arquitectura.md capas, puertos, flujo de un caso de uso
  amenazas.md     qué protege y qué no
src/
  domain/         tipos y funciones puras
  application/    casos de uso y puertos
  infrastructure/ adaptadores del navegador
  ui/             vistas, store, i18n, estilos, main.ts (raíz de composición)
tests/            unitarios y de arquitectura (Vitest)
e2e/              Playwright
scripts/          recursos de pdf.js, documento de ejemplo, capturas
```

### Comandos

| Comando                 | Qué hace                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `npm start`             | Servidor de desarrollo y abre el navegador                                           |
| `npm test`              | Tests unitarios y de arquitectura                                                    |
| `npm run test:e2e`      | E2E contra el build de producción (`npx playwright install chromium` la primera vez) |
| `npm run check`         | Lint, typecheck, formato, tests y build: lo mismo que CI                             |
| `npm run build`         | Build de producción en `dist/` (`BASE_PATH=/copia-segura/` para Pages)               |
| `npm run example:build` | Regenera el PDF de ejemplo a partir de las tarjetas ficticias                        |

## Contribuir

Las propuestas de cambio empiezan por el requisito: si el cambio altera el alcance, primero una
spec nueva en `docs/specs/`; si no, un PR con su test. Detalles en [CONTRIBUTING.md](CONTRIBUTING.md).
Las vulnerabilidades se reportan según [SECURITY.md](SECURITY.md).

## Licencia

[MIT](LICENSE) · Hernán Bonavota
