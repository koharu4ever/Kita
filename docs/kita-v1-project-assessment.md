# Kita V1 项目完成度与面试价值评估

> 评估日期：2026-07-01
> 评估对象：当前本地工作区、`main` 分支、已知生产部署流程与现有项目文档

## 1. 结论

Kita 已经可以被定义为一个**功能完整的本地 V1 候选版本**，不需要继续增加搜索、评论、登录、收藏、复杂媒体库或新的 UI 模板。

但当前还不能严谨地说“V1 已经正式发布完成”，原因不是核心功能缺失，而是以下发布收口尚未完成：

1. Games 的 Payload 数据链路仍在本地工作区，尚未 commit、push 和部署。
2. Games Collection 尚未生成生产 migration，直接推送会使生产数据库缺少 `games` 表。
3. About、Games mock 和 Tools 仍存在明确的 placeholder / draft 文案。
4. 仓库根目录没有面向面试官的 `README.md`。

因此当前状态可以概括为：

```text
本地功能完成度：已经达到 V1
GitHub main 完成度：尚未包含最新 Games 数据链路
生产版本完成度：尚未包含 Games Collection 与正式内容
面试投递状态：可以准备，但建议完成最后一次发布收口后再正式展示
```

完成本文列出的四项阻断任务后，应当冻结 V1，不再继续扩展功能。

## 2. 项目定位

Kita 是一个具有视觉小说氛围的个人内容站，主要包含：

- 首页沉浸式视觉与雨滴玻璃效果。
- Reviews 文章列表与富文本详情页。
- Games 图片墙、全屏查看器与游戏详情页。
- Tools 资源与工具集合。
- About 静态介绍页。
- Payload CMS 管理后台。
- PostgreSQL 数据库。
- Docker、Coolify 与 VPS 部署链路。

它适合作为个人全栈作品集，不需要包装成大型商业平台。

## 3. 当前技术栈

```text
Next.js 16 App Router
React 19
TypeScript
Tailwind CSS
Payload CMS 3
Payload Local API
Payload Lexical Rich Text
PostgreSQL 16
Zod / @t3-oss/env-nextjs
Docker / Docker Compose
Coolify / Cloudflare / VPS
pnpm
```

项目已经覆盖了一个个人全栈项目的重要环节：

```text
页面设计
-> 数据模型
-> CMS Admin
-> PostgreSQL
-> server getter
-> mapper / DTO
-> Server Component
-> Docker build
-> migration
-> VPS deployment
```

## 4. 功能完成度

### 4.1 首页 `/`

已完成：

- 响应式全屏视觉。
- 背景轮播。
- WebGL 雨滴玻璃层。
- 桌面设备能力判断与 reduced-motion 处理。
- 移动端静态降级。
- 首屏导航与滚动后右侧浮动导航。
- 手机端浮动导航显示。

结论：V1 已完成，不应继续重写雨滴引擎。

### 4.2 Reviews `/reviews` 与 `/reviews/[slug]`

已完成：

- Payload Reviews Collection。
- draft / published 状态。
- Lexical Rich Text 正文。
- Local API server getter。
- Payload document mapper。
- 稳定的前端 `ReviewPreview` 数据合同。
- 开发 mock fallback 与生产错误区分。
- 列表页、详情页、动态 metadata。
- Review 生产 migration。
- 生产 Admin 内容录入与线上显示验证。
- 日期、评分和阅读时间格式化。

结论：这是项目中最完整、最适合面试讲解的数据链路。

### 4.3 Games `/games` 与 `/games/[slug]`

本地已完成：

- 基于原 Vercel Image Gallery 模板的响应式照片墙。
- 查询参数驱动的全屏 lightbox。
- 左右切换、键盘切换、缩略图导航、下载和详情入口。
- 克制的游戏详情页。
- `GameDetail` 前端数据合同。
- public 图片资源注册表。
- `coverKey -> cover` 解析。
- Payload Games Collection。
- Payload document mapper。
- Local API server getter。
- 列表和详情 route 与 mock 解耦。
- 开发空库 fallback。
- 动态 metadata。

尚未完成：

- Games migration。
- Git commit / push。
- 生产部署。
- 生产 Admin 正式 Game 内容。

结论：代码层面的 V1 已完成，但发布层面尚未完成。

### 4.4 Tools `/tools`

已完成：

