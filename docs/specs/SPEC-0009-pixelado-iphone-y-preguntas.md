# SPEC-0009 · Tapado pixelado, fotos del iPhone y preguntas frecuentes

**Estado:** Implementada · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0002, SPEC-0008

## RF-28 · Tapado pixelado

- El estilo de tapado es _Negro_ (por defecto) o _Pixelado_ y se aplica a todas las zonas.
- El pixelado es **grueso**: el bloque mide la mitad del lado corto de la zona (mínimo 16 px), de
  modo que una zona queda en una o dos filas de bloques.
- La interfaz advierte que solo el negro es irreversible y que el pixelado no debe usarse sobre
  números ni texto: hay técnicas que recuperan texto pixelado con bloques pequeños.

## RF-29 · Fotos HEIC del iPhone

- Si el navegador sabe decodificar HEIC (Safari), la foto se abre como cualquier otra.
- Si no, el aviso es específico: cómo exportarla como JPG desde el iPhone o cambiar el formato de
  la cámara, en lugar del error genérico.
- No se añade un decodificador propio: pesaría entre 1 y 2 MB de WebAssembly y su licencia (LGPL)
  complica la distribución. Se reconsiderará si los navegadores no lo resuelven.

## RF-30 · Preguntas frecuentes

- Un apartado de preguntas desplegables responde a las dudas habituales: si se sube el documento,
  qué texto poner, qué datos tapar, si funciona en el móvil y sin conexión, si sirve para otros
  documentos, si la marca se puede quitar con IA y por qué no pixelar números.
- Las respuestas no dan consejo legal: remiten a la autoridad de protección de datos.
