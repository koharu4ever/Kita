# Kita 当前架构

> 最后核对：2026-09-03
>
> 本文只描述当前结构与长期边界；完成度和待办见 [current-project-status.md](./current-project-status.md)。

## 一句话定义

Kita 是一个使用 Next.js 16、Payload CMS 和 PostgreSQL 构建的自托管游戏目录与评论发布平台。Payload 提供 Admin、内容模型和 Local API；Next.js server 层读取并映射数据；feature 组件消费页面 DTO，正文仍保留 Lexical JSON 契约；生产通过 Docker Compose 和 Coolify 运行。

## 先分清三个层次

| 层次       | 包含什么                                                                            | 不要混淆的概念                                                                          |
| ---------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 产品       | Games 馆藏、Reviews 文章、Tools 资源目录，Home/About 提供导航与介绍                 | 五个页面不是五个独立后端服务。                                                          |
| 应用       | 一个 Next.js 应用，内部集成 Payload；PostgreSQL 保存数据，R2 保存生产图片           | Payload Admin 是编辑入口，Local API 是服务端代码调用接口，不需要额外启动一台 CMS 服务。 |
| 交付与开发 | Docker/Compose、Coolify、GitHub Actions；本地另有 Dev Container 与 Docker-in-Docker | 编辑器、Codex CLI、本地 Docker daemon 不属于访客请求经过的生产链路。                    |

主要名词可以按下面理解：

- **Collection**：Payload 中一个内容模型的配置，定义字段、验证和访问规则，不只是数据库表名。
- **getter**：负责一次公开数据查询的函数，不负责画页面。
- **mapper / DTO**：把 CMS 返回的数据整理成页面需要的形状。例如页面要封面的 URL、alt 与尺寸，不需要知道数据库外键列名。
- **Local API**：在 Next.js 服务端进程内调用 Payload 的 API。这里的 local 不表示“只能在开发电脑使用”；生产同样使用。
- **Lexical JSON**：编辑器的结构化正文，包含段落、标题、链接和插图节点；不是直接存储任意 HTML。
- **migration**：随代码提交的数据库结构演进，不是向网站添加文章。

## 运行拓扑

```text
Browser
  -> Next.js routes / React UI
       -> server getter
            -> Payload Local API (overrideAccess: false)
                 -> PostgreSQL 16
                 -> Media metadata / relationship
                      -> local .payload-media (development)
                      -> Cloudflare R2 (production)
```

生产 Compose 另外运行 PostgreSQL backup sidecar，将 custom-format dump 上传到独立私有 R2 bucket。Media bucket 与 database backup bucket 不共享用途或凭据。

上述箭头表示职责关系，不意味着每个箭头都是 HTTP 请求。Server getter 调用 Payload Local API 不绕行本站公开 REST API；浏览器加载 R2 图片和 Giscus iframe 则属于独立网络请求。原图和生成尺寸是对象存储文件，Media 的描述、文件名等记录保存在数据库中。

## 目录职责

```text
src/app/          路由、layout、Payload Admin/API 接入和页面组合
src/features/     页面业务、稳定 DTO、mapper、组件与 feature 测试
src/server/       Payload client 与 server getter
src/payload/      Collections、access helpers 和 generated types
src/migrations/   可审查的生产 schema migration
src/config/       环境变量、站点 metadata 与 Media storage 配置
src/testing/      跨 feature 的测试 fixture
docker/           PostgreSQL backup sidecar
public/           仍由前端直接使用的版本化静态资源
```

放置新代码时按依赖方向判断：

```text
app -> server -> Payload/PostgreSQL
app -> features
server -> feature mapper / DTO
feature component -> feature DTO
```

页面组件不应直接查询 Payload，视觉组件不应知道数据库字段，collection 配置不应依赖前端组件。

## 内容数据流

Tools、Reviews 和 Games 使用同一种结构：

```text
Payload document
  -> src/server/<feature>/get-*.ts
  -> src/features/<feature>/utils/map-*.ts
  -> feature DTO
  -> route / page component
```

Getter 明确使用 `overrideAccess: false`。匿名访问只读取 published Reviews/Games；查询失败在所有环境都会抛错，由站点 error boundary 处理。空 Collection 返回真实空结果，由页面 empty state 解释；Payload 是开发与生产内容的共同事实源，不再维护运行时静态 fallback。

