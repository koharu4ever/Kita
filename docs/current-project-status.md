# Kita 当前项目状态与环境配置

> 最后核对：2026-07-13
>
> 文档定位：这是当前项目状态的入口文档。代码、开发环境和部署操作以本文为准；其他较早的学习笔记与实施计划可能记录的是历史阶段。

## 1. 当前结论

Kita 已经不是“准备接入 Payload/PostgreSQL”的早期工程骨架，而是已经形成完整数据链路的 Next.js 全栈个人内容站。

当前代码已经包含：

- Next.js 16 App Router 前台。
- Payload CMS Admin、REST API、GraphQL API 和 Local API。
- PostgreSQL 16 数据库。
- Users、Tools、Reviews、Games collections。
- Tools、Reviews、Games 的 server getter 和 mapper。
- Reviews 与 Games 富文本详情页。
- Payload generated types。
- 4 个生产 migration。
- Dev Container + Docker-in-Docker 开发环境。
- Docker 多阶段生产构建。
- 容器启动时自动执行 Payload migration。
- Coolify 部署配置所需的环境变量边界。
- 8 个 Vitest 文件、33 个单元测试。
- backup shell 的 4 个 fake-command 场景。
- GitHub Actions `quality`：install、format、lint、typecheck、test、build。
- main Ruleset：必须通过 Pull Request 和 `quality`。
- 已启用的生产 PostgreSQL -> R2 backup sidecar。

当前本地开发环境已经实际确认：

```text
Dev Container        正在运行
Node                 v22.16.0
pnpm                 10.28.2
PostgreSQL           postgres:16，正在运行
/                     HTTP 200
/tools                HTTP 200
/reviews              HTTP 200
/games                HTTP 200
/admin                HTTP 200
ESLint                通过
TypeScript            通过
Vitest                 8 files / 33 tests 通过
Backup shell tests     4 scenarios 通过
GitHub main            bf9c53e（PR #7 已合并）
GitHub quality         通过并设为 main 必需检查
```

目前应当把项目理解为：

```text
核心功能与生产链路已经建立
  -> Dev Container / PostgreSQL / Payload / Next.js 可用
  -> Coolify + R2 backup 正在运行
  -> 33 个 Vitest + 4 个 backup shell 场景进入 CI
  -> main 由 Pull Request + quality Ruleset 保护
  -> 当前重点转向真实内容、产品体验和少量高价值集成测试
```

## 2. 当前架构

```text
Browser
  |
  v
Next.js App Router
  |-- (site) 前台页面
  |-- (payload) Admin / REST / GraphQL
  |
  v
src/server getters
  |
  v
Payload Local API
  |
  v
PostgreSQL
```

后台内容流：

```text
Payload Admin
  -> Collection
  -> PostgreSQL
  -> Payload Local API
  -> server getter
  -> mapper
  -> feature component
  -> page
```

项目没有独立 Express 后端，也没有 Prisma。Payload 已经同时承担 CMS、CRUD、权限、API 和数据库 schema 管理职责，当前不需要再增加一层后端框架。

## 3. 当前功能完成度

### 首页 `/`

已完成：

- 全屏视觉首页。
- 背景轮播。
- WebGL 雨滴玻璃效果。
- 桌面设备能力判断。
- reduced-motion 降级。
- 移动端静态降级。
- 首屏导航和浮动导航。

### About `/about`

页面和导航已完成，但正文仍包含 placeholder 文案，需要换成真实个人介绍。

### Tools `/tools`

已完成：

- Payload Tools collection。
- PostgreSQL 存储。
- Payload Local API 查询。
- server getter。
- mapper。
- 前台列表。
- 开发 seed。

生产数据库为空时返回空列表；只有开发环境允许使用静态 fallback。

### Reviews `/reviews`、`/reviews/[slug]`

已完成：

- Reviews collection。
- draft/published 读取权限。
- 列表与详情查询。
- Rich Text 正文。
- mapper。
- 动态 metadata。
- production 不使用静态 fallback。

仍需完成真实内容录入，并逐步删除演示文案。

### Games `/games`、`/games/[slug]`

已完成：

- Games collection。
- draft/published 读取权限。
- 图片墙。
- Lightbox。
- 详情页。
- Rich Text 正文。
- server getter 与 mapper。
- Games migrations。
- 封面资源与数据库 schema 解耦。

当前 `white-album-2` 同时存在于开发 fallback 和 seed 定义中，因此页面能显示它并不一定代表数据库已有该记录。

## 4. 开发环境变量

