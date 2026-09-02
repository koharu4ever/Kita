# Kita 当前项目状态

> 最后核对：2026-09-02
>
> 本文是可变事实和待办的唯一来源。操作步骤见 [文档入口](./README.md) 中的专题文档。

## 代码与 Git

本轮文档整理基线：

```text
main: 6e15b45 (PR #25 merge)
workspace: C:\dev\Kita
```

开始新任务时必须重新查询 Git；上述 SHA 是 2026-09-02 的基线证据，不代表永久 HEAD。

仓库当前包含：

- Next.js 16 App Router、React、TypeScript；
- Payload CMS Admin、REST/GraphQL route 和 Local API；
- PostgreSQL 16；
- Users、Media、Tools、Reviews、Games collections；
- server getter、mapper 和 feature DTO；
- 6 个 production migration；
- Dev Container + Docker-in-Docker；
- Docker multi-stage standalone Production image；
- repository Compose：web/postgres/backup；
- GitHub Actions required `quality`；
- 独立 OpenList Application 边界。

项目已经进入 `v1.0` 收尾阶段。固定定位是自托管游戏目录与评论发布平台；后续优先完成真实内容、隔离验证和最终展示，不再扩张技术栈或业务类型。

截至 2026-09-01，PR #24 已合并到 `main` 并部署；Production `/api/health` 已返回 `200`、`ready` 和 `database: reachable`。后续视觉替换与内容整理继续使用独立小型分支，不直接修改 `main`。

2026-09-02 已核实 PR #25 恢复旧视觉的改动合并到 `main`。Reviews 博客式展示和 Tools 五模式归档已共同提交并推送到 `codex/reviews-blog-experience`；用户已授权创建 PR，但尚未创建成功，也未合并或部署。

## 本地开发

正常目录为 `C:\dev\Kita`；D 盘旧工作区不再开发或提交。

已确认设计：

- Dev Container 使用 Node 22 和 `node` 用户；
- `node_modules` 与 `.next` 使用 targeted named volumes；
- Codex CLI 固定安装在 Dev Container 镜像中，`CODEX_HOME` 使用独立的本机 named volume；
- 本地 PostgreSQL 运行在 Dev Container 的 Docker-in-Docker；
- `pnpm dev` 自动启动并等待 PostgreSQL healthy；
- 本地 Media 使用 `.payload-media`，不需要 R2 credentials。

2026-07-20 曾完成 C SSD 全新 clone 复建：Dev Container、全新本地 PostgreSQL、主要页面、36 Vitest、4 个 backup shell 场景、check 和 build 通过。此记录只证明当时的本地复建；当前代码验证结果应重新运行命令获得。

## 内容与 Payload

当前 Collections：Users、Media、Tools、Reviews、Games。

读取边界：

- Media/Tools 允许匿名读取；
- Reviews 匿名只读 `published`；
- Games 匿名只读 `published`；
- getter 使用 `overrideAccess: false`；
- 所有环境的数据读取失败都会抛错，不用静态 fallback 掩盖故障；空 Collection 使用页面 empty state。

写权限边界：

- Media、Tools、Reviews、Games 均显式要求登录才能 create/update/delete；
- collection 配置测试覆盖全部内容 Collection 的公开读取和写权限声明；隔离 PostgreSQL smoke 另以 Reviews 验证真实 anonymous published 与 authenticated create/update/delete 链路。

内容字段边界：

- Games/Reviews slug 只接受以单个连字符分隔的小写 ASCII 字母和数字；
- Tools URL 与 Games links 只接受 `http/https` 绝对 URL；
- Media、Tools、Reviews、Games 的必填 text/textarea 字段拒绝纯空白，并保留 Payload 原生 required/长度校验；
- Games/Reviews 共用同一份 Lexical feature 配置。

Games Media-only 已完成：

- `cover` 是必填 Payload Media upload relationship；
- Production 图片在独立 Cloudflare R2 Media bucket；
- 公开 URL 使用 `media.kral-koharu.com` custom domain；
- 旧 `coverSrc`、`coverAlt`、`coverWidth`、`coverHeight` schema/列已删除；
- mapper 从 Media metadata 构造前端 cover DTO；
- 生产 6 条 Games 的 relationship、页面、Media URL 与 Redeploy 持久性曾于 2026-07-22 验证。

Reviews 展示层已在当前分支完成本地实现：

