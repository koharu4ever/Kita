# Payload 内容与 Media

> 最后核对：2026-08-31

## 当前 Collections

| Collection | 公开读取     | 主要内容                                                                                     |
| ---------- | ------------ | -------------------------------------------------------------------------------------------- |
| Users      | 否           | Payload Admin 认证用户                                                                       |
| Media      | 是           | 图片、alt、original/thumbnail/display metadata                                               |
| Tools      | 是           | 标题、描述、URL、分类、排序                                                                  |
| Reviews    | 仅 published | 标题、slug、状态、游戏名、日期、摘要、评分、标签、Lexical body                               |
| Games      | 仅 published | 标题、slug、开发者、发布日期文本、游玩/发布状态、摘要、Lexical body、Media cover、标签和链接 |

Media、Tools、Reviews 和 Games 均显式要求登录用户才能 create/update/delete。Tools 保持公开读取；Reviews 和 Games 的匿名读取仍只返回 published 内容。collection 配置测试固定这些匿名与登录权限边界；真实 Payload/PostgreSQL 请求链路仍需独立集成测试。

Games/Reviews slug 只接受以单个连字符分隔的小写 ASCII 字母和数字。Tools URL 与 Games links 只接受不带首尾空白的 `http/https` 绝对 URL。必填 text/textarea 字段拒绝纯空白；自定义规则先执行 Payload 原生 validation，因此 required 和长度限制仍然生效。Games/Reviews 的正文共用一份 Lexical feature 配置，避免编辑能力随 collection 漂移。

## 内容读取链路

```text
Payload Collection
  -> Local API getter (overrideAccess: false)
  -> mapper
  -> feature DTO
  -> page component
```

匿名请求必须受 collection access 和 getter 的 published filter 双重约束。Production 查询失败应报错；Development 可使用 feature fixture。

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

删除 Media document 时 storage adapter 会删除对应对象和生成尺寸。删除前先确认没有 Game relationship 继续引用它；不要直接在 R2 控制台删除仍被 Payload 引用的对象。

R2 免费额度与价格可能变化，容量判断应以 Cloudflare 当前账单页为准。对个人站图片规模通常充足，但仍需关注对象数、Class A/B 操作和存储增长。

## Games Media-only 设计

Games 曾短暂同时保存 Media relationship 和旧 `coverSrc`/`coverAlt`/`coverWidth`/`coverHeight`，用于安全迁移。生产 6 条 Game 全部关联 Media 并通过页面、R2 URL 与 Redeploy 验证后，PR #18：

- 将 `Games.cover` 设为必填；
- 删除四个重复 schema/数据库列；
- 让 mapper 只从 Media 生成 cover DTO；
- 在 migration `up` 删除列前检查空 `cover_id`；
- 提供可审查的 `down`。

`down` 会加回旧列并从当前 Media metadata 填充，恢复旧代码所需的数据库契约。它不把数据库倒带到历史时刻，也不保证旧字段的逐字原值。精确历史恢复依赖对应时间点的 dump。

Production 数据库曾手动复建。PR #17/#18 的成功证明增量 migration 与 Media-only 链路在该数据库上可用，不证明完整 migration 链已从全新数据库自动执行。

## 日常内容操作

### 新建 Game

1. 在 Media 上传一张唯一封面并填写有意义的 alt；
2. 如果同一图片已存在，选择 existing Media，不重复上传；
3. 创建 Game，填写唯一 slug、状态、摘要和正文；
4. 选择必填 `cover`；
5. 先保存 draft，预览内容后再切 published；
6. 验证 `/games`、详情页和 Media URL。

### 删除 Game 或 Media

- 删除 Game 不自动意味着图片无用；先检查 Media 是否被其他 Game 复用。
- 删除 Media 前解除所有引用，并确认 R2 对象删除符合预期。
- Production 删除属于真实数据变更；需要项目所有者明确决定。

### Reviews 与 Tools

Reviews 使用 Lexical rich text 和手写 draft/published 状态。Tools 按 `sortOrder` 排序。现阶段不需要 drafts/versions、角色系统或自建搜索。

## 后续验证

后续优先级以 [当前项目状态](./current-project-status.md) 和 [产品路线](./product-roadmap.md) 为准。Payload 侧仍缺 PostgreSQL migration smoke 和真实 anonymous/published/authenticated access 集成测试。`releaseDate` 暂不迁移为 date，先清理真实内容中的 placeholder。

Trash、Reviews relationship、Globals、Payload drafts/versions、角色系统、Jobs 和搜索只有出现真实需求后再评估。
