# SPEC-0013 · Cámara trasera y frontal

**Estado:** Implementada · **Fecha:** 2026-10-24 · **Depende de:** SPEC-0002 (RF-03)

## Contexto

RF-03 pensó la cámara para una sola foto: el usuario sosteniendo el documento junto a la cara, que
es lo que piden algunos trámites. Por eso pedía la cámara frontal. Pero lo más habitual es otra
cosa: fotografiar el documento en sí, y eso se hace con la cámara trasera, que tiene más resolución
y enfoque. En el móvil no había forma de usarla.

Esta spec **modifica RF-03**: la captura empieza con la trasera, se puede cambiar a la frontal y
solo la frontal se previsualiza en espejo.

## RF-37 · Elegir cámara

- Dado un dispositivo con cámara trasera, cuando se abre la captura, entonces se enciende la
  trasera y la ayuda explica cómo fotografiar un documento (superficie lisa, buena luz, sin
  reflejos, documento entero en el encuadre).
- Dado un dispositivo con más de una cámara, cuando la captura está abierta, entonces hay un botón
  **Cambiar de cámara** sobre la vista previa que alterna entre trasera y frontal. La ayuda y el
  título cambian con la cámara (con la frontal, los de RF-03: foto sosteniendo el documento) y se
  anuncia la cámara en uso a los lectores de pantalla.
- Al cambiar, la cámara anterior se apaga **antes** de encender la otra: muchos móviles no permiten
  dos a la vez, y ninguna queda encendida al cerrar o tras la foto.
- Dado un dispositivo con una sola cámara (un portátil), entonces no aparece el botón y se usa la
  que haya: la cámara se pide como preferencia (`facingMode: { ideal }`), nunca como requisito, así
  que pedir la trasera no falla donde no existe.
- La vista previa va en espejo solo con la cámara frontal (para encuadrarse como en un espejo). Con
  la trasera no: se ve como es. La foto capturada **nunca** va en espejo.
- La cámara en uso es la que informa el navegador; si no lo informa (las webcams no suelen) y es la
  única, se trata como frontal.

## Pruebas

- Unitarias: cámara por defecto, alternancia, cuándo se ofrece cambiar y cómo se deduce la cámara en
  uso.
- e2e: un móvil simulado con dos cámaras de distinto color comprueba el espejo, el cambio, que la
  foto sale de la cámara elegida y que todas las cámaras quedan apagadas; y un portátil simulado con
  una sola, que no se ofrece cambiar.
