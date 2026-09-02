# Payload 内容与 Media

> 最后核对：2026-09-02

## 当前 Collections

| Collection | 公开读取     | 主要内容                                                                                     |
| ---------- | ------------ | -------------------------------------------------------------------------------------------- |
| Users      | 否           | Payload Admin 认证用户                                                                       |
| Media      | 是           | 图片、alt、original/thumbnail/display metadata                                               |
| Tools      | 是           | 标题、描述、URL、分类、排序                                                                  |
| Reviews    | 仅 published | 标题、slug、状态、游戏名、日期、摘要、评分、标签、Lexical body                               |
| Games      | 仅 published | 标题、slug、开发者、发布日期文本、游玩/发布状态、摘要、Lexical body、Media cover、标签和链接 |

Media、Tools、Reviews 和 Games 均显式要求登录用户才能 create/update/delete。Tools 保持公开读取；Reviews 和 Games 的匿名读取仍只返回 published 内容。Collection 配置测试固定这些边界；一次性 PostgreSQL/Payload integration smoke 另外验证完整 fresh migration、匿名 published 读取与登录写入。

Games/Reviews slug 只接受以单个连字符分隔的小写 ASCII 字母和数字。Tools URL 与 Games links 只接受不带首尾空白的 `http/https` 绝对 URL。必填 text/textarea 字段拒绝纯空白；自定义规则先执行 Payload 原生 validation，因此 required 和长度限制仍然生效。Games/Reviews 的正文共用一份 Lexical feature 配置，避免编辑能力随 collection 漂移。

## 内容读取链路

```text
Payload Collection
  -> Local API getter (overrideAccess: false)
  -> mapper
  -> feature DTO
  -> page component
```

匿名请求必须受 collection access 和 getter 的 published filter 双重约束。开发和生产使用同一条 CMS-only 路径：空 Collection 返回真实空结果，查询失败继续抛出，由站点 error boundary 安全处理。运行时代码不再维护第二份静态内容或 seed route。

## Media storage

Development：

```text
MEDIA_STORAGE_MODE=local
files -> .payload-media
```

Production：

```text
MEDIA_STORAGE_MODE=r2
Payload upload -> S3 storage adapter -> kita Media R2 bucket
public URL -> HTTPS custom domain
```

Production 配置缺失会拒绝启动，防止图片误写容器临时文件系统。允许 MIME：JPEG、PNG、WebP、AVIF；单文件上限 10 MiB。Payload 生成 400px thumbnail 和 1600px display WebP（不放大小图）。Alt 必填，长度 3–240。

删除 Media document 会触发文件清理，但数据库与对象存储之间没有跨系统事务，不能保证记录和文件同时删除成功。目前没有自动引用保护：删除前必须手动检查 Game 封面及 Reviews/Games 正文插图的全部引用，删除后核对存储结果。不要直接在 R2 控制台删除仍被 Payload 引用的对象。已知失败边界见 [当前项目状态](./current-project-status.md)。

R2 免费额度与价格可能变化，容量判断应以 Cloudflare 当前账单页为准。对个人站图片规模通常充足，但仍需关注对象数、Class A/B 操作和存储增长。

## Games Media-only 设计

Games 曾短暂同时保存 Media relationship 和旧 `coverSrc`/`coverAlt`/`coverWidth`/`coverHeight`，用于安全迁移。生产 6 条 Game 全部关联 Media 并通过页面、R2 URL 与 Redeploy 验证后，PR #18：

- 将 `Games.cover` 设为必填；
- 删除四个重复 schema/数据库列；
- 让 mapper 只从 Media 生成 cover DTO；
- 在 migration `up` 删除列前检查空 `cover_id`；
- 提供可审查的 `down`。

`down` 会加回旧列并从当前 Media metadata 填充，恢复旧代码所需的数据库契约。它不把数据库倒带到历史时刻，也不保证旧字段的逐字原值。精确历史恢复依赖对应时间点的 dump。

Production 数据库曾手动复建。PR #17/#18 的成功证明增量 migration 与 Media-only 链路在该数据库上可用；2026-09-01 的隔离 PostgreSQL 16 smoke 另外证明全部 6 个 migration 能从空数据库执行并收敛到当前 Media-only schema。两者都不证明带真实 Production 数据的升级、全部 `down` 或 dump restore。

## 日常内容操作

### 新建 Game

1. 在 Media 上传一张唯一封面并填写有意义的 alt；
2. 如果同一图片已存在，选择 existing Media，不重复上传；
3. 创建 Game，填写唯一 slug、状态、摘要和正文；
4. 选择必填 `cover`；
5. 可先用 draft 保存，在 Admin 检查正文后再切 published 并保存；当前没有私密草稿的前台预览；
6. 验证 `/games`、详情页和 Media URL。

### 删除 Game 或 Media

