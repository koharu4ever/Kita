# Kita 开发环境与整体架构审计

> 审计日期：2026-07-06
>
> 审计目标：确认换电脑后是否已经具备稳定开发条件，解释当前架构与隔离边界，列出仍缺少的内容，并给出按优先级执行的收口路线。
>
> 审计原则：以仓库当前代码为准，不擅自增加依赖、Volume、服务或框架；环境验证只在现有 Dev Container 内执行。

## 1. 先说结论

Kita **已经能够作为开发环境运行**，不是一个只有页面草稿的空壳项目。

当前已经跑通的核心链路是：

```text
浏览器
  -> Next.js App Router
  -> Server Component / server getter
  -> Payload Local API
  -> PostgreSQL

Payload Admin
  -> Collection 配置
  -> PostgreSQL
  -> 前台读取同一份内容
```

本次实际确认：

- Dev Container 正在运行。
- 容器内 Node.js 为 `v22.16.0`。
- 容器内 pnpm 为 `10.28.2`，与 `package.json` 的 `packageManager` 一致。
- Docker-in-Docker 与 Docker Compose 可用。
- 内层 PostgreSQL 16 容器正在运行。
- 本地 `.env` 已包含项目要求的 4 个变量，格式检查通过，且 `ENABLE_DEV_SEED=false`。
- `/`、`/tools`、`/reviews`、`/games`、`/admin` 均返回 HTTP 200。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- Payload 能读取 4 个 migration 文件。

但它还没有达到“新电脑拉下来后完全不用判断、一次命令就能确认一切”的状态。当前最重要的问题不是缺少更多框架，而是以下收口工作：

1. `pnpm format:check` 当前失败。
2. 生产构建在本次 Windows bind mount 环境中长时间未返回，不能记为已通过。
3. 本地数据库 schema 与 migration 历史没有对齐；4 个 migration 在当前本地数据库中都显示未执行。
4. 开发 fallback 数据会掩盖数据库是否真的有内容，已经造成了 `white-album-2` 来源不清的问题。
5. `seed:games` 会删除现有 Games 数据，行为过于危险。
6. `compose.yaml` 同时承担本地数据库辅助和生产部署参考，部分设置的目标互相冲突。
7. 文档明显落后于代码，多个文档仍声称 Reviews/Games 尚未接入 Payload。
8. 测试、CI、健康检查、邮件适配器和生产备份验收仍未完成。

因此整体判断是：

```text
可以继续开发：是
开发环境基本可复现：是
开发环境完全自动化：否
架构方向合理：是
需要推倒重来：否
需要先做一轮工程收口：是
```

## 2. 本次审计范围

本次盘点了：

- 76 个 TypeScript、TSX、CSS、SCSS 源文件。
- 约 5,410 行源码。
- 26 篇项目文档。
- 4 个 Payload migration。
- Dev Container、Dockerfile、Compose、环境变量、Payload 配置和 Next.js 配置。
- Tools、Reviews、Games 三条 CMS 数据链路。
- 首页 WebGL 雨滴层和主要交互组件。
- 当前 Git 状态、运行中的容器、HTTP 路由、Lint、TypeScript、格式和 migration 状态。

没有做的事情：

- 没有改数据库数据。
- 没有调用任何 seed 接口。
- 没有安装宿主机 Node、pnpm、PostgreSQL 或项目依赖。
- 没有删除 `node_modules`、`.next`、Volume 或容器。
- 没有修改现有 Dev Container、Compose、Dockerfile 或业务代码。
- 没有读取或记录 `.env` 的真实密钥值。

## 3. 当前项目到底是什么

Kita 是一个 Next.js 全栈个人内容站，包含：

```text
前台视觉层
  首页、About、Tools、Reviews、Games

内容管理层
  Payload Admin

应用服务层
  Next.js Server Components
  src/server 下的数据读取函数
  Payload Local API

数据层
  PostgreSQL

开发环境
  VS Code / Dev Container
  Docker-in-Docker

生产环境
  Dockerfile
  Payload migration
  Coolify / VPS
```

它不是传统的“前端项目 + 独立后端仓库”。Payload 3 直接集成在 Next.js 应用中：

