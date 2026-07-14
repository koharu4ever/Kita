# Kita 本地开发性能修复记录（2026-07-14）

## 1. 结论

这次调试 `/games` 时遇到的“Next.js 启动和页面访问需要数分钟”，不是 Games → OpenList 下载链接功能造成的，而是两个本地开发问题叠加：

1. Windows 工作区通过 9P bind mount 进入 Linux Dev Container，Next.js 对 `.next` 的大量小文件读写非常慢；
2. Dev Container 重启后，本地 PostgreSQL 没有继续运行，但开发者只执行了 `pnpm dev`，Payload CMS 因而反复等待数据库连接失败。

修复后的标准入口只有一个：

```bash
pnpm dev
```

它会先启动 PostgreSQL并等待数据库健康，然后启动 Next.js。同时，`node_modules` 和 `.next` 使用 Docker 本地 named Volume，避免把高频小文件读写放在 Windows 9P 文件系统上。

实测结果：

| 指标              |        修复前 |   修复后首次运行 | 变化                   |
| ----------------- | ------------: | ---------------: | ---------------------- |
| Next.js Ready     |         71 秒 |         465 毫秒 | 约快 99%               |
| 首次访问 `/`      |   约 2.5 分钟 |           7.7 秒 | 从分钟级回到秒级       |
| 首次访问 `/games` | 60 秒至数分钟 |          12.8 秒 | 数据库与编译均正常完成 |
| PostgreSQL        |    可能未运行 | 0.5 秒内 Healthy | 由 `pnpm dev` 自动保证 |

这是一项值得独立提交 PR 的开发基础设施修复，不应该与 Games 下载链接功能混在同一个最终 PR 中。

## 2. 当时到底发生了什么

最初的开发日志包含：

```text
Ready in 71s
Slow filesystem detected. The benchmark took 820ms.
GET / 200 in 2.5min
GET /games 200 in 3.9min
```

访问 `/games` 时还出现：

```text
Error: cannot connect to Postgres
connect ECONNREFUSED 127.0.0.1:5432
```

`ECONNREFUSED` 的意思是：应用确实访问了本地 5432 端口，但当时没有 PostgreSQL 进程接受连接。

Games getter 有开发环境 fallback，所以页面最终仍可能返回 200。但在进入 fallback 前，Payload 会经历连接、重连与初始化失败。这就是日志里 `application-code: 60s`，甚至数分钟等待的重要来源。

因此：

- 页面最后能显示，不代表数据库连接正常；
- 这次等待不全是 Next.js 编译；
- Games archive link 本身只是读取一个 link 并渲染按钮，不会制造数分钟延迟。

## 3. 根因一：Windows 9P 文件系统拖慢 Next.js

### 3.1 原来的挂载方式

Kita 源码位于 Windows：

```text
D:\lipan\Kita
```

Dev Container 将它挂载到：

```text
/workspaces/Kita
```

这样可以让 Windows、VS Code 和容器共享同一份源代码，但底层 9P 文件共享不擅长大量小文件操作。

### 3.2 为什么 `.next` 和 `node_modules` 特别慢

Next.js 开发模式会在 `.next` 中保存：

- Turbopack 编译产物；
- 路由与模块缓存；
- 文件系统缓存数据库；
- 服务端和客户端开发产物；
- 大量体积小、数量多的中间文件。

`node_modules` 同样包含大量小文件，模块解析会频繁读取它们。

源码编辑通常只改少量文件，继续使用 bind mount 很合适；`.next` 和 `node_modules` 更适合放在 Docker 所在 Linux 环境的本地文件系统中。

### 3.3 采用的解决方案

`.devcontainer/devcontainer.json` 增加了两个有针对性的 named Volume：

```json
"mounts": [
  "source=${devcontainerId}-node-modules,target=${containerWorkspaceFolder}/node_modules,type=volume",
  "source=${devcontainerId}-next-cache,target=${containerWorkspaceFolder}/.next,type=volume"
]
```

现在的逻辑结构是：

```text
Windows bind mount
└── /workspaces/Kita
    ├── src/               继续与 Windows 实时同步
    ├── docs/              继续与 Windows 实时同步
    ├── package.json       继续与 Windows 实时同步
    ├── node_modules/      Docker named Volume 覆盖
    └── .next/             Docker named Volume 覆盖
```

这没有把整个项目复制进 Volume，也没有改变源码的保存位置。只有两个高频缓存/依赖目录改用 Linux 本地存储。

