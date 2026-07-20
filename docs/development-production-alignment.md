# Kita 开发环境与生产环境对齐说明

> 完成日期：2026-07-06；当前事实复核：2026-07-20
>
> 适用范围：当前 Dev Container、本地 PostgreSQL、repository Docker Compose、Coolify Compose Production。
>
> 安全说明：本文不包含任何真实生产 secret。此前截图中出现的生产 secret 必须按本文顺序轮换。

## 1. 本次修复目标

本次不是让本地和生产使用完全相同的密码，也不是把生产数据库复制到新电脑。

正确目标是：

```text
相同的服务结构
相同的环境变量名称
相同的 PostgreSQL 主版本
相同的 Payload collection 和 migration
相同的代码检查与生产构建

但：
本地和生产使用各自独立的 secret、数据库和数据卷
```

这叫做“结构和配置颗粒度对齐”，而不是“秘密值完全相同”。

## 2. 修复后的整体结构

### 2.1 本地开发

```text
Windows
  Docker Desktop
    Dev Container
      Node 22
      pnpm 10.28.2
      Next.js dev
      Payload CMS
      Docker-in-Docker
        PostgreSQL 16
        postgres-data
```

本地 Next.js 在 Dev Container 中直接运行：

```bash
pnpm dev
```

本地 PostgreSQL 由同一个 repository Compose 定义，但额外叠加开发 override：

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres
```

项目已经把它封装成内部服务命令：

```bash
pnpm dev:services
```

日常开发不需要先运行它；`pnpm dev` 会自动调用并等待 PostgreSQL healthy。`pnpm dev:services` 只用于单独启动数据库的诊断或维护场景。

### 2.2 Coolify 生产

```text
Coolify Compose Application
  |-- web
  |     Next.js standalone
  |     Payload CMS
  |     startup migration
  |
  |-- postgres
  |     PostgreSQL 16
  |
  `-- postgres-data
        生产持久化数据
```

Coolify 只读取 `compose.yaml`，不会读取 `compose.dev.yaml`。

因此：

- 生产 PostgreSQL 不再通过 repository Compose 发布 `5432:5432`。
- web 通过 Compose 内部主机名 `postgres` 访问数据库。
- 本地才通过 `compose.dev.yaml` 把 PostgreSQL 暴露到 Dev Container 的 `localhost:5432`。

## 3. 本次实际修改

### 3.1 分离生产数据库端口与本地端口

修改前，`compose.yaml` 中 PostgreSQL 包含：

```yaml
ports:
  - "5432:5432"
```

这对本地开发有用，但交给 Coolify 后会把数据库端口发布到服务器宿主机，开发和生产需求混在了一起。

修复后：

```text
compose.yaml
  不发布 PostgreSQL 端口

compose.dev.yaml
  本地发布 5432:5432
```

生产 web 与 postgres 仍位于同一个 Compose network，所以 web 不需要宿主机端口也能连接数据库。

### 3.2 增加 PostgreSQL healthcheck

`postgres` 现在使用 `pg_isready` 检查：

```text
数据库进程是否已经接受连接
目标用户是否正确
目标数据库名是否正确
```

`web.depends_on` 改为等待：

```text
service_healthy
```

这样生产容器不会只因为 postgres container 已创建，就立刻执行 Payload migration。

### 3.3 固定依赖安装

Dev Container 初始化命令从：

```bash
pnpm install
```

改为：

```bash
pnpm install --frozen-lockfile
```

新电脑会严格按照 `pnpm-lock.yaml` 安装，不会在初始化环境时悄悄更新 lockfile。

### 3.4 环境变量模板对齐

`.env.example` 现在同时列出：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYLOAD_SECRET=<本地随机密钥>
ENABLE_DEV_SEED=false
POSTGRES_DB=kita
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URI=postgres://postgres:postgres@localhost:5432/kita
```

这让本地 PostgreSQL service 配置和应用连接串出现在同一份模板里。

### 3.5 增加服务与质量辅助命令

```bash
pnpm dev:services
pnpm dev:services:stop
pnpm check
```

含义：

```text
dev:services
  仅在诊断或维护时，使用生产 Compose + 开发 override 单独启动本地 PostgreSQL

dev:services:stop
  停止本地 PostgreSQL，不删除 Volume

check
  format:check + lint + typecheck
