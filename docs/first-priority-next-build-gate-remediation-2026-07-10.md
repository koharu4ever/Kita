# Kita 第一优先级问题评估与修复方案

> 日期：2026-07-10（America/Los_Angeles）
>
> 基线：`main` / `002c892`
>
> 状态：已完成。污染的 `.next` 已清理并由 `node` 重新生成；最终 `pnpm check` 与 `pnpm build` 已通过；root 与 dev/build 并发防护已加入并完成专项验证。
>
> 安全边界：不读取或输出 secret，不修改生产环境，不操作 PostgreSQL，不停止或删除数据库 Volume，不修改业务源码。

## 1. 第一优先级是什么

第一优先级是修复 Dev Container 工作区中被污染的 `.next` 生成目录，使下面两条命令重新得到可信、可重复的退出结果：

```bash
pnpm check
pnpm build
```

这件事应排在新增功能、性能优化和测试建设之前。原因不是 `.next` 本身重要，而是它正在污染项目的判断工具：当前无法可靠区分“源码真的有错”和“旧生成物坏了”。如果继续开发，后续每个 TypeScript 或构建错误都会带着噪声。

## 2. 已证实的事实

### 2.1 Git 源码没有被 `.next` 污染

- 当前分支为 `main`，与 `origin/main` 对齐。
- `.next` 已被 `.gitignore` 忽略。
- 当前 Git 变化只有评估文档，没有业务源码变化。
- `.dockerignore` 也排除了 `.next`，生产 Docker build context 不会复制宿主工作区的 `.next`。

因此，这是本地 bind-mounted workspace 的生成物问题，不是已提交代码或生产数据库问题。

### 2.2 `.next` 所有权明显混乱

当前只读检查结果：

```text
.next                         node:node
.next/build                   root:root
.next/dev                     node:node
.next/dev/types               node:node
非 node 所有的 .next 条目     2102
```

异常不只存在于一个文件，而是覆盖 `.next/build`、`.next/server`、`.next/static`、`.next/standalone`、部分 `.next/dev` cache 和生成类型。

### 2.3 TypeScript 正在读取残缺的 Next 生成文件

`tsconfig.json` 会包含 `.next/types/**/*.ts` 和 `.next/dev/types/**/*.ts`。当前 `.next/dev/types/validator.ts` 在第 116 行附近出现残缺内容：

```ts
Config<"/">> = Specific
```

前面的类型声明已经缺失，所以 `pnpm typecheck` 报语法错误。错误文件是被忽略的 Next 生成物，不是 `src/` 中的源码。

### 2.4 build 被文件权限直接阻断

当前以 Dev Container 的 `node` 用户运行 `pnpm build`，会失败于：

```text
EACCES: permission denied, unlink '.next/build/56416d4ae4ce586f.js'
```

这说明 Next 试图重建输出时无法删除 root 拥有的旧文件。

### 2.5 当前没有项目进程占用 `.next`

复核时没有发现：

```text
next dev
next build
next-server
eslint
tsc
```

PostgreSQL 是否运行与本问题无关；修复 `.next` 不需要停止、重建或删除数据库服务和 Volume。

## 3. 根因判断

### 3.1 可以确定的根因

可以确定的是：至少有一部分 Next 生成物曾由 root 身份创建，而日常开发命令由 `node` 用户执行。两个用户对同一个 `.next` 写入，最终导致权限冲突。

同时，`.next/dev/types/validator.ts` 处于未完整生成的状态，说明某次 dev 类型生成被中断、竞争写入，或与其他 Next 生命周期留下的输出混合。

### 3.2 高概率但尚不能证明的触发方式

以下任一行为都可能造成当前状态：

- 在 Dev Container 中执行 `sudo pnpm dev`、`sudo pnpm build` 或 `sudo pnpm typecheck`；
- 使用没有指定 `-u node` 的 `docker exec` 运行项目命令；
- `next dev` 尚未停止时启动 `next build`；
- Next 正在写 `.next/dev/types` 时命令或容器被中断。

当前没有读取 shell history，也没有足够日志证明具体是哪一条命令，所以不应把某一种可能写成既定事实。

### 3.3 不是根因的部分

目前没有证据表明问题来自：

- PostgreSQL；
- Payload collection 或 migration；
- pnpm 依赖缺失；
- Docker Volume；
- Coolify 生产环境；
- Git 中的 `.next` 文件。

## 4. 为什么不能只执行 `chown`

只把 `.next` 改回 `node:node` 可以解决 unlink 权限，但不能保证已经残缺的 `validator.ts`、Turbopack cache 和混合的 dev/build 输出恢复正确。

因此只执行：

```bash
sudo chown -R node:node .next
```

不够完整。它适合作为紧急取回文件控制权的手段，不是最终修复。

更可靠的方式是：确认路径和进程安全后，删除**整个被忽略的 `.next` 生成目录**，再由 `node` 用户从源码重新生成。