- Payload Tools Collection。
- Local API getter。
- mapper 与 `ToolkitItem` 前端类型。
- 开发 fallback。
- 桌面右侧导航。
- 移动端顶部响应式导航。
- 生产数据链路与部署验证。

仍需收口：

- Footer 仍显示 `STATIC FRONT-END DRAFT`。
- fallback 文案需要确认 UTF-8 显示。
- 正式展示时应确保至少有几条真实工具数据。

结论：功能完成，只需清理展示文案。

### 4.5 About `/about`

已完成：

- 独立视觉页面。
- 响应式布局。
- 页面导航。

仍需收口：

- 页面明确写着 `The current text is only a placeholder`。
- 当前内容在解释开发状态，而不是介绍项目作者、目标或技术方向。

结论：页面结构完成，内容尚未达到面试展示标准。

### 4.6 Payload Admin 与数据库

已完成：

- Users、Tools、Reviews Collection。
- 本地 Games Collection。
- PostgreSQL 连接。
- Payload 类型生成。
- Payload Admin。
- Reviews Rich Text 编辑器与 import map。
- 生产 migration 启动流程。
- Docker entrypoint 自动执行 migration。

尚未完成：

- Games 生产 migration。
- 生产 Games 数据录入。

## 5. 架构完成度

当前目录结构基本符合 feature-first 与 server boundary 原则：

```text
src/app       路由、layout、metadata
src/features  页面功能、组件、前端类型、mapper
src/server    Local API getter 与服务端边界
src/payload   Collection 与 Payload 类型
src/config    环境变量
src/migrations 生产数据库结构迁移
```

Reviews 与 Games 的标准链路分别为：

```text
Payload Review
-> getReviews / getReviewBySlug
-> mapReviewDocumentToReviewPreview
-> ReviewPreview
-> Reviews UI
```

```text
Payload Game
-> getGames / getGameBySlug
-> mapGameDocumentToGameDetail
-> resolveGameCover
-> GameDetail
-> Games UI
```

优点：

- UI 不直接认识 Payload document。
- 数据库字段调整集中在 mapper。
- mock 只作为开发 fallback。
- Local API 不进入浏览器 bundle。
- Collection、查询、转换和展示职责清晰。

这个架构已经足以作为初级或初中级全栈面试项目，不需要再人为增加 Repository 接口或额外 ORM。

## 6. 工程与部署完成度

已完成：

- ESLint。
- Prettier。
- TypeScript strict mode。
- 环境变量校验。
- Next.js typed routes。
- pnpm lockfile。
- Docker 多阶段构建。
- PostgreSQL Compose 服务。
- Payload migration。
- Coolify 部署。
- Cloudflare 域名与 HTTPS。

最近验证：

- `pnpm lint`：2026-07-01 通过。
- `pnpm typecheck`：最新 Games 数据链路通过。
- `pnpm build`：最新 Games 数据链路通过。
- `/games`：本地返回 200。
- `/games/sea-side-fragment`：本地返回 200。
- `/api/games`：本地 Collection 路由已注册。

缺口：

- 没有根目录 README。
- 没有 GitHub Actions CI。
- 没有自动化测试。
- 没有明确记录生产数据库恢复演练。

其中 README 是面试前必须完成；CI 和测试属于推荐项，不应阻止 V1 发布。

## 7. 当前 Git 与发布状态

当前 `HEAD` 与 `origin/main` 都是：

```text
ea3eacd fix: show floating navigation on mobile
```

这说明最新 Games 数据链路仍未进入 GitHub。

当前工作区包含：

- Games 前端详情页调整。
- Games 图片注册表。
- Games Collection。
- Games mapper。
- Games server getter。
- Games route 数据接入。
- Payload 生成类型。
- Games 数据流文档。

同时还有与本次 Games 提交无关的本地文档，提交时必须精确选择文件，不能使用无差别 `git add .`。

重要风险：

> 不能只 push Games Collection 代码而不生成 migration。

生产容器启动时会执行 `payload migrate`。如果代码查询 `games` collection，但生产数据库没有对应 migration，生产 `/games` 会因为缺少表而失败。

## 8. 面试价值评估

### 可以展示的能力