- `/reviews` 信息流和 Review 详情使用独立 route layout，不污染其他路由；
- 信息流以全屏封面 Hero 和打字机文案进入博客式双列卡片；列表按每页 4 篇执行 Payload 分页，并在信息流底部提供紧凑页码和前后翻页；
- 开发环境可通过 `/reviews/preview` 查看 6 篇无数据库写入的占位内容和两页分页效果，Production 返回 404；详情保留封面、正文卡和粘性目录；
- 详情页包含 Lexical heading 自动目录、上一篇/下一篇、随机 Review 与本地阅读位置恢复；导航与随机选择读取全部已发布 Reviews，不再受旧的 20 条上限限制，信息流仍独立执行每页 4 篇的服务端分页；
- 光暗模式、角色导航、按 pathname 稳定散布并随页面滚动的侧边装饰贴纸和自定义鼠标严格限制在 Reviews 子路由；Giscus iframe 随主题加载对应 CSS；
- Hero 不显示向下箭头；阅读工具在滚动后以博客式蓝色方块 SVG 按钮出现，包含主题、工具收折、随机阅读和进度/返回顶部；手机进入评论区时隐藏浮动工具，避免遮挡输入与登录；
- 评论区沿用所有者博客的渐变标签、点阵底纹、渐变边框和七张装饰贴纸，窄屏减少贴纸并保留真实 Giscus 输入区；
- Giscus 使用 pathname 映射到 Kita GitHub Discussions，支持配套光暗主题和 Anki-tan reaction CSS；
- 本地 Giscus iframe 使用所有者博客已公开的同款主题，避免跨来源加载 localhost CSS 失败；部署版本使用 Kita 自己的 `/reviews/giscus/` 主题与素材；
- 评论不进入 Payload/PostgreSQL，不新增后端内容模型或 secret。

## Production 与数据库

Coolify 使用 repository `compose.yaml`。Production `web` 等待 PostgreSQL healthy，entrypoint 先执行 Payload migration，再启动 standalone server。

数据库事实边界：

- Production 数据库曾由项目所有者手动复建；
- 手动复建后 Admin、Tools、Reviews、Games 正常运行；
- PR #17 Media/relationship 和 PR #18 Media-only cleanup 增量 migration 成功；
- 2026-09-01 已在无 Volume 的一次性 PostgreSQL 16 上验证全部 6 个 migration、再次运行时无待执行 migration 和最终 Media-only schema；同一路径已加入 CI；
- fresh smoke 不证明带真实 Production 数据升级、全部 `down` 或 dump restore；
- PostgreSQL dump restore 尚未在隔离数据库演练。

不要在现有本地或 Production 数据库盲跑全部初始 migration，也不要为了测试删除 Volume。

### Production 发布审计（2026-09-01）

本次只读取公开页面和 REST API，没有登录 Admin、写入内容或修改基础设施。结果表明代码结构已经可以收尾，Production 仍需完成以下发布门禁：

- 用真实编辑内容替换演示条目、测试说明和无效日期；
- 删除未经确认授权的下载入口，只保留官方、资料库或合法商店链接；
- 逐项确认 Games/Reviews 的内容、外部链接和 Media 来源，确保为原创或有明确公开授权；
- 将需要作为 Production 内容封面的替换素材通过 Payload Media 上传到 R2，并更新对应 relationship；仓库静态文件不会自动覆盖 R2 对象；
- 清理 Tools 的标题格式和描述文案；
- `/api/health` 已随 PR #24 部署并验证正常 readiness；故障时的 `503` 行为仍由自动测试覆盖，不在 Production 主动制造故障。

以上是内容和发布阻塞项，不是新的架构缺陷。具体内容清单不进入公开仓库；Production 应由项目所有者在 Payload Admin 中逐条确认，代码任务不能替代版权与编辑判断。

## Backup 与恢复

已完成：

- PostgreSQL custom-format dump -> private R2 sidecar 已启用并有真实对象；
- backup shell 的 dump/校验/上传失败不会误报成功；
- 关键账户、配置键和 secret 位置已盘点到 Bitwarden；
- Coolify SSH keys/`authorized_keys` 的加密恢复归档曾完成 checksum 核对并上传 private R2；
- C SSD 本地工作区丢失复建已演练。

未完成或暂缓：

- 隔离 PostgreSQL 16 dump restore；
- private R2 SSH archive 再下载 round-trip；
- OpenList 最终 storage、data inventory 和 backup/restore；
- Coolify/VPS 端到端恢复；
- Production secret 轮换；
- backup last-success healthcheck/告警；
- Bitwarden 独立离线恢复副本确认。

不能把“有 R2 对象”“手动复建数据库”或“本地 clone 成功”写成完整灾难恢复闭环。

## OpenList

OpenList 以独立 Coolify Application 运行，不属于 Kita `v1.0` 核心用户流程。它不与 Kita 共享数据库、Volume、secret、构建流程或登录。

