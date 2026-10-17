# Modelo de amenazas

Qué protege copia-segura, de qué no protege y qué le pedimos al usuario. Sin esto, una herramienta
de "seguridad" promete más de lo que cumple.

## Activos

- El documento de identidad del usuario (imagen, metadatos de la foto).
- La confianza del usuario en que la herramienta no exfiltra nada.

## Amenazas que la herramienta mitiga

| Amenaza                                                                                              | Mitigación                                                                                                                                                     | Dónde se comprueba                                               |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| La copia entregada se reutiliza para otro trámite o se vende.                                        | Marca diagonal repetida con destinatario, finalidad y fecha que cruza foto, número y firma. Encarece la reutilización y deja constancia de a quién se entregó. | RF-07, e2e                                                       |
| Datos que el trámite no necesita viajan igualmente (número de trámite, código de barras, dirección). | Zonas tapadas con negro opaco pintado sobre los píxeles.                                                                                                       | RF-06, e2e "en el archivo exportado el píxel original no existe" |
| Texto pixelado que se recupera con técnicas de _depixelado_.                                         | Negro por defecto. El pixelado es opcional, de bloques grandes (la mitad del lado corto de la zona) y la interfaz desaconseja usarlo sobre números o texto.    | RF-28                                                            |
| La foto lleva ubicación, modelo de móvil y fecha en EXIF.                                            | La salida se genera desde un lienzo nuevo: sin EXIF, XMP ni ICC.                                                                                               | RF-08, test sobre el archivo generado                            |
| Una copia en alta resolución facilita falsificaciones físicas.                                       | Lado máximo 1200 px por defecto; nunca se amplía.                                                                                                              | RF-08                                                            |
| La herramienta misma envía el documento a un servidor.                                               | Sin backend; CSP con `connect-src 'self'` (solo el propio origen, estático); sin dependencias externas; test e2e que registra todas las peticiones.            | ADR-0001, ADR-0005, RNF-01                                       |
| El documento queda guardado en el navegador.                                                         | Solo memoria; nada en `localStorage`/`IndexedDB`. La caché guarda solo archivos de la app (ADR-0007): el documento no viaja por ninguna URL.                   | RNF-01, SPEC-0012, e2e "la caché solo guarda archivos de la app" |
| El _service worker_ sirve código viejo o ajeno.                                                      | Solo atiende `GET` del propio origen; versión nueva en cada despliegue, que borra las anteriores; código propio sin dependencias en `src/pwa/`.                | ADR-0007, tests de `src/pwa/rules.ts`                            |

## Amenazas que NO mitiga (y se dicen en la interfaz)

- **Eliminación de la marca con IA.** El _inpainting_ elimina bien texto fino sobre fondo uniforme. Una
  marca densa que cruza cara, números y firma, en una imagen de resolución reducida, deja artefactos
  y los sistemas de verificación suelen detectar la manipulación, pero no es imposible. La marca sube
  el coste; no lo hace infinito.
- **Un destinatario legítimo que hace mal uso.** Si el destinatario filtra la copia, la marca
  identifica el origen de la filtración, pero el documento ya está fuera.
- **Canal de envío inseguro.** La herramienta no sabe a quién envías la copia. Pedir una foto del DNI
  junto a un cambio de titularidad es exactamente el material de un _SIM swap_: usa solo canales
  oficiales (app, web o correo verificado), nunca el WhatsApp de "un asesor".
- **Lo que pasa después de Compartir.** El botón _Compartir_ entrega los JPG a la app que elijas
  en el menú del sistema; a partir de ahí la herramienta no controla nada.
- **Compromiso del propio dispositivo.** Si el navegador o el sistema están comprometidos, nada de lo
  anterior importa.

## Supuestos

- El navegador aplica la CSP y aísla el origen. Es el mismo supuesto que hace cualquier aplicación web.
- La CSP impide peticiones y recursos de otros dominios, pero no la navegación. La aplicación no
  navega por código y solo enlaza al repositorio (ADR-0005, _Límites conocidos_).
- GitHub Pages, como cualquier hosting, ve la IP del visitante al cargar la página. No hay más
  terceros que ese.
- El usuario descarga el resultado y envía _ese_ archivo, no el original.

## Qué revisar si cambias algo

- Añadir una dependencia: ¿carga algo en tiempo de ejecución? Debe empaquetarse (ADR-0005). Así se
  sirve la fuente Inter: es un recurso más del build, del propio origen.
- Mensajes de confianza: solo lo que se puede comprobar. Nada de "cifrado": no ciframos nada (RF-23).
- Añadir persistencia: ¿contiene algo del documento? Entonces no (RNF-01).
- Cambiar la marca por defecto: ¿sigue cruzando los campos sensibles en una tarjeta 86×54 mm? (RF-07)