```

### 3.6 修复格式检查

Payload 自动生成的文件不再参与 Prettier gate：

```text
src/payload/payload-types.ts
src/migrations/*.json
```

Next.js 自动维护的根目录 `next-env.d.ts` 也不再由 Git 跟踪。它仍由 Next.js 在开发或构建时生成，并继续被 `tsconfig.json` 使用；开发者不手工编辑，也不把 dev/build 路径切换造成的变化提交到 PR。

这些文件由 Payload generator 维护。手写 TypeScript、组件、配置和 Markdown 仍继续接受 Prettier 检查。

### 3.7 修复 Tools 生产 fallback

修改前：生产数据库为空时，`/tools` 仍显示本地静态数据。

修改后：

```text
development
  数据库为空时允许本地 fallback

production
  数据库为空时返回空列表
  数据库错误时抛出错误
```

这样生产环境不会用演示数据掩盖真实数据库状态。

### 3.8 修复 Games seed

修改前：

```text
seed:games
  -> 删除已有 Games
  -> 写入 WHITE ALBUM2
```

修改后：

```text
seed:games
  -> 按 slug 查找
  -> 已存在则 update
  -> 不存在则 create
```

它现在与 Tools seed 一样是幂等 upsert，不会再删除手工录入的其他 Games。

## 4. 本地与生产变量关系

| 变量                   | 本地开发                | Coolify Production             | 必须相同吗     |
| ---------------------- | ----------------------- | ------------------------------ | -------------- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://kita.kral-koharu.com` | 否             |
| `PAYLOAD_SECRET`       | 本地专用                | 生产专用且稳定                 | 否             |
| `ENABLE_DEV_SEED`      | 默认 `false`            | 必须 `false`                   | 通常同为 false |
| `POSTGRES_DB`          | `kita`                  | `kita`                         | 可以相同       |
| `POSTGRES_USER`        | `postgres`              | 当前为 `postgres`              | 可以相同       |
| `POSTGRES_PASSWORD`    | 本地开发密码            | 生产强密码                     | 否             |
| `DATABASE_URI` host    | `localhost`             | `postgres`                     | 否             |

必须满足的只是每套环境内部一致：

```text
本地 DATABASE_URI 密码
  = 本地 PostgreSQL 实际密码

生产 DATABASE_URI 密码
  = 生产 PostgreSQL 实际密码
  = Coolify POSTGRES_PASSWORD
```

`PAYLOAD_SECRET` 不是数据库密码，并且不应该与 `POSTGRES_PASSWORD` 使用同一个字符串。

## 5. 新电脑第一次启动

### 5.1 宿主机准备

只安装：

```text
Docker Desktop
VS Code
Dev Containers 扩展
Git
浏览器
```

不需要安装：

```text
Windows Node.js
Windows pnpm
Windows PostgreSQL
Payload CLI
```

### 5.2 打开项目

```text
1. 启动 Docker Desktop。
2. 用 VS Code 打开 Kita。
3. 执行 Dev Containers: Reopen in Container。
4. 等待 pnpm install --frozen-lockfile 完成。
```

### 5.3 创建本地 `.env`

从 `.env.example` 复制，生成一个仅用于本地的 `PAYLOAD_SECRET`。

不要把 Coolify 的生产 secret 复制到新电脑。

如果使用模板中的本地默认数据库密码：

```env
POSTGRES_DB=kita
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URI=postgres://postgres:postgres@localhost:5432/kita
```

### 5.4 启动开发服务

在 Dev Container 终端执行：

```bash
pnpm dev
```

这是唯一正常开发入口；`pnpm dev:services` 不是必需的前置步骤。

访问：

```text
http://localhost:3000
http://localhost:3000/tools
http://localhost:3000/reviews
http://localhost:3000/games
http://localhost:3000/admin
```

### 5.5 停止开发

停止 Next.js：

```text
在运行 pnpm dev 的终端按 Ctrl+C
```

停止 PostgreSQL，但保留数据：

```bash
pnpm dev:services:stop
```

不要日常执行：

```bash
docker compose down -v
```

`-v` 会删除数据库 Volume。

## 6. 日常写码流程

### 开始写码

```bash
pnpm dev
```

### 修改前端组件

```bash
pnpm check
```

### 修改 Payload collection

```bash
pnpm payload:types
pnpm payload:migrate:create
pnpm check
```

必须人工审查新 migration，确认没有意外删除字段或表。

### 使用 seed

临时把本地 `.env` 设置为：

```env
ENABLE_DEV_SEED=true
```

启动 dev server 后执行：

```bash
pnpm seed:tools
pnpm seed:games
```

完成后恢复：

```env
ENABLE_DEV_SEED=false
```

生产永远保持 `false`。

### 提交前

开发服务器运行时：

```bash
pnpm check
```

生产构建前先停止 `pnpm dev`，因为 `next dev` 与 `next build` 共用 `.next`：

```bash
pnpm build
```

不要同时运行 `next dev` 和 `next build`。本次验证已经确认，同时运行会使旧开发进程失去响应，需要重新启动。

## 7. Coolify Production 正确设置

### 7.1 Runtime / Buildtime

| 变量                   | Buildtime | Runtime |
| ---------------------- | --------: | ------: |
| `NEXT_PUBLIC_SITE_URL` |        是 |      是 |
| `DATABASE_URI`         |        否 |      是 |
| `PAYLOAD_SECRET`       |        否 |      是 |
| `ENABLE_DEV_SEED`      |        否 |      是 |
| `POSTGRES_DB`          |        否 |      是 |
| `POSTGRES_USER`        |        否 |      是 |
| `POSTGRES_PASSWORD`    |        否 |      是 |

Dockerfile builder 已使用内部构建占位值完成环境校验，不需要把数据库密码和 Payload secret 注入 build 阶段。

Coolify 自动生成的这些变量无需复制或手动维护：

```text
SERVICE_FQDN_WEB
SERVICE_URL_WEB
NODE_ENV
NEXT_TELEMETRY_DISABLED
```

### 7.2 Preview Deployments

Coolify 的 Preview Environment Variables 与 Production 分开。

如果当前不使用 Pull Request Preview：

```text
可以保持 Preview Deployments 关闭
不要把生产 secret 复制到 Preview
```

如果以后启用 Preview：

- 使用独立的 Preview `PAYLOAD_SECRET`。
- 使用独立的 Preview 数据库密码和 Volume。
- 不允许 Preview 连接 Production 数据库。
- 不在来自不可信公开 PR 的 Preview 中放生产 secret。

## 8. 已暴露生产 secret 的轮换流程

此前 Coolify 截图显示了生产 `PAYLOAD_SECRET` 和数据库凭据。这些值必须视为已泄露。

### 8.1 不要立即做的事

不要直接：

```text
只修改 Coolify POSTGRES_PASSWORD
立刻 Redeploy
删除 postgres-data
执行 docker compose down -v
```

只修改环境变量不会自动改变已有 PostgreSQL Volume 中的用户密码，可能导致 web 无法连接。

### 8.2 正确顺序

1. 在 Coolify 确认生产数据库备份可用。
2. 记录当前部署状态和最近成功备份时间。
3. 生成新的生产 `PAYLOAD_SECRET`。
4. 生成新的生产数据库密码。
5. 进入生产 postgres 容器或 Coolify Database Terminal。
6. 在数据库内部修改 `postgres` 用户密码。
7. 更新 Coolify `POSTGRES_PASSWORD`。
8. 更新 Coolify `DATABASE_URI` 中的密码。
9. 更新 Coolify `PAYLOAD_SECRET`。
10. 将秘密变量关闭 Buildtime，只保留 Runtime。
11. Redeploy。
12. 检查 web startup log 中 migration 成功。
13. 打开 `/admin` 重新登录。
14. 检查 `/tools`、`/reviews`、`/games`。
15. 重启 web，确认数据仍存在。

数据库内部修改密码需要类似：

```sql
ALTER USER postgres WITH PASSWORD '<new-production-password>';
```

不要把真实密码写进仓库、文档或聊天。应在受信任的 Coolify Terminal 中执行，并避免把命令留在可公开日志中。

### 8.3 `PAYLOAD_SECRET` 轮换影响

更新 `PAYLOAD_SECRET` 后：

- 现有 Admin session 会失效。
- 需要重新登录。
- 数据库内容不会因此被删除。
- 不要在每次部署时自动生成新值。

## 9. Migration 对齐规则

本地开发和生产不要求使用同一个数据库，但必须使用同一套 migration 文件。

```text
collection 修改
  -> payload:types
  -> migrate:create
  -> 审查 migration
  -> 本地验证
  -> commit/push
  -> Coolify build
  -> production entrypoint migrate
  -> Next.js start
```

当前本地数据库历史上主要通过 Payload development schema push 建立，migration status 没有完整登记。因此：

- 不要在当前已有表的本地库上盲目补跑初始 migration。
- 在需要验证完整生产迁移时，应使用临时空数据库/临时 Volume。
- 生产 migration 状态必须以生产数据库自己的 `payload_migrations` 为准。

## 10. 本次验证结果

| 验证                        | 结果                  |
| --------------------------- | --------------------- |
| JSON 配置解析               | 通过                  |
| Compose base + dev override | 通过                  |
| 本地 postgres recreation    | 通过，Volume 保留     |
| PostgreSQL healthcheck      | `healthy`             |
| `pg_isready`                | accepting connections |
| `pnpm format:check`         | 通过                  |
| `pnpm lint`                 | 通过                  |
| `pnpm typecheck`            | 通过                  |
| `pnpm check`                | 通过                  |
| `pnpm build`                | 通过                  |
| Next.js route generation    | 通过                  |
| 开发服务器重新启动          | 通过                  |

生产构建结果：

```text
Next.js 16.2.7
Compiled successfully
TypeScript finished
Static pages generated
exit code 0
```

Windows bind mount 文件系统较慢，Next.js 明确报告 slow filesystem。它影响编译速度，但不是代码错误，也不代表 Node/pnpm 安装到了 Windows。

## 11. 本次没有做的事情

- 没有把生产 secret 写入本地 `.env`。
- 没有读取或保存用户新的生产 secret。
- 没有修改生产 PostgreSQL 密码。
- 没有 Redeploy Coolify。
- 没有删除本地或生产数据库 Volume。
- 在 2026-07-06 的原始修复中尚未给 `node_modules`、`.pnpm-store`、`.next` 添加 named volume。
- 没有增加 Redis、Prisma、独立 API 或其他架构层。

这些边界是刻意保留的。代码仓库修复可以自动验证；生产 secret 轮换必须在备份确认后，由项目所有者在 Coolify 的受信任界面完成。

### 2026-07-14 本地性能后续

在 root/并发守卫已经完成后，实测 Windows `9p` 挂载使 Turbopack 文件系统基准达到 820ms，冷路由编译达到数分钟。因此现在仅在 `.devcontainer/devcontainer.json` 中为 `node_modules` 与 `.next` 使用 targeted named volumes；源码、`.env` 与 Git 仍保留在宿主工作区。

这不是生产架构变更：生产 Docker build、Coolify、PostgreSQL 数据 Volume 和 secret 均不受影响。两个开发 Volume 由 `node` 用户写入，现有 workspace guard 继续检查 `.next` 所有权与 dev/build 冲突。

`pnpm dev` 现在会自动执行并等待 `pnpm dev:services`，避免 Dev Container 重启后 PostgreSQL 尚未恢复而触发 Payload 的分钟级重连等待。

这两个 named volumes 是经实测保留的有限性能例外，不授权增加第三个开发 Volume，也不改变 PostgreSQL 或 Coolify 的 Volume 结构。

### 2026-07-15 OpenList 边界

OpenList 已作为独立 Coolify Application 部署。Kita 不把 OpenList 加入 repository Compose，不调用其 API，也不共享数据库、Volume 或 secret；Kita 只在 Games 内容中保存公开 archive URL。这个 URL 是两者唯一契约，因此 OpenList 故障不应阻止 Kita 页面渲染。

### 2026-07-20 恢复与环境边界

本地、CI 和生产仍然使用相同代码与 lockfile，但恢复材料不应强行放进同一个仓库：

```text
GitHub
  代码、migration、Compose、Dev Container、CI、.env.example、Runbook

Bitwarden
  外部账户、生产/开发真实 secret、平台恢复字段

私有 R2 + C 盘副本
  已加密的 Coolify SSH keys / authorized_keys 恢复归档与 checksum
```

2026-07-20 已在 `C:\dev\Kita` 完成一次真实的 D 盘单点丢失恢复演练：从 GitHub 全新 clone，从 `.env.example` 与 Bitwarden 的本地开发记录重建 `.env`，Reopen in Container 后确认 `node` 用户、Node 22 与 pnpm，`pnpm dev` 自动启动全新 PostgreSQL，主要页面 smoke、36 Vitest、4 个 backup shell 场景、`pnpm check` 和 `pnpm build` 全部通过。该演练证明本地开发环境可从仓库外材料重建，但不等于 PostgreSQL restore、Coolify restore 或 VPS 全灾难恢复已经演练。

OpenList 的 Application 信息已记录，最终 storage provider 与 data Volume backup 则因挂载方案尚未定型而明确延期。这个延期不改变 Kita 与 OpenList 的 URL-only 边界，也不应把临时测试挂载描述成不可替代生产资产。

完整恢复状态只以 `docs/kita-disaster-recovery-inventory-and-rebuild-runbook-2026-07-16.md` 为准，避免本地/生产对齐文档成为第二套恢复事实来源。

## 12. 最终标准流程

日常开发只记住：

```bash
pnpm dev
```

提交前：

```bash
pnpm test
pnpm check
# 停止 pnpm dev
pnpm build
```

当前 `pnpm test` 包含 36 个 Vitest 和 4 个 backup shell 场景。

部署：

```text
commit
  -> push GitHub
  -> Coolify 读取 compose.yaml
  -> postgres healthcheck
  -> web build
  -> Payload migrate
  -> Next.js start
```

本地与生产的代码结构现在是一致的；secret、数据库数据和端口暴露仍按环境隔离，这才是正确的开发/生产对齐。
