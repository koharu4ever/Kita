# Kita 架构、可维护性与可移植性复核

> 复核日期：2026-07-15（America/Los_Angeles）
>
> 原始复核基线：`main` / `1d524754`（PR #11 已合并）
>
> 范围：目录边界、Next.js / Payload 数据流、环境配置、Dev Container、Docker / Coolify、PostgreSQL、备份、测试与 CI、OpenList 松耦合集成、可移植性与复建难度。
>
> 安全边界：本次为只读代码复核；没有读取或输出 secret，没有修改生产环境、数据库或 Volume。

> 2026-07-20 后续状态：本轮文档分支基线为 `78ad2d2`（PR #13）。外部账户与关键 secret 已盘点到 Bitwarden；Coolify SSH keys / `authorized_keys` 已制作 AES256 加密归档，并在 C 盘核对 checksum 后上传私有 R2。`C:\dev\Kita` 已完成全新 clone、Dev Container、本地 PostgreSQL、页面 smoke、36 Vitest、4 个 shell 场景、check 与 build 的真实复建演练。PostgreSQL restore、OpenList data backup、Coolify/VPS 端到端恢复仍未演练。最新恢复事实以灾难恢复 Runbook 为准；本文其余内容保留为 2026-07-15 的架构复核快照。

## 1. 结论先行

Kita 当前仍然是一个结构清楚、边界合理的个人内容站初版，不需要目录重写，也不需要新增后端框架。

综合判断：

| 维度         |   评分 | 结论                                                                       |
| ------------ | -----: | -------------------------------------------------------------------------- |
| 架构清晰度   |   8/10 | route、feature、server、Payload、migration 和基础设施职责可辨认            |
| 代码可维护性 | 7.5/10 | 主要业务代码不臃肿；少量约定和框架默认行为需要显式化                       |
| 当前可靠性   |   8/10 | P0 已关闭，CI、单元测试、backup shell 测试和 production migration 均有证据 |
| 本地可复建性 |   7/10 | 命令已简化，但 Windows + WSL + Docker Desktop + DIND 增加了恢复路径        |
| 生产可复建性 | 7.5/10 | Docker 化和 migration 较好；仍依赖外部 secret、Volume、Coolify 与恢复知识  |
| 数据灾难恢复 | 6.5/10 | 自动备份已真实运行，但临时库恢复演练仍未做，属于已接受的剩余风险           |
| 文档可信度   | 6.5/10 | 文档充分，但当前事实分散且存在日期、测试数量和启动命令漂移                 |

一句话评价：**代码结构本身比文档给人的感觉更清楚；目前最容易让人迷惑的不是业务代码，而是多份历史 Markdown 同时描述“当前状态”。**

本次没有发现新的 P0。下一步不应继续扩大基础设施，而应完成两个很小的开发体验收口，然后转回内容和产品体验。

## 2. 本次核对依据

本次通过 GitHub 插件核对了当前 `main`，最新提交为：

```text
1d524754 Merge pull request #11
           feat: link games to OpenList archive
```

PR #11 记录的验收结果为：

```text
36 个 Vitest 用例通过
4 个 backup shell 场景通过
pnpm check 通过
pnpm build 通过
PR head 对应 GitHub Actions CI / quality 成功
```

本报告没有重新在本机执行完整测试，因此以上结果是已合并 PR 与 GitHub Actions 的现有证据，不冒充本次新的本地执行结果。

## 3. 当前架构图

```text
Browser
  |
  +-- Next.js App Router route             src/app
  |      |
  |      +-- server getter                 src/server
  |              |
  |              +-- Payload Local API
  |                      |
  |                      +-- Collection    src/payload
  |                      +-- PostgreSQL
  |              |
  |              +-- mapper / view model   src/features/*/utils
  |      |
  |      +-- feature UI                    src/features/*/components
  |
  +-- Payload Admin                        /admin
  |
  `-- OpenList public URL                  archive.kral-koharu.com
         独立 Application、独立 Volume、独立凭据
```

生产发布链路：

```text
Coolify
  -> Kita web container
       -> docker-entrypoint.sh
       -> payload migrate
       -> Next.js standalone server
       -> PostgreSQL
       -> backup sidecar -> Cloudflare R2

  -> OpenList container（独立发布单元）
       -> OpenList data Volume
       -> 外部存储或挂载来源
