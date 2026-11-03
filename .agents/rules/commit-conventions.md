---
description: "Solicitada por el agente cuando prepare staging, revise un diff o cree un commit."
---

# Commits y validacion

## Regla

- Ejecutar los cinco pasos de [AGENTS.md](../../AGENTS.md#flujo-obligatorio-antes-de-cada-commit), en orden, antes de CADA commit. Stage solo de paths explicitos; conservar cambios ajenos.
- Para esta entrega usar mensajes convencionales `tipo(scope): descripcion`, con scope opcional. Separar memory bank, workflow raiz, reglas y skill en los cuatro commits solicitados. No presentar esta convencion como practica historica ya consolidada.
- Verificar `git log --oneline -10 main`: en la base inspeccionada aparecen `Fase`, `Agrega`, `Hito` y merges libres. El nuevo formato es politica de la entrega agent-ready.
- Correr checks scoped reales; no inventar `npm test` ni runners de Python que no figuran en manifests. Registrar fallos y no usar `--no-verify`. La excepcion documental para deuda previa solo aplica segun AGENTS y con diff de producto vacio frente a main.
- Actualizar progress cuando cambie el estado; repetir checks si se modifica despues de validar. Antes del commit ejecutar `git diff --cached --check`; despues `git status -sb` y `git log -1 --oneline`.
- No hacer push ni mergear PRs por iniciativa propia. El PR #9 apunta a una rama de feature: releer su base y dependencias antes de proponer orden de merge.

## Rationale

Los commits pequenos permiten revisar documentacion y configuracion sin mezclar correcciones de producto ni cambios de dependencias. Los checks fallidos previos deben seguir visibles; un commit documental no certifica que las apps esten verdes.

## Evidence

- [AGENTS.md](../../AGENTS.md): workflow, mensajes y protecciones de esta entrega.
- [progress.md](../../memory-bank/progress.md): snapshot Git/PRs, resultados baseline y evidencia de cada fallo.
- [package.json](../../package.json), [backoffice/package.json](../../uis/backoffice/package.json), [tracker/package.json](../../uis/talent-pipeline-tracker/package.json), [pyproject.toml](../../packages/incidents-analysis/pyproject.toml): comandos y ausencia de runners de tests declarados.