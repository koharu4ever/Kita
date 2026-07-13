# Kita 项目代码审查与初版评估

> 审查日期：2026-07-09（America/Los_Angeles）
>
> 审查基线：`main` / `002c892 feat: add PostgreSQL R2 backup sidecar`
>
> 范围：Next.js/React、Payload CMS、PostgreSQL、migration、Dev Container、Docker/Coolify、R2 备份、测试与 CI。
>
> 边界：未读取或输出真实 secret，未修改生产环境，未删除 Volume，也未清理本地 `.next`。

## 0. 2026-07-10 状态更新

> 本节取代原报告中关于三个 P0 的旧结论；后续“本次实际验证”仍保留 2026-07-09 原始审查现场，便于追溯问题是如何发现的。

| P0                                | 当前状态                       | 关闭依据                                                                                                                          |
| --------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| P0-1 本地 `.next` 破坏质量门禁    | **已解决**                     | `.next` 由 `node` 重新生成；最终 `pnpm check`、`pnpm build` 均 exit 0；root 与 dev/build 并发守卫通过专项验证。                   |
| P0-2 生产 secret 与备份恢复未闭环 | **已关闭，剩余事项转后续增强** | 生产备份连续成功且 R2 存在对应对象；恢复演练和 secret 轮换未执行，由项目所有者明确接受为现阶段非阻断风险。                        |
| P0-3 migration 未从空库验证       | **已解决**                     | 项目所有者确认生产首次部署使用全新 PostgreSQL Volume，entrypoint 成功执行四个 migration，之后 Admin、Tools、Reviews、Games 正常。 |

因此，三个 P0 均已关闭。2026-07-10 时当前最高优先级转为 **P1-3：测试与 CI**；该项第一阶段随后于 2026-07-12 关闭。

本次状态更新只修改评估文档，没有连接生产数据库、修改 Coolify、输出 secret 或操作 Volume。P0-2 的关闭不代表恢复演练或 secret 轮换已经执行，而是“真实备份已验证，剩余风险已明确接受”。

### 2026-07-12：P1-3 第一阶段测试与 CI 闭环

PR #1 已增加 7 个 Vitest 文件、30 个高价值单元测试；PR #2 已增加只读、无 production secret 的 GitHub Actions `quality` workflow。PR #2 的远端 CI 已真实运行通过，main Ruleset 已要求通过 Pull Request 和 `quality`，并阻止删除与 force push。两个 PR 已依次合并到 main。

因此 P1-3 的第一阶段已关闭。2026-07-12 的后续独立 PR 又增加了 4 个 backup shell 场景，验证 dump、archive 校验和上传失败不会误报成功。临时 PostgreSQL、Playwright 和 published 权限测试仍按独立增强项推进，不影响本阶段关闭结论。

### 2026-07-12：当前结构可靠性复核

本次在最新 `main` 上重新检查了页面路由、业务功能、服务端查询、Payload schema、migration、测试与基础设施边界。结论是：**Kita 当前结构对初版而言清晰、可靠，不需要为了“看起来更工程化”而重写目录。**

| 层次                | 当前落点                                      | 复核结论                                                                        |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| 页面与路由          | `src/app`                                     | 路由保持轻量，主要负责取数和组合页面，边界清楚                                  |
| 业务功能            | `src/features`                                | Games、Reviews、Tools 按功能垂直组织，类型、mapper 与 UI 能就近维护             |
| 服务端数据访问      | `src/server`                                  | Payload Local API 查询集中，production fail-fast 与 development fallback 可识别 |
| CMS 与数据库 schema | `src/payload`、`src/migrations`               | Collection、访问控制、migration 与 PostgreSQL 链路明确                          |
| 环境配置            | `src/config`                                  | 集中管理方向正确；`SKIP_ENV_VALIDATION` 已由 PR #7 改为严格布尔解析并增加测试   |
| 基础设施            | Compose、`docker`                             | Web、PostgreSQL、备份职责分离，生产备份已有运行与自动测试证据                   |
| 测试和合并门禁      | Vitest、backup shell、GitHub Actions、Ruleset | 33 个 Vitest 用例和 4 个 shell 用例已进入必需的 `quality` 检查                  |
| 项目文档            | `docs`                                        | 入口文档现已对齐；约 40 份历史记录仍需依靠“当前文档优先”规则避免混淆            |