```

这个结构没有重复后端：Payload 已经承担 CMS、认证、Local API、schema 和 migration，不需要再增加 Express、Prisma、Redis 或自建 Go 服务。

## 4. 结构为什么仍然清晰

### 4.1 `src/app` 保持很薄

Games、Reviews、Tools 的 route 主要只做三件事：

1. 调用 `src/server` getter；
2. 处理 `notFound` / metadata；
3. 把数据交给 feature component。

查询、mapping 和大块 UI 没有混进 route 文件，这是正确方向。

### 4.2 `src/features` 是真实业务边界

Games、Reviews、Tools、Home 各自包含：

- components；
- data 或 development fallback；
- types；
- mapper / formatter；
- 就近单元测试。

这与项目采用的 feature-oriented / bulletproof-react 思路一致。当前规模下不需要再引入通用 service、repository 或 domain 包。

### 4.3 `src/server` 集中处理运行环境分支

getter 明确表达：

```text
production
  Payload 失败 -> 记录错误并抛出，不用 fallback 掩盖故障

development
  Payload 为空或失败 -> 使用本地 fallback，便于继续开发 UI
```

这个边界已经有测试，也是早期架构里非常重要的一项正确选择。

### 4.4 Payload schema 和 UI view model 没有直接绑定

三个 mapper 把 Payload document 转成前端需要的 `GameDetail`、`ReviewPreview`、`ToolkitItem`，并处理 nullable tags / links。这让 Payload generated type 不会扩散到所有组件。

### 4.5 OpenList 的接入没有污染 Kita

当前实现只是从 Games 的 `links` 中识别 `Game archive`，然后由浏览器打开公开 HTTPS URL。

Kita 没有：

- 调用 OpenList API；
- 保存管理 token；
- 共享数据库或 Volume；
- 把 OpenList 加进 Kita Compose；
- 为 OpenList 重写一套前端。

因此 OpenList 停止时，Kita 的封面墙、详情和 Reviews 仍可运行。这是正确的松耦合，不是临时拼接。

## 5. 本次确认的问题与处理状态

### P1-文档：当前事实出现漂移（本 PR 已关闭）

这是目前最影响理解的问题。

已经看到的矛盾包括：

- `CODEX_HANDOFF.md`、`current-project-status.md` 的顶部基线仍停留在较早提交；
- 部分位置仍写 33 个 Vitest，但 PR #11 后实际记录为 36 个；
- `current-project-status.md` 一处仍要求先执行 `pnpm dev:services` 再执行 `pnpm dev`，而当前 `pnpm dev` 已自动启动并等待 PostgreSQL；
- 早期文档写“不要为 `.next` / `node_modules` 增加 named volume”，后续性能修复又明确增加了两个有边界的 named volume；
- Games 当前已连接独立 OpenList archive，但部分状态文档还没有反映；
- 带日期的历史实施记录与四份“当前事实入口”混在一起阅读，容易把旧结论当成现状。

这些不是运行时故障，但会直接造成接手者误操作。本评估所在 PR 已同步四份当前事实入口到 PR #11、36 + 4 测试、唯一开发入口、两个性能 Volume 例外和 OpenList URL 边界。

建议将文档职责固定为：

| 文档                                  | 唯一职责                               |
| ------------------------------------- | -------------------------------------- |
| `CODEX_HANDOFF.md`                    | 入口、强制安全边界、最短操作顺序       |
| `current-project-status.md`           | 当前事实、当前命令、当前待办           |
| `project-structure.md`                | 稳定目录职责和依赖方向                 |
| `development-production-alignment.md` | 本地与生产的差异和不变量               |
| 带日期文档                            | 历史证据、决策过程，不再声称永久“当前” |

最好再新增一个简短根目录 `README.md`。当前 GitHub `main` 没有根 README，这增加了首次复建的入口成本。

### P1-开发体验：`next-env.d.ts` 被 Git 跟踪（本 PR 已关闭）

Next.js 在 `next dev` 时会自动改写 `next-env.d.ts`，本次实际开发中已经造成无业务意义的 dirty working tree。

评估时状态：

- `tsconfig.json` 包含 `next-env.d.ts`；
- `.gitignore` 没有忽略它；
- 文件由 Next.js 自动生成并带有 “should not be edited” 注释。

本 PR 已执行：

1. 将 `next-env.d.ts` 加入 `.gitignore`；
2. 从 Git 索引取消跟踪，但保留本地自动生成文件；
3. 执行 typecheck 与 build，确认 Next 能自动生成并使用它。

这不会影响生产数据，也不会触碰 `.next` Volume。

### P1-生产配置：Compose 的数据库弱默认值仍未 fail-fast

`compose.yaml` 中 `DATABASE_URI`、`POSTGRES_USER`、`POSTGRES_PASSWORD` 仍保留本地开发默认值。

它不代表当前生产已经使用弱密码；生产实际变量由 Coolify 提供。但它意味着未来若迁移平台或漏配变量，Compose 可能使用默认值继续启动，而不是立刻报错。

建议未来独立 PR：

- base / production Compose 对数据库关键变量使用 `${VAR:?}`；
- 本地默认值保留在 `.env.example` 或 dev override；
- 只验证 `docker compose config` 和本地启动；
- 不修改现有 Coolify secret、数据库或 Volume。

### P2-数据契约：`Game archive` 依赖 label 字符串

当前 `getGameArchiveLink()` 用大小写不敏感的字符串 `Game archive` 识别资源入口。它已测试，当前一个游戏的 V1 足够用，也避免了立即生成 migration。

但它仍是一个隐式语义：管理员把 label 改成 `Download` 或 `Archive` 后，按钮会消失。

建议：

- 现在保留，不为一条数据新增 schema；
- 在 Payload 字段说明和当前状态文档中明确这个约定；
- 当出现第二类可操作链接或更多游戏时，再把 links 增加 `kind` select，或新增明确的 `archiveUrl` 字段并生成 migration。

同时建议把 archive URL 限制为 `https:`，避免把任意协议误当作外部资源入口。

### P2-性能：详情 metadata 和页面重复查询

Games 与 Reviews 的 `[slug]/page.tsx` 都会：

1. 在 `generateMetadata()` 调 getter；
2. 在页面组件再次调同一个 getter。

内容量小时影响不大，但每个详情请求可能产生两次相同 Payload 查询。可在 getter 外使用 React request cache，或抽出按 slug memoized 的查询函数。该优化应先用日志确认重复查询，再实施。

### P2-前端资源：雨滴 WebGL texture 没有显式释放

`RainRenderer.init()` 创建了 4 个 WebGL texture；`destroy()` 只删除 program 和 position buffer，没有保存并 `deleteTexture()`。

`RainWaterLayer` 在背景变化和 resize 后会销毁并重建 scene，因此长时间停留、频繁 resize 时，旧 texture 可能继续占用 GPU 资源直到 context 被回收。

这不是首页立刻崩溃的问题，但属于已确认的资源生命周期缺口。修复方向：

- 保存 `createTexture()` 返回的 texture；
- `destroy()` 中逐个 `deleteTexture()`；
- 保留当前 reduced-motion、桌面能力检测和 fallback；
- 用重复 resize 的浏览器性能记录验证显存 / context 行为。

### P2-可访问性：Lightbox 还不是完整 modal

当前已有：

- `role="dialog"`；
- `aria-modal="true"`；
- Escape / 左右方向键；
- body 滚动锁定；
- 按钮 aria-label。

仍缺少：

- 打开时把焦点移进 modal；
- focus trap；
- 关闭后恢复到原封面；
- 可见 focus ring。

视觉实现没有明显臃肿，但 `game-shared-modal.tsx` 已同时负责图标、图片、导航、操作区和缩略图。以后再增加功能时，应先拆出 `GameModalActions` 和 `GameThumbnailStrip`，现在不需要为了文件长度提前重构。

### P2-镜像体积：production runner 复制完整依赖树

Dockerfile 将 deps 阶段的完整 `node_modules` 复制到 runner，主要原因是容器启动时还要执行 Payload migration。

这保证了 migration 可靠，但可能包含 dev dependencies，增加镜像体积、上传时间和攻击面。优化前必须先测镜像大小，并确保 Payload CLI、migration、SWC 和 standalone runtime 所需依赖不会被错误裁剪。

当前优先级低于内容、文档真相和 Compose fail-fast。

## 6. 已解决问题之间有没有冲突

| 已完成工作                                            | 是否冲突   | 复核结论                                                                                     |
| ----------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| 禁止 root 生成 `.next` + `.next` named volume         | 否         | 守卫约束“谁写”，named volume 优化“写到哪里”；postCreate 负责所有权，两者互补                 |
| `pnpm dev` 自动启动 PostgreSQL + development fallback | 否         | 正常入口优先得到真实 DB；fallback 只在开发故障时兜底，production 仍 fail-fast                |
| 严格解析 `SKIP_ENV_VALIDATION` + CI 设置为 true       | 有意的例外 | 运行代码只认精确 `true`；CI build 有意跳过真实 secret，但最好保留独立 env 分支测试           |
| production migration + development schema push        | 无直接冲突 | 两套生命周期服务不同环境，但必须在文档中明确，不能把 dev push 当作 production migration 证据 |
| 自动 R2 backup + backup shell 失败测试                | 否         | 前者证明成功路径在生产运行，后者证明修改脚本后失败不会误报成功                               |
| 自动备份 + 尚未恢复演练                               | 不是冲突   | 备份已闭环到“有对象”，恢复能力仍是明确接受的剩余风险                                         |
| OpenList 独立 Application + Kita archive link         | 否         | URL 是唯一契约；OpenList 故障不会阻止 Kita 渲染                                              |
| 生产不用 fallback + OpenList 外链可能失效             | 否         | Payload 是页面必需数据源；OpenList 是可选外部操作，按钮可独立隐藏或检测                      |

整体上，最近的修复没有互相抵消。真正需要处理的是文档没有把这些“互补关系”和“有意例外”同步表达清楚。

## 7. 哪些地方看起来复杂，但目前不算过度设计

### Dev Container 的 Docker-in-Docker

DIND 的确增加了：

- 外层 Docker Desktop；
- WSL integration；
- Dev Container；
- 内层 Docker daemon；
- 内层 PostgreSQL Volume；
- node_modules / `.next` 的外层 named volume。

这次 `/run/guest-services/distro-services/ubuntu.sock` 故障也说明它的恢复路径比普通宿主机 Node 开发更复杂。

但它换来的好处是：

- Node、pnpm、PostgreSQL 和 Docker 工具不污染 Windows 主机；
- 开发者默认使用 `node`，root 守卫有效；
- PostgreSQL 与工作区一起管理；
- named volume 显著缓解 Windows bind mount 的 Next 编译性能问题。

因此当前不建议拆除 DIND。应补一份短恢复清单，而不是再次改变容器架构。

### Home 雨滴效果

Home 的 WebGL / Canvas 是当前最复杂的前端子系统，但它是站点视觉身份的一部分，并且已经具备：

- desktop capability 检测；
- reduced-motion；
- 页面不可见时暂停绘制；
- resize debounce；
- 初始化失败 fallback；
- React effect cleanup。

所以它不是“应该删除的炫技代码”。只需补 texture 清理和性能验证。

### backup sidecar

对当前少量内容而言，备份容器看起来比业务代码重，但它保护的是 PostgreSQL 中所有 Payload 内容和未来管理数据。脚本已经验证：

- PostgreSQL 未就绪时不会假成功；
- pg_dump 失败不会假成功；
- archive 无法读取不会上传；
- R2 上传失败不会打印 `Backup completed`。

它解决的是低频但高损失风险，不属于过度工程化。现在不需要继续增加复杂监控系统。

## 8. 可移植性与复建难度

### 8.1 源码可移植性：高

有利因素：

- Node 22、pnpm 版本固定；
- Next.js standalone；
- PostgreSQL 16；
- Dockerfile 与 Compose 在仓库中；
- migration 在仓库中；
- `.env.example` 列出键名；
- CI 不依赖 production secret；
- OpenList 与 Kita 不共享源码或数据库。

阻碍因素：

- 缺少根 README；
- 当前文档入口较长；
- 部分配置知识只存在于带日期记录中。

### 8.2 本地复建：中等

全新电脑需要：

```text
Git
Docker Desktop
WSL 2 + Ubuntu integration
VS Code + Dev Containers
clone repository
copy .env.example -> .env
Reopen in Container
pnpm dev
```

源码步骤不复杂，但 Docker Desktop / WSL / DIND 任一层故障都会让症状看起来像项目容器或数据库丢失。named volumes 保留数据，却也使“容器消失但数据还在”的状态需要一定 Docker 知识才能理解。

这份本地恢复清单现已由 `docs/kita-disaster-recovery-inventory-and-rebuild-runbook-2026-07-16.md` 的第 11、12 节覆盖，包括：

1. 如何判断是外层 Docker、WSL、Dev Container 还是内层 PostgreSQL 故障；
2. 如何确认 volumes 存在；
3. 如何安全 Reopen / Rebuild；
4. 哪些 Volume 绝不能删除；
5. `pnpm dev` 的正常日志长什么样。

### 8.3 生产复建：中等偏低难度

代码和数据库 schema 可以从仓库重建：

```text
new PostgreSQL Volume
  -> docker-entrypoint.sh
  -> payload migrate
  -> Next.js start
