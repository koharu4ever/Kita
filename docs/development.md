# Kita 开发指南

> 最后核对：2026-09-01
>
> 正常工作区：`C:\dev\Kita`。D 盘旧工作区已经退役。

## 主机与容器边界

主机只需要 Git、Docker Desktop、VS Code 和 Dev Containers 扩展。Node、pnpm、Payload CLI、项目依赖和本地 PostgreSQL 均在 Dev Container 内使用。

不要在 Windows 宿主机运行 `pnpm install` 或项目脚本。不要用 root 运行 Next.js、pnpm 或 Payload 命令。

## 第一次打开

1. 从 GitHub clone 到 `C:\dev\Kita`。
2. 从 `.env.example` 复制 `.env`，只在本机填写开发值。
3. 使用 VS Code **Reopen in Container**。
4. 等待 `postCreateCommand` 完成 frozen-lockfile install。
5. 在容器终端确认：

```bash
whoami
node --version
pnpm --version
pnpm dev
```

正常用户必须是 `node`。`pnpm dev` 是唯一日常入口，会启动并等待本地 PostgreSQL healthy，再启动 Next.js。

## Codex CLI

Dev Container 镜像内置固定版本的 Codex CLI，登录、个人配置与会话状态保存在本机 `kita-codex-home` named volume，不进入 Git 或生产镜像。第一次使用、权限边界、容量检查、升级和彻底删除步骤统一维护在 [Codex CLI 工作流](./codex-cli.md)。

推荐由开发者手动运行 `pnpm dev`，再在另一个容器终端启动 `codex`。Codex 默认不管理 Docker 生命周期；不要同时让 Codex Desktop 和 CLI 修改同一个工作树。

## 日常流程

```bash
git status --short --branch
git switch main
git pull --ff-only origin main
git switch -c codex/<short-task-name>
pnpm dev
```

主要地址：

```text
http://localhost:3000
http://localhost:3000/tools
http://localhost:3000/reviews
http://localhost:3000/games
http://localhost:3000/admin
```

提交前停止 `pnpm dev`，避免 dev/build 同时写 `.next`，然后运行与风险相称的检查：

```bash
pnpm test
pnpm test:integration # when migrations, Payload access, or CI changes
pnpm check
pnpm build
```

使用功能分支 -> commit -> push -> Pull Request -> required `quality` -> merge。不要直接 push `main`。

## 常用命令

| 命令                          | 用途                                         |
| ----------------------------- | -------------------------------------------- |
| `pnpm dev`                    | 正常本地开发入口                             |
| `pnpm dev:services`           | 只启动并等待 PostgreSQL，供诊断使用          |
| `pnpm dev:services:stop`      | 停止本地 PostgreSQL container，不删除 Volume |
| `pnpm test`                   | Vitest + backup shell 场景                   |
| `pnpm test:integration`       | 一次性 PostgreSQL 16 migration/access smoke  |
| `pnpm check`                  | format、lint、typecheck                      |
| `pnpm build`                  | production build                             |
| `pnpm payload:types`          | 重新生成 Payload types                       |
| `pnpm payload:importmap`      | 重新生成 Admin import map                    |
| `pnpm payload:migrate:create` | 根据已确认 schema 变更生成 migration         |
| `pnpm payload:migrate:status` | 查看当前数据库 migration 状态                |

`pnpm start` 不是 production 容器入口；Docker production 使用 standalone `node server.js`。本地通常使用 `pnpm dev`。

## 本地环境变量

只记录键，不把真实值写入文档或提交：

- `PAYLOAD_SECRET`（至少 32 字符）
- `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`
- `DATABASE_URI`
- `MEDIA_STORAGE_MODE=local`

本地不需要 R2 凭据。`SKIP_ENV_VALIDATION` 只供受控 build/CI 使用，不是生产配置。

## 新增或修改内容功能

推荐顺序：

1. 定义或确认 feature DTO；
2. 修改 Payload collection；
3. 更新 mapper；
4. 更新 server getter，并保持 `overrideAccess: false`；
5. 更新 route/page 和组件；
6. 更新 fixtures 与测试；
7. 生成 types/import map；
8. schema 变化时生成并审查 migration；
9. 运行 test/check/build；
10. 在本地 Admin 和公开页面做 smoke。

不要让 UI 直接消费 `Payload` generated document type。开发与生产都以 Payload 为内容事实源：空 Collection 使用页面 empty state，查询失败交给 error boundary，不用静态 fixture 掩盖后端状态。

## Schema 与 migration

Development 可以由 Payload schema push 维护本地数据库，因此本地 `payload_migrations` 不能反推 Production。Production entrypoint 执行仓库 `src/migrations` 中的 migration。

规则：

- schema 修改和对应 migration 放在同一 PR；
- 审查 `up` 和 `down`，尤其是数据删除、NOT NULL 和 relationship；
- 不在已有 Production 数据库盲跑全部初始 migration；
- 不为了 migration 测试删除本地或生产 Volume；
- 破坏性 migration 前先确认生产备份和内容前置条件；
- 回滚旧镜像前确认旧 schema 契约，必要时先运行对应 `down`；
- `pnpm test:integration` 和 CI 使用无 Volume 的一次性 PostgreSQL 16，验证完整 fresh migration、再次运行时无待执行 migration、当前 Media-only schema 和 Reviews 访问边界；
- fresh smoke 不证明带真实数据升级、全部 `down`、dump restore 或 Production 状态，不能据此跳过 migration review 和备份前置条件。

## 本地内容

本地内容通过 Payload Admin 手工创建，保存在 Docker-in-Docker 的开发 PostgreSQL 和 `.payload-media`，不会进入 Git 或 Production。仓库不提供可公开调用的 seed route，也不在数据库为空或不可用时注入演示内容；因此本地页面展示的是实际 CMS 状态。需要确定性测试数据时，使用单元测试 fixture 或一次性 integration 数据库，不污染日常开发库。

## 常见排障

### `.next` ownership 错误

先停止所有 Next/pnpm 进程，确认终端用户为 `node`，然后 Rebuild Dev Container。`.next` 和 `node_modules` 是 targeted volumes，不要在宿主机用 `sudo rm -rf` 或手工改所有权，也不要让 root 再次生成文件。

### dev 与 build 冲突

停止 `pnpm dev` 后再运行 `pnpm build`。两者同时写 `.next` 会触发项目守卫或产生不稳定结果。

### 端口 3000 被占用

VS Code 可能把多个 Dev Container 的内部 3000 自动转发成不同宿主端口。先看 **Ports** 面板和当前 workspace，不要因为浏览器使用 3001 就修改项目配置。关闭旧工作区的 dev server 后再启动当前项目。

### PostgreSQL 没启动

运行：

```bash
pnpm dev:services
docker compose -f compose.yaml -f compose.dev.yaml ps
```

只诊断当前 Dev Container 的 Docker daemon。不要删除 `postgres-data`，除非用户明确要求丢弃本地数据。

### Docker pull 凭据助手报错

这通常来自 Dev Container 继承了失效的宿主 Docker credential helper。普通 dev/test/build 不受影响。需要拉取镜像时优先修复 Docker 配置或使用明确的临时 Docker config；不要把 secret 写入仓库。

## 安全边界

- 不读取或输出不需要的 secret；
- 不提交 `.env`；
- 不删除数据库或 Volume；
- 不擅自修改 Coolify、Cloudflare 或生产环境；
- 不在不确定的脏工作树中批量 stage；
- 所有破坏性数据操作先确认目标、备份和授权。