- 前台页面由 Next.js 提供。
- Payload Admin 和 API 也由同一个 Next.js 应用提供。
- Payload Local API 在服务端进程内访问 CMS，不需要前台页面再绕一圈 HTTP。
- PostgreSQL 是最终持久化数据源。

这种结构非常适合当前体量的个人站：部署单元少，类型边界清晰，也不需要为了“看起来像微服务”而拆成多个仓库。

## 4. 当前目录分层

### 4.1 `src/app`

负责 Next.js 路由入口和框架集成。

```text
src/app/(site)
  前台网站路由

src/app/(payload)
  Payload Admin、REST API、GraphQL API

src/app/api/dev
  本地开发 seed 路由
```

`(site)` 和 `(payload)` 使用不同 root layout 是合理的。Payload Admin 有自己的 Layout、CSS 和 Server Functions；前台有自己的字体、语言和全局样式。这样避免了 Payload Admin 与前台 `<html>/<body>` 嵌套冲突。

### 4.2 `src/features`

按业务功能组织 UI、前端类型、mapper 和开发 fallback 数据：

```text
features/home
features/about
features/tools
features/reviews
features/games
```

这是 feature-oriented 结构，而不是把所有组件都堆进一个 `components` 文件夹。方向合理。

### 4.3 `src/server`

负责服务端数据读取：

```text
server/payload/get-payload.ts
server/tools/get-tools.ts
server/reviews/get-reviews.ts
server/games/get-games.ts
```

页面组件不直接操作 PostgreSQL，也不直接理解 Payload 文档结构。server getter 调用 Payload Local API，再通过 mapper 转成前端 view model。

### 4.4 `src/payload`

负责 CMS collection：

```text
Users
Tools
Reviews
Games
```

Payload 根据 collection 自动提供 Admin CRUD、REST API、GraphQL schema 和 Local API。

### 4.5 `src/migrations`

保存生产数据库迁移：

```text
初始 Users + Tools
Reviews
Games
Games 封面字段解耦
```

Docker 生产容器启动时先运行 migration，再启动 Next.js standalone server。

## 5. 数据流为什么是合理的

以 Games 为例：

```text
访问 /games
  -> src/app/(site)/games/page.tsx
  -> getGames()
  -> getPayloadClient()
  -> Payload Local API
  -> PostgreSQL games 表
  -> mapGameDocumentToGameDetail()
  -> GamesPage / GamesGallery
```

详情页：

```text
访问 /games/white-album-2
  -> getGameBySlug("white-album-2")
  -> 查询 published Game
  -> mapper
  -> GameDetailPage
```

优点：

- React 展示组件不依赖 Payload 的完整 Document 类型。
- 数据库字段变化优先集中在 collection、generated types 和 mapper。
- 页面路由文件保持轻量。
- production 与 development 可以采用不同的错误策略。
- Payload Admin 和前台读取同一数据源。

这个边界不需要改成 Prisma、独立 Express API 或微服务。当前架构复杂度已经足够。

## 6. Dev Container 实际是怎么运行的

当前 `.devcontainer/devcontainer.json` 使用：

```text
mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm
Docker-in-Docker feature
remoteUser=node
postCreateCommand=sudo corepack enable && pnpm install
```

实际结构：

```text
Windows 宿主机
  D:\lipan\Kita
  Docker Desktop
    Dev Container
      /workspaces/Kita
      Node 22
      pnpm 10.28.2
      Next.js / Payload 开发进程
      内层 Docker daemon
        kita-postgres-1
        postgres-data
```

这里有两个 Docker 层次：

1. Docker Desktop 运行 Dev Container。
2. Dev Container 内的 Docker daemon 运行 PostgreSQL。

这样做的好处是：Node、pnpm、Payload CLI、Docker CLI 和 PostgreSQL 都不需要作为项目专属软件安装到 Windows 系统。

代价是：Docker-in-Docker 比普通“Dev Container 连接宿主机 Docker”更重，也更容易让初学者混淆外层容器和内层容器。当前项目已经按这个思路运行，所以不建议在没有明确收益时切换架构。

## 7. “会不会污染宿主机”的准确答案

### 7.1 不会产生的系统级污染

当前流程不会要求在 Windows 全局安装：

- Node.js
- pnpm
- 项目 npm 包
- Payload CLI
- PostgreSQL Windows Service
- 项目级系统环境变量

