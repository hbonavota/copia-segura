# ADR-0002 · Arquitectura limpia por capas con regla de dependencia verificada

**Estado:** Aceptada · **Fecha:** 2026-10-17

## Contexto

Una aplicación de este tamaño cabe en un único archivo. Pero el objetivo del repositorio es que
alguien técnico lo lea y entienda _cómo_ trabajamos, y que las partes con lógica (geometría de la
marca, giro de rectángulos, detección de imágenes en PDF) se puedan probar sin navegador.

## Decisión

Cuatro capas con dependencias en un solo sentido, de fuera hacia dentro:

```
ui  →  application  →  domain
        ↑
infrastructure (implementa los puertos de application)
```

- `domain/`: tipos, invariantes y funciones puras. Sin imports fuera de la carpeta.
- `application/`: casos de uso y **puertos** (interfaces). Solo importa `domain`.
- `infrastructure/`: adaptadores que implementan los puertos con pdf.js, canvas, pdf-lib, JSZip,
  `getUserMedia`… Importa `application` (los puertos) y `domain`.
- `ui/`: componentes y estado de la interfaz. Importa `application` y `domain`; recibe los adaptadores
  ya construidos desde la raíz de composición (`main.ts`).

La regla se comprueba con un test (`tests/architecture.test.ts`) que analiza los imports de cada
archivo: si alguien la rompe, CI falla.

## Consecuencias

- Más archivos y algo de ceremonia (puertos, raíz de composición) a cambio de tests rápidos y
  deterministas en `domain` y `application` (sin DOM, sin jsdom).
- Cambiar pdf.js por otra librería, o canvas por WebGPU, no toca el dominio.
- El coste de añadir una función es mayor que en un script: hay que decidir en qué capa va. Es un
  coste asumido por legibilidad.