- 删除 Game 或 Review 不自动删除 Media；先检查图片是否被其他封面或正文复用。
- 删除 Media 前解除所有引用，并确认 R2 对象删除符合预期。
- Production 删除属于真实数据变更；需要项目所有者明确决定。

### 写 Review 或 Game 正文

Reviews 和 Games 共用 `src/payload/fields/content-editor.ts`，前台共用 `ContentRichText`，不另装一套编辑器。编辑区域中的排版立即可见；它不是和网站详情页完全相同的实时预览。

1. 在 `/admin` 选择 Reviews 或 Games，打开记录或 Create New。标题、摘要、正文放在主区域；slug、发布状态等放在侧栏。
2. 使用正文上方固定工具栏，或选中文字后的浮动工具栏。支持 H2/H3/H4、粗体、斜体、下划线、删除线、行内代码、有序/无序列表、引用、对齐与缩进。Reviews 的前台目录继续从正文标题生成。
3. 在新段落输入 `/` 可打开插入菜单，选择上传图片或分隔线。图片只能来自 Media，可选择已有图片，也可创建新 Media。相同图片优先复用；选择图片后仍需保存文章。上传 Media 与保存文章是两次操作，放弃文章不会自动清理已经上传的图片。
4. Media 的 `alt` 描述画面内容；插入图片的 `caption` 是本次使用的可选图注（最多 300 字符），显示在正文图片下方，不修改其他文章中的图注。
5. 链接可填写安全的网页地址，或选择站内 Games/Reviews 文档。前台只生成已发布目标的详情链接；未解析、草稿或不安全链接降级为普通文字，不输出可执行协议。公开 Media 本身不随文章 draft 状态变成私密资源。
6. Reviews 填写游戏名、日期、评分、阅读时间、摘要与封面路径/URL；Games 填写开发者、发布日期文本、游玩状态、摘要及必填 Media 封面。Review 封面仍是旧 URL/path 字段，不是本次新增的正文 Media 插图；外部封面地址须符合 Next Image 的允许来源。
7. 点击 Save 才持久化正文。选择 published 并保存后，检查列表和详情页。日期、阅读时间和 slug 不会根据正文自动计算；修改已发布记录后保存会直接更新公开内容，没有独立的“已发布版本 + 编辑草稿”双版本。

前台插图优先使用 Media 的 display 尺寸，缺少该尺寸则使用原图；缺失图片只显示占位提示，不使整篇文章崩溃。图注作为文本渲染。没有开放任意 HTML、脚本或 iframe 输入。

运行开发服务后，`/reviews/preview/rain-city-after-midnight` 提供插图与图注的前台示例；该 fixture 只用于开发预览，不会创建 Media 或文章记录，也不是已保存草稿的预览入口。

这次使用 Payload 自带的 [Lexical features](https://payloadcms.com/docs/rich-text/official-features) 和 JSX converter 扩展。没有加入表格、代码块语法高亮、视频嵌入、自动保存、版本历史或工作流审批；这些不是当前基础文章编辑的前提。

### 维护 Tool

Tools 是外链目录，不是文章 Collection，因此保留清晰的结构化表单：标题、纯文本描述、目标 URL、分类、`sortOrder`。保存后即公开；没有 draft 状态。来源显示由 URL 推导。分类是内容分组，五种展示模式是前台视图，二者不是同一概念；较小的 `sortOrder` 优先展示，前台手动排序仍可改变当前视图。

### 数据兼容与验证

新增格式、插图引用和图注保存在现有 `body` JSONB 内，没有增加数据库列或新 Collection，因此本轮不新增 migration。旧正文仍可渲染；Admin import map 和 Payload types 随配置重新生成。

隔离 PostgreSQL 测试通过已有 migration 建库后，真实上传临时图片，创建/更新/匿名读取 Review 和 Game 的正文、Media 及图注，并验证 Tools 字段。测试图片使用临时目录，不写当前开发 Media 或 R2。渲染单测覆盖缺图、图注转义、链接过滤与标题格式；最新执行结果集中记录在 [当前项目状态](./current-project-status.md)。

没有 schema migration 不等于可以任意降级代码：开始保存新的 upload 节点后，旧版本可能不认识这些节点或无法正确展示。回退时应保留对应编辑器与渲染支持，或先备份并转换新增内容；不能靠运行旧的 down migration 处理正文格式。

## 后续验证

后续优先级以 [当前项目状态](./current-project-status.md) 和 [产品路线](./product-roadmap.md) 为准。`releaseDate` 暂不迁移为 date，先清理真实内容中的 placeholder。最小浏览器 smoke 与隔离 dump restore 仍是可选的后续验证，不是继续扩张内容模型的理由。

Trash、Reviews relationship、Globals、Payload drafts/versions、角色系统、Jobs 和搜索只有出现真实需求后再评估。