`.env` 是仓库目录里的项目文件，不是 Windows 系统环境变量。它被 `.gitignore` 忽略，也被 `.dockerignore` 排除，不会进入 Git 或 Docker build context。

### 7.2 宿主机上仍然会存在的内容

“使用容器”不等于宿主机磁盘上完全没有文件。当前真实挂载是：

```text
D:\lipan\Kita
  -> /workspaces/Kita
```

这是 bind mount。容器在 `/workspaces/Kita` 写文件，Windows 的 `D:\lipan\Kita` 会立刻看到同一文件。

因此以下目录当前真实存在于宿主机项目目录：

```text
node_modules/
.pnpm-store/
.next/
tsconfig.tsbuildinfo
.env
```

它们是**项目局部产物**，不是系统全局安装；删除项目目录即可一起删除，不会注册 Windows 服务，也不会修改系统 PATH。但从“物理文件在哪里”这个角度，它们确实占用宿主机磁盘。

### 7.3 `package.json` 不能代替 `node_modules`

`package.json` 和 `pnpm-lock.yaml` 只负责描述：

```text
应该安装哪些包
应该安装什么版本
依赖关系如何解析
```

它们不会让运行时凭空获得依赖。执行 `pnpm install` 后仍然必须产生：

```text
node_modules
pnpm store
```

所以：

```text
package.json / lockfile = 安装清单
node_modules / store = 已安装实体
```

不用 Docker named volume 的结果不是“依赖不存在”，而是依赖目录跟随 bind-mounted 项目目录落到宿主机。

### 7.4 当前 Docker managed volumes

Dev Container 的 Docker-in-Docker feature 自己创建了 Docker managed volume：

```text
/var/lib/docker
/var/lib/containerd
/vscode
```

内层 PostgreSQL 的 image、container layer 和 `postgres-data` 都位于这个 Docker 管理区域，不是 Windows PostgreSQL 安装。

这类 Volume 是容器架构正常组成部分。删除对应 Docker Volume 会丢失内层数据库数据，因此不能把“清理 Docker”与“清理项目缓存”混为一谈。

### 7.5 当前隔离等级

当前更准确的描述是：

```text
系统级工具隔离：高
数据库服务隔离：高
项目生成目录隔离：中
源码与生成目录共享：是
完全不在宿主机落项目文件：否
```

这个设计在开发体验与隔离之间做了常见取舍。它不是“完全封闭容器文件系统”，但也不是把项目环境安装进 Windows。

## 8. 新电脑上真正需要什么

宿主机只需要通用工具：

```text
Git
Docker Desktop（WSL 2 backend）
VS Code
Dev Containers 扩展
浏览器
```

不需要：

```text
Windows Node.js
Windows pnpm
Windows PostgreSQL
Windows Payload CLI
```

### 8.1 新电脑首次启动顺序

```text
1. 安装并启动 Docker Desktop。
2. 用 Git clone Kita。
3. 用 VS Code 打开仓库根目录。
4. 执行 Dev Containers: Reopen in Container。
5. 等待 postCreateCommand 完成 pnpm install。
6. 从 .env.example 创建本地 .env。
7. 为 PAYLOAD_SECRET 写入本地开发 secret。
8. 在 Dev Container 终端启动 PostgreSQL。
9. 启动 pnpm dev。
10. 打开 /admin、/tools、/reviews、/games 验证。
```

建议命令：

```bash
docker compose up -d postgres
pnpm dev
```

本项目不能自动替你生成真实 `.env`，因为 secret 不应该提交进仓库。这不是缺陷，而是安全边界。

## 9. 环境变量现状

开发环境需要：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYLOAD_SECRET=<至少 32 位的本地开发密钥>
ENABLE_DEV_SEED=false
DATABASE_URI=postgres://postgres:postgres@localhost:5432/kita
```

本次只检查了键、长度和格式，没有输出值。当前本地 `.env` 四项都存在并满足 schema。

变量职责：

| 变量                   | 作用                   | 是否可以公开 | 开发环境                |
| ---------------------- | ---------------------- | -----------: | ----------------------- |
| `NEXT_PUBLIC_SITE_URL` | 网站公开地址           |         可以 | `http://localhost:3000` |
| `PAYLOAD_SECRET`       | Payload 签名与安全密钥 |       不可以 | 至少 32 位              |
| `ENABLE_DEV_SEED`      | 是否开放开发 seed 路由 |         可以 | 默认 `false`            |
| `DATABASE_URI`         | PostgreSQL 连接字符串  |       不可以 | 连接内层 PostgreSQL     |