### 3.4 为什么还要修改所有权

新 Volume 第一次挂载时可能归 root 所有，而 Kita 的正常开发用户是 `node`。因此 `postCreateCommand` 调整为：

```json
"postCreateCommand": "sudo corepack enable && sudo chown node:node node_modules .next && pnpm install --frozen-lockfile"
```

它负责：

1. 启用 Corepack；
2. 将两个目录交给 `node` 用户；
3. 在新的 `node_modules` Volume 中按 lockfile 安装依赖。

这延续了此前 `.next` 防护的原则：正常开发与构建使用 `node`，避免 root 生成随后无法修改的产物。

## 4. 根因二：数据库启动依赖人的记忆

### 4.1 为什么 PostgreSQL 停了

调查发现，外层 Dev Container 曾正常停止并重新启动。容器内部的 Docker daemon 也随之重启，因此原来运行的 PostgreSQL 子容器停止。

证据不支持 PostgreSQL 自身崩溃，也不支持 OOM。真正的问题是旧流程要求开发者记住：

```text
先启动 PostgreSQL
再运行 pnpm dev
```

如果遗漏第一步，Next.js 仍会启动，但依赖 Payload 的页面会长时间等待数据库失败。

### 4.2 `pnpm dev` 现在做什么

`package.json` 的开发命令调整为：

```json
"dev": "node scripts/assert-dev-workspace-user.mjs --check-next --mode=dev && pnpm dev:services && next dev",
"dev:services": "node scripts/assert-dev-workspace-user.mjs && docker compose -f compose.yaml -f compose.dev.yaml up -d --wait postgres"
```

执行顺序变为：

```text
pnpm dev
  ↓
检查 node 用户和 .next 安全状态
  ↓
启动/确认 PostgreSQL
  ↓
等待 PostgreSQL healthcheck 通过
  ↓
启动 next dev
```

`docker compose up -d` 是幂等操作：数据库已经运行时不会清空数据，只会确认服务处于运行状态。

`--wait` 很重要。容器进程已经启动，不代表 PostgreSQL 已准备好接受连接；`--wait` 会等到 healthcheck 通过。

### 4.3 本地 restart policy

`compose.dev.yaml` 为本地 PostgreSQL 增加：

```yaml
restart: unless-stopped
```

两层保护各有职责：

- restart policy 负责 Docker daemon 恢复后的自动恢复；
- `pnpm dev:services` 负责每次开发前的确定性检查。

## 5. 为什么修复后首次 `/games` 仍要 12.8 秒

修复后的日志：

```text
Container kita-postgres-1 Healthy 0.5s
Ready in 465ms
GET / 200 in 7.7s
[✓] Pulling schema from database...
GET /games 200 in 12.8s
```

`/games` 的 12.8 秒分为：

```text
next.js:          2.9s
application-code: 9.9s
```

首次 application code 成本主要包括：

- 初始化 Payload；
- 建立 PostgreSQL 连接；
- development 模式读取 schema；
- 首次查询 Games collection；
- 建立本进程后续可复用的模块和连接状态。

这和数据库不存在时的 60 秒至数分钟不同。现在日志明确显示 schema 成功读取，并在一次正常冷启动中完成。

同一个 `pnpm dev` 进程内的第二次访问通常会明显更快。最终验收仍应补记一次 `/games` 热访问时间。

## 6. 这次改了哪些文件

### 6.1 开发基础设施

- `.devcontainer/devcontainer.json`
  - 为 `node_modules`、`.next` 增加 named Volume；
  - Rebuild 时修正目录所有权并安装依赖。
- `package.json`
  - 让 `pnpm dev` 自动调用 `pnpm dev:services`；
  - 新增等待 PostgreSQL Healthy 的标准命令。
- `compose.dev.yaml`
  - 为本地 PostgreSQL 增加 `restart: unless-stopped`。

### 6.2 协作文档

- `docs/CODEX_HANDOFF.md`
- `docs/current-project-status.md`
- `docs/development-production-alignment.md`
- `docs/first-priority-next-build-gate-remediation-2026-07-10.md`
- `docs/project-structure.md`
- 本文档

这些文档统一说明新的启动入口、named Volume 的边界，以及它与 `.next` 所有权防护的关系。

## 7. 对生产环境有没有影响

结论：没有改变生产运行结构。

