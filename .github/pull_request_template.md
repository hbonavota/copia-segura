## Qué cambia

<!-- Una o dos frases. -->

## Requisito que cubre

<!-- RF-xx / RNF-xx de docs/specs, o "ninguno" si es mantenimiento. Si el cambio altera el
     alcance, va primero una nueva spec (docs/specs/README.md). -->

## Comprobaciones

- [ ] `npm run check` en verde (lint, typecheck, formato, tests, build)
- [ ] `npm run test:e2e` en verde
- [ ] Si añade una dependencia: se empaqueta, no carga nada en tiempo de ejecución (ADR-0005)
- [ ] Si toca la marca, el recorte o las máscaras: el test unitario del dominio cubre el caso