`SKIP_ENV_VALIDATION` 只用于 Docker build 的特殊阶段。日常开发和生产 runtime 不应设置它。

### 9.1 Coolify 环境变量

生产至少需要：

```text
DATABASE_URI
PAYLOAD_SECRET
NEXT_PUBLIC_SITE_URL
ENABLE_DEV_SEED=false
```

其中：

- `DATABASE_URI` 与 `PAYLOAD_SECRET` 只需要 runtime。
- `NEXT_PUBLIC_SITE_URL` 建议 buildtime 和 runtime 都可用。
- Coolify 管理后台域名不是 Kita 的 `NEXT_PUBLIC_SITE_URL`。
- 不要把真实数据库地址、密码或 Payload secret 发到聊天或文档。

## 10. Dockerfile 与生产启动链路

Dockerfile 使用多阶段构建：

```text
base
  Node 22 + corepack

deps
  pnpm install --frozen-lockfile

builder
  pnpm build
  SKIP_ENV_VALIDATION=true

runner
  非 root nextjs 用户
  Next.js standalone
  Payload config / migrations
```

启动时：

```text
docker-entrypoint.sh
  -> payload migrate
  -> node server.js
```

这个总体设计合理：

- build 不需要真实生产 secret。
- runtime 仍强制要求真实 `DATABASE_URI` 与 `PAYLOAD_SECRET`。
- 生产容器使用非 root 用户。
- migration 失败时不会继续启动错误版本的应用。
- Next.js 使用 standalone 输出。

需要注意：为了在 runtime 执行 Payload CLI，最终镜像复制了完整 `node_modules` 和相关 TypeScript 文件。它牺牲了一些镜像体积，换取启动时 migration 能力。当前阶段可以接受。

## 11. 发现的问题与优先级

## P0：继续开发前应确认

### P0-1：生产构建没有在本次审计中确认通过

本次 `pnpm build` 在 Windows bind mount 的 Dev Container 中长时间没有返回完整结果。为了避免强制杀容器或破坏用户进程，本次停止等待，不能把它写成成功。

这不等于代码一定构建失败，因为仓库中存在较早的 `.next/BUILD_ID`，并且当前页面可运行；但“以前成功”不能代替“当前 commit 成功”。

建议在开发服务器停止后单独执行：

```bash
pnpm build
```

如果仍然非常慢，再区分：

```text
Next/Payload 本身的构建耗时
Windows bind mount I/O
同时运行的 next dev
Docker Desktop CPU/内存限制
杀毒软件扫描 node_modules/.next
```

验收标准是命令明确 exit 0，而不是只看到 `.next` 目录。

### P0-2：当前本地数据库没有 migration 执行记录

`pnpm payload:migrate:status` 显示：

```text
20260614_112311_init   No
20260628_133544        No
20260702_161526        No
20260703_132233        No
```

但页面能读取数据库，说明当前开发库很可能由 Payload development schema push 建立，而不是通过 migration 从空库建立。

这对日常本地开发不是立即故障；问题在于它不能证明生产 migration 链路可从空库完整执行。

正确的验证方式不是直接在当前有数据的开发库上盲目执行全部 migration。初始 migration 会创建已存在的表，可能冲突。

建议：

1. 保留当前开发数据库，不要直接破坏。
2. 创建一个专门的临时空数据库或临时 Volume。
3. 用生产 entrypoint 或 `pnpm payload:migrate` 从 0 执行全部 migration。
4. 验证表结构、Admin、Reviews 和 Games。
5. 删除临时验证数据库。

正式 Coolify 数据库如果已经存在，也需要先确认 `payload_migrations` 的真实记录，不能把本地状态推断成生产状态。

## P1：应尽快修复

### P1-1：`format:check` 当前失败

失败文件：

```text
src/migrations/20260702_161526.json
src/migrations/20260703_132233.json
src/payload/payload-types.ts
```

