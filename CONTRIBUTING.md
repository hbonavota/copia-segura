# Contribuir

Gracias por querer mejorar copia segura. Estas son las reglas de la casa; son pocas y todas tienen
un motivo.

## Antes de escribir código

1. **Busca el requisito.** Cada comportamiento viene de un `RF-xx` o `RNF-xx` en
   [`docs/specs/`](docs/specs/). Si tu cambio encaja en uno existente, cítalo en el PR y en el test.
2. **Si cambia el alcance, primero la spec.** Un requisito nuevo o distinto se propone como una
   spec nueva (`SPEC-0012-…`), no editando una aprobada. Se discute en el PR de la spec antes de
   implementar nada. Así la conversación es sobre qué queremos, no sobre un código ya escrito.
3. **Si cambia una decisión de arquitectura, un ADR nuevo** que sustituya al anterior.

## Al escribir código

- Respeta la regla de dependencia (`ui → application → domain`; `infrastructure` implementa
  puertos). Hay un test que la comprueba y CI lo ejecuta.
- La lógica va en `domain/` y se prueba sin navegador. Si necesitas el DOM, canvas o una librería,
  es un adaptador en `infrastructure/` detrás de un puerto.
- Nada de red, salvo al propio origen. Si una dependencia carga algo en tiempo de ejecución desde
  otro dominio, no entra (ADR-0005).
- Nada del documento del usuario se persiste. Ni "temporalmente".
- Textos de interfaz en `src/ui/i18n/`, en español e inglés.

## Tests

- Un test unitario por criterio de aceptación que toques, nombrado por el requisito:
  `describe('RF-06 · tapar zonas', …)`.
- Los e2e cubren flujos completos con el documento de ejemplo; no añadas uno por cada detalle.
- `npm run check` y `npm run test:e2e` en verde antes de abrir el PR.

## Commits y PR

- [Conventional Commits](https://www.conventionalcommits.org/) con el requisito cuando aplica:
  `feat(editor): recorte con el puntero (RF-05)`, `fix(watermark): esquinas sin texto en 9:16 (RF-07)`,
  `docs(adr): ADR-0007 …`.
- Un PR, un tema. La plantilla pide el requisito y las comprobaciones; rellénala.

## Entorno

Node 22.13+ (ver `.nvmrc`). `npm install`, `npm start`. Para los e2e, `npx playwright install chromium` una vez.
