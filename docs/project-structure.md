# Kita Project Structure

> 最后核对：2026-07-15
>
> 定位：当前代码目录与依赖边界的 source of truth。较早 plan/notes 中的 “future” 或“尚未接入”描述只代表历史阶段。

Kita 采用 feature-oriented 结构，参考 `bulletproof-react` 的精神，但针对 Next.js App Router、Payload CMS、PostgreSQL、Docker/Coolify 和当前个人内容站规模做了简化。目标不是追求目录数量，而是让每种职责有稳定位置。

## 当前结论

当前结构是清晰且适合 V1 的，不需要推倒重构：

- App Router 负责路由、layout、metadata 和 route handler；
- feature 目录负责各业务域的 UI、类型、mapper 和开发 fallback；
- server 目录负责 Payload Local API 查询和服务端编排；
- payload 目录负责 collection schema 与 generated types；
- migrations 目录负责生产数据库演进；
- config 负责环境变量；
- testing 与 colocated `__tests__` 负责测试；
- Docker、backup、CI 和 workspace guard 位于独立基础设施目录。

当前最大可维护性风险不是代码目录，而是历史 Markdown 数量较多、状态描述曾发生漂移。当前状态应优先查看：

1. `docs/CODEX_HANDOFF.md`
2. `docs/current-project-status.md`
3. `docs/project-structure.md`
4. `docs/development-production-alignment.md`
5. `docs/kita-code-review-2026-07-09.md` 顶部最新状态节

## 顶层目录

```text
.github/workflows/
  GitHub Actions quality gate

.devcontainer/
  Dev Container 与 Docker-in-Docker 配置

docker/postgres-backup/
  PostgreSQL custom dump -> Cloudflare R2 sidecar
  以及独立 shell 测试

docs/
  当前入口文档、专题说明和历史实施记录

public/
  前台静态图片与雨滴纹理

scripts/
  workspace 用户与 .next 冲突守卫

src/
  应用源码、Payload schema、migration 和测试

compose.yaml
  生产/基础 Compose：web、postgres、backup、postgres-data

compose.dev.yaml
  本地开发 override，只映射 PostgreSQL 到 Dev Container

Dockerfile
  Next.js/Payload production image

docker-entrypoint.sh
  production migration -> Next.js start

payload.config.ts
  Payload collections、PostgreSQL adapter、production migrations

package.json
  开发、检查、测试、migration 和 build 命令
```

Dev Container 仅为 `node_modules` 与 `.next` 使用两个 targeted named volumes。这是在用户明确授权并实测 Windows `9p` 是冷编译瓶颈后保留的性能例外；不是可随意复制的默认模式。

`.pnpm-store`、源码、`.env` 和 Git 不使用新增 named volume。root 用户禁令、`.next` 所有权检查和 dev/build 并发守卫仍然有效；不得擅自增加第三个开发 Volume、删除数据库 Volume 或修改生产结构。

> 修改该配置后需执行一次 `Dev Containers: Rebuild Container`。

## `src` 当前布局

```text
src/
  app/
    (site)/       前台 routes
    (payload)/    Payload Admin / REST / GraphQL
    api/dev/      受环境保护的开发 seed routes

  config/
    env.ts        类型安全环境变量

  features/
    home/
    about/
    tools/
    reviews/
    games/

  server/
    payload/      Payload client
    tools/        Tools queries
    reviews/      Reviews queries
    games/        Games queries 与 seed upsert

  payload/
    collections/  Users / Tools / Reviews / Games
    payload-types.ts

  migrations/
    4 个 production migrations 与 index

  testing/
    跨多个测试共享的 fixture

  shared/
    跨 feature 的可复用代码预留；目前保持精简
```

## 实际数据流

```text
Browser
  -> src/app/(site) route
  -> src/server getter
  -> Payload Local API
  -> PostgreSQL
  -> mapper
  -> feature view model
  -> feature component
  -> rendered page
```

后台写入：

```text
Payload Admin
  -> collection schema / access rules
  -> PostgreSQL
  -> Local API getter
  -> mapper
  -> site page
```

项目没有独立 Express 后端，也没有 Prisma。Payload 已经承担 CMS、认证、CRUD、API、访问控制和 schema/migration 集成职责；当前不应增加重复后端层。

## `src/app`：路由与组合层

只放：

- page、layout、metadata；
- Payload route handlers；
- 开发 seed route 的 HTTP/环境保护；
- feature component 与 server getter 的组合；
- Next.js 的 not-found/error/loading 边界。

当前 Games route 是正确示例：

```text
route
  -> getGames()
  -> <GamesFeaturePage games={games} />
```

避免把 Payload 查询、复杂映射或大块 UI 直接写入 page 文件。