它们都是生成文件或高度依赖生成器的文件。这里应该先确定团队策略：

方案 A：生成文件也必须经过 Prettier，生成后运行 `pnpm format` 并提交变化。

方案 B：把稳定的生成文件加入 `.prettierignore`，避免每次生成后 format gate 失败。

我更倾向方案 B，因为 `payload-types.ts` 和 migration snapshot JSON 的来源是 Payload generator，不应让格式化工具反复制造无语义 diff。但应只忽略明确的生成文件，不能忽略手写 migration TS。

### P1-2：开发 fallback 正在掩盖真实数据状态

当前开发环境在以下情况会返回静态数据：

```text
数据库连接失败
查询返回 0 条数据
找不到指定 slug
```

这解释了为什么 `/games/white-album-2` 即使没有数据库 seed，也可能正常显示。

优点是前端开发不被数据库阻塞；缺点是开发者无法从页面判断：

```text
这是数据库真实记录？
这是 seed 写入的数据？
还是本地 fallback？
```

建议至少采用一种收口方式：

- 页面在 development 显示轻量的 `Demo/Fallback` 标记；或
- 仅在显式 `USE_DEMO_CONTENT=true` 时使用 fallback；或
- 数据库可用但为空时显示空状态，只有数据库连接失败才 fallback；或
- 完成 CMS 数据录入后删除对应 fallback。

不建议继续让“空数据库”和“数据库出错”都静默显示完整示例内容。

### P1-3：Tools 的生产空数据行为与文档不一致

`getReviews()` 和 `getGames()` 在 production 查询为空时返回空数组。

但 `getTools()` 当前逻辑是：

```text
只要 tools.docs.length === 0
  -> 返回 toolkitItems
```

它没有判断 `NODE_ENV`。因此生产数据库没有 Tools 时，页面仍会显示本地静态内容。`development-workflow.md` 却写着 production 不静默 fallback，文档与实现不一致。

这应该明确选择：

- 如果 Tools 是 CMS 内容，生产空库应显示空状态。
- 如果 `toolkitItems` 是正式内置内容，就不应该把它叫 fallback，也不必重复存进 CMS。

当前两套来源并存，语义不清。

### P1-4：`seed:games` 会删除所有 Games

当前 seed 逻辑：

```text
查询前 100 条 Games
逐条删除
写入一条 WHITE ALBUM2
```

虽然路由有双重保护：

```text
NODE_ENV !== production
ENABLE_DEV_SEED=true
```

但这个行为仍然过于危险：

- 一次误操作会删除手工录入的本地数据。
- 超过 100 条时只删前 100 条，结果不完整。
- 它与 `seed:tools` 的幂等 upsert 行为不一致。
- 命令名 `seed:games` 没有表达“reset all games”。

建议改为按 slug upsert；如果确实需要重置命令，应命名为 `reset:games`，并加入二次确认或专用测试数据库限制。

### P1-5：Compose 混合了本地辅助与生产语义

同一个 `compose.yaml` 当前既用于：

```text
Dev Container 内启动 postgres
生产方式构建 web
Coolify 部署参考
```

冲突点：

- 本地 Dev Container 里的 Next.js 在 Compose 网络外，需要 PostgreSQL 映射 `5432:5432`。
- 生产 web 与 postgres 在同一 Compose 网络内，不需要向 VPS 宿主机发布 5432。
- 生产数据库直接发布 5432 会扩大攻击面。
- `depends_on` 只保证启动顺序，不保证 PostgreSQL 已可连接。
- web entrypoint 会立即 migration，初次启动存在数据库尚未 ready 的竞态。

建议未来明确选择：

```text
compose.yaml
  生产/部署语义，不发布数据库端口，加入 healthcheck

compose.dev.yaml 或专用 dev service
  只为 Dev Container 暴露本地 PostgreSQL
```

如果 Coolify 实际使用“Dockerfile 应用 + Coolify 独立 PostgreSQL resource”，则应在文档中明确该方案，并停止把 repository Compose 描述为唯一生产方案。

### P1-6：PostgreSQL 缺少 readiness 检查

当前：

```yaml
depends_on:
  - postgres
```

