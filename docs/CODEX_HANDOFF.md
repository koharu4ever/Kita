# Kita Codex 开发交接

> 更新时间：2026-07-13
>
> 项目根目录：`D:\lipan\Kita`
>
> 用途：在新建 Codex 工作区并将 Project Root 选择为 `D:\lipan\Kita` 后，先让 Codex 完整阅读本文，再开始任何修改。

## 给新 Codex 的第一条消息

复制下面这段到新 Codex 输入框：

```text
请先完整阅读 docs/CODEX_HANDOFF.md，然后阅读 docs/current-project-status.md、docs/project-structure.md 和 docs/development-production-alignment.md。先只读检查 git status、当前分支、Dev Container、PostgreSQL 和环境变量键是否完整，不要输出任何 secret，不要删除 Volume，不要修改生产环境。确认状态后，按 CODEX_HANDOFF.md 中的架构、开发命令和安全边界继续协作。
```

## 1. 当前状态结论

Kita 的本地开发环境和 Coolify 生产运行链路已经搭建完成并通过实际验证。

可以确认：

```text
本地 Dev Container              可用
本地 PostgreSQL 16              healthy
本地 Node                       v22.16.0
本地 pnpm                       10.28.2
pnpm test                       33 Vitest + 4 backup shell 场景通过
pnpm check                      通过
pnpm build                      通过
GitHub main                     bf9c53e（PR #7）
GitHub Actions quality          已启用并通过
main Ruleset                    必须 PR + quality
Coolify Compose Production      正在运行
PostgreSQL -> R2 backup         已启用并有真实成功日志/对象
https://kita.kral-koharu.com/   HTTP 200
/tools                          HTTP 200
/reviews                        HTTP 200
/games                          HTTP 200
/admin                          HTTP 200
```

当前最新 main：

```text
bf9c53e Merge pull request #7 from koharu4ever/codex/fix-env-validation-flag
```

## 2. 项目架构

```text
Browser
  -> Next.js 16 App Router
  -> Server Components / server getters
  -> Payload CMS Local API
  -> PostgreSQL 16
```

主要组成：

```text
src/app/(site)
  前台页面：Home、About、Tools、Reviews、Games

src/app/(payload)
  Payload Admin、REST API、GraphQL API

src/features
  按功能组织 UI、view model、mapper 和开发 fallback

src/server
  Payload Local API 查询与服务端数据编排

src/payload
  Users、Tools、Reviews、Games collections

src/migrations
  生产数据库 migration
```

项目没有独立 Express 后端，也没有 Prisma。Payload 已承担 CMS、CRUD、权限、Local API 和 PostgreSQL schema 管理职责，不应无理由增加新的后端层。

## 3. 开发环境结构

```text
Windows
  Docker Desktop
    Dev Container
      Node / pnpm / Next.js / Payload
      Docker-in-Docker
        PostgreSQL 16
        postgres-data
```

Windows 宿主机只需要通用工具：

```text
Git for Windows
Docker Desktop
VS Code
Dev Containers 扩展
浏览器
```

不要为 Kita 在 Windows 全局安装：

```text
Node.js
pnpm
Payload CLI
PostgreSQL Windows Service
```

所有项目命令默认在 Dev Container 终端执行，终端提示应类似：

```text
node ➜ /workspaces/Kita
```

### Dev Container 用户边界

Docker-in-Docker 入口需要容器默认用户保持 root，但 VS Code 和生命周期命令使用 `remoteUser: node`。因此：

```text
VS Code Dev Container 终端       node
裸 docker exec（未指定 -u）      可能是 root
```

Codex 或其他自动化通过 Docker 进入容器时，必须显式使用：

```bash
docker exec -u node -w /workspaces/Kita <container> ...
```

项目 package scripts 与 `next.config.ts` 已加入 bind-mounted workspace 用户守卫。root 在 `/workspaces/...` 运行项目命令会被拒绝；dev/build 冲突也会被拒绝。不得用 sudo 绕过守卫。

