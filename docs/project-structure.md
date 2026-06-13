# Project Structure

This project follows the feature-oriented spirit of `bulletproof-react`, adapted
for Next.js App Router, Payload CMS, and Docker-based deployment.

The goal is not to copy every folder from a generic React SPA. The goal is to
keep code easy to locate, make feature boundaries visible, and prevent shared
code from becoming an unstructured dumping ground.

## Top-Level Layout

```txt
src/
  app/        Next.js routes, layouts, metadata, route handlers
  config/     App configuration and future environment validation
  features/   Business feature modules
  server/     Server-only integrations and adapters
  shared/     Cross-feature UI, utilities, hooks, and types
  testing/    Test utilities and fixtures
```

## Dependency Direction

Prefer this dependency direction:

```txt
app -> features -> shared
app -> server
features -> server
server -> shared
```

Avoid these directions:

```txt
shared -> features
shared -> app
server -> app
```

This keeps reusable code independent and prevents low-level modules from knowing
about routes or specific business features.

## `src/app`

The `app` directory is owned by Next.js App Router.

Use it for:

- route segments
- layouts
- metadata
- loading and error boundaries
- route handlers
- server component composition

Avoid putting large business logic directly in route files. Route files should
usually compose feature modules and server adapters.

## `src/features`

Features are vertical slices of business behavior.

Future examples:

```txt
features/
  articles/
    components/
    data/
    types/
  projects/
    components/
    data/
    types/
```

Use a feature folder when code belongs to one domain area and is not broadly
reusable.

Do not create a feature folder before the feature exists.

## `src/shared`

Shared code is cross-feature infrastructure.

Suggested subfolders:

```txt
shared/
  components/  Reusable UI components that are not domain-specific
  hooks/       Reusable React hooks
  lib/         Framework-agnostic helpers
  types/       Shared TypeScript types
```

Shared code should stay boring and dependency-light.

## `src/server`

Server-only code lives here.

This is where future Payload CMS and database-facing adapters can be placed
without mixing server concerns into React components.

Future examples:

```txt
server/
  payload/
  database/
```

Payload and PostgreSQL are intentionally not wired in yet.

## `src/config`

Configuration code lives here.

Future examples:

```txt
config/
  env.ts
  site.ts
```

Typesafe environment validation can be added later with `zod` or
`@t3-oss/env-nextjs`.

## `src/testing`

Test utilities and fixtures live here when tests are introduced.

This directory should contain test helpers, not production business logic.

## Import Rules

Use the `@/*` alias for imports from `src`.

Good:

```ts
import { formatDate } from "@/shared/lib/format-date";
```

Avoid deep relative imports:

```ts
import { formatDate } from "../../../shared/lib/format-date";
```

## When To Add Code

Add code where it naturally belongs:

- Route-specific composition: `src/app`
- Article/project-specific behavior: `src/features`
- Reusable primitives: `src/shared`
- Payload/PostgreSQL/server adapters: `src/server`
- Environment and app configuration: `src/config`

If a piece of code is only used once, keep it close to where it is used. Move it
to `shared` only when reuse is real.