1. 能从视觉目标出发完成真实页面，而不是只拼通用 Dashboard。
2. 能使用 Next.js App Router 组织 Server Component 与动态 route。
3. 能设计 Payload Collection 并使用 PostgreSQL。
4. 能解释 Local API 与 REST API 的区别。
5. 能通过 mapper 隔离 CMS document 与 UI view model。
6. 能处理 Rich Text、动态 metadata、notFound 和发布状态。
7. 能编写 Docker 多阶段构建与生产 entrypoint。
8. 能用 migration 管理生产数据库结构。
9. 能处理 Coolify、Cloudflare、域名、HTTPS 和环境变量。
10. 能解释移动端降级、WebGL 性能取舍和模板改造边界。

### 面试官可能追问的问题

- 为什么选择 Payload，而不是自己写 REST API？
- 为什么页面不直接使用 Payload document？
- mapper 解决了什么问题？
- Local API 为什么只能放在服务端？
- 开发数据库自动同步与生产 migration 有什么区别？
- 为什么 Games 图片使用 `coverKey`，而不是 Media Collection？
- 生产数据库查询失败时为什么不能回退假数据？
- 为什么移动端禁用雨滴效果？
- 为什么 Games lightbox 保留原模板结构？
- 如果访问量增加，当前架构首先需要改哪里？

这些问题都可以直接使用项目中的真实决策回答，不需要背虚构架构。

### 不应该夸大的部分

面试中不要把 Kita 描述为：

- 高并发系统。
- 企业级权限平台。
- 完整社交产品。
- 自研 CMS。
- 拥有完整测试体系的生产 SaaS。

更准确的表达是：

> 一个已经部署的 Next.js 全栈个人内容站。我使用 Payload CMS 和 PostgreSQL 管理内容，通过 Local API、server getter 和 mapper 保持前后端数据边界，并使用 migration、Docker 与 Coolify完成生产部署。

## 9. 面试前必须完成的四项任务

### P0-1：清理明显占位内容

- About 改成真实个人介绍与项目目标。
- Tools 删除 `STATIC FRONT-END DRAFT`。
- Games 删除 `Placeholder Studio`、`VNDB placeholder` 和解释模板实现的 note。
- 确认页面不存在乱码。

### P0-2：完成 Games 发布链路

1. 确认 Games schema 不再调整。
2. 创建 Games migration。
3. 检查 migration 内容。
4. 运行 typecheck 与 production build。
5. 精确提交 Games 相关文件。
6. push GitHub。
7. Coolify redeploy。
8. 在生产 Admin 录入至少一条 published Game。
9. 验证 `/games`、lightbox 和 `/games/[slug]`。

### P0-3：新增根 README

README 至少需要：

- 项目一句话说明。
- 在线地址。
- 一张首页截图和一张后台/内容页截图。
- 技术栈。
- 功能列表。
- 数据流图。
- 本地启动方式。
- 环境变量说明。
- migration 与部署说明。
- 关键设计取舍。

### P0-4：最终生产验收

检查桌面和手机：

```text
/
/reviews
/reviews/[slug]
/games
/games/[slug]
/tools
/about
/admin
```

同时检查：

- 所有导航链接。
- 外部链接。
- 404。
- 页面 title 和 description。
- 手机横向溢出。
- 数据库内容为空时的行为。
- Coolify logs 与 migration status。

## 10. 推荐但不阻止 V1 的任务

这些可以在投递后继续补，不应拖延发布：

- GitHub Actions：lint、typecheck、build。
- mapper 的少量单元测试。
- 一条 route smoke test。
- Open Graph 图片。
- sitemap 与 robots。
- 数据库备份恢复演练。
- 更完整的空状态。

## 11. 简历描述建议

可以写成：

> 使用 Next.js、Payload CMS 与 PostgreSQL 构建并部署个人内容站，完成 Reviews、Games 与 Tools 模块的数据建模、Admin 内容管理和服务端渲染。

> 通过 Payload Local API、server getter 与 mapper 将 CMS document 转换为稳定的前端 view model，保持 UI 与数据库结构解耦。

> 使用 Payload migration、Docker 多阶段构建、Coolify 与 Cloudflare 完成生产数据库迁移、容器部署、域名和 HTTPS 配置。

不要在简历里列出还没有实现的评论、搜索、登录或完整媒体上传。

## 12. 最终判断

Kita 已经不是练习片段，而是一个有真实前端、CMS、数据库和部署链路的全栈项目。

作为面试项目：**可以。**

作为今天立刻发送给面试官的最终版本：**建议先完成四项 P0 收口。**

完成后，Kita V1 可以正式宣布结束。后续工作应该转向 README、简历表达和面试讲解，而不是继续增加功能。
