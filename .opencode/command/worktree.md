---
description: Crea un git worktree en .worktrees/<slug-kebab> a partir de un argumento libre.
---

Recibe este texto libre:

$ARGUMENTS

Pasos:
1. Normaliza a kebab-case: minúsculas, quita acentos/diéresis, convierte todo lo
   que no sea [a-z0-9] en guion, colapsa guiones repetidos y recorta los extremos.
2. Si ya existe `.worktrees/<slug>` o la rama `<slug>`, aborta y avisa; no fuerces nada.
3. Ejecuta exactamente:

git worktree add .worktrees/<slug>

No cambies de directorio ni hagas nada más. Muestra el resultado.
