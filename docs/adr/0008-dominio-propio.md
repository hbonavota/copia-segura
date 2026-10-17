# ADR-0008 · Dominio propio: copia-segura.orbytia.es

**Estado:** Aceptada · **Fecha:** 2026-10-18 · **Modifica:** ADR-0006

## Contexto

ADR-0006 publicó la app en la URL del proyecto (`hbonavota.github.io/copia-segura/`) sin dominio
propio. Para compartirla y para que forme parte del trabajo de Orbytia Tech conviene una dirección
corta y con marca. El alojamiento no cambia: sigue siendo GitHub Pages, desplegado solo tras CI.

## Decisión

1. La app se publica en `https://copia-segura.orbytia.es/`, con un registro `CNAME`
   `copia-segura → hbonavota.github.io` en el DNS de orbytia.es (Hostinger) y el dominio
   configurado en _Settings › Pages_, con HTTPS obligatorio.
2. El workflow de despliegue ya no fija la ruta: toma `base_path` de `actions/configure-pages`.
   Con dominio propio la app vive en la raíz (`/`); sin él, bajo `/<repositorio>/`. Un fork o un
   cambio de dominio no requieren tocar código.
3. El dominio orbytia.es se verifica en la cuenta de GitHub (registro `TXT`) para que nadie más
   pueda publicar en un subdominio suyo si algún día se retira de Pages.
4. CI pasa los e2e dos veces: bajo `/copia-segura/` (el caso más exigente con las rutas relativas)
   y en la raíz, como en el dominio propio.

## Consecuencias

- La URL antigua redirige a la nueva (lo hace GitHub Pages).
- Las garantías de privacidad no cambian: el servidor que aloja la página sigue siendo GitHub Pages
  y el DNS solo resuelve el nombre. El _manifest_ y el _service worker_ usan rutas relativas.
- Una app instalada desde la URL antigua es otro origen: hay que instalarla de nuevo desde la nueva.
- La dirección depende de renovar orbytia.es.