## 5. 推荐修复方案

### 5.1 修复原则

- 只处理 `/workspaces/Kita/.next`。
- 不触碰 `src/`、`public/`、`.env`、`node_modules` 或 `.pnpm-store`。
- 不运行 `docker compose down -v`。
- 不停止、删除或重建 PostgreSQL Volume。
- 不修改生产环境。
- 删除前必须确认真实路径、Git ignore 和活动进程。
- 删除后所有项目命令必须以 `node` 用户运行。

### 5.2 阶段 A：删除前只读检查

在 Dev Container 的 `node` 终端执行：

```bash
pwd
whoami
git status --short --branch
git check-ignore -v .next
realpath .next
pgrep -af 'next dev|next build|next-server|eslint|tsc' || true
```

必须同时满足：

```text
pwd              = /workspaces/Kita
whoami           = node
realpath .next   = /workspaces/Kita/.next
.next            被 Git ignore
没有相关活动进程
```

如果任一项不满足，停止修复并重新判断，不能继续删除。

### 5.3 阶段 B：清理唯一目标

推荐删除目标：

```text
/workspaces/Kita/.next
```

该目录是 Next.js 可再生构建产物，不包含 PostgreSQL 数据，也不是 Docker Volume。

由于内部有 root 文件，删除动作需要临时使用 sudo；但路径必须写成已经核验过的绝对路径，不能使用模糊变量、通配符或上级目录。

计划命令：

```bash
sudo rm -rf -- /workspaces/Kita/.next
```

本轮只提供方案，不执行这条命令。正式执行前应再次取得用户授权。

### 5.4 阶段 C：由 node 用户重新生成并检查

清理后退出 sudo，确认仍为 `node`：

```bash
whoami
```

然后依次执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

不要同时启动 `pnpm dev`。`next dev` 和 `next build` 都会写 `.next`，完整构建结束前必须保持 dev server 停止。

### 5.5 阶段 D：验证所有权与 Git 状态

构建成功后执行：

```bash
find .next ! -user node -print -quit
git status --short --branch
git diff --check
```

验收要求：

- `find` 不输出任何路径；
- `pnpm format:check` exit 0；
- `pnpm lint` exit 0；
- `pnpm typecheck` exit 0；
- `pnpm build` exit 0；
- Git 不出现 `.next`；
- 业务源码没有意外变化。

如需继续开发，构建完全结束后再运行：

```bash
pnpm dev
```

## 6. 风险评估

### 6.1 数据风险：低

`.next` 是被忽略的 Next.js 生成目录。删除后会丢失本地构建缓存，下一次编译更慢，但不会删除：

- PostgreSQL 数据；
- Payload 内容；
- Admin 用户；
- 图片资源；
- Git 历史；
- Docker Volume；
- 生产环境数据。

### 6.2 操作风险：中低

真正的风险不是删除 `.next`，而是路径写错或在相关进程仍运行时删除。因此方案要求绝对路径核验、活动进程检查，并只删除一个明确目标。

### 6.3 回滚方式

`.next` 不需要传统回滚。它的恢复方式就是由同一份源码和依赖重新运行 `pnpm dev` 或 `pnpm build`。

如果重新生成后仍失败：

1. 保留新的完整错误输出；
2. 确认 `.next` 全部归 `node`；
3. 再判断是否为真实源码、依赖或 Next.js 问题；
4. 不恢复旧的损坏 `.next`。

## 7. 防止复发

### 7.1 日常命令只在 node 用户下运行

Dev Container 终端应满足：

```text
node ➜ /workspaces/Kita
```

不要使用 `sudo pnpm ...`。通过自动化进入容器时，应显式指定 `docker exec -u node -w /workspaces/Kita ...`。

### 7.2 dev 与 build 严格串行

正确流程：

```text
pnpm check
  -> 停止 pnpm dev
  -> pnpm build
  -> 构建结束
  -> pnpm dev
```

### 7.3 不建议通过修改 tsconfig 隐藏问题

不应为了让 typecheck 变绿而移除 `.next/dev/types/**/*.ts`。当前错误源是生成物损坏，正确动作是修复生成环境，而不是降低类型检查范围。

### 7.4 暂不增加 named volume

不建议为 `.next` 增加 Docker named volume。当前问题是用户身份和生命周期混用，不是缺少 Volume；新增 Volume 会改变既定开发结构，却不能阻止 root 在 Volume 中创建 root 文件。

### 7.5 可选的后续防护

在问题修复并确认原因后，可以考虑增加一个只用于本地开发的轻量检查，检测 `.next` 是否存在非当前用户文件并给出明确提示。但不能简单给通用 `pnpm build` 加“禁止 root”的 prebuild，因为 production Docker builder 本身可能以 root 在隔离的 `/app` 中构建。

## 8. 为什么它排第一