开发环境使用项目根目录的 `.env`：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYLOAD_SECRET=<至少 32 位的本地开发密钥>
ENABLE_DEV_SEED=false
DATABASE_URI=postgres://postgres:postgres@localhost:5432/kita
```

当前本地 `.env` 已经包含这 4 个变量，并通过了键、长度和格式检查。真实值不会写入本文，也不应提交 Git。

本地与生产环境不要求使用相同的 secret。正确关系是：

| 配置                   | 本地开发                         | Coolify 生产                      | 是否应相同             |
| ---------------------- | -------------------------------- | --------------------------------- | ---------------------- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000`          | `https://kita.kral-koharu.com`    | 否                     |
| `PAYLOAD_SECRET`       | 新电脑自己的开发 secret          | 稳定的生产 secret                 | 否                     |
| `ENABLE_DEV_SEED`      | 默认 `false`，临时 seed 时才开启 | 必须 `false`                      | 值通常相同，但原因不同 |
| `DATABASE_URI`         | 主机为 `localhost`               | 主机为 Compose service `postgres` | 否                     |
| PostgreSQL 密码        | 本地开发密码                     | 生产强密码                        | 否                     |

旧电脑的本地 secret 曾经与生产相同，并不表示架构要求必须相同；那只是旧电脑当时复制了生产值。新电脑应使用独立的本地 secret 和本地数据库密码。

### `NEXT_PUBLIC_SITE_URL`

开发环境：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

它可以暴露给浏览器。

### `PAYLOAD_SECRET`

这是 Payload 的真实应用密钥：

```env
PAYLOAD_SECRET=<随机且至少 32 位>
```

要求：

- 开发环境和生产环境使用不同值。
- 生产值由项目所有者生成。
- 不发送给 AI。
- 不放入 Markdown、截图、GitHub issue 或 commit。
- 生产部署后保持稳定，不要每次 redeploy 重新生成。

### `ENABLE_DEV_SEED`

默认：

```env
ENABLE_DEV_SEED=false
```

只有操作临时开发数据库时才短暂设置为 `true`。生产环境必须始终为 `false`。

### `DATABASE_URI`

本地 Next.js 运行在 Dev Container 中，PostgreSQL 由 Dev Container 内层 Docker 映射到 5432，因此使用：

```env
DATABASE_URI=postgres://postgres:postgres@localhost:5432/kita
```

生产环境不能照抄这个地址。

## 5. Coolify 生产环境变量

生产环境不需要把真实变量交给 AI。项目所有者应在 Coolify 面板中创建和保存。

### 5.1 生产变量表

| 变量                   | 值从哪里来                         | Buildtime | Runtime | 是否秘密 |
| ---------------------- | ---------------------------------- | --------: | ------: | -------: |
| `DATABASE_URI`         | Compose 内部 `postgres` 服务连接串 |        否 |      是 |       是 |
| `PAYLOAD_SECRET`       | 自己生成的随机密钥                 |        否 |      是 |       是 |
| `NEXT_PUBLIC_SITE_URL` | Kita 正式网站域名                  |        是 |      是 |       否 |
| `ENABLE_DEV_SEED`      | 固定为 `false`                     |        否 |      是 |       否 |
| `POSTGRES_DB`          | 当前为 `kita`                      |        否 |      是 |       否 |
| `POSTGRES_USER`        | 当前为 `postgres`                  |        否 |      是 |       否 |
| `POSTGRES_PASSWORD`    | 自己生成的生产数据库密码           |        否 |      是 |       是 |

### 5.2 `DATABASE_URI` 与 `POSTGRES_PASSWORD` 必须成对

当前 Coolify 使用 repository `compose.yaml`。Compose 创建：

```text
web
postgres
postgres-data
```

生产 `DATABASE_URI` 的数据库主机使用 Compose service name：

```text
postgres
```

连接串内部的密码必须与同一次部署中的 `POSTGRES_PASSWORD` 一致：

```text
POSTGRES_PASSWORD=<生产数据库密码>
DATABASE_URI=postgres://<用户>:<同一数据库密码>@postgres:5432/<数据库名>
```

这里的“一致”只发生在同一个生产环境内部：`DATABASE_URI` 必须携带 PostgreSQL 实际接受的密码。它不要求新电脑的本地数据库使用同一密码。

开发环境则是：

```text
Next/Payload 在 Dev Container
PostgreSQL 在 Dev Container 的内层 Docker
DATABASE_URI 使用 localhost:5432
```

### 5.3 `PAYLOAD_SECRET` 由你自己生成

推荐在可信的本地终端中生成 32 字节随机值：

```bash
openssl rand -hex 32
```

这会得到 64 个十六进制字符。生成后直接粘贴到 Coolify，不要发到聊天。

也可以使用可信密码管理器的随机密码生成器。要求不是必须采用某个命令，而是：随机、足够长、只保存于安全位置、部署后保持稳定。

### 5.4 `NEXT_PUBLIC_SITE_URL`

填写 Kita 的正式公开域名，例如：