如果守卫报告 `.next` 所有权异常，先停止所有 Next 进程，再按 `docs/first-priority-next-build-gate-remediation-2026-07-10.md` 的路径核验和清理流程处理。禁止把清理范围扩大到数据库、Volume、`node_modules` 或其他项目目录。

## 4. Compose 分层

### `compose.yaml`

生产/基础服务定义：

```text
web
postgres
postgres-data
PostgreSQL healthcheck
web 等待 service_healthy
```

生产 PostgreSQL 不通过 repository Compose 发布宿主机 5432。

### `compose.dev.yaml`

仅用于本地开发：

```text
把内层 PostgreSQL 映射到 Dev Container localhost:5432
```

本地使用两份 Compose 叠加；Coolify 只读取 `compose.yaml`。

不要给以下目录擅自增加 Docker named volume：

```text
node_modules
.pnpm-store
.next
```

当前决定是让这些目录作为项目内生成产物存在于 bind-mounted workspace。

## 5. 环境变量边界

本地 `.env` 已被 `.gitignore` 忽略，不得提交。

本地应存在这些键：

```text
NEXT_PUBLIC_SITE_URL
PAYLOAD_SECRET
ENABLE_DEV_SEED
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
DATABASE_URI
```

只允许检查：

```text
键是否存在
值是否为空
长度/URL 形状是否合法
```

禁止在 Codex 输出、日志、Markdown、截图或 commit 中显示真实 secret。

本地与生产不使用相同 secret：

| 配置                   | 本地                    | Coolify Production             |
| ---------------------- | ----------------------- | ------------------------------ |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://kita.kral-koharu.com` |
| `PAYLOAD_SECRET`       | 本地专用                | 生产专用且稳定                 |
| `POSTGRES_PASSWORD`    | 本地开发值              | 生产强密码                     |
| `DATABASE_URI` host    | `localhost`             | `postgres`                     |
| `ENABLE_DEV_SEED`      | 默认 `false`            | 必须 `false`                   |

同一环境内部必须满足：

```text
DATABASE_URI 中的数据库用户、密码和数据库名
  与该环境 POSTGRES_USER、POSTGRES_PASSWORD、POSTGRES_DB 匹配
```

`PAYLOAD_SECRET` 与 `POSTGRES_PASSWORD` 是不同用途，不能使用同一个值。

## 6. 标准开发流程

### 开始开发

在 Dev Container 终端执行：

```bash
pnpm dev
```

`pnpm dev` 会先幂等启动本地 PostgreSQL，并等待 healthcheck 通过，再启动 Next.js。只有需要单独启动数据库而暂时不启动 Web 时，才执行 `pnpm dev:services`。

Dev Container 将 `node_modules` 和 `.next` 挂载到只用于本地开发的 Docker named volumes，避免 Windows bind mount 的高频小文件 I/O。修改 `.devcontainer/devcontainer.json` 后必须执行一次 `Dev Containers: Rebuild Container`；两个 Volume 仍必须由 `node` 用户写入，现有 root 与 dev/build 并发守卫继续生效。

访问：

```text
http://localhost:3000
http://localhost:3000/tools
http://localhost:3000/reviews
http://localhost:3000/games
http://localhost:3000/admin
```

Windows 机械盘 + bind mount 的首次 Next.js 编译可能需要一两分钟。Next.js 已报告 slow filesystem，这属于 I/O 性能，不等于代码或依赖错误。

从 2026-07-14 起，`.next` 与 `node_modules` 改由 Linux named volumes 承载；源码仍在 Windows，但 Next 高频缓存和依赖读写不再经过 9p。第一次重建会重新安装依赖，后续冷编译与 HMR 才会受益。

### 日常检查

```bash
pnpm test
pnpm check
```

