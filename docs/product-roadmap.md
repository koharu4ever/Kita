# Kita 产品路线

> 最后核对：2026-08-12

## 产品定位

Kita 是一个具有视觉小说氛围的个人内容站：

- Home 负责视觉和导航；
- About 解释作者与项目；
- Tools 展示个人工具箱；
- Reviews 承载长篇评论；
- Games 作为视觉馆藏和资料入口；
- OpenList 只提供低耦合的附属 archive。

技术底座已经足够。下一阶段成功标准不是增加框架，而是让真实内容、错误状态和项目叙述完整。

## 已完成的产品/后台能力

- Home、About、Tools、Reviews、Games 路由和视觉骨架；
- Payload Admin 与 Users/Media/Tools/Reviews/Games；
- Reviews/Games 列表和详情的真实数据链路；
- Games Media/R2 封面；
- Games archive 公开链接；
- Docker/Coolify Production、CI 和 database backup 基础。

## 当前内容缺口

- About 仍需替换 placeholder；
- Reviews 需要录入真实文章；
- Games 需要以真实资料替换 placeholder 字段；
- Tools 需要决定由 CMS 维护还是保留内置 fallback；
- 前台可见的 draft/implementation 文案需要清理；
- error、empty、not-found 和 loading 体验尚需统一；
- 根 README 和作品集/简历描述尚需与真实实现对齐。

## 推荐顺序

### 1. 小型后端质量 PR

完成 slug/URL 验证、显式写权限和共用 rich-text 配置。范围保持小，不引入新服务。

### 2. 数据链路集成 smoke

使用隔离 PostgreSQL 验证完整 migration 和真实 Payload published access。不要操作现有 Production/本地数据 Volume。

### 3. 真实内容

优先完成 About、至少一篇真实 Review、Games 的真实元数据和 Tools 决策。删除前台 placeholder。

### 4. 产品状态

补统一的 empty/error/not-found 行为和关键页面 smoke。再评估 Playwright。

### 5. 项目展示

编写根 README、架构图、Production 截图和准确简历描述。只描述实际实现，不声称高并发、微服务或完整灾备。

## 延期项

在出现真实需求前不做：

- Payload drafts/versions、Trash、复杂角色系统；
- Reviews 与 Games 强关系重构；
- 自建搜索、评论系统、用户注册；
- Redis、Prisma、微服务、Kubernetes；
- OpenList 深度 API 集成或前端 fork；
- 大型监控平台；
- 为了“完整”而新增页面或内容类型。

## 选择下一项工作的标准

优先级从高到低：

1. 会导致数据错误、安全边界不清或部署失败的问题；
2. 阻止真实内容录入和展示的问题；
3. 用户能直接感知的错误/空状态和可访问性；
4. 能提升作品集可解释性的测试和文档；
5. 仅在出现痛点后才引入的新能力。

每个 PR 都应有单一目标、明确验收和可回滚边界。