这只说明 postgres container 已启动，不代表 `pg_isready` 已通过。`docker-entrypoint.sh` 使用 `set -eu`，migration 首次连接失败会直接退出，Next.js 不会启动。

建议：

- postgres 增加 healthcheck；
- web 等待 `service_healthy`；或
- entrypoint 对数据库连接采用有限次数、带间隔的重试。

不要采用无限等待，因为真正的连接串错误必须尽快暴露。

### P1-7：文档已经发生明显漂移

例子：

- `project-structure.md` 仍写着 Payload/PostgreSQL 尚未接入。
- `development-workflow.md` 前半部分仍写 Reviews/Games 是前端模板数据，但代码已经接入 collection、getter、mapper 和 migration。
- 早期 Docker 文档里的 Compose 示例仍只有 web，而当前 Compose 已有 web + postgres。
- 部分旧文档还保留旧电脑路径 `D:\blackwater\kita`。

建议将文档分成：

```text
CURRENT
  README
  development-environment-architecture-review.md
  development-workflow.md
  deployment-roadmap.md

HISTORY / NOTES
  早期学习记录、旧实现计划、迁移过程
```

历史文档可以保留，但顶部应标明“历史记录，不能作为当前启动说明”。

## P2：重要但不阻塞今天写码

### P2-1：缺少自动化测试

当前没有：

```text
test script
Vitest
React Testing Library
Playwright
```

优先测试点不应是 CSS，而应是：

1. 三个 mapper。
2. server getter 的正常、空数据、异常和 production fallback 行为。
3. Games seed 不应删除非 seed 数据。
4. `/`、`/tools`、`/reviews`、`/games`、`/admin` 的少量 smoke test。

### P2-2：缺少 CI

仓库没有 `.github/workflows`。

最小 CI 足够：

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

数据库集成测试可以后加，不需要第一天就塞进 CI。

### P2-3：缺少根 README

仓库没有根 `README.md`。这会直接影响换电脑接手和作品展示。

README 至少应包含：

- 项目一句话说明。
- 技术栈。
- 架构图。
- Dev Container 首次启动步骤。
- 环境变量键说明，不包含秘密值。
- migration 与 seed 的危险提示。
- Coolify 部署模式。
- 当前线上地址。

### P2-4：Payload 没有邮件适配器

Payload CLI 已明确警告：

```text
No email adapter provided. Email will be written to console.
```

这不阻止本地开发，也不阻止单管理员登录。但生产环境的密码重置、验证邮件等功能不能依赖 console。

如果 V1 不开放注册，可以把它列为上线安全收口；如果需要找回管理员密码，则应在上线前接入 SMTP 或邮件服务。

### P2-5：缺少健康检查与可观测入口

当前没有专用 `/api/health` 或等价检查。

建议至少区分：

```text
liveness
  Next.js 进程能响应

readiness
  Payload 能访问 PostgreSQL
```

Coolify 不应只用首页视觉页面判断服务健康。

### P2-6：访问控制应更显式

Reviews/Games 的公开读取只允许 published，设计正确。Tools 公开读取也是明确的。

但 create/update/delete 依赖 Payload 默认行为。为了安全审计和未来维护，建议显式写出：

```text
public read
authenticated create/update/delete
```

这样不用依赖维护者记住 Payload 默认规则。

### P2-7：CMS URL 字段缺少格式验证

以下字段目前只是普通 text：

```text
Tools.url
Reviews.coverImage
Games.coverSrc
Games.links.href
```

内容主要由管理员录入，风险低于公开表单，但错误 URL 会在前台形成坏链接或异常资源。建议添加 URL/path 校验，并明确是否允许：

```text
/public-relative-path
https://external.example
```

### P2-8：`NEXT_PUBLIC_SITE_URL` 目前只验证，未真正使用

代码里只有 `env.ts` 声明它，没有用于：

```text
metadataBase
canonical URL
Open Graph URL
sitemap
robots
```

这不是运行故障，但说明变量已经存在、功能还没接上。生产 SEO 收口时再使用即可。

### P2-9：详情页 metadata 会重复查询

Reviews/Games 详情页在 `generateMetadata()` 和页面函数里各调用一次 getter。是否被框架层去重不应依赖猜测。