没有发现必须通过大规模目录调整才能解决的循环依赖、重复后端或职责倒置。当前最容易造成“项目结构混乱”感受的来源是历史文档与现状不同步，而不是业务代码本身。今后应以 `CODEX_HANDOFF.md`、`current-project-status.md`、`project-structure.md` 和 `development-production-alignment.md` 为当前事实入口，其余带日期的评估与修复文件主要作为历史证据。

### 2026-07-12：第二次当前代码复核与下一步决定

#### 当前结论

当前复核基线为 `main` / `bf9c53e`（PR #7 已合并），工作树干净。实际执行结果：

```text
pnpm test    通过：8 files / 33 Vitest + 4 backup shell scenarios
pnpm check   通过：Prettier + ESLint + TypeScript
```

本次没有启动本地 PostgreSQL；Dev Container 可用，`.env` 中要求的四个键均存在，但只检查键名，没有读取或输出任何值。没有连接或修改生产环境、数据库、secret 或 Volume。

**没有发现新的 P0，也没有发现需要推倒重写的架构问题。** 对当前个人内容站 V1，代码架构清晰度约为 **8/10**；把历史文档和仍显示 “draft/placeholder” 的页面文案计算进去，整体理解清晰度约为 **7/10**。

#### 为什么代码结构是清楚的

```text
src/app route
  -> src/server getter
  -> Payload Local API
  -> PostgreSQL
  -> feature mapper / view model
  -> feature component
```

- route 文件很薄，没有把查询、mapping 和大块 UI 混在一起；
- `src/features` 按 Games、Reviews、Tools 等业务域组织，符合项目采用的 feature-oriented 方向；
- `src/server` 统一承担 Payload 查询、production fail-fast 和 development fallback；
- collection schema、generated types 和 migration 分别位于稳定位置；
- Docker、backup、workspace guard 和 GitHub Actions 没有侵入业务目录；
- 测试与 mapper/getter/seed 就近放置，跨测试 fixture 才进入 `src/testing`；
- 当前没有证据表明存在循环依赖、重复后端、巨型 service 层或需要引入 Prisma/Redis 的问题。

#### 当前真正需要解决的问题

| 优先级  | 问题                                                                | 影响                                                                                                            | 当前判断                                                        |
| ------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| P1      | `src/config/env.ts` 曾用 `Boolean(process.env.SKIP_ENV_VALIDATION)` | 字符串 `"false"` 也会被当成 `true`，可能意外跳过环境校验；而 `payload.config.ts` 已使用严格比较，两处行为不一致 | **PR #7 已合并，问题关闭**                                      |
| P1      | `compose.yaml` 为 `DATABASE_URI` 和 PostgreSQL 凭据保留开发默认值   | 生产变量漏填时可能使用弱默认值继续启动，降低 fail-fast 能力                                                     | 应单独设计，不能直接破坏本地开发默认流程                        |
| P1-理解 | 必读文档与当前事实曾有漂移                                          | handoff/status 曾停留在较早提交，容易让接手者误判当前测试数量与优先级                                           | 当前入口文档已对齐至 PR #7 / `bf9c53e`                          |
| P1-产品 | About 与 Tools 仍公开显示 placeholder / static draft 文案           | 访问者会认为 CMS 尚未接入或站点仍是脚手架，与真实架构不符                                                       | 技术收口后应马上替换                                            |
| P2      | collection 的写权限依赖 Payload 默认“需要已认证用户”                | 当前不是匿名可写漏洞，但意图不够显式，阅读代码时需要知道框架默认规则                                            | 后续提取 `authenticated` helper 并显式声明 create/update/delete |
| P2      | development fallback 文件名看起来像第二套正式数据源                 | `game-items.ts`、`review-items.ts`、`toolkit-items.ts` 容易让新接手者误以为生产同时依赖静态数据                 | 可改名为 `development-fallback-*`，或在文件头明确用途           |
| P2      | detail metadata 与页面分别调用同一 getter                           | Games/Reviews 详情请求可能产生重复 Payload 查询                                                                 | 内容量增大后用 React `cache()` 或共享 request memoization       |
| P2      | Lightbox 缺少完整 focus trap/焦点恢复                               | 键盘和读屏体验不完整                                                                                            | 产品可访问性收口时处理                                          |
| P2      | WebGL renderer 只删除 program/buffer，没有保存并删除创建的 textures | 多次 resize/重建场景可能累积 GPU 资源，长期停留首页时有性能风险                                                 | 应在首页性能 PR 中修复并验证                                    |
| P2      | 没有自定义 error/empty/not-found、health endpoint 和页面 smoke      | 数据为空或后端失败时体验依赖框架默认行为；单元测试无法证明真实 HTTP 链路                                        | 逐步补，不是当前 P0                                             |

