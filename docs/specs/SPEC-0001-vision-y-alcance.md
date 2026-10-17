# SPEC-0001 · Visión, problema y alcance

**Estado:** Aprobada · **Fecha:** 2026-10-17

## Problema

Cada vez que una empresa pide "una foto del DNI" (cambio de titularidad de una línea, alta en un
servicio, verificación de identidad, alquiler…), la persona entrega una copia íntegra y reutilizable
de su documento, normalmente con los metadatos de la foto (modelo del móvil, fecha, a veces
ubicación). Si esa copia se filtra o se reutiliza, no hay forma de demostrar a quién se entregó ni
para qué, y el documento sirve tal cual para suplantar la identidad.

Las agencias de protección de datos recomiendan entregar copias **limitadas**: con una marca que
indique destinatario, finalidad y fecha, tapando los datos que el trámite no necesita y con la
resolución justa. Hacerlo a mano cada vez es tedioso, y las webs de "añadir marca de agua" obligan a
subir el documento a un servidor ajeno, que es exactamente lo que se quiere evitar.

## Propuesta

**copia-segura** es una aplicación web que prepara esa copia limitada **sin que el documento salga
del dispositivo**: todo el procesado ocurre en el navegador, no hay servidor y la página no hace
ninguna petición de red después de cargarse.

A partir de un PDF, una foto o una captura de la cámara, permite:

1. girar, recortar y tapar zonas (número de trámite, código de barras, dirección…);
2. estampar una marca diagonal repetida con destinatario, finalidad y fecha, editable;
3. reducir la resolución, eliminar metadatos y descargar el resultado en JPG o PDF.

## Para quién

- Personas que tienen que enviar su documento a una empresa y quieren limitar el daño si la copia
  se reutiliza.
- Equipos de atención al cliente que quieran recomendar una herramienta a sus usuarios sin
  pedirles que suban el documento a un tercero.

## Principios

| Principio                   | Qué implica                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local por diseño            | Ningún dato del documento abandona el navegador. No es una promesa: es verificable (CSP, sin dependencias en tiempo de ejecución, sin analítica). |
| Honestidad sobre el alcance | La marca de agua disuade y deja rastro; no impide un mal uso. La interfaz lo explica en vez de prometer seguridad.                                |
| Sin instalación             | Se usa desde la URL publicada o con `npm start` en local. Nada que configurar.                                                                    |
| Pequeño y legible           | Código por capas, sin framework de UI, con tests trazables a los requisitos. Que un desarrollador pueda auditarlo en una tarde.                   |

## Fuera de alcance (v1)

- Detección automática de campos del documento (OCR). Las zonas se tapan a mano.
- Marcas de agua invisibles o esteganografía.
- Cuentas de usuario, historial o sincronización: no hay nada que guardar.
- Formatos de entrada que el navegador no decodifica de forma nativa (HEIC fuera de Safari). Se
  informa al usuario y se le indica cómo convertirlo.
- Aplicación de escritorio o móvil nativa.

## Criterio de éxito

Una persona sin conocimientos técnicos prepara, en menos de dos minutos y sin leer instrucciones,
una copia de su documento con marca, zonas tapadas y resolución reducida, y puede comprobar en la
pestaña _Red_ de su navegador que no se ha enviado nada.