当前数据量小，影响有限。以后可以用 React `cache()` 包装按 slug 查询，明确做到单请求内复用。

### P2-10：Lightbox 可访问性仍可加强

已有的优点：

- `role="dialog"`
- `aria-modal="true"`
- Esc 关闭
- 左右方向键切换
- 按钮有 aria-label
- 打开时锁定 body 滚动

仍缺：

- 打开时把焦点移进 modal。
- 焦点 trap。
- 关闭后恢复触发元素焦点。
- 更明确的 focus-visible 样式。

这不阻塞开发，但属于正式可访问性收口。

## P3：可以等到功能增长后再做

以下内容当前不缺，不要为了“架构完整”提前加入：

- Redis。
- 消息队列。
- 独立 API 服务。
- Prisma。
- Kubernetes。
- 微服务。
- Storybook。
- 复杂监控栈。
- Media collection：如果当前图片继续通过 `public` + Git + Coolify 发布，可以暂缓。
- S3/R2：只有开始后台上传媒体并要求跨部署持久化时才需要。

## 12. 当前验证结果表

| 检查项                | 结果   | 说明                         |
| --------------------- | ------ | ---------------------------- |
| Dev Container         | 通过   | 容器正在运行                 |
| Node                  | 通过   | `v22.16.0`                   |
| pnpm                  | 通过   | `10.28.2`                    |
| Docker-in-Docker      | 通过   | Docker 29.6.1                |
| Docker Compose        | 通过   | v2.40.3                      |
| PostgreSQL 容器       | 通过   | `postgres:16` 正在运行       |
| 本地环境变量          | 通过   | 4 个必需键存在且格式正确     |
| `/`                   | 通过   | HTTP 200                     |
| `/tools`              | 通过   | HTTP 200                     |
| `/reviews`            | 通过   | HTTP 200                     |
| `/games`              | 通过   | HTTP 200                     |
| `/admin`              | 通过   | HTTP 200                     |
| ESLint                | 通过   | exit 0                       |
| TypeScript            | 通过   | exit 0                       |
| Prettier check        | 失败   | 3 个生成文件不符合当前规则   |
| Migration discovery   | 通过   | 4 个文件可读取               |
| 本地 migration 状态   | 未对齐 | 4 个均显示未执行             |
| Next production build | 未确认 | 本次执行长时间未返回完整结果 |
| 自动化测试            | 缺失   | 没有 test script             |
| CI                    | 缺失   | 没有 GitHub Actions          |

## 13. 推荐的日常开发流程

### 每天开始

```text
1. 启动 Docker Desktop。
2. Reopen in Container。
3. 确认当前终端位于 /workspaces/Kita。
4. 启动 PostgreSQL。
5. 启动 Next.js。
```

```bash
docker compose up -d postgres
pnpm dev
```

### 修改普通前端代码后

```bash
pnpm lint
pnpm typecheck
```

### 修改 Payload collection 后

```bash
pnpm payload:types
pnpm typecheck
```

然后创建 migration，并审查 migration 内容。不要只依赖 development schema push。

### 提交前

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

在 format 策略收口之前，`format:check` 会继续因生成文件失败，因此应先解决 P1-1。

### Seed 使用规则

默认：

```env
ENABLE_DEV_SEED=false
```

只有在明确使用临时开发数据库时才短暂改为 `true`。执行后立即恢复 `false`。

当前尤其不要随意执行：

```bash
pnpm seed:games
```

因为它会删除 Games 数据。

## 14. 换电脑后的验收清单

### 宿主机

- [ ] Docker Desktop 正常启动。
- [ ] WSL 2 backend 正常。
- [ ] VS Code Dev Containers 扩展可用。
- [ ] Git 能 clone/pull 仓库。
- [ ] 没有为了 Kita 安装 Windows Node、pnpm 或 PostgreSQL。

### Dev Container

- [ ] 左下角显示 Dev Container: kita。
- [ ] `node --version` 为 Node 22。
- [ ] `pnpm --version` 与 `packageManager` 一致。
- [ ] `docker --version` 成功。
- [ ] `docker compose version` 成功。
- [ ] `pnpm install --frozen-lockfile` 成功。

### 环境变量

