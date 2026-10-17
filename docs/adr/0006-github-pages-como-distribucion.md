# ADR-0006 · GitHub Pages como distribución, CI como única puerta

**Estado:** Aceptada (dominio y ruta modificados por ADR-0008) · **Fecha:** 2026-10-17

## Contexto

Al no haber backend, la aplicación es un conjunto de archivos estáticos. Hay que decidir dónde se
publica y qué garantiza que lo publicado es lo que está en `main`.

## Decisión

- Se publica en GitHub Pages desde un workflow de GitHub Actions (`deploy-pages.yml`) que solo se
  ejecuta en `main` y solo tras pasar el workflow de CI (lint, typecheck, tests, build, e2e).
- El build usa `BASE_PATH=/copia-segura/` para que las rutas funcionen bajo el subdirectorio del
  repositorio (desde ADR-0008, la ruta la da Pages). En local, `npm start` sirve en `/`.
- ~~No se usan dominios personalizados~~ (ver ADR-0008: `copia-segura.orbytia.es`). Ni CDN
  adicionales.

## Consecuencias

- Cualquiera puede comparar el artefacto publicado con el código del commit: el build es
  reproducible (`npm ci` + `npm run build`).
- Un fork obtiene su propia copia publicada cambiando solo el nombre del repositorio en
  `BASE_PATH`.
- Si GitHub Pages no estuviera disponible, cualquier hosting estático sirve: no hay nada específico
  de la plataforma fuera del workflow.