```env
NEXT_PUBLIC_SITE_URL=https://kita.example.com
```

`https://coolify.kral-koharu.com` 是 Coolify 管理后台域名，不是 Kita 网站地址。

因为变量以 `NEXT_PUBLIC_` 开头，建议同时启用 Buildtime 和 Runtime。

### 5.5 `ENABLE_DEV_SEED`

生产固定：

```env
ENABLE_DEV_SEED=false
```

只启用 Runtime。它不是 secret，可以显示明文。

### 5.6 不需要在 Coolify 额外配置

当前通常不需要添加：

```text
NODE_ENV
NEXT_TELEMETRY_DISABLED
SKIP_ENV_VALIDATION
```

原因：

- Dockerfile runner 已设置 `NODE_ENV=production`。
- Dockerfile 已关闭 Next telemetry。
- `SKIP_ENV_VALIDATION` 只在 Docker builder 阶段内部使用，runtime 不应跳过校验。

### 5.7 当前截图中的秘密必须轮换

2026-07-06 提供的 Coolify 截图直接显示了 `PAYLOAD_SECRET`，并显示了数据库连接凭据。即使截图只用于本次对话，这些值也应视为已经离开秘密存储边界。

不要只删除截图后继续使用旧值。正确处理：

1. 先完成 PostgreSQL 备份。
2. 生成新的生产 `PAYLOAD_SECRET`。
3. 生成新的生产数据库密码。
4. 在数据库内部真正修改用户密码。
5. 同步更新 Coolify 的 `POSTGRES_PASSWORD` 和 `DATABASE_URI`。
6. Redeploy，并检查 migration、Admin 登录和前台查询。

重要：对于已经有 `postgres-data` 的 PostgreSQL 容器，只修改 Compose/Coolify 的 `POSTGRES_PASSWORD` 环境变量，通常不会自动修改数据库内部已有用户的密码。该变量主要用于首次初始化空数据目录。必须先通过数据库管理方式执行密码修改，再让应用连接串使用新密码，否则 web 会连接失败。

轮换 `PAYLOAD_SECRET` 会使现有 Payload 会话或相关签名失效，需要重新登录 Admin。这是预期行为。

## 6. 已确认的 Coolify 部署模式

最新 Coolify 截图已经确认：当前使用 repository `compose.yaml`，不是单独的 Coolify PostgreSQL resource。

```text
Coolify Compose application
  |-- web
  |-- postgres
  |-- backup（仓库已实现，生产需显式启用）
  `-- postgres-data
```

判断依据：

- Coolify 环境变量中同时存在 `POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`。
- `DATABASE_URI` 的主机名是 `postgres`，对应 Compose service name。
- Coolify 自动生成了 `SERVICE_FQDN_WEB` 和 `SERVICE_URL_WEB`。
- `NODE_ENV` 与 `NEXT_TELEMETRY_DISABLED` 显示为 web service 的 hardcoded env，对应仓库 Compose 配置。

当前需要确保：

- `POSTGRES_PASSWORD` 使用生产强密码。
- `DATABASE_URI` 中密码一致。
- `postgres-data` 持久化。
- PostgreSQL 5432 不对公网开放。
- migration 启动前数据库已经 ready。
- backup 不开放端口、不挂载数据库 volume，默认 `POSTGRES_BACKUP_ENABLED=false`。
- 生产启用 backup 前，必须在 Coolify 填写 R2 Endpoint、Bucket 和受限凭据。

Coolify 的 `SERVICE_FQDN_WEB`、`SERVICE_URL_WEB` 是平台自动变量，不需要复制到本地 `.env`。

## 7. Dev Container 与宿主机边界

当前代码目录使用 bind mount：

```text
D:\lipan\Kita
  -> /workspaces/Kita
```

因此：

- Node、pnpm、Payload CLI、PostgreSQL 服务不安装到 Windows。
- `node_modules`、`.pnpm-store`、`.next` 会作为项目局部生成物出现在 `D:\lipan\Kita`。
- 这些目录不是 Windows 全局依赖，也不进入 PATH。
- `.env` 是项目配置文件，不是系统环境变量。
- Docker-in-Docker 数据存放在 Docker managed volumes。

准确说法是：项目专属运行时与服务已隔离；项目源码和生成目录通过 bind mount 与宿主机共享。

## 8. 当前数据库与 migration 状态

仓库包含：

```text
20260614_112311_init
20260628_133544
20260702_161526
20260703_132233
```

当前本地开发数据库的 migration status 显示这 4 个 migration 都未登记执行，但本地页面和数据库能工作。这说明本地 schema 很可能由 Payload development 模式同步，而不是从 migration 0 开始建立。

这不阻塞继续写页面，但生产发布前必须验证：

```text
临时空数据库
  -> 执行全部 migration
  -> 启动 production container
  -> 打开 Admin
  -> 验证 Tools / Reviews / Games