- [ ] `.env` 存在。
- [ ] `.env` 没有被 Git 跟踪。
- [ ] `PAYLOAD_SECRET` 至少 32 位。
- [ ] `DATABASE_URI` 指向开发数据库。
- [ ] `NEXT_PUBLIC_SITE_URL=http://localhost:3000`。
- [ ] `ENABLE_DEV_SEED=false`。

### 数据库

- [ ] `docker compose up -d postgres` 成功。
- [ ] `docker ps` 能看到 postgres。
- [ ] `/admin` 可以打开。
- [ ] 管理员可以登录。
- [ ] 可以在 Admin 中创建和读取一条测试内容。

### 应用

- [ ] `/` 返回 200。
- [ ] `/about` 返回 200。
- [ ] `/tools` 返回 200。
- [ ] `/reviews` 返回 200。
- [ ] `/games` 返回 200。
- [ ] `/admin` 返回 200。
- [ ] 能区分数据库内容和 fallback 内容。

### 工程检查

- [ ] `pnpm format:check` 通过。
- [ ] `pnpm lint` 通过。
- [ ] `pnpm typecheck` 通过。
- [ ] `pnpm build` 明确 exit 0。
- [ ] migration 能在临时空库从 0 执行。

## 15. 建议执行顺序

不要同时重写所有配置。按下面顺序风险最低。

### 第一轮：让当前开发结果可信

1. 决定生成文件的 Prettier 策略，修复 `format:check`。
2. 停止 `pnpm dev` 后重新验证一次 `pnpm build`。
3. 明确页面上的数据来自数据库还是 fallback。
4. 把 `seed:games` 改成非破坏式 upsert。

### 第二轮：让数据库发布链路可信

1. 用临时空库完整执行 4 个 migration。
2. 验证 production entrypoint。
3. 给 postgres readiness 加有限重试或 healthcheck。
4. 明确 Coolify 使用 Compose 还是“Dockerfile + 独立数据库 resource”。
5. 如果使用生产 Compose，取消 PostgreSQL 对宿主机发布 5432。

### 第三轮：让仓库可长期维护

1. 写根 README。
2. 给历史文档标记状态并修正文档漂移。
3. 加 mapper/server getter 单元测试。
4. 加最小 GitHub Actions。
5. 加健康检查和少量 Playwright smoke test。

### 第四轮：上线后再补

1. 邮件适配器。
2. 数据库自动备份与恢复演练。
3. Admin 额外保护。
4. sitemap、robots、metadataBase、Open Graph。
5. 真正需要上传媒体时再引入 Media + S3/R2。

## 16. 最终架构评价

### 合理的部分

- Next.js + Payload + PostgreSQL 适合个人内容站。
- `(site)` / `(payload)` route groups 的拆分正确。
- feature-oriented 目录结构清楚。
- `src/server` + mapper 避免 UI 直接绑定 Payload document。
- 环境变量有 Zod 校验。
- 开发 seed 默认关闭。
- 生产环境数据库错误不会在 Reviews/Games 中静默伪装成功。
- Dockerfile 使用 multi-stage、standalone 和非 root 用户。
- production startup 自动执行 migration。
- 静态图片通过 `public` + Git 发布，符合当前阶段，不必急着上对象存储。

### 需要收口的部分

- fallback 与真实 CMS 数据边界不够可见。
- Tools 的生产 fallback 逻辑不一致。
- Games seed 破坏性太强。
- 本地 schema push 与 production migration 没有形成可信的验证闭环。
- 一个 Compose 同时服务开发与生产，数据库端口和 readiness 语义冲突。
- 生成文件与 Prettier gate 冲突。
- 文档更新没有跟上代码演进。
- 缺少自动测试、CI 和生产健康检查。

### 不需要做的事情

这个项目不需要推倒重写，也不需要为了“架构感”继续增加中间层。当前正确方向是：

```text
保留现有主架构
  -> 收紧开发数据来源
  -> 验证 migration
  -> 稳定 build
  -> 分清开发与生产 Compose 语义
  -> 增加最小自动化保障
```

## 17. 一句话结论

Kita 已经具备继续写功能的完整基础，架构主线是合理的；现在缺的不是更多技术栈，而是把“可运行”收口成“可验证、可迁移、可复现、不会被 fallback 和危险 seed 误导”的开发与发布流程。
