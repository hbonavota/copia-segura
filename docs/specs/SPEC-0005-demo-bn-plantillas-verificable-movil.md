# SPEC-0005 · Demo en portada, blanco y negro, plantillas de zonas, verificabilidad y móvil

**Estado:** Implementada · **Fecha:** 2026-10-17 · **Depende de:** SPEC-0002, SPEC-0004

## Contexto

Existen otras herramientas web que prometen procesar el documento en local. Revisando una de ellas
vimos dos cosas: presentan mejor el resultado (se entiende qué hacen antes de subir nada) y
ofrecen copia en blanco y negro; pero cargan servicios de terceros (fuentes y analítica), no tienen
política de seguridad de contenido ni código público, solo aceptan una imagen suelta y no permiten
comprobar lo que prometen.

Esta spec cierra esa diferencia de presentación y refuerza lo que nos distingue: **la privacidad
no se promete, se puede comprobar**.

## RF-14 · Demo en la portada

- Dado que no hay ninguna página cargada, entonces junto a la zona de carga se muestra una tarjeta
  ficticia procesada en vivo con el mismo pipeline que la exportación, con pestañas _Original_,
  _Tapado_, _Marca_ y _B/N_.
- Dada una pestaña, cuando se selecciona, entonces la imagen muestra ese paso acumulado (Tapado =
  original + zonas; Marca = tapado + marca; B/N = marca + blanco y negro) y un texto de una línea
  explica qué ha cambiado.
- Las pestañas se manejan con teclado (flechas izquierda/derecha) y tienen semántica `tablist`.

## RF-15 · Copia en blanco y negro

- Dada la opción _Blanco y negro_ activada, cuando se exporta, entonces el documento sale en escala
  de grises (luminancia Rec. 601) y la marca de agua conserva su color, para que siga destacando.
- Por defecto está desactivada. La vista previa la refleja (RF-09).

## RF-16 · Plantillas de zonas

- Dado un documento, el usuario puede aplicar una plantilla que propone las zonas típicas a tapar:
  _DNI España (frente)_, _DNI España (dorso)_, _DNI Argentina (frente)_, _DNI Argentina (dorso)_.
- Las zonas se expresan relativas a la tarjeta: se colocan sobre el recorte si existe y, si no,
  sobre la página entera. Se añaden a las que ya hubiera; _Deshacer zona_ las quita una a una.
- La interfaz avisa de que son aproximadas y deben revisarse.

## RF-17 · Compruébalo tú

- La interfaz incluye un bloque visible que explica cómo verificar la privacidad sin leer código:
  abrir la pestaña _Red_ y comprobar que no hay peticiones a otros dominios, ver la política de
  seguridad en el código fuente de la página, y enlaces al repositorio y al test que lo comprueba.
- Un bloque _Qué la hace distinta_ resume el diferencial: sin terceros (ni analítica ni fuentes
  externas), CSP que lo impone, código abierto, PDF de varias páginas, metadatos eliminados,
  resolución limitada y honestidad sobre los límites de la marca.

## RF-18 · Móvil primero

- En pantallas estrechas el editor aparece antes que la tira de páginas y los ajustes, y la barra de
  exportación queda fija abajo.
- Dado un navegador que permite compartir archivos (Web Share API nivel 2), aparece _Compartir_:
  genera los JPG igual que _Descargar_ y abre el menú nativo del sistema. Si no lo permite, el botón
  no aparece. Cancelar el menú no es un error.

## Fuera de alcance

- Dominio propio e imagen para redes (decisión del propietario).
- Detección automática de la posición real de los campos (OCR): las plantillas son fijas.
