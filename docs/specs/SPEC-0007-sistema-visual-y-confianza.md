# SPEC-0007 · Sistema visual y confianza verificable

**Estado:** Implementada · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0005, SPEC-0006

## Contexto

La herramienta funciona, pero su aspecto es el de un formulario técnico: el rojo del sello compite
con el azul de los botones y el negro de las selecciones, las tarjetas de intensidad ocupan medio
panel y el mensaje de privacidad es una línea de texto que no se puede comprobar.

Revisamos tres herramientas parecidas (ProtegeDNI, Pantallazo y Sinologic). Las tres prometen
"100 % en tu navegador" y las tres cargan servicios de terceros (Google Analytics, AdSense, Tag
Manager o Google Fonts) sin ninguna política de seguridad de contenido. Nuestra diferencia no es
estética: es que **se puede comprobar**. Esta spec la hace visible y ordena el aspecto.

## RF-20 · Sistema visual

- Neutros fríos para fondos, paneles y bordes; **un solo color de acción** (azul tinta); **verde
  solo para señales de confianza**; el **rojo del sello solo para la marca y el sello** del nombre.
- Cada color es un par claro / oscuro (RF-19). Texto y controles cumplen contraste AA (RNF-04).
- Tipografía Inter Variable **alojada en el propio origen** (la CSP no cambia: `font-src 'self'`),
  con cifras tabulares en valores numéricos. La marca de agua no cambia de fuente: la copia
  exportada es idéntica a la de versiones anteriores con los mismos ajustes.
- Radios de 6 / 8 / 12 px, bordes de 1 px y casi sin sombras; foco visible con anillo de 3 px.

## RF-21 · Intensidad como control segmentado

- Las dos opciones (_Visible_ y _Discreta_) son un grupo de radio presentado como control
  segmentado, cada una con una muestra de cómo se ve la marca.
- Dado el teclado, las flechas cambian de opción (semántica nativa de `radio`).

## RF-22 · Contador de peticiones a otros dominios

- La cabecera muestra en todo momento cuántas peticiones ha hecho la página a otros dominios
  (lo normal: **0**), medido en vivo con la API de _Resource Timing_ del navegador.
- Dada una petición a otro origen registrada por el navegador, entonces el contador sube y cambia
  a color de aviso. `data:` y `blob:` no cuentan: no salen del equipo.
- Al pulsarlo lleva al apartado _Compruébalo tú_ (RF-17).
- Límite declarado: _Resource Timing_ solo ve las peticiones del documento, no las de los
  _workers_. Por eso el contador acompaña, no sustituye, a la CSP y al test e2e (RNF-01), que sí
  cubren también el worker de pdf.js.

## RF-23 · Textos y confirmación

- Titular, carga, campos y botones se reescriben para ser más cortos y directos (ver `i18n/`).
- Bajo la zona de carga, tres señales comprobables: _Se procesa en este dispositivo_, _Sin
  analítica ni cookies_, _Código abierto_. No se habla de "cifrado": no ciframos nada.
- Al terminar una exportación, el aviso es de éxito, con un icono que se marca una vez y el texto
  _Nada ha salido de tu equipo_. Respeta _reducir movimiento_.

## Fuera de alcance

- Cambiar a un framework de interfaz (ADR-0003 sigue vigente).
- Comparativas con competidores dentro de la interfaz.
