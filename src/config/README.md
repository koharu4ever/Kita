# `src/config`

Application configuration belongs here.

Planned uses:

- site-level constants
- typesafe environment validation
- deployment/runtime configuration helpers

Do not read secrets from client components.

Environment variables should be read through `src/config/env.ts`, not directly
through `process.env` in feature or app code.