- Dev Container 配置只作用于本地 VS Code；
- `compose.dev.yaml` 是本地开发 override；
- `pnpm dev`、`pnpm dev:services` 是开发命令；
- 生产 Dockerfile、entrypoint 和 Compose 未因本次优化改变；
- 没有修改生产环境变量；
- 没有访问或修改生产数据库；
- 没有删除任何本地或生产 Volume；
- 没有输出 secret。

新 Volume 只保存可重建的本地内容：

- `node_modules` 可由 `pnpm install` 重建；
- `.next` 可由 Next.js 重建。

PostgreSQL 数据仍使用原来的数据库 Volume，本次没有迁移、清空或替换它。

## 8. 以后如何启动本地开发

完成一次 Dev Container Rebuild 后，日常只执行：

```bash
pnpm dev
```

正常输出应包含：

```text
Container kita-postgres-1 Healthy
Next.js ...
Ready in ...
```

只想检查或恢复开发数据库时可以执行：

```bash
pnpm dev:services
```

开发结束用 `Ctrl+C` 停止 Next.js 即可，通常不需要停止 PostgreSQL。

不要在 `pnpm dev` 仍运行时执行 `pnpm build`，因为两个进程会共同使用 `.next`。

## 9. 为什么必须 Rebuild Dev Container

修改 `.devcontainer/devcontainer.json` 不会改变一个已经运行的容器，必须执行：

```text
VS Code Command Palette
→ Dev Containers: Rebuild Container
```

Rebuild 才会让新的 mounts 生效，并运行 `postCreateCommand`。

第一次 Rebuild 需要在空的 `node_modules` Volume 中安装依赖，可能比以后慢。这是一次性初始化成本，不代表优化失败。

Rebuild 不等于删除数据库 Volume，本次也没有执行 Volume 删除。

## 10. 建议怎样拆 PR

当前工作分支还包含 Games → OpenList 下载链接功能。为了让审查和回滚边界清晰，建议最终拆成两个 PR。

### PR A：本地开发性能和数据库启动闭环

应包含：

- `.devcontainer/devcontainer.json`；
- `compose.dev.yaml`；
- `package.json`；
- 本次开发环境文档。

验收：

- Rebuild 后 `.next`、`node_modules` 使用 named Volume；
- `pnpm dev` 自动等待 PostgreSQL Healthy；
- Ready 恢复到毫秒或少量秒级；
- `/`、`/games` 首次访问不再需要数分钟；
- check、测试、最终 build 通过；
- 没有生产配置变化。

### PR B：Games → OpenList archive link

应包含：

- archive link helper 与测试；
- Games modal 下载按钮；
- fallback 和开发 seed 的 archive link；
- 对应功能说明。

验收：

- 无 archive link 时不显示下载按钮；
- 有 link 时在新标签页打开；
- helper 测试通过；
- 本地视觉和交互确认；
- 不影响现有图片查看器。

现在先记录和审核，不立即 commit、push 或创建 PR。拆分时从最新 main 建立独立分支，再分别选择文件，避免两个主题进入同一提交。

## 11. 验收状态

- [x] Dev Container Rebuild 完成；
- [x] PostgreSQL 由 `pnpm dev` 自动启动并通过健康检查；
- [x] Ready 从 71 秒降到 465 毫秒；
- [x] 首页首次访问从分钟级降到 7.7 秒；
- [x] `/games` 首次访问从分钟级降到 12.8 秒；
- [x] 修复前已完成 `pnpm check`；
- [ ] 记录 Rebuild 后 `/games` 第二次热访问时间；
- [x] 新 Volume 生效后，33 个 Vitest 与 4 个 backup shell 场景通过；
- [x] 停止 dev 后最终 build 通过，Turbopack 编译耗时 41 秒；
- [ ] 审核并拆分 PR A、PR B；
- [ ] 用户确认后再 commit、push 和创建 PR。

## 12. 最终评价

这不是为了追求漂亮的性能数字而增加复杂度，而是在修复两类真实的开发可靠性问题：

1. Windows bind mount 让 Next.js 高频缓存读写变成分钟级；
2. 数据库启动依赖人的记忆，遗漏时应用会长时间重试。

修复后的操作反而更简单：源码继续实时同步，缓存与依赖使用 Docker 本地存储，开发者只需记住 `pnpm dev`。它同时减少操作步骤、缩短等待时间，并让失败原因更明确，适合作为独立的开发基础设施 PR 先行合并。
