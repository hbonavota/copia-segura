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
- Radios de 6 / 8 / 12 px, bordes de 1 px y casi sin sombras; foco siempre visible (contorno de
  2 px en el color de acción). Los controles y sus estados cumplen 3:1 de contraste (WCAG 1.4.11).

## RF-21 · Intensidad como control segmentado

- Las dos opciones (_Visible_ y _Discreta_) son un grupo de radio presentado como control
  segmentado, cada una con una muestra de cómo se ve la marca.
- Dado el teclado, las flechas cambian de opción (semántica nativa de `radio`).

## RF-22 · Contador de recursos de otros dominios

- La cabecera muestra cuántos recursos de otros dominios ha registrado el navegador en esta página
  (lo normal: **0**), en vivo, con la API de _Resource Timing_.
- Dado un recurso de otro origen registrado, el contador sube y cambia a color de aviso. `data:` y
  `blob:` no cuentan: no salen del equipo.
- Al pulsarlo lleva al apartado _Compruébalo tú_ (RF-17). En pantallas estrechas solo se ve la
  cifra; el texto completo va en su etiqueta accesible.
- Límites declarados, por eso se llama "recursos registrados" y no "peticiones":
  - _Resource Timing_ registra los recursos que el documento intenta cargar (imágenes, scripts,
    hojas de estilo, fuentes), **también cuando la CSP los bloquea**: el contador puede subir sin
    que nada haya salido. Mejor un falso aviso que un silencio.
  - Un `fetch` bloqueado por la CSP no deja registro, y las peticiones de los _workers_ tampoco
    aparecen aquí.
- Por todo ello el contador acompaña, no sustituye, a la CSP y al test e2e (RNF-01), que son la
  garantía real.

## RF-23 · Textos y confirmación

- Titular, carga, campos y botones se reescriben para ser más cortos y directos (ver `i18n/`).
- Bajo la zona de carga, tres señales comprobables: _Se procesa en este dispositivo_, _Sin
  analítica ni cookies_, _Código abierto_. No se habla de "cifrado": no ciframos nada.
- Al terminar una exportación, el aviso es de éxito, con un icono que se marca una vez y el texto
  _Nada ha salido de tu equipo_. Respeta _reducir movimiento_.

## Fuera de alcance

- Cambiar a un framework de interfaz (ADR-0003 sigue vigente).
- Comparativas con competidores dentro de la interfaz.