最终 storage provider 尚未确定，当前测试挂载按可丢弃处理。OpenList data backup/restore 未闭环。

## 测试与 CI

GitHub Actions `quality` 运行 frozen install、format、lint、typecheck、快速 tests、隔离 PostgreSQL/Payload integration smoke 和 build；main ruleset 要求 PR 与 required check。

最近文档记录的代码基线包含字段 validation、collection access/config、Dev Container workspace guard、CMS-only getter 与 readiness response 等 Vitest，以及 4 个 backup shell 场景。2026-09-01 在 Reviews 分支重新验证 126 个 Vitest、4 个 backup shell 场景、`pnpm check` 和 `SKIP_ENV_VALIDATION=true pnpm build` 全部通过；新增测试覆盖目录 Unicode/重复标题 ID、Review 导航、随机选择、稳定随机贴纸布局和列表分页。浏览器确认 Reviews Hero、打字机、真实翻页、桌面与 390px 窄屏、主题切换、随机路由、目录、Giscus 加载及路由隔离；Giscus 在首次留言前提示尚未创建对应 Discussion，属于预期行为。此前的 5 个真实 PostgreSQL/Payload integration 测试仍是 PR #24 基线结果，本分支没有修改 Payload schema。`SKIP_ENV_VALIDATION` 与 CI 一致，只用于受控 build；Production 运行时仍强制使用完整 R2 配置。

同日将 Next.js、Payload、Sharp 和 PostCSS 更新到修复已知高危 advisory 的同栈补丁版本，并在升级后重跑上述完整门禁。锁文件的 `pnpm audit --prod --audit-level high` 结果为 0 high、0 critical；剩余 low/moderate 项来自上游固定的 Admin/CLI 传递依赖，当前不使用未经上游验证的强制 override。

首页和 Games gallery 的本地浏览器收尾已完成：

- 首页、About 与仓库内 Review 兼容封面已恢复为 PR #24 生成图替换之前的旧视觉；项目所有者已明确授权 Kita 使用其本地 Kral 博客资源，Git 来源版本和授权边界统一记录在根目录 `THIRD_PARTY_NOTICES.md`；
- 首页静态视觉资源使用 WebP，首次渲染只挂载当前背景 URL，后续壁纸随轮播按需加载；保留的旧 JPEG 文件名仅用于已有内容和 migration 的路径兼容；
- rain WebGL 只在对应区块进入视口后初始化；
- `prefers-reduced-motion` 会停止自动换图、持续动画、光标闪烁和平滑滚动；
- Home 非活动导航使用 `inert`/`aria-hidden`，不会残留隐藏的键盘焦点；
- Games lightbox 使用原生 modal dialog，控件始终存在，具有可见焦点、初始焦点和关闭后焦点恢复；
- 本地浏览器已确认首页初始只引用一张壁纸、未提前初始化 WebGL，以及 gallery 打开/关闭焦点流程。这里是针对当前实现的手动 smoke，不等同于 Playwright 自动回归套件。

测试缺口：

- 首页、内容页和 Admin 的最小 Playwright smoke；
- backup last-success healthcheck/告警。

## Tools 五模式移植（分支实现，2026-09-02）

`/tools` 复用所有者博客 `/notes/` 的界面，而不是另行设计：Minimal、Minimal+、Compact、Extended、Thumbnail 五种模式，透明蓝色背景、分类色块、实时搜索、AND 多条件筛选、上下分页和 25/50/All 每页数量均保留。控件使用 React 状态替代 Hexo 的 DOM 重排和 PJAX 初始化；偏好保存在独立的 `kita-tools-archive` localStorage key，`?view=` 可覆盖默认展示模式。样式全部限制在 Tools 类名下，不修改站点或 Reviews 的主题。

必要的数据适配：

- 原文章分类对应现有 Tools category；原标签筛选对应 URL 来源站点筛选，不新增数据库 tags 字段；
- 原阅读时长与作者列改成 External link 与 Source，不虚构工具的阅读时长；
- 默认排序尊重 CMS `sortOrder`（Curated order），另保留按新旧日期和标题排序；
- getter 使用 `pagination: false` 读取全部工具，保留 `overrideAccess: false`；原来仅取 20 条无法支持完整客户端搜索与分页。当前小型目录采用与博客相同的全量客户端模式，规模显著增长后再评估服务端检索；
- 四类工具使用博客授权图片作为分类装饰封面，不代表实际软件截图，也没有引入 Media/schema migration；
- `/tools/preview` 只在 development 开放，提供 30 条展示样例用于测试分页；production 返回 404，正式 `/tools` 仍只显示 Payload 数据，查询错误仍交给 error boundary。

