# Kita 当前项目状态

> 最后核对：2026-09-01
>
> 本文是可变事实和待办的唯一来源。操作步骤见 [文档入口](./README.md) 中的专题文档。

## 代码与 Git

本轮文档整理基线：

```text
main: 1fa2ab4 (PR #24 merge)
workspace: C:\dev\Kita
```

开始新任务时必须重新查询 Git；上述 SHA 是 2026-09-01 的基线证据，不代表永久 HEAD。

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

最近文档记录的代码基线包含字段 validation、collection access/config、Dev Container workspace guard、CMS-only getter 与 readiness response 等 Vitest，以及 4 个 backup shell 场景。2026-09-01 已在 Dev Container 重新验证 115 个 Vitest、4 个 backup shell 场景、5 个真实 PostgreSQL/Payload integration 测试、`pnpm check` 和 `SKIP_ENV_VALIDATION=true pnpm build` 全部通过；本地浏览器同时确认 Home、About、Games、Reviews 的桌面与窄屏状态和 Review 兼容封面，控制台无错误或警告。此前还验证了未发布 Game 的品牌化 404。减少的测试来自连同实现一起移除的 development seed/fallback，不代表当前行为失去覆盖。`SKIP_ENV_VALIDATION` 与 CI 一致，只用于受控 build；Production 运行时仍强制使用完整 R2 配置。

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
- [x] push `codex/portfolio-v1-readiness`、创建 Draft PR，并通过远端 required check；
- [x] 合并部署后验证 `/api/health` readiness；
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

下一步按固定顺序执行：先由项目所有者在本地确认已恢复的旧视觉效果；随后在 Payload Admin 完成上述 Production 内容与 Media 清理，做一次公开 API/页面/Redeploy smoke，最后采集 Production 截图。Review–Game relationship 只有在真实内容证明一 Review 必属一 Game 时才实施。