```

但完整复建还需要仓库外信息：

- Coolify 中的环境变量；
- Payload secret；
- PostgreSQL 凭据；
- 域名、DNS 与 TLS；
- R2 backup 凭据；
- 现有 PostgreSQL dump；
- OpenList data Volume / 配置；
- OpenList 挂载来源与访客权限。

因此“应用能重新启动”和“原站内容完整恢复”是两件事。前者难度中等偏低，后者仍取决于备份恢复步骤是否被真正演练。

2026-07-20 更新：上述仓库外身份、secret 与平台配置已经按用途盘点到 Bitwarden；Coolify SSH 恢复归档也已经形成独立加密副本。这降低了“只靠记忆复建”的风险，但不改变完整 restore drill 尚未完成的结论。

### 8.4 数据可移植性：中等

优点：PostgreSQL 使用 custom-format dump，理论上比绑定某个托管平台更容易迁移；R2 也是标准 S3 风格对象存储。

剩余不确定性：尚未用一个临时 PostgreSQL 16 实际执行 restore 并验证 Payload 内容。因此恢复演练不是当前上线阻断，但仍是灾难恢复可信度中最大的缺口。

### 8.5 OpenList 可移植性：边界清楚，但有外部依赖

Kita 侧只保存 URL，所以替换 OpenList 或底层存储很容易。

OpenList 自身的复建需要：

- 固定镜像版本；
- data Volume 备份；
- 管理员身份与站点配置；
- storage / WebDAV / provider 配置；
- 公开访客权限；
- 保持旧的公开 URL，或同步更新 Payload links。

这部分不应写进 Kita Compose，但应有独立部署记录。

## 9. 建议的下一步

### 已完成：开发体验收口 PR

范围保持很小：

1. [x] 处理 `next-env.d.ts` 的 generated-file hygiene；
2. [x] 同步四份当前事实文档到 `main` / PR #11；
3. [x] 把 `pnpm dev` 写成唯一正常开发入口；
4. [x] 明确两个 targeted named volumes 是经过验证的性能例外；
5. [x] 记录当前 36 Vitest + 4 shell 场景；
6. [x] 记录 OpenList 已是独立 Application，Kita 只保存 URL。

这项完成后，应停止继续整理工程底座。

### 然后做：内容与产品体验

建议顺序：

1. 明确 Games 的策展字段：标题、原名、开发商、状态、简介、资料链接和 archive 链接；
2. 录入 3–5 个真实、风格一致的条目，验证封面墙在真实内容量下的节奏；
3. 替换 About / Tools 中仍像 placeholder 或 draft 的文案；
4. 增加 Games / Reviews / Tools 的空状态和通用 error boundary；
5. 再评估是否需要搜索、筛选或更多 OpenList 入口。

### 后续独立做，不与内容 PR 混合

- production Compose 数据库变量 fail-fast；
- Game archive 结构化字段；
- detail getter request cache；
- WebGL texture cleanup；
- Lightbox focus trap；
- 临时 PostgreSQL restore 演练；
- 少量 Playwright smoke test。

## 10. 目前不建议做的事情

- 不重写 `src/features` 目录；
- 不把 OpenList 加入 Kita Compose；
- 不新增 Prisma、Express、Redis 或独立 API；
- 不为了一个 archive link 立刻重做 Games schema；
- 不删除现有 Dev Container / PostgreSQL / `.next` / node_modules named volumes；
- 不把历史 Markdown 全部删除；
- 不追求测试覆盖率数字；
- 不在同一个 PR 同时改生产 Compose、前端内容和 WebGL。

## 11. 最终判断

Kita 当前的整体设计没有出现方向性错误。

最稳定的部分是：

- Next.js route 与 feature UI 分离；
- Payload document 通过 mapper 转换；
- production 不使用 development fallback；
- migration 在容器启动前执行；
- backup 成功与失败路径都有证据；
- CI 与 main Ruleset 已建立；
- OpenList 采用独立应用和公开 URL 契约。

最需要收口的部分是：

- 当前文档事实漂移；
- `next-env.d.ts` 生成文件污染；
- Compose 的 production fail-fast；
- 少量已确认的性能、资源释放和可访问性细节。

因此下一阶段的正确策略不是继续“搭架构”，而是：

```text
先做一次很小的开发体验 / 文档真相 PR
  -> 停止基础设施扩张
  -> 录入真实内容
  -> 观察真实使用
  -> 只修复有证据的产品与性能问题
```

这能保持项目的设计品味，也能避免一个个人内容站被工程流程本身拖慢。

## 12. 参考

- [PR #10：Dev Container 本地性能修复](https://github.com/koharu4ever/Kita/pull/10)
- [PR #11：Games 连接 OpenList archive](https://github.com/koharu4ever/Kita/pull/11)
- [Payload Access Control 官方说明](https://payloadcms.com/docs/access-control/overview)
- [Payload Local API access control 官方说明](https://payloadcms.com/docs/local-api/access-control)
- [Games 与 OpenList 方案评估](./games-openlist-index-evaluation-2026-07-13.md)
- [Kita 与 OpenList 项目边界评估](./openlist-kita-project-boundary-evaluation-2026-07-13.md)
