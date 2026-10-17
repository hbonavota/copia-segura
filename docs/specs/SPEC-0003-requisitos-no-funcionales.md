# SPEC-0003 · Requisitos no funcionales

**Estado:** Implementada · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0001

## RNF-01 · Privacidad verificable

- La aplicación no realiza ninguna petición a otro dominio, nunca. Se impone con una
  _Content Security Policy_ en el HTML publicado: `default-src 'self'`, `connect-src 'self'`,
  sin orígenes externos para scripts, estilos, fuentes, imágenes ni conexiones. Las únicas
  peticiones tras la carga van al propio origen (decodificadores de pdf.js, documento de ejemplo),
  que es un hosting estático incapaz de recibir datos.
- No hay analítica, fuentes externas ni CDN. Todas las dependencias se empaquetan en el build.
- El documento del usuario vive solo en memoria. No se escribe en `localStorage`, `IndexedDB`,
  `Cache Storage` ni en cookies. La única preferencia persistida es el idioma.
- Con fotos, la aplicación funciona sin conexión una vez cargada. Abrir un PDF o exportar a PDF o
  ZIP descarga la primera vez los módulos correspondientes (pdf.js, pdf-lib, JSZip), siempre del
  propio origen; si no hay conexión, se informa al usuario. No hay _service worker_.
- Un test e2e comprueba que durante un flujo completo (importar, editar, exportar) no se produce
  ninguna petición fuera del origen de la página.

## RNF-02 · Rendimiento

- Importar un PDF de 2 páginas A4 escaneadas a 300 ppp y mostrar las miniaturas: < 3 s en un portátil
  de gama media.
- Actualizar la vista previa tras un cambio: < 300 ms para una salida de 1200 px (RF-09).
- El bundle de producción (sin pdf.js) pesa menos de 150 kB comprimido; pdf.js se carga en un
  _chunk_ aparte solo cuando se importa un PDF.

## RNF-03 · Compatibilidad

- Últimas dos versiones de Chrome, Edge, Firefox y Safari (escritorio y móvil).
- Sin _polyfills_: se usan solo APIs disponibles en todos ellos (`createImageBitmap`,
  `OffscreenCanvas` opcional con _fallback_ a `<canvas>`, `getUserMedia`, `Blob`, `URL.createObjectURL`).
- Funciona desde `file://`? No: los módulos ES requieren un origen HTTP. `npm start` levanta uno en
  `localhost` y la versión publicada está en GitHub Pages.

## RNF-04 · Accesibilidad

- Todo el flujo se puede completar con teclado: importar (botón + diálogo nativo), girar, deshacer,
  ajustar controles, exportar. El dibujo de zonas con el ratón tiene alternativa: tapar la página
  entera por franjas (arriba / abajo / izquierda / derecha) desde botones.
- Foco visible, etiquetas en todos los controles, contraste AA, `prefers-reduced-motion` respetado.
- Los mensajes de error dicen qué ha pasado y qué hacer, no solo "error".

## RNF-05 · Calidad del código

- TypeScript en modo `strict`, sin `any` implícitos.
- Arquitectura por capas (ver `docs/arquitectura.md`) con la regla de dependencia comprobada por un
  test: `domain` no importa nada fuera de `domain`; `application` solo importa `domain`.
- Cobertura de tests unitarios en `domain` y `application`: ≥ 90 % de líneas y ≥ 85 % de ramas (umbral de CI).
- CI en cada push: lint, typecheck, tests unitarios, build y e2e. Despliegue a Pages solo desde `main`
  con CI en verde.
- Commits en formato _Conventional Commits_ con referencia al requisito cuando aplica
  (`feat(watermark): mosaico diagonal (RF-07)`).

## RNF-06 · Licencia y reutilización

- Licencia MIT. Sin dependencias con licencias copyleft en el bundle.
