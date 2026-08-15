# Kita repository instructions

## Start here

- Read `docs/CODEX_HANDOFF.md` and `docs/current-project-status.md` completely before changing the project.
- Use `docs/README.md` to select the single relevant topic document.
- Inspect Git status, the current branch, and the workspace path before editing.
- Treat `C:\dev\Kita` as the active workspace; the old D-drive checkout is retired.

## Development environment

- Run Node, pnpm, Payload, tests, and build commands inside the Dev Container as the `node` user.
- Use pnpm and the scripts defined in `package.json`; do not install project dependencies on Windows.
- Local PostgreSQL runs in Docker-in-Docker and contains manually reconstructed development data.
- Prefer an already running development server. Do not start, stop, recreate, or remove Docker services unless the task requires it.
- Stop `pnpm dev` before running `pnpm build` because both use `.next`.

## Data and infrastructure safety

- Never run `docker compose down -v`, `docker volume prune`, `docker system prune`, or an equivalent broad destructive command.
- Do not remove existing project volumes. An exactly named temporary volume created during the current task may be removed after verifying its identity.
- Do not drop, reset, restore, or replace a database without explicit user authorization and a confirmed backup target.
- Do not read, print, copy, or commit secret values. Never commit `.env` or `/home/node/.codex` contents.
- Do not modify Coolify, Cloudflare, R2, DNS, VPS, production databases, production volumes, or production content without explicit authorization.
- Treat a local Docker or database command as affecting user data even though Docker-in-Docker is separate from production.

## Change workflow

- Preserve unrelated user changes and stage only files that belong to the requested task.
- Use `codex/<short-task-name>` branches and Pull Requests; never push directly to `main`.
- Do not commit, push, open or merge a Pull Request, or deploy unless the user explicitly requested that action.
- Keep migrations with their schema changes and review both `up` and `down` behavior.
- Run checks proportional to risk. The normal full gate is `pnpm test`, `pnpm check`, and `pnpm build`.
- Update one authoritative document instead of copying mutable facts across multiple files.
