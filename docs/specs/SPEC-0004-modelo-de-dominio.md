# SPEC-0004 · Modelo de dominio

**Estado:** Implementada · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0002

El dominio es **puro**: no conoce el DOM, `canvas`, pdf.js ni ningún formato de archivo. Recibe
números y devuelve números (o un _plan_ de dibujo que otra capa ejecuta). Eso es lo que permite
probarlo sin navegador.

## Entidades y objetos de valor

| Nombre           | Qué es                                                                                                                                                                                                                              | Invariantes                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Page`           | Una imagen de origen (página de PDF, foto o captura) con su etiqueta (`p1`, `foto-2`, `camara-1`) y tamaño en píxeles.                                                                                                              | Ancho y alto > 0. El `id` es único en el proyecto; la etiqueta lo es dentro de su archivo de origen, y los nombres de salida se desambiguan al exportar (`-2`, `-3`…). |
| `Rotation`       | Giro aplicado a la página: `0 \| 90 \| 180 \| 270` grados en sentido horario.                                                                                                                                                       | Solo múltiplos de 90.                                                                                                                                                  |
| `NormalizedRect` | Rectángulo en coordenadas relativas `[0, 1]` del **marco de página** (la página ya girada, sin recortar).                                                                                                                           | `0 ≤ x < x + w ≤ 1`, igual en `y`. Se normaliza siempre (nunca se almacena con ancho negativo).                                                                        |
| `PageEdits`      | Lo que el usuario ha hecho a una página: `rotation`, `crop?` (un `NormalizedRect`) y `masks` (lista de `NormalizedRect`).                                                                                                           | Las máscaras y el recorte viven en el marco de página. Al girar, se transforman para seguir cubriendo el mismo contenido.                                              |
| `WatermarkStyle` | Parámetros visuales de la marca: `opacity` (0–100), `sizePct` (alto del texto en % del ancho de salida), `spacing` (en altos de texto), `angleDeg`, `color` (RGB), `outline` (borde blanco).                                        | Rangos acotados; fuera de rango se recorta al límite.                                                                                                                  |
| `WatermarkText`  | Composición del texto: `freeText`, `recipient`, `purpose`, `includeDate`.                                                                                                                                                           | El texto final nunca está vacío si `includeDate` es `true`; si todo está vacío y sin fecha, no se dibuja marca.                                                        |
| `OutputOptions`  | `maxSide` (px), `jpegQuality` (0–1), `format` (`jpg` \| `pdf` \| `zip`).                                                                                                                                                            | `maxSide ≥ 200`. La imagen nunca se amplía.                                                                                                                            |
| `CopyPlan`       | Resultado de combinar `Page` + `PageEdits` + `WatermarkStyle` + `WatermarkText` + `OutputOptions`: tamaño de salida, transformación de origen, máscaras en píxeles de salida y mosaico de la marca (posiciones de cada repetición). | Determinista: mismas entradas, mismo plan. No contiene píxeles.                                                                                                        |

## Reglas

1. **Marco de página.** Todas las coordenadas del usuario se guardan normalizadas respecto a la
   página girada. Así son independientes de la resolución de salida y de la escala de la vista previa.
2. **Orden del pipeline.** Origen → giro → recorte → escala a `maxSide` → máscaras → marca → codificación.
   La vista previa y la exportación ejecutan el **mismo** plan.
3. **Giro con contenido.** Al cambiar `rotation`, cada `NormalizedRect` se transforma con la misma
   rotación, de forma que sigue cubriendo los mismos píxeles de origen.
4. **Mosaico de la marca.** Dado el tamaño de salida `W×H` y el alto del texto `h = W·sizePct/100`:
   el texto se mide (ancho `tw`), las filas se separan `h·spacing`, las repeticiones en una fila se
   separan `tw + W/10` y las filas impares se desplazan media celda. El mosaico se calcula sobre un
   lienzo de lado `1,1·√(W²+H²)` centrado en la imagen y girado `angleDeg`, para que al girar siga
   cubriendo las esquinas.
5. **Máscaras opacas.** Una máscara es negro sólido pintado sobre los píxeles de salida. No hay capa
   que quitar después.
6. **Sin metadatos.** La salida se genera desde un lienzo nuevo; por construcción no hereda EXIF,
   XMP ni perfil ICC. El PDF de salida solo lleva las imágenes, el título/productor "copia-segura" y
   la fecha de creación de la propia copia (nada del documento original).

## Detección de imágenes incrustadas en PDF (RF-01)

Dada la lista de operadores de una página (lo que pdf.js devuelve en `getOperatorList`), el dominio
reconstruye la matriz de transformación en cada `paintImageXObject` (siguiendo `save`, `restore`,
`transform` y los `Form XObject`) y calcula el rectángulo que ocupa cada imagen en el espacio de la
página. Si alguna ocupa ≥ 5 % del área, la mayor se propone como recorte inicial. Esta función es
pura: recibe operadores y matrices, devuelve rectángulos.

## Glosario

- **Copia limitada**: copia de un documento con marca de finalidad, zonas tapadas y resolución reducida.
- **Marco de página**: sistema de coordenadas normalizado de la página girada.
- **Plan**: descripción declarativa de cómo dibujar la salida; lo ejecuta la capa de infraestructura.
- **Preset**: conjunto de valores por defecto de `WatermarkStyle` (_Normal_, _Suave_).
