# Kita 产品路线

> 最后核对：2026-09-01
>
> 本文只维护稳定的产品方向和验收原则；实际完成度见
> [当前项目状态](./current-project-status.md)。

## 产品定位

Kita 是一个具有视觉小说氛围的自托管游戏目录与评论发布平台：

- Home 负责视觉和导航；
- About 解释产品与实现方式；
- Tools 展示个人工具箱；
- Reviews 承载长篇评论；
- Games 作为视觉馆藏和资料入口。

站主通过 Payload Admin 管理 Games、Reviews 和 Media；访客只浏览已发布内容。Kita 采用 Next.js、Payload、PostgreSQL 与 R2 组成的 focused monolith。`v1.0` 的目标是把真实内容、可靠状态、验证证据和项目叙述收完整，而不是继续增加框架或服务。

## v1.0 验收标准

### 真实内容

- 公开 Games、Reviews 与 Tools 均是有意保留的真实内容，不出现 placeholder 或为了撑满页面而存在的 fixture。
- 公开 archive、商店和参考链接均有明确用途，不提供未经确认授权的商业内容下载。
- Production Payload Media 逐项完成来源和公开使用边界核对；同一资产只上传一次并复用 relationship。
- Repository 静态视觉为项目原创或具有可验证许可，第三方归属集中记录在根目录 `THIRD_PARTY_NOTICES.md`。

### 产品可靠性

- 内容列表具有 empty state，数据读取失败进入安全的 error boundary，未知详情显示品牌化 404，路由切换提供轻量 loading。
- 公共 getter 保留 Payload access control，并通过 mapper/DTO 隔离 CMS document shape。
- 新数据库可顺序执行全部 migration；关键 published/draft 和匿名/登录写权限在一次性 PostgreSQL 中得到验证。
- Home 的背景加载、Reduced Motion 与主要键盘操作不会阻碍内容浏览。
- `/api/health` 只验证应用与 PostgreSQL readiness，不泄露内部配置，也不冒充完整监控系统。

### 项目展示

- 根 README 准确说明产品、架构、主要取舍、运行方式、验证边界和已知限制。
- 最终截图来自真实 Production 内容，不使用 mock 数据冒充上线状态。
- 简历和项目文案只描述实际实现，不声称高并发、微服务、完整灾难恢复或尚未验证的能力。
- `pnpm test`、`pnpm test:integration`、`pnpm check` 与 production build 在 Dev Container 和 CI 中可重复执行。

## 后续工作流

### 1. 收口 Production 内容

先清理 Games 的 placeholder、未确认 archive 链接和不适合公开展示的 Media，再完成至少一篇可以公开说明来源与作者关系的 Review。代码仓库保持 CMS-only，不重新加入 runtime fallback 或公开 seed route。

### 2. 核对最终数据链路

在 Production 内容完成后，逐页验证列表、详情、Media custom domain、匿名访问和一次 Redeploy 后的持久性。只读检查不能代替备份，也不在该步骤顺手改 Cloudflare、Coolify 或数据库结构。

### 3. 完成作品集材料

从最终 Production 采集少量有代表性的桌面/窄屏截图，更新 README 和简历描述。截图只证明可见产品状态；migration、权限和恢复边界仍由测试与文档证据说明。

### 4. 根据真实需求决定关系模型

只有当内容规则明确要求“一篇 Review 必须属于 Games 馆藏中的某个条目”时，才增加 Review–Game relationship。若评论可独立存在，就维持当前松耦合模型。

## 延期项

在出现真实需求前不做：

- Payload drafts/versions、Trash、复杂角色系统；
- Reviews 与 Games 强关系重构；
- 自建搜索、评论系统、用户注册；
- Redis、Prisma、微服务、Kubernetes；
- OpenList 深度 API 集成或前端 fork；
- 大型监控平台；
- 多浏览器 E2E 或大规模视觉回归矩阵；
- 为了“完整”而新增页面或内容类型。

## 选择下一项工作的标准

优先级从高到低：

1. 会导致数据错误、安全边界不清或部署失败的问题；
2. 阻止真实内容录入和展示的问题；
3. 用户能直接感知的错误、空状态和可访问性；
4. 能提升作品集可解释性的测试和文档；
5. 仅在出现明确痛点后才引入的新能力。

每个 PR 都应有单一目标、明确验收和可回滚边界。完成状态只更新 `current-project-status.md`，避免路线图与事实页互相漂移。