Games getter 使用 `depth: 1` 解析必填的 `cover` Media relationship。Mapper 从 Media 的 display/original 元数据构造封面 DTO；Game 表不再保存重复的 cover URL、alt、width 或 height。

### 沿一篇文章追踪一次读取

以公开 `/reviews/<slug>` 为例：

1. [详情 route](<../src/app/(site)/reviews/[slug]/page.tsx>) 读取 URL 中的 slug。路由使用 `force-dynamic`；页面与 metadata 通过 React `cache` 复用当前请求中的详情查询，这不是 Redis 或跨请求永久缓存。
2. [Reviews getter](../src/server/reviews/get-reviews.ts) 获取 Payload client，按 slug 与 published 条件查询，保留 `overrideAccess: false`。找不到记录返回 `undefined`；数据库异常继续抛出。
3. [Reviews Collection](../src/payload/collections/reviews.ts) 对匿名读取施加 published 规则。前台少显示一个按钮不等于权限控制；直接访问 API 仍应受 Collection 规则约束。
4. [mapper](../src/features/reviews/utils/map-review-document-to-review-preview.ts) 将字段映射成 [ReviewPreview DTO](../src/features/reviews/types/review-preview.ts)。正文保留为 Lexical 数据，不在此把它转换成 HTML 字符串。
5. route 对不存在的内容调用 `notFound()`；正常结果交给 [详情组件](../src/features/reviews/components/review-detail-page.tsx)。目录由正文 heading 派生，正文经 [共享渲染器](../src/features/content/components/content-rich-text.tsx) 输出。
6. 主题、阅读进度和评论等客户端组件在对应页面内工作。Giscus 评论属于 GitHub Discussions，不经过这次 Payload 文章查询。

上一篇/下一篇会另外获取已发布文章集合；不能把详情的请求级去重说成“整页只会查询一次数据库”。同样，保留 Lexical 正文意味着更换 CMS 时仍要处理编辑器数据兼容，DTO 并未消除所有迁移成本。

### 从编辑到公开，是另一条流程

```text
站主登录 Admin
  -> 编辑字段与 Lexical 正文
  -> Save
  -> Payload 写权限 + 字段校验
  -> PostgreSQL 保存文档
  -> published 文档进入公开读取链路

上传 Media
  -> 校验文件并生成图片尺寸
  -> 开发文件目录 / 生产 R2 + 数据库元数据
  -> 文章正文或 Game 封面引用 Media
```

上传图片与保存文章不是一个原子操作：放弃编辑文章，不会自动删除先前上传的 Media。`draft` 是文档状态字段，不是版本系统；修改 published 文档并保存会直接更新公开内容。日期不是定时发布任务，Save 不是自动保存。详细操作与误删边界只维护在 [内容指南](./payload-content-and-media.md)。

## 数据模型与文件归属

| 内容                 | 保存在哪里                       | 关系与限制                                                                           |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| 用户与登录数据       | PostgreSQL，由 Payload auth 管理 | 当前是可信站主模型，不是完整的多角色组织系统。                                       |
| Game 资料与正文      | PostgreSQL；正文为 JSONB         | 必填 `cover` 引用 Media；正文也可插入 Media。                                        |
| Review 资料与正文    | PostgreSQL；正文为 JSONB         | `gameTitle` 是文本，不是 Game 外键；封面为 `coverImage` URL/path，正文可引用 Media。 |
| Tool 条目            | PostgreSQL                       | 外链与纯文本描述；没有文章正文或 draft 状态。                                        |
| Media                | 数据库元数据 + 外部图片文件      | 开发写 `.payload-media`，生产写 R2；同图可以复用，但没有内容哈希去重承诺。           |
| 界面壁纸、声音、装饰 | 仓库 `public/`，随镜像发布       | 不自动出现在 Payload Media 中。                                                      |
| 评论                 | GitHub Discussions               | 由 Giscus 按 pathname 对应；修改文章 slug 需考虑评论地址。                           |