源码集中在 `src/features/tools/`，资源来源记录在 `THIRD_PARTY_NOTICES.md`。本次不写入开发或生产内容，不执行 migration；Reviews 与 Tools 在同一 PR 中提交，不合并、不部署。

验证：2026-09-02 同步 PR #25 后重新运行 137 个 Vitest 和 4 个 backup shell 场景通过；`pnpm check` 与 `SKIP_ENV_VALIDATION=true pnpm build` 通过，包含超过 20 篇 Review 的导航回归测试。此前本地浏览器检查五模式、分类与来源筛选、全角关键词、清空/空结果、标题排序、25/All、第二页及 390px 布局；保留键盘焦点和 reduced-motion 支持。生产预渲染的 preview 包含 404 边界、不含样例工具。手机高级选项只修正原版负边距造成的越界，未重设整体视觉。

本次读取真实本地 `/tools` 返回 200，但当前开发数据库没有 Tools 条目，页面正确显示空状态；样例只出现在 `/tools/preview`。从 Tools 客户端导航到 Reviews 后 Tools 根样式容器消失，Reviews 页面正常渲染。未据此推断生产内容数量。

## 当前待办

### 当前收尾

- [x] 根 README、Home/About 定位与公开 metadata；
- [x] 清理公开页面的 placeholder/draft 工程文案；
- [x] 移除 repository development seed、运行时静态 fallback 和 Games gallery 中针对商业游戏 archive 的专用入口；
- [x] 统一列表 empty、站点 error/not-found/loading，并对详情查询做请求级去重；
- [ ] 从 Production Games 删除未经授权的下载入口和测试说明，并确认公开 API 不再返回；
- [x] 恢复 PR #24 之前的仓库静态背景与兼容封面，并保留现有 WebP 性能路径；
- [x] 记录恢复视觉的 Git 来源和项目所有者对 Kita 的使用授权，同时不将其误写为通用开源许可；
- [ ] 用真实 Game 内容替换演示条目，并清理无效发布日期；
- [ ] 将 Production Games 的 R2 Media 替换为原创或明确授权素材，逐条复核外部链接；
- [ ] 确认 Production Reviews 为原创或已获公开授权；
- [ ] 修正 Production Tools 的标题格式与描述；
- [x] PostgreSQL 16 完整 fresh migration、再次运行无待执行 migration 和 Media-only schema smoke；
- [x] 真实 Payload anonymous published/authenticated Reviews access smoke；
- [x] 首页资源按需加载、reduced motion、Home 导航与 Games gallery 键盘焦点收尾；
- [x] DB-backed `/api/health`、安全 503 响应与 Compose `web` healthcheck；
- [x] `codex/portfolio-v1-readiness` 通过 PR #24 合并到 `main`；
- [x] 合并部署后验证 `/api/health` readiness；
- [x] 提交并 push `codex/reviews-blog-experience`，通过本地 test/check/build；
- [ ] 为 Reviews 与 Tools 分支创建 Draft PR，并通过远端 required check；
- [ ] Reviews 与 Tools PR 合并部署后验证列表、详情、主题、目录、随机入口、五种工具视图、Giscus 和首条 Discussion；
- [ ] 完成内容清理后验证 Games、Reviews、Tools、Media URL 和 Redeploy 持久性；
- [ ] 最终 Production 截图与准确发布材料。

### 随后独立完成

- [x] Tools、Reviews、Games 统一为 CMS-only；空数据与查询错误不再被演示内容掩盖；
- [ ] 明确 Review 是否必须关联 Games 馆藏中的条目；只有业务规则成立后才做 relationship migration。

### 低优先级/条件触发

- [ ] 清理真实日期后再评估 `releaseDate` date migration；
- [ ] 出现误删痛点后再评估 Trash；
- [ ] 出现多人编辑后再评估角色和 drafts/versions；
- [ ] 数据价值提高后安排 restore/DR 演练和 last-success 监控；
- [ ] OpenList storage 定型后补 data backup。

## 当前不做

不因为“后端看起来简单”而引入 Redis、Prisma、微服务、Kubernetes、自建上传服务、大型监控平台、复杂角色系统或深度 OpenList API 集成。

## 下一步

当前分支已推送，下一步创建 Reviews 与 Tools Draft PR；required check 和人工 review 通过后，另获明确授权才合并部署。Production 内容和 Media 清理由项目所有者确认，部署后核验页面与 Redeploy 持久性；首次真正留言为对应 pathname 创建 GitHub Discussion 时，再核验自定义 reaction、光暗主题和移动端。Review–Game relationship 只有在真实内容证明一 Review 必属一 Game 时才实施。
