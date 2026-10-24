# Especificaciones (SDD)

Este proyecto se desarrolla con **Spec-Driven Development**: primero se escribe la especificación,
de ella se derivan los tests y solo entonces se implementa. Cada requisito tiene un identificador
estable (`RF-xx`, `RNF-xx`) que aparece en los tests (`describe('RF-07 …')`) y en los commits,
de modo que se puede trazar cualquier línea de código hasta el requisito que la justifica.

| Spec                                                           | Título                                                                                      | Estado       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------ |
| [SPEC-0001](SPEC-0001-vision-y-alcance.md)                     | Visión, problema y alcance                                                                  | Aprobada     |
| [SPEC-0002](SPEC-0002-requisitos-funcionales.md)               | Requisitos funcionales (RF) con criterios de aceptación                                     | Implementada |
| [SPEC-0003](SPEC-0003-requisitos-no-funcionales.md)            | Requisitos no funcionales (RNF): privacidad, rendimiento, accesibilidad                     | Implementada |
| [SPEC-0004](SPEC-0004-modelo-de-dominio.md)                    | Modelo de dominio, invariantes y glosario                                                   | Implementada |
| [SPEC-0005](SPEC-0005-demo-bn-plantillas-verificable-movil.md) | Demo en portada, blanco y negro, plantillas de zonas, verificabilidad y móvil (RF-14…RF-18) | Implementada |
| [SPEC-0006](SPEC-0006-tema-claro-y-oscuro.md)                  | Tema claro y oscuro (RF-19)                                                                 | Implementada |
| [SPEC-0007](SPEC-0007-sistema-visual-y-confianza.md)           | Sistema visual y confianza verificable (RF-20…RF-23)                                        | Implementada |
| [SPEC-0008](SPEC-0008-portada-y-editor.md)                     | Portada y editor de dos paneles (RF-24…RF-27)                                               | Implementada |
| [SPEC-0009](SPEC-0009-pixelado-iphone-y-preguntas.md)          | Tapado pixelado, fotos del iPhone y preguntas frecuentes (RF-28…RF-30)                      | Implementada |
| [SPEC-0010](SPEC-0010-cualquier-documento.md)                  | Cualquier documento, no solo el DNI (RF-31, RF-32)                                          | Implementada |
| [SPEC-0011](SPEC-0011-textos-breves-y-tarjeta-de-muestra.md)   | Textos breves y tarjeta de muestra (RF-33, RF-34)                                           | Implementada |
| [SPEC-0012](SPEC-0012-app-instalable-y-sin-conexion.md)        | App instalable y sin conexión (RF-35, RF-36)                                                | Implementada |
| [SPEC-0013](SPEC-0013-camara-trasera-y-frontal.md)             | Cámara trasera y frontal (RF-37)                                                            | Implementada |
| [SPEC-0014](SPEC-0014-publicacion-profesional.md)              | Publicación profesional: buscadores, redes y build (RF-38…RF-40)                            | Implementada |

Las decisiones de arquitectura están en [`docs/adr/`](../adr/) y la descripción de capas en
[`docs/arquitectura.md`](../arquitectura.md). El modelo de amenazas, en [`docs/amenazas.md`](../amenazas.md).

## Ciclo de vida de una spec

1. **Borrador**: se discute el problema y se redactan requisitos con criterios _Dado / Cuando / Entonces_.
2. **Aprobada**: los requisitos tienen identificador y no cambian sin una nueva revisión.
3. **Implementada**: cada RF tiene al menos un test que lo cubre y pasa en CI.
4. **Sustituida**: una spec posterior la reemplaza; se mantiene por trazabilidad.

Los cambios de alcance se hacen con una nueva spec (`SPEC-0015`, …), no editando una aprobada.