数据库 dump 只备份数据库，不包含上述对象存储与仓库之外的全部文件。数据库事务也不能撤销已完成的外部文件删除；相关已知问题见 [当前状态](./current-project-status.md#评审结论与已知边界)。

## Reviews 展示边界

`/reviews` 使用自己的 route layout 和视觉 shell。光暗主题、阅读进度、随机文章、文章目录、装饰贴纸与自定义鼠标仅存在于该子路由；它们不修改全局 `<html>` 状态，也不影响 Home、Games、Tools 或 Payload Admin。

Review 正文和元数据仍沿用标准内容数据流，由 Payload/PostgreSQL 提供。目录从已读取的 Lexical heading 节点派生，不保存第二份目录数据；上一篇、下一篇和随机文章只查询已发布 Reviews，并继续经过 `overrideAccess: false` 的 getter。

`/reviews/preview` 是仅在 `NODE_ENV=development` 下可见的 UI 评审入口，使用仓库内占位数据，不读取或写入 Payload/PostgreSQL。Production 对该入口返回 404；正常 `/reviews` 不会在查询失败或内容为空时退回占位数据。

评论是有意独立的外部边界：详情页使用 Giscus 将当前 pathname 映射到 `koharu4ever/Kita` 的 GitHub Discussions，不将评论复制到 Payload 或 PostgreSQL。Giscus repository/category 标识是公开配置，不是 secret；光暗主题和 reaction CSS 随 Reviews shell 同步。自定义 reaction 在 Giscus DOM 发生变化时保留原生 emoji 回退。

## Payload 当前边界

Collections：

- `users`：Payload auth collection；
- `media`：图片 upload collection；匿名可读；
- `tools`：公开读取；
- `reviews`：匿名只读 `published`，登录用户可在 Admin 查看全部；
- `games`：匿名只读 `published`，登录用户可在 Admin 查看全部，封面必须关联 Media。

Media、Tools、Reviews 和 Games 的 create/update/delete 均复用 authenticated access helper，写操作要求登录。常用 text/textarea 字段的非空白、slug 和绝对 URL 规则集中在 `src/payload/fields`，并先保留 Payload 原生 required/长度校验。

Reviews 与 Games 共用同一份 Lexical editor 配置，避免两个内容模型的编辑能力分别漂移。

正文插图与每次使用的图注保存在现有 JSONB 中，选择节点后仍需保存文章。前台共享 converter 处理插图、标题和安全链接，Reviews 再提供目录 ID。新增一种 JSON 节点通常不需要新增数据库列，但旧渲染器可能不理解它；“没有 SQL migration”不等于可以任意降级代码。

## Development 与 Production 的隔离

本地开发：

- VS Code Dev Container 使用 Node 22 和 `node` 用户；
- `node_modules` 与 `.next` 使用 Dev Container targeted named volumes，避开 Windows bind mount 小文件性能瓶颈；
- Docker-in-Docker 运行本地 PostgreSQL；
- Media 默认写入 `.payload-media`；
- `pnpm dev` 自动启动并等待 PostgreSQL healthy。

生产：

- Coolify 使用仓库 `compose.yaml`；
- `web` 使用 standalone multi-stage image 和非 root 用户；
- entrypoint 先运行 Payload production migrations，再启动 `server.js`；
- PostgreSQL 使用 `postgres-data` named volume；
- Media 必须使用 R2，拒绝落入临时容器文件系统；
- backup sidecar 默认只在显式启用时上传数据库 dump。

Development 的 Docker daemon、PostgreSQL Volume 和 targeted volumes 与宿主 Docker/Coolify production 无关。不要把 Dev Container 的 named volumes 写成生产架构的一部分。

## 关键取舍

- 使用 Payload，而不是自行开发 CRUD Admin、upload API 和权限框架。
- 使用 server getter + mapper，隔离 CMS document 与 UI contract。
- Development 与 Production 共用 CMS-only 数据路径；空数据与查询故障分别处理。
- Development schema push 方便迭代；Production 只执行 migration。
- 使用一个 repository Compose 管理 web/postgres/backup；其他外部工具不进入 Kita 核心运行链路。
- Media/R2 使用 Payload storage adapter，不自建上传服务。
- Reviews 评论使用 Giscus/GitHub Discussions，不自建评论 Collection、登录和审核系统。
- 保持单体，不引入 Redis、Prisma、微服务、Kubernetes或大型监控平台，除非出现具体需求。

## 架构变更准入问题

引入新服务、依赖或数据层前必须回答：

1. 它解决了哪个已存在的问题？
2. 当前代码或 Payload 原生能力为什么不够？
3. 是否新增备份、恢复、secret、部署或监控责任？
4. 能否独立回滚？
5. 是否有与复杂度相称的测试？

无法明确回答时，不扩张技术栈。