`pnpm test` 运行 33 个 Vitest 和 4 个 backup shell 场景；`pnpm check` 依次执行 format、lint、typecheck。

### 生产构建检查

先在运行 `pnpm dev` 的终端按 `Ctrl+C`，再执行：

```bash
pnpm build
```

不要同时运行 `pnpm dev` 与 `pnpm build`，因为它们会同时写入 `.next`。

构建完成后继续开发：

```bash
pnpm dev
```

### 停止本地数据库但保留数据

```bash
pnpm dev:services:stop
```

禁止在不明确需要删除数据库时执行：

```bash
docker compose down -v
```

## 7. Payload 开发流程

修改 collection 后：

```bash
pnpm payload:types
pnpm payload:migrate:create
pnpm check
```

必须人工审查 migration，再 commit。

数据流：

```text
Payload Admin
  -> collection
  -> PostgreSQL
  -> Payload Local API
  -> src/server getter
  -> mapper
  -> feature component
  -> route
```

生产环境数据库错误必须暴露，不能用本地 fallback 伪装成功。

## 8. Seed 规则

Seed 只允许在：

```text
NODE_ENV !== production
ENABLE_DEV_SEED=true
```

时执行。

当前脚本：

```bash
pnpm seed:tools
pnpm seed:games
```

Games seed 已改成按 slug upsert，不再删除其他 Games。

使用完成后立即恢复：

```env
ENABLE_DEV_SEED=false
```

生产环境必须一直为 `false`。

## 9. Git 与 Pull Request 工作流

项目真实 Git 根目录：

```text
D:\lipan\Kita\.git
```

远程仓库：

```text
https://github.com/koharu4ever/Kita.git
```

日常工作不直接 push main。标准流程：

```bash
git fetch origin
git switch -c codex/<task-name> origin/main

# 修改后，在 Dev Container 中
pnpm test
pnpm check
# 停止 pnpm dev
pnpm build

git status
git diff
git add -- <明确文件>
git diff --cached --check
git diff --cached
git commit -m "..."
git push -u origin codex/<task-name>
```

然后在 GitHub 创建目标为 `main` 的 Pull Request，等待 `CI / quality` 成功后 merge。main Ruleset 会阻止未通过 PR/quality 的日常修改，也会阻止 force push 和删除 main。

避免无检查地使用 `git add .`，尤其不能提交 `.env`、真实密钥和不相关的自动生成变化。

合并后同步并清理：

```bash
git switch main
git pull --ff-only origin main
git branch -d codex/<task-name>
git fetch --prune origin
```

完整初学者说明见 `docs/git-pull-request-workflow-guide-2026-07-12.md`。

## 10. Coolify Production

当前部署模式已经确认：

```text
Coolify Compose Application
  |-- web
  |-- postgres
  |-- backup（Compose 默认关闭；当前 production 已显式启用）
  `-- postgres-data