Payload 当前版本的默认 Access Control 会要求请求中存在已认证用户；因此三个内容 collection 没有显式 `create/update/delete` 时，**不能据此断言匿名用户可以写入**。但是显式写出权限仍更利于审计和理解。参考：[Payload Access Control](https://payloadcms.com/docs/access-control/overview)。

#### 最容易造成理解问题的地方

1. **历史文档数量多，而且部分文档同时被列为“必读”。** 带日期的实施记录应视为历史证据，不应和当前状态入口处于同一权威层级。
2. **固定 commit 编号很快过期。** `CODEX_HANDOFF.md` 与 `current-project-status.md` 写死 `f853969`，PR #6 合并后立刻落后；以后更适合记录“最后核对日期 + 当时基线”，不要称为永久“当前最新 main”。
3. **页面文案否认了已经存在的架构。** About 写着 CMS 尚未接入，Tools 仍显示 “STATIC FRONT-END DRAFT”，会让维护者和访问者误判 Payload 是否已经工作。
4. **production CMS 与 development fallback 同时存在。** 这是合理设计，但命名不够直白；生产不会使用 fallback，这个边界主要依靠 getter 和文档解释。
5. **权限安全依赖框架默认值。** 行为当前安全，但读者必须先知道 Payload 默认 access 才能确认，因此显式配置更容易维护。

#### 建议的下一步，不要再继续扩张基础设施

建议按三个小 PR 推进：

1. [x] **PR A：严格环境校验 — PR #7 已合并，P1-1 已关闭**
   - [x] `src/config/env.ts` 已改为 `process.env.SKIP_ENV_VALIDATION === "true"`；
   - [x] 已增加 `true`、`false`、未设置三个实际模块分支测试；
   - [x] 完整 `pnpm test`、`pnpm check`、`pnpm build` 已通过；
   - [x] `payload.config.ts` 与 `src/config/env.ts` 的开关行为已一致。
2. **PR B：生产 Compose fail-fast（单独做）**
   - production 不允许默认数据库密码或 fallback `DATABASE_URI`；
   - development 默认值放进 `compose.dev.yaml` 或本地 `.env.example`；
   - 只验证 Compose config，不修改 Coolify 和现有 Volume。
3. **PR C：从工程转回产品**
   - 替换 About、Tools 的 placeholder/draft 文案；
   - 增加 Tools/Reviews/Games 的空状态与一个通用错误边界；
   - 再录入真实内容。此时用户可见收益高于继续增加测试框架。

临时 PostgreSQL、Playwright、恢复演练和 backup last-success 都有价值，但以当前内容量不应排在上述三项之前。PR #7 合并后，最合理的方向是：**单独处理 production Compose fail-fast，然后停止工程底座扩张，开始完成内容和产品体验。**

## 1. 结论

Kita 作为初版是合格且有明显亮点的，整体约 **7/10**；只评价个人内容站初版的产品与架构完成度，可以给 **7.5/10**。

它不是“架构选错、需要推倒重写”的项目。主线设计清楚：Next.js App Router、Payload Local API、server getter、mapper、PostgreSQL 和 production migration 的职责基本分开，前台也已经形成自己的视觉性格。

2026-07-10 更新后，原报告的三个 P0 均已关闭：本地 build gate 已恢复并加入防复发守卫；生产 R2 备份已连续成功；完整 migration 链路已由首次生产空库部署验证。

P1-1 和 P1-3 第一阶段关闭后，当前短板主要集中在 production Compose fail-fast、内容、性能、可访问性、错误/空状态和 SEO。备份最近成功时间监控、恢复演练、secret 轮换及更深的集成/E2E 测试保留为后续增强，不再作为当前阻断。

一句话评价：**这是一个代码结构清楚、主链路可靠、三个 P0 已收口，并已建立首批自动测试与 CI 合并门禁的合格初版；无需重写目录，下一阶段应优先修复配置细节并完成产品层收口。**

## 2. 评分

| 维度           | 评分 | 评价                                                                                                       |
| -------------- | ---: | ---------------------------------------------------------------------------------------------------------- |
| 架构选择       | 8/10 | Next.js + Payload + PostgreSQL 适合当前规模，没有无意义的中间层。                                          |
| 代码组织       | 8/10 | route、feature、server、collection、migration 分层合理。                                                   |
| 功能完成度     | 7/10 | Home、About、Tools、Reviews、Games、Admin 和详情数据流已成形。                                             |
| 安全与配置     | 7/10 | 生产备份已运行，环境校验开关已修复；secret 轮换与 Compose fail-fast 仍是后续增强。                         |
| 数据可靠性     | 8/10 | 生产空库 migration 与连续 R2 备份已有证据；恢复演练仍可作为后续增强。                                      |
| 测试与发布门禁 | 8/10 | 33 个 Vitest 与 4 个 backup shell 用例、GitHub Actions `quality` 和 main Ruleset 已落地；集成/E2E 仍待补。 |
| 前端体验与视觉 | 8/10 | 视觉鲜明，响应式基础不错；资源体积和可访问性仍需优化。                                                     |
| 可维护性       | 7/10 | 文档充分，但部分规则仍靠文档约束，文档也开始有漂移风险。                                                   |

## 3. 2026-07-09 原始审查现场（历史）

下表保留首次审查当日的现场，不代表 2026-07-12 的当前状态；已经关闭或修复的项目以上方状态更新为准。

| 检查              | 结果       | 说明                                                                 |
| ----------------- | ---------- | -------------------------------------------------------------------- |
| Git 基线          | 通过       | 审查开始时 `main` 与 `origin/main` 对齐，工作树干净。                |
| Prettier          | 通过       | `pnpm format:check` 明确 exit 0。                                    |
| 定向 ESLint       | 通过       | `eslint src payload.config.ts next.config.ts` 明确 exit 0。          |
| 完整 `pnpm check` | 未取得结论 | 外层命令 124 秒超时；拆分后确认 format 和定向 lint 通过。            |
| TypeScript        | 当前失败   | 被忽略的 `.next/dev/types/validator.ts` 语法损坏，并非仓库源码报错。 |
| `pnpm build`      | 当前失败   | `node` 无法删除 root 拥有的 `.next/build/...js`，报 `EACCES`。       |
| `.next` 所有权    | 异常       | 发现 2,102 个非 `node` 用户拥有的 `.next` 条目。                     |
| Compose           | 通过       | base + dev override 的 `config --quiet` 通过。                       |
| 备份脚本语法      | 通过       | `sh -n docker/postgres-backup/backup.sh` 通过。                      |
| 测试 / CI         | 缺失       | 0 个 test/spec，0 个 `.github/workflows`。                           |
| 静态资源          | 偏重       | `public/` 约 9.2 MiB，其中 `cover.png` 约 4.1 MiB。                  |

当前 build/typecheck 的失败首先证明的是**本地生成物状态不健康**，不能直接推断业务源码无法构建；但在重新得到 exit 0 前，也不能把当前提交记作“构建已通过”。

## 4. 做得好的地方

### 4.1 主架构没有过度设计

项目没有额外引入 Express、Prisma、Redis 或独立 API 层。Payload 已承担 CMS、CRUD、认证、Local API 和 schema/migration 职责，符合当前规模。

```text
Payload Admin
  -> Collection
  -> PostgreSQL
  -> Payload Local API
  -> server getter
  -> mapper
  -> feature component
  -> App Router page
```

### 4.2 生产环境不再用 fallback 掩盖数据库问题

Tools、Reviews、Games 的 getter 明确区分 development 与 production。生产数据库为空时返回真实空结果，查询失败时抛错，不会用本地演示数据伪装成功。

### 4.3 Payload 公开读取边界基本正确

Reviews 和 Games 对匿名访问只返回 published 内容，登录用户才能读 draft；server getter 还显式使用 `overrideAccess: false`，slug 有数据库唯一约束。

### 4.4 migration 设计较谨慎

仓库有四个显式 migration。Games 图片字段迁移先添加 nullable 字段、回填、检查未知值，再改成 NOT NULL，down migration 的破坏性也没有被隐藏。

### 4.5 容器和 secret 边界意识较好

- Dev Container 固定 Node 22，并用 `pnpm install --frozen-lockfile`。
- PostgreSQL 16 有 healthcheck，web 等待 `service_healthy`。
- 生产基础 Compose 不发布 PostgreSQL 5432。
- `.env`、dump、依赖和构建产物都有忽略规则。
- runtime secret 不需要进入 Docker build 阶段，web runner 使用非 root 用户。

### 4.6 备份 sidecar 的方向合理

backup service 不挂载 Docker socket 或数据库 Volume，不开放端口，使用只读根文件系统、非 root、cap drop、no-new-privileges 和 tmpfs。脚本按 `pg_dump -> pg_restore --list -> R2 -> cleanup` 执行，失败后受控重试。

### 4.7 前端已有自己的性格

首页轮播、WebGL 雨滴、桌面能力判断、局部 reduced-motion、游戏图片墙和富文本详情页形成了明确视觉方向，组件规模总体也可控。

## 5. P0：最高优先级问题（均已关闭）

### P0-1：本地 `.next` 已破坏质量门禁 — 已解决

污染的 `.next` 已在核对路径和进程后安全清理，并由 `node` 重新生成。最终非 `node` 条目为 0，`pnpm check` 与 `pnpm build` 均为 exit 0。package scripts 和 `next.config.ts` 已加入 workspace root 防护，dev/build 并发守卫也完成专项验证。

正常开发入口现在默认安全；任意 root shell 仍可故意绕过仓库守卫，这是 Linux 权限模型的客观边界，不影响本项关闭。完整证据见 `docs/first-priority-next-build-gate-remediation-2026-07-10.md`。

### P0-2：生产 secret 与备份恢复未闭环 — 已关闭（部分事项转后续增强）

关闭依据：

- Coolify backup service 已启用并完成初始备份。
- 日志显示 2026-07-08、09、10 连续完成 dump、archive 校验和 R2 上传。
- 每次成功后明确记录 `Backup completed`，随后进入 86400 秒的下一次计划。
- R2 bucket 中存在与日志 object key、时间和大小相符的三个 `.dump` 对象。
- bucket public access 为 Disabled。

需要诚实保留的边界：临时数据库完整恢复演练和生产 secret 轮换尚未执行。项目所有者已明确决定现阶段不要求执行，并接受其作为后续安全增强。因此本项通过“真实备份已验证 + 剩余风险已接受”关闭，不能写成恢复演练或轮换已经完成。

### P0-3：完整 migration 链路尚未从空库验证 — 已解决

项目所有者确认首次生产部署满足：

```text
全新的 postgres-data
  → web 启动
  → docker-entrypoint.sh 执行 payload migrate
  → 四个 migration 成功
  → Next.js 启动
  → Admin、Tools、Reviews、Games 正常读写
```

生产库 `payload_migrations` 记录四个 migration，首次启动没有 `table already exists` 等冲突。首次生产部署本身就是比额外临时库更真实的空库验证，因此 P0-3 关闭，不需要为关闭该问题重复创建临时数据库。

未来在 CI 使用一次性 PostgreSQL 16 重跑 migration 仍有价值，但属于防回归测试，不再是生产链路未验证的 P0。

## 6. P1：重要代码与工程问题

### P1-1：`SKIP_ENV_VALIDATION=false` 仍会跳过校验 — **已关闭（PR #7，2026-07-13）**

修复前位置：`src/config/env.ts:26`

```ts
skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
```

这里的 Zod schema 本身没有写错。问题发生在 Zod 运行之前：`@t3-oss/env` 收到 `skipValidation: true` 后会直接返回原始 runtime env，不再执行 Zod 的格式检查、默认值和 `.transform()`。

Node.js 中的环境变量是字符串。`Boolean()` 判断的是字符串是否为空，而不是字符串的英文含义：

| 原始值      | `Boolean(...)` | 是否跳过 Zod   |
| ----------- | -------------- | -------------- |
| `undefined` | `false`        | 否             |
| `""`        | `false`        | 否             |
| `"true"`    | `true`         | 是             |
| `"false"`   | `true`         | **是（错误）** |
| `"0"`       | `true`         | **是（错误）** |

因此，若平台显式配置 `SKIP_ENV_VALIDATION=false`，应用反而会绕过 Zod。除了不检查 `DATABASE_URI` 和 `PAYLOAD_SECRET`，`ENABLE_DEV_SEED` 的字符串到 boolean 转换也不会发生：原始字符串 `"false"` 本身是 truthy，运行时值可能和 TypeScript 声明不一致。

当前环境边界是：

```text
本地 pnpm dev
  使用被 Git 忽略的 .env
  SKIP_ENV_VALIDATION 应不设置
  Zod 应正常检查和转换

Docker builder / GitHub Actions
  明确设置 SKIP_ENV_VALIDATION=true
  构建时不注入 production secret，因此有意跳过

Coolify production runtime
  由 Runtime Variables 提供 DATABASE_URI / PAYLOAD_SECRET 等
  SKIP_ENV_VALIDATION 应不设置
  Zod 应正常检查，错误配置应让应用尽早失败
```

Dockerfile 中的 `SKIP_ENV_VALIDATION=true` 只存在于 builder stage；runner 重新从 `base` stage 开始，因此它不会自动成为 production runtime 环境变量。CI 同样是明确的 build/check 场景，不持有 production secret。

这也是为什么它是 P1 而不是 P0：如果 Coolify runtime 没有设置该开关，当前生产仍会正常运行 Zod；风险发生在有人认为 `false` 表示“不要跳过”而显式填写它时。

PR #7 已修复为：

```ts
skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
```

这是本次确认的真实逻辑错误。修复已验证三个分支：未设置和 `"false"` 都执行 Zod 并完成类型转换，只有精确的 `"true"` 才跳过。

2026-07-13 实施记录：

- `src/config/env.ts` 已改为严格比较；
- 新增 `src/config/__tests__/env.test.ts`，3 个测试直接重新导入真实 env 模块；
- 完整测试结果为 8 files / 33 Vitest，加上 4 个 backup shell scenarios；
- `pnpm check` 与 `pnpm build` 均 exit 0；
- 未修改 Coolify、production runtime variables、数据库、secret 或 Volume。

PR #7 已合并到 main（`bf9c53e`），P1-1 正式关闭。

### P1-2：生产 Compose 允许默认数据库凭据

位置：`compose.yaml:8`、`compose.yaml:23`

基础 Compose 允许 `DATABASE_URI` 和 `POSTGRES_PASSWORD` 回退到 `postgres/postgres`。这对本地方便，但 `compose.yaml` 同时是生产 source of truth；Coolify 漏配时应尽早失败，而不是带默认密码启动。

建议让生产基础 Compose 对 `DATABASE_URI`、`POSTGRES_PASSWORD` 使用 required 语义，或增加自动校验，证明生产部署没有使用模板默认值。

### P1-3：测试和 CI 完全缺失 — **第一阶段已关闭（2026-07-12）**

2026-07-09 原始审查时确实是 0 个 test/spec、0 个 GitHub Actions workflow；production fallback、Games seed、nullable mapper 等规则只能人工验证。这个历史发现保留用于追溯，但已不再代表当前仓库状态。

关闭依据：

- PR #1 增加 Vitest 4、7 个测试文件和 30 个测试，覆盖三个 mapper、Tools/Reviews/Games getter 的正常、空、异常与 development/production 分支，以及 Games seed upsert 不调用 delete；
- PR #2 增加 `.github/workflows/ci.yml`，在 Pull Request 和 main push 上依次执行 install → format:check → lint → typecheck → test → build；
- workflow 只有 `contents: read` 权限，不含 production secret、数据库连接或部署步骤；
- PR #2 的 `CI / quality (pull_request)` 已在 GitHub 托管 runner 上真实运行并通过；
- main Ruleset 已要求通过 Pull Request 和 GitHub Actions `quality`，required approvals 为 0，并限制删除 main、阻止 force push；
- PR #1、PR #2 已依次合并；远端 main 的合并提交分别为 `9bf5caa`、`faf8cea`。

因此 P1-3 的“第一阶段高价值测试 + 自动 CI + main 合并门禁”已经闭环，backup shell 的 4 个失败/成功场景也已作为后续独立增强实现。临时 PostgreSQL、published 权限集成测试和 Playwright smoke 仍未完成，不能据此声称整个测试体系已经完备。具体实施记录见 `docs/testing-and-github-actions-guide-2026-07-10.md`。

### P1-4：备份容器 Running 不代表最近备份成功

`backup.sh` 会永久循环并在失败后重试，因此凭据失效、R2 故障或 tmpfs 空间不足时，容器仍可能显示 Running。当前没有 healthcheck、last-success 文件、指标或告警。

2026-07-12 已增加 4 个 fake-command shell 场景，自动证明 `pg_dump`、archive 校验或 R2 上传失败不会打印 `Backup completed`，并验证临时 dump 清理。它关闭了失败误报的回归缺口，但不能证明最近一次真实备份成功。

后续仍应记录最近成功时间，并让 healthcheck 或外部检查判断是否超过允许窗口。

当前 R2 Token 具备对象读写能力，dump 也没有应用层加密。对当前单人项目可作为已知取舍，但 Token 泄露意味着攻击者可能读取或删除备份；数据敏感度提高后应考虑对象锁、权限隔离或客户端加密。

### P1-5：首页资源和 GPU 生命周期偏重

`public/` 约 9.2 MiB，`cover.png` 单文件约 4.1 MiB。`SceneBackground` 同时创建所有 wallpaper 的 CSS background，浏览器很可能较早下载多张背景，也无法获得 `next/image` 的响应式优化。

`rain-renderer.ts:120-127` 创建四个 texture，但 `destroy()`（第 96 行）只删除 program 和 position buffer，没有保存并 `deleteTexture`。壁纸轮换和 resize 会重复重建场景，长时间停留首页可能积累 GPU 资源。

建议先压缩/转换 WebP 或 AVIF，只预载当前和下一张背景，并完整释放 WebGL texture。

### P1-6：CMS 字段缺少 slug、URL 和资源路径验证

Reviews/Games slug、Tools.url、Reviews.coverImage、Games.coverSrc、Games.links.href 主要是普通 text。管理员录入错误会造成坏路由、坏链接或 `next/image` 运行错误；`next.config.ts` 又没有远程图片白名单。

建议统一 slug 小写/连字符校验，明确 URL 和站内资源路径策略，并把 releaseDate、readingTime 等改成更适合校验和排序的类型。

### P1-7：错误、空状态和数据上限没有形成产品行为

getter 固定上限为 Tools 20、Reviews 20、Games 100，但没有分页或“查看更多”；超过后内容会静默消失。生产数据库为空时多个页面没有明确空状态，查询异常也没有站点级 `error.tsx`。

至少应补：空列表说明、统一 404/错误页、明确分页策略和结构化错误日志。

### P1-8：Lightbox 还不是完整的可访问 modal

已有 `role="dialog"`、`aria-modal`、Esc、方向键和 body scroll lock，但仍缺焦点进入、focus trap、关闭后恢复焦点和背景 inert。多个按钮使用 `focus:outline-none`，没有等价的 `focus-visible` 样式。

`GameSharedModal` 的 `loaded` state 换图时不会重置，`direction` prop 当前也没有使用。

### P1-9：reduced-motion 降级不完整

雨滴层会关闭，但 wallpaper 仍自动轮换和执行缩放动画，caret 仍持续闪烁。应在 reduced-motion 下同时停止 wallpaper breathing、自动轮换/长过渡和 caret blink。

### P1-10：页面仍暴露明显 placeholder

- `src/features/about/components/about-page.tsx:44` 直接告诉访客正文是 placeholder。
- `src/features/tools/components/tools-page.tsx:60` 显示 `STATIC FRONT-END DRAFT`。

这比很多技术细节更直接影响访客对初版完成度的判断，上线展示前应优先替换。

## 7. P2：中低优先级改进

- Reviews/Games 详情页的 `generateMetadata()` 与 page 各查询一次，可用 React `cache()` 做同请求去重。
- 所有内容页都 `force-dynamic`；以后可评估 revalidate/tag invalidation。
- 全局 description 仍是工程骨架文案，`NEXT_PUBLIC_SITE_URL` 尚未用于 metadataBase、canonical、OG、sitemap、robots。
- collection 的 create/update/delete 建议显式声明 authenticated 权限，便于审计。
- 缺少根 `README.md`，现有 docs 很充分但开始有 source of truth 漂移风险。
- PostgreSQL 有 healthcheck，web 没有专用 liveness/readiness endpoint。
- Payload 未配置邮件 adapter；若 V1 需要找回密码，应在上线前处理。

## 8. 推荐执行顺序

### 第一阶段：恢复可信开发门禁 — 已完成

1. `.next` 已由 `node` 重新生成。
2. 最终 `pnpm check`、`pnpm build` 均为 exit 0。
3. root 与 dev/build 并发防护已加入。
4. `SKIP_ENV_VALIDATION` 严格解析已由 PR #7 修复；production fail-fast 仍列在 P1，不影响 P0-1 关闭。

### 第二阶段：完成 P0 数据可靠性闭环 — 已完成

1. 生产首次空库部署已验证四个 migration。
2. Coolify R2 backup 已启用并连续生成真实对象。
3. 恢复演练和生产 secret 轮换由项目所有者接受为后续增强。
4. 保留策略、last-success 监控和告警继续作为 P1/P2 改进。

### 第三阶段：建立最小工程护栏 — 基础部分已完成

1. [x] mapper/getter/seed 的 30 个高价值 Vitest 测试。
2. [x] GitHub Actions：install、format、lint、typecheck、test、build，并由 main Ruleset 强制执行。
3. [x] backup shell 的 4 个成功/失败分支测试，防止上传失败时误报成功。
4. [ ] error、not-found、empty state 和 health endpoint。
5. [ ] slug/URL/资源路径校验。
6. [ ] 临时 PostgreSQL、published 权限和 Playwright smoke；按收益独立推进，不阻断当前初版。

### 第四阶段：让初版更像成品

1. 替换 About 与 Tools 的 draft 文案。
2. 压缩首页图片、释放 WebGL texture。
3. 补 Lightbox 焦点管理和完整 reduced-motion。
4. 补 metadataBase、canonical、OG、sitemap、robots。
5. 根据内容量决定分页与缓存策略。

## 9. 现在不建议做的事情

当前没有证据支持引入 Prisma、Redis、微服务、Kubernetes、消息队列、大型监控/备份面板，或为 `node_modules`、`.next`、`.pnpm-store` 擅自增加 named volume。这些不会解决当前最紧迫的问题。

## 10. 审查与状态更新限制

原始审查没有进行真实生产日志审查、Coolify 修改、真实 R2 上传、恢复演练、浏览器多设备回归、Lighthouse/axe、在线依赖漏洞 audit 或渗透测试，因此本报告不能替代完整生产验收或安全测试。

2026-07-10 的状态更新依据：本地修复执行记录、用户提供的 Coolify/R2 截图，以及项目所有者对首次生产空库部署过程的明确确认。本次更新没有重新登录生产数据库独立查询 `payload_migrations`。恢复演练与 secret 轮换也没有执行，二者是已明确接受的剩余风险。

## 11. 最终判断

Kita 的三个 P0 已经关闭：本地 build gate 恢复且有防复发守卫；生产 R2 备份持续成功；完整 migration 链路由首次生产空库部署验证。恢复演练与 secret 轮换并未伪装成已执行，而是由项目所有者接受为后续增强。

P1-3 第一阶段测试与 CI 已关闭。当前代码结构对初版而言清晰可靠，route、feature、server、Payload、migration 和基础设施职责没有混在一起，不需要推倒重来。此前的迷惑主要来自历史文档与现状漂移；当前入口文档已重新对齐，但仍应把带日期的评估文件视为历史记录。

P1-1 的 `SKIP_ENV_VALIDATION` 布尔解析已由 PR #7 修复并关闭。下一步更值得优先处理的是 production Compose 默认凭据，然后转向内容和产品层收口。backup last-success、恢复演练、临时数据库和 Playwright 属于有价值但可分阶段实施的增强项。
