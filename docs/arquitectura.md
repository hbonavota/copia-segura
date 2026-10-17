# Arquitectura

copia-segura es una aplicación de una sola página sin backend. El código se organiza en cuatro capas
con dependencias en un solo sentido (ADR-0002). Esta página describe qué hay en cada una y cómo
atraviesa un caso de uso el sistema.

```mermaid
flowchart LR
  subgraph ui["ui/ (DOM, estado de la interfaz)"]
    Main["main.ts<br/>raíz de composición"]
    Views["vistas: dropzone, page-strip,<br/>editor, settings, export-bar, camera"]
    Store["store.ts"]
  end
  subgraph app["application/ (casos de uso y puertos)"]
    UC["ImportFiles · RenderPage<br/>ExportCopies · CaptureFromCamera"]
    Ports["puertos: PdfReader, ImageDecoder,<br/>Rasterizer, TextMeasurer, PdfWriter,<br/>Archiver, Downloader, Sharer, Camera, Clock"]
  end
  subgraph dom["domain/ (puro)"]
    D["Page · PageEdits · NormalizedRect<br/>WatermarkStyle · WatermarkText · OutputOptions<br/>CopyPlan · presets · geometry · watermark · pdf-images"]
  end
  subgraph infra["infrastructure/ (adaptadores)"]
    I["PdfJsReader · BrowserImageDecoder<br/>CanvasRasterizer · CanvasTextMeasurer<br/>PdfLibWriter · JsZipArchiver<br/>AnchorDownloader · WebShareSharer<br/>MediaDevicesCamera · SystemClock"]
  end
  Main --> Views --> Store
  Views --> UC
  UC --> Ports
  UC --> D
  I -. implementa .-> Ports
  Main --> I
```

## Capas

### `src/domain/`

Funciones puras y tipos. Sin imports externos a la carpeta, sin DOM, sin `Date.now()`.

| Módulo          | Responsabilidad                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `types.ts`      | `Page`, `PageEdits`, `Rotation`, `NormalizedRect`, `WatermarkStyle`, `WatermarkText`, `OutputOptions`, `CopyPlan`.                         |
| `geometry.ts`   | Normalizar rectángulos, girarlos con la página, intersectar con el recorte, escalar a píxeles, `fitWithin`.                                |
| `presets.ts`    | Presets _Normal_ y _Suave_; `resolveStyle(preset, overrides)`; acotación de rangos.                                                        |
| `watermark.ts`  | Composición del texto (`composeWatermarkText`) y cálculo del mosaico (`layoutWatermark`), que recibe una función `MeasureText` para medir. |
| `plan.ts`       | `planCopy(...)`: combina todo lo anterior en un `CopyPlan` determinista.                                                                   |
| `pdf-images.ts` | Reconstrucción de la matriz de transformación sobre la lista de operadores de un PDF para localizar imágenes incrustadas.                  |
| `templates.ts`  | Plantillas de zonas a tapar por tipo de documento, relativas a la tarjeta (RF-16).                                                         |
| `templates.ts`  | Plantillas de zonas a tapar por tipo de documento, relativas a la tarjeta (RF-16).                                                         |
| `naming.ts`     | Nombres de archivo de salida.                                                                                                              |

### `src/application/`

Casos de uso (una función o clase pequeña por caso) y puertos (interfaces TypeScript). Solo importa
`domain`.

- `ImportFiles`: decide por extensión/`type` si un archivo es PDF o imagen, usa `PdfReader` o
  `ImageDecoder` y devuelve `Page[]` con etiquetas únicas. Propone recorte automático para páginas
  de PDF con una imagen grande.
- `RenderPage`: `planCopy` + `Rasterizer.render(plan)` → bitmap. Lo usan la vista previa y la exportación.
- `ExportCopies`: renderiza cada página, codifica a JPEG y entrega un JPG, un ZIP o un PDF.
- `CaptureFromCamera`: abre la cámara, captura un fotograma sin espejo, cierra la cámara.

### `src/infrastructure/`

Un archivo por adaptador. Es la única capa que conoce pdf.js, canvas, pdf-lib, JSZip, `getUserMedia`
o el DOM de descarga. Cada adaptador implementa exactamente un puerto.

### `src/ui/`

- `main.ts`: raíz de composición. Construye los adaptadores, los casos de uso y monta las vistas.
- `store.ts`: estado observable mínimo (`get`, `set`, `subscribe`).
- `views/*.ts`: cada vista recibe el elemento raíz, el store y las dependencias que necesita.
- `i18n/`: diccionarios `es` y `en`.
- `styles.css`: tokens de diseño y estilos. Sin preprocesador.

## Un caso de uso de principio a fin: exportar un PDF

1. La vista `export-bar` llama a `ExportCopies.run({ format: 'pdf' })` con las páginas del store.
2. `ExportCopies` recorre las páginas; para cada una llama a `planCopy` (dominio) con la página, sus
   ediciones, el estilo y texto de la marca y las opciones de salida. Para medir el texto, el dominio
   recibe la función del puerto `TextMeasurer`.
3. El `CopyPlan` resultante (tamaño de salida, giro, recorte, máscaras en píxeles, posiciones del
   mosaico) se pasa a `Rasterizer.render`, que lo ejecuta sobre un canvas nuevo.
4. El canvas se codifica a JPEG con la calidad del plan. `PdfWriter.write(jpegs)` construye el PDF con
   una página por imagen y `Downloader.download(blob, name)` lo entrega al usuario.
5. Nada de esto toca red ni almacenamiento: todo son `Blob` en memoria que se liberan al terminar.

## Pruebas

| Nivel        | Qué cubre                                                                                                          | Herramienta                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Unitarias    | `domain` y `application` con puertos falsos. Nombradas por requisito (`RF-07`).                                    | Vitest, entorno Node         |
| Arquitectura | Regla de dependencia entre capas.                                                                                  | Vitest (análisis de imports) |
| E2E          | Flujo completo con el documento de ejemplo en Chromium: importar, tapar, exportar, y **cero peticiones externas**. | Playwright                   |
