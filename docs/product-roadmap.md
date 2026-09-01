# Kita 产品路线

> 最后核对：2026-09-01

## 产品定位

Kita 是一个具有视觉小说氛围的自托管游戏目录与评论发布平台：

- Home 负责视觉和导航；
- About 解释产品与实现方式；
- Tools 展示个人工具箱；
- Reviews 承载长篇评论；
- Games 作为视觉馆藏和资料入口。

站主通过 Payload Admin 管理 Games、Reviews 和 Media；访客浏览已经发布的公开内容。技术底座已经足够，`v1.0` 成功标准不是增加框架，而是让真实内容、错误状态、隔离验证和项目叙述完整。

## 已完成的产品/后台能力

- Home、About、Tools、Reviews、Games 路由和视觉骨架；
- Payload Admin 与 Users/Media/Tools/Reviews/Games；
- Reviews/Games 列表和详情的真实数据链路；
- Games Media/R2 封面；
- Docker/Coolify Production、CI 和 database backup 基础。

## 当前内容缺口

- Reviews 需要录入真实文章；
- Games 需要以真实资料替换 placeholder 字段；
- 公开 archive URL 和视觉素材需要完成来源/授权核对；
- Tools 需要决定由 CMS 维护还是保留内置 fallback；
- 最终 Production 截图和发布文案尚需与真实内容对齐。

根 README、Home/About 定位、公开 metadata 和开发期文案已在 2026-08-31 的 portfolio positioning 工作中收敛；最终 Production 截图留到真实内容完成后获取。

## 推荐顺序

### 1. 后端内容边界（已完成）

slug/URL/必填文本验证、显式写权限和共用 rich-text 配置已经收敛到 Payload collection 边界，没有引入新服务。

### 2. 仓库入口与公开定位（已完成）

根 README、Home/About 产品定义、页面 metadata 和公开开发期文案已经统一。最终截图必须在真实内容收口后从 Production 获取，不使用 mockup。

### 3. 产品状态（已完成）

Games、Reviews 和 Tools 具有明确 empty state；站点路由统一处理 error/not-found/loading；详情页通过 React request cache 让 metadata 与页面共享一次 Payload 查询，不引入跨请求缓存。

### 4. 数据链路集成 smoke（已完成）

无 Volume 的一次性 PostgreSQL 16 已验证完整 fresh migration、再次运行时无待执行 migration、Media-only schema 和 Reviews 的 anonymous published/authenticated write 边界；同一路径进入 CI。它不代表带数据升级、down 或 restore 已验证。

### 5. 首页性能与基础可访问性（已完成）

首页背景改用体积更小的 WebP，并从一次挂载全部壁纸改为随轮播按需挂载；rain WebGL 延迟到对应区块进入视口。Reduced Motion 会停止自动换图和持续动画，Home 非活动导航退出焦点顺序，Games gallery 使用原生 modal dialog 完成初始焦点、关闭后恢复和始终可见的键盘控件。没有引入 UI 框架、图片服务或额外运行时。

### 6. Readiness health

增加一个只验证 Next/Payload 与 PostgreSQL 可达性的轻量 `/api/health`，并让 Compose `web` 使用 Node 内置 `fetch` 探测。它不扩张为 R2、backup、OpenList 或完整监控平台。

### 7. 真实内容

优先完成至少一篇真实 Review、Games 的真实元数据、Tools 决策和素材授权核对。删除前台 placeholder。

在真实 Review 和 Games 清理后，再决定 Review 是否必须关联一个馆藏 Game。只有规则成立时才增加 relationship；不为了展示数据库关系强制耦合内容模型。

### 8. 项目展示

在真实内容收口后补 Production 截图和准确发布/简历描述。只描述实际实现，不声称高并发、微服务或完整灾备。

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
