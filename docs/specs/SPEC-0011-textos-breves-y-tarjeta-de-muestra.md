# SPEC-0011 · Textos breves y tarjeta de muestra

**Estado:** Implementada · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0007, SPEC-0010

## Contexto

Revisando la versión publicada en el móvil: demasiado texto seguido, el sello del nombre se estiraba
a todo el ancho y el código de barras de la tarjeta de ejemplo se salía del borde. Las otras
herramientas enseñan una tarjeta de muestra con aspecto de documento real; la nuestra parecía un
esquema.

## RF-33 · Textos breves, detalle plegado

- Cada bloque explicativo dice lo esencial en una o dos frases. El detalle (cómo comprobar la
  privacidad, qué consigue y qué no una marca de agua) queda en un desplegable _Más información_,
  cerrado por defecto. Las preguntas frecuentes ya eran desplegables (RF-30).
- La ayuda del editor es una frase; los atajos de teclado se muestran cuando una zona tiene el
  foco, y siempre están en el texto que leen los lectores de pantalla (RF-27).
- El sello del nombre mide lo que su texto en cualquier ancho: no se estira en el móvil.

## RF-34 · Tarjeta de muestra creíble e inventada

- La demo y el documento de ejemplo usan una tarjeta de identidad con los elementos de una real
  (fondo de seguridad con guilloches, chip, retrato, firma, CAN, zona de lectura mecánica) para que
  el resultado se entienda de un vistazo.
- Es **inventada**: "República de Ejemplo", datos de muestra, retrato ilustrado (no una persona
  real) y sello MUESTRA. No reproduce el diseño, el escudo ni las imágenes de ningún documento
  oficial: copiarlos sería usar imágenes ajenas y publicar una plantilla útil para falsificar.
- Sigue la disposición de la plantilla del DNI (RF-16), así que la demo tapa las zonas de esa
  plantilla. Se genera con `npm run example:cards` (SVG renderizado con Playwright) y nada se
  sale de la tarjeta.