```

不要直接在已有数据的本地库或生产库上尝试“补跑全部初始 migration”，因为初始 migration 可能创建已经存在的表。

## 9. Seed 当前状态

### Tools seed

`seed:tools` 根据 title 查找并 update/create，基本是幂等行为。

### Games seed

`seed:games` 当前会：

```text
按 slug 查找现有 Game
存在则 update
不存在则 create
```

它现在是幂等 upsert，不再删除其他 Games。仍然只允许在 `NODE_ENV !== production` 且 `ENABLE_DEV_SEED=true` 时运行。

## 10. 当前已知待办

### 开发环境收口

- [x] generated files 不再阻塞 `format:check`。
- [x] `pnpm build` 已明确 exit 0。
- [x] production 不再使用 Tools 静态 fallback。
- [x] Games seed 已改成非破坏式 upsert。
- [x] `postCreateCommand` 使用 `pnpm install --frozen-lockfile`。

### 数据库与部署收口

- [x] 已确认 Coolify 使用 repository `compose.yaml`。
- [x] 生产首次空库部署已成功执行 4 个 migration。
- [x] PostgreSQL 已增加 healthcheck，web 等待 `service_healthy`。
- [x] PostgreSQL custom dump -> R2 backup sidecar 已启用并连续生成真实对象。
- [x] backup shell 的 dump/校验/上传失败分支已自动测试且不会误报成功。
- [ ] 用临时 PostgreSQL 16 完成一次恢复演练（已接受为后续增强）。
- [ ] 轮换生产 secret（项目所有者当前决定暂缓，不能写成已完成）。
- [ ] 增加 backup last-success healthcheck/告警（内容量较少时可延后）。

### 内容收口

- [ ] About 替换 placeholder。
- [ ] Reviews 录入真实内容。
- [ ] Games 录入真实内容。
- [ ] Tools 确认使用 CMS 内容还是内置静态内容。
- [ ] 清理前台可见的 draft/implementation 说明。

### 工程化收口

- [x] GitHub Actions：install、format、lint、typecheck、test、build。
- [x] main Ruleset：必须经过 PR 且 `quality` 成功。
- [x] mapper/server getter/seed 的 30 个 Vitest，以及环境校验开关的 3 个 Vitest。
- [x] backup shell 的 4 个 fake-command 场景。
- [ ] 临时 PostgreSQL + published 权限集成测试。
- [ ] 首页、内容页和 Admin 的 Playwright smoke。
- [ ] 健康检查 endpoint。
- [ ] Payload 邮件适配器或明确暂不支持找回密码。
- [ ] 根 README。

## 11. 当前正确的开发启动流程

在 Dev Container 中：

```bash
pnpm dev:services
pnpm dev
```

检查：

```text
http://localhost:3000
http://localhost:3000/tools
http://localhost:3000/reviews
http://localhost:3000/games
http://localhost:3000/admin
```

提交前：

```bash
pnpm test
pnpm check
pnpm build
```

Git 使用功能分支 -> push 分支 -> Pull Request -> `quality` -> merge main。日常修改不再直接 push main。

`pnpm check` 当前已通过。运行 `pnpm build` 前先停止 `pnpm dev`，避免二者同时写入 `.next`。

## 12. 文档使用规则

从现在开始建议：

```text
current-project-status.md
  当前状态、环境变量、启动入口

project-structure.md
  当前代码目录、职责和依赖边界

kita-code-review-2026-07-09.md
  原始审查、最新关闭证据和仍存在的问题

development-environment-architecture-review.md
  2026-07-06 的完整架构审计与历史问题解释

development-workflow.md
  日常功能开发流程，后续需要按当前代码更新

deployment-roadmap.md
  部署背景和历史路线，其中部分“尚未部署”描述已经过时

其他 plan / notes
  作为设计和实现历史，不应自动视为当前状态
```

后续可以整理旧文档，但在没有确认哪些历史信息需要保留前，不应直接批量删除。

## 13. 最终结论

生产 secret 不需要也不应该提供给 AI：

```text
PAYLOAD_SECRET
  由你生成并保存在 Coolify

DATABASE_URI
  使用 Compose 内部 postgres service，并与 POSTGRES_PASSWORD 匹配

NEXT_PUBLIC_SITE_URL
  填 Kita 正式公开域名

ENABLE_DEV_SEED
  固定 false
```

Kita 当前代码结构清晰，生产链路、备份、测试、CI 和 main 保护均已建立。接下来优先补真实内容、产品体验和少量高价值集成测试；恢复演练、secret 轮换与 backup last-success 监控作为已知后续增强，不需要继续扩张技术栈。