## `src/features`：业务功能层

每个 feature 是一个垂直业务域：

```text
features/games/
  components/
  data/
  types/
  utils/
    __tests__/
```

用途：

- 页面主体和域内组件；
- UI 使用的 view model/type；
- Payload document -> view model mapper；
- development-only fallback/seed 数据；
- 与实现相邻的纯函数测试。

只有真正跨多个 feature 的代码才移动到 `shared`。不要提前创建抽象目录，也不要把所有组件集中到一个全局 components 文件夹。

## `src/server`：服务端数据边界

用途：

- 初始化 Payload client；
- 使用 Local API 查询 collection；
- 明确 `overrideAccess: false`；
- 区分 development fallback 与 production fail-fast；
- 调用 feature mapper；
- Games seed 的可测试 upsert。

当前 server 会依赖对应 feature 的 domain type、mapper 和 development fallback；route 同时依赖 server 与 feature component。这是当前规模下有意采用的方向：

```text
app -> server
app -> feature components
server -> Payload client
server -> feature mapper / type / fallback
```

目前没有形成循环依赖。以后如果一个 feature 变得很大，可以把其 server query 收进 feature 内部的 `api/`，但当前没有迁移必要。

## `src/payload` 与 `src/migrations`

`src/payload/collections` 是 CMS schema 和 access rule 的 source of truth。

`src/payload/payload-types.ts` 是 Payload generated types，不应手工维护业务字段。

`src/migrations` 是 production schema 演进记录。修改 collection 后：

```bash
pnpm payload:types
pnpm payload:migrate:create
pnpm check
```

必须人工审查 migration。不要在已有表的数据库上盲跑初始 migration，也不要删除现有数据库 Volume 来“修复” migration。

## 测试结构

TypeScript 测试与实现相邻：

```text
src/features/*/utils/__tests__/*.test.ts
src/server/*/__tests__/*.test.ts
```

跨测试 fixture：

```text
src/testing/fixtures/
```

基础设施 shell 测试：

```text
docker/postgres-backup/tests/backup.test.sh
```

当前 `pnpm test` 依次运行：

```text
36 个 Vitest（9 个测试文件）
-> 4 个 backup shell 场景
```

未来 Playwright 放到独立 `e2e/tests`，不要混入 Vitest 的 colocated 目录。

## 基础设施边界

```text
compose.yaml
  web
  postgres
  backup
  postgres-data

compose.dev.yaml
  仅本地端口映射

docker/postgres-backup/
  生产 backup image、entrypoint、README、shell tests

.github/workflows/ci.yml
  install -> format -> lint -> typecheck -> test -> build
```

真实 secret 只存在于本地忽略的 `.env` 或 Coolify Runtime Variables，不进入 Git、文档、测试或 GitHub Actions。

OpenList 是独立 Coolify Application，不进入 Kita 的 `compose.yaml`。Kita 只保存 Games `links[].href` 的公开 URL，不调用 OpenList API，也不共享 OpenList 的数据库、配置 Volume 或 secret；这是两者唯一的运行时契约。

## Git 与发布边界

日常工作不直接 push main：

```text
origin/main
  -> 创建功能分支
  -> 修改 / 测试 / commit
  -> push 功能分支
  -> Pull Request
  -> CI / quality
  -> merge main
  -> Coolify 部署
```

main Ruleset 要求 PR 和 `quality`，并阻止 force push 与删除 main。

## 仍需关注但不要求重构的地方

- production Compose 的数据库默认凭据仍应评估 fail-fast；
- 尚无临时 PostgreSQL/published 集成测试和 Playwright smoke；
- 页面 error/empty/not-found、分页、metadata、可访问性仍可加强；
- `docs` 中大量历史 plan/notes 应保留历史定位，不再作为当前 source of truth；
- 当前没有 import-boundary ESLint rule，分层主要由 review 和目录约定保证。

这些是渐进改进，不构成“架构混乱”或“需要重写”的证据。

## 放置新代码的判断

```text
路由、layout、metadata、route handler
  -> src/app

某个业务域的 UI、type、mapper、fallback
  -> src/features/<feature>

Payload 查询和服务端编排
  -> src/server/<feature>

Collection schema 和 access
  -> src/payload/collections

数据库 schema 演进
  -> src/migrations

环境变量
  -> src/config

跨多个测试共享 fixture
  -> src/testing

真正跨 feature 的稳定复用代码
  -> src/shared

生产容器和备份
  -> docker / compose.yaml / Dockerfile

CI
  -> .github/workflows
```

一句话结论：

> Kita 当前代码结构清晰、主链路可靠、工程护栏已建立；无需重构目录。接下来应优先维护入口文档的一致性，并把精力转向内容、产品体验和少量高价值集成测试。