其他问题——测试、CI、环境校验、备份恢复、图片优化——都很重要，但它们的修改最终仍要经过 typecheck 和 build。

如果门禁本身不可信：

```text
无法验证修复
  -> 无法安全提交
  -> 无法区分源码错误和环境噪声
  -> 后续所有任务风险上升
```

先修 `.next` 不会直接增加用户功能，却会恢复整个项目的判断能力，是最小、最可逆、收益覆盖面最大的第一步。

## 9. 完成定义

只有同时满足以下条件，才算这个问题真正解决：

- [x] `.next` 已从干净状态由 `node` 用户重新生成；
- [x] `.next` 中没有非 `node` 所有的条目；
- [x] `pnpm format:check` 通过；
- [x] `pnpm lint` 通过；
- [x] `pnpm typecheck` 通过；
- [x] `pnpm build` 通过；
- [x] Git 没有出现 `.next` 或意外源码变化；
- [x] package scripts 会阻止 dev/build 并行；
- [x] 没有触碰 PostgreSQL、Volume 或生产环境。

## 10. 实际处理记录

### 10.1 安全清理

删除前重新确认了四项条件：

```text
realpath .next   = /workspaces/Kita/.next
.next            已被 Git ignore
相关项目进程     无
删除范围         仅 /workspaces/Kita/.next
```

确认后删除旧 `.next`，再由 `node` 用户从源码重新生成。没有操作 `.env`、PostgreSQL、Compose service、named volume 或生产环境。

### 10.2 防止 root 再次污染

新增 `scripts/assert-dev-workspace-user.mjs`，并让 `package.json` 中所有项目 scripts 先调用它：

- 位于 `/workspaces/...` 时拒绝 uid 0；
- dev/build/typecheck/start 前检查 `.next` 是否存在非当前用户文件；
- build 前检查活动 dev/next-server；
- dev 前检查活动 build；
- 位于 production Docker 的 `/app` 等非 bind-mounted 工作区时允许 root builder 正常运行。

`next.config.ts` 还增加了第二层保护：即使绕过 pnpm，直接执行 Next CLI，只要当前位于 `/workspaces/...` 且 uid 为 0，就会在读取配置时失败。

### 10.3 为什么没有设置 `containerUser: node`

当前容器默认用户是 root，而 VS Code/生命周期命令使用 `remoteUser: node`。这与 Docker-in-Docker 需要 root 入口启动 daemon 的结构有关。Dev Container 官方规范也明确区分 Container User 与 Remote User，并说明这种分离允许 entrypoint 与开发者进程使用不同权限：

<https://github.com/devcontainers/spec/blob/main/docs/specs/devcontainer-reference.md#users>

因此本次保留 root 容器入口和 `remoteUser: node`，不冒险破坏 DinD；把保护放在 bind-mounted 项目命令和 Next 配置层。Codex/自动化使用裸 `docker exec` 时仍必须显式指定：

```bash
docker exec -u node -w /workspaces/Kita <container> ...
```

### 10.4 验证结果

| 验证                                          | 结果                                |
| --------------------------------------------- | ----------------------------------- |
| node 用户运行 workspace guard                 | 通过                                |
| root 在 `/workspaces/Kita` 运行 package guard | 按预期 exit 1                       |
| root 绕过 pnpm 直接运行 Next build            | 按预期 exit 1                       |
| root 在非 `/workspaces` 目录运行 guard        | 通过，production builder 不被误拦截 |
| 活动 dev 时启动 build                         | 按预期 exit 1                       |
| 活动 build 时启动 dev                         | 按预期 exit 1                       |
| 无冲突时 dev/build 模式检查                   | 通过                                |
| 清理后第一次 `pnpm check`                     | exit 0，约 6 分 42 秒               |
| 清理后第一次 `pnpm build`                     | exit 0，约 5 分 49 秒               |
| 最终防护代码 `pnpm check`                     | exit 0，约 3 分 13 秒               |
| 最终防护代码 `pnpm build`                     | exit 0，约 7 分 23 秒               |
| 最终 `.next` 非 node 条目                     | 0                                   |
| `.next/BUILD_ID` 所有者                       | `node:node`                         |

## 11. 能否永久解决

可以把正常开发路径解决到“默认安全、错误会早失败”，但不能在仓库代码层绝对限制拥有 uid 0 的任意 shell。root 如果故意绕过 package scripts、Next 配置并直接写文件，仍拥有 Linux 层权限。

本次处理覆盖了实际高风险入口：pnpm scripts、直接 Next CLI、`.next` 所有权和 dev/build 冲突。再配合 Codex 强制使用 `-u node`，可以防止日常工具切换身份时静默污染工作区。若守卫报错，不应使用 sudo 绕过，而应停止进程、核对路径并按本文重新生成 `.next`。

## 12. 结论

本问题已完成修复和最终验证。后续只需审查并提交本次代码与文档变化。
