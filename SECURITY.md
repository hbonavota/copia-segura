# Seguridad

## Qué garantiza esta herramienta

copia segura procesa el documento íntegramente en el navegador. El HTML publicado lleva una
_Content Security Policy_ que impide cualquier petición a otros dominios, no hay analítica ni
dependencias cargadas en tiempo de ejecución, y el documento no se guarda en ningún almacenamiento
del navegador. El [modelo de amenazas](docs/amenazas.md) detalla qué cubre y qué no.

## Reportar una vulnerabilidad

Si encuentras una forma de que el documento salga del navegador, de que quede guardado, o de que la
salida conserve datos que debería eliminar (metadatos, píxeles bajo una zona tapada), no abras un
issue público: usa [GitHub Security Advisories](https://github.com/hbonavota/copia-segura/security/advisories/new)
para reportarlo en privado. Responderé en un plazo de siete días.

Cualquier otro fallo (la marca no se ve bien, un PDF no abre) sí es un issue normal.

## Alcance

- Código de este repositorio y la versión publicada en GitHub Pages.
- No cubre vulnerabilidades del propio navegador, del sistema operativo ni de las dependencias
  aguas arriba (pdf.js, pdf-lib, JSZip), que se reportan a sus proyectos; sí agradezco el aviso
  para actualizar la versión.