```

生产变量：

| 变量                                   | Buildtime | Runtime |
| -------------------------------------- | --------: | ------: |
| `NEXT_PUBLIC_SITE_URL`                 |        是 |      是 |
| `DATABASE_URI`                         |        否 |      是 |
| `PAYLOAD_SECRET`                       |        否 |      是 |
| `ENABLE_DEV_SEED`                      |        否 |      是 |
| `POSTGRES_DB`                          |        否 |      是 |
| `POSTGRES_USER`                        |        否 |      是 |
| `POSTGRES_PASSWORD`                    |        否 |      是 |
| `POSTGRES_BACKUP_ENABLED`              |        否 |      是 |
| `POSTGRES_BACKUP_R2_ENDPOINT`          |        否 |      是 |
| `POSTGRES_BACKUP_R2_BUCKET`            |        否 |      是 |
| `POSTGRES_BACKUP_R2_ACCESS_KEY_ID`     |        否 |      是 |
| `POSTGRES_BACKUP_R2_SECRET_ACCESS_KEY` |        否 |      是 |

仓库中的 `docker/postgres-backup` 是可审计的 PostgreSQL 16 custom dump -> Cloudflare R2 sidecar。它没有端口、数据库 volume 或 Docker socket；本地默认关闭。真实 R2 凭据只允许保存在 Coolify，不得写入 `.env.example` 的值、文档、聊天或 Git。

Coolify 自动生成的 `SERVICE_FQDN_WEB`、`SERVICE_URL_WEB` 不复制到本地。

Pull Request 通过 `quality` 并 merge main 后，由 Coolify 自动部署。部署检查顺序：

```text
build logs
postgres healthcheck
Payload migration
web runtime logs
公开页面 HTTP 状态
```

## 11. 已接受的安全增强边界

生产 R2 backup 已启用并连续成功，bucket 对象与日志已核对；backup shell 的 4 个 fake-command 场景也已进入 CI。

仍未执行：

- 临时 PostgreSQL 16 完整恢复演练；
- 生产 `PAYLOAD_SECRET` / PostgreSQL 密码轮换；
- backup last-success healthcheck/告警。

项目所有者已经明确决定现阶段暂缓恢复演练和 secret 轮换，并接受为非阻断后续增强。文档不得把它们写成已经完成，也不得重新提升为 P0。

任何 Codex 都不得在未确认备份、未得到用户明确授权的情况下操作生产密码、数据库、Coolify 或 Volume。已有 `postgres-data` 时，只修改 `POSTGRES_PASSWORD` 环境变量不会自动修改数据库内部密码。

## 12. Migration 注意事项

仓库包含 4 个 production migration。项目所有者已确认首次生产部署使用全新 PostgreSQL Volume，`docker-entrypoint.sh` 成功执行全部 migration，随后 Admin、Tools、Reviews、Games 正常，因此生产空库链路已经验证。

本地开发数据库历史上主要通过 Payload development schema push 建立，本地 migration status 不一定完整。因此：

- 不要在当前已有表的本地数据库上盲目补跑全部初始 migration；
- 不要根据本地 migration status 反推生产状态；
- 修改 collection 后必须生成并人工审查新 migration；
- 未来可用一次性 PostgreSQL 16 做 CI 防回归，但它不再是关闭 P0 的前置条件；
- 不得为了 migration 测试删除现有本地或生产 Volume。

## 13. 当前优先级

当前代码与工程底座已经稳定，不需要继续扩张技术栈。建议顺序：

```text
P1 评估 production Compose 数据库凭据 fail-fast
P1 替换 About、Tools 等前台 placeholder，录入真实内容
P1 补 error / empty / not-found 产品行为
P1 补 slug、URL、资源路径校验
P2 按内容增长决定临时 PostgreSQL/published 集成测试
P2 最后再考虑 Playwright smoke
P2 数据价值提高后再做恢复演练和 last-success 监控
```

不要优先增加 Redis、Prisma、微服务、Kubernetes、大型监控平台或额外 named volume。

## 14. 必读文档

新 Codex 开始工作前按顺序阅读：

1. `docs/CODEX_HANDOFF.md`
2. `docs/current-project-status.md`
3. `docs/project-structure.md`
4. `docs/development-production-alignment.md`
5. `docs/kita-code-review-2026-07-09.md`

其他 docs 中有早期学习记录和历史计划，可能描述旧阶段。发生冲突时，以当前代码、Git 历史和上述 5 份文档为准。

## 15. 新 Codex 的工作原则

```text
先读后改
先检查 Git 状态
保留用户已有修改
所有项目命令在 Dev Container 中运行
不输出 secret
不提交 .env
不删除 Volume
不擅自操作生产环境
不擅自增加 named volume 或新技术栈
修改后运行与风险相称的验证
先本地验收，再 commit/push，再观察 Coolify
```

当前项目已经可以立即进入正常功能开发；开始新任务前，只需先完成只读状态确认。
