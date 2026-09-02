# Kita 当前项目状态

> 最后核对：2026-09-02
>
> 本文是可变事实、验证结果和已知边界的唯一来源。操作步骤见 [文档入口](./README.md)。实施过程和旧 PR 记录通过 Git 历史查阅，不在本页持续追加流水账。

## 当前阶段

主要功能与视觉调整已完成，项目进入内容维护和稳定性维护阶段，不再以增加框架、服务或展示效果作为默认下一步。

项目所有者已确认 PR #29 合并并部署。2026-09-02 只读评审核实：

- GitHub `main` 合并基线为 `6eb8b1b`（PR #29）；
- 审查时本地 `a4a1f11` 与该 `main` 的文件内容一致；
- 生产首页返回 HTTP 200，`/api/health` 返回 `ready`、`database: reachable`；
- 对应 [main CI](https://github.com/koharu4ever/Kita/actions/runs/33656585588) 通过。

这些是带日期的证据，不代表永久 HEAD，也不代替逐条生产内容、全部浏览器或真实管理员会话的验收。此次文档整理没有创建版本 tag；`package.json` 版本仍为 `0.1.0`，文档中的 `v1.0` 是原收尾目标，不是本次发布的版本号。

正常工作区为 `C:\dev\Kita`。开始任务仍需重新检查 Git；不要根据本文推断本机已经切回 `main` 或已删除旧分支。

## 内容编辑补充验收（2026-09-02）

在上述生产基线之上，`codex/content-authoring` 功能分支补充 Reviews/Games 的正文 Media 插图、每次使用的图注、常用文字格式、对齐/缩进、分隔线与站内文章链接；前台共用渲染器，Admin 补充字段说明和侧栏组织。Tools 保持结构化外链目录。使用方法在功能 PR 中更新 [Payload 内容与 Media](./payload-content-and-media.md)。

没有新增依赖、Collection 或数据库列，不需要新的 migration；实施时没有修改生产内容或现有开发内容。项目所有者已查看本地效果并确认没有问题，授权将文档整理与基础编辑能力分别提交 PR。这里记录的是带日期的验收证据，不代表生产部署证明，也没有修复下文列出的全部评审边界；合并状态以 GitHub PR 为准。

## 已交付范围

| 区域       | 当前实现                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| Home       | 原有壁纸按需加载、滚动雨景、主动开启的循环雨声；后台暂停与 reduced-motion 降级。                             |
| Games      | Media 封面瀑布流、详情页、原生 dialog lightbox、城市雨窗返回入口与独立暂停控制。                             |
| Reviews    | 每页 4 篇的服务端分页、Hero、富文本详情、目录、上一篇/下一篇、随机阅读、阅读进度、子路由主题/贴纸/鼠标效果。 |
| Comments   | Giscus 对接 Kita GitHub Discussions；pathname 映射、光暗主题及 reaction 样式，不写入 Payload 数据库。        |
| Tools      | 五种视图、关键词搜索、多条件筛选、排序与分页；使用现有 Collection，不新增独立搜索服务。                      |
| About      | 项目介绍与红橙窗纱导航；原生 dialog、键盘焦点管理、Esc 关闭及路由主题色。                                    |
| 内容后台   | Users、Media、Tools、Reviews、Games；显式内容写权限、共享校验和 Lexical 配置。                               |
| 运行与交付 | Docker/Compose/Coolify、迁移后启动、数据库 readiness、PostgreSQL 备份 sidecar、PR CI。                       |

静态图片、声音、移植效果的来源和使用边界只维护在 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。不把背景或第三方素材描述为全部原创实现。

## 数据与环境边界

- 公开页面使用 `getter -> Payload Local API -> mapper -> DTO -> UI`；getter 保留 `overrideAccess: false`。
- Games/Reviews 匿名仅可读 `published`；Media/Tools 公开可读；内容 create/update/delete 均显式要求登录。可信站主模型不是细粒度多角色权限系统。
- 空 Collection 显示 empty state；查询失败抛错，不用静态示例掩盖故障。各 preview 路由仅供开发环境展示，不向生产数据库注入样例。
- Games 的必填 `cover` Media relationship 是唯一封面事实源；四个旧 cover 字段已通过 migration 删除。Reviews 封面仍使用 URL/path 字段，不宣称所有图片都由 Media relationship 管理。
- 本地使用 Dev Container、`node` 用户、Docker-in-Docker PostgreSQL 和 `.payload-media`；生产使用独立 PostgreSQL 与 R2。不要用生产凭据填充本地内容。
- 生产数据库曾手动复建；其后的 Media 与 Media-only 增量迁移曾通过。2026-07-22 曾确认 6 条 Game 的关联、图片 URL 和 Redeploy 持久性；该历史数量不是当前内容数量。
- 6 个已提交 migration 已有 fresh `up` 与重复执行 smoke。手动复建、fresh migration、带真实数据的升级和 dump restore 是不同验证，不能互相代替。
- Production entrypoint 先运行 migration 再启动应用。回滚须核对数据库兼容性，不能默认只切旧镜像。
- OpenList 为独立 Application，不共享 Kita 数据库、Volume、secret 或用户流程；不计入本站完成度。

## 验证证据

2026-09-02，针对 PR #29 同文件基线进行只读评审：

| 检查                  | 结果与边界                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm test`           | 162 个 Vitest、4 个 backup shell 场景通过。                                                                                                                              |
| `pnpm check`          | Prettier、ESLint、TypeScript 通过。                                                                                                                                      |
| 合并后 CI             | 包含隔离 PostgreSQL/Payload integration 和 production build，结果成功；本轮没有在现有本地数据库重跑 integration。                                                        |
| 本地 production build | PR #29 提交前已通过；本轮评审未停止开发服务再次构建。                                                                                                                    |
| `pnpm audit --prod`   | 0 critical、0 high、15 moderate、4 low；主要链路为 Payload 间接引入的 Monaco/DOMPurify 和 drizzle 工具链/esbuild。不等于没有可利用风险，也没有以强制 override 伪造清零。 |
| 生产只读探测          | 首页 200、数据库 readiness 正常；没有登录 Admin、读取凭据或操作数据库。                                                                                                  |

前序本地手动 smoke 覆盖主要桌面/窄屏布局、路由隔离、主题、分页、目录、雨景暂停和 modal 焦点。它们不等于持续的多浏览器 E2E 回归，也没有证明每个生产内容条目和外部服务都正常。

验证命令与 CI 分工见 [testing-and-ci.md](./testing-and-ci.md)。

同日，本地 `codex/content-authoring` 工作区另外通过 `pnpm test`（188 个 Vitest + 4 个 backup 场景）、`pnpm check`、`SKIP_ENV_VALIDATION=true pnpm build` 与 `pnpm test:integration`（7 个场景）。隔离测试验证正文 Media、图注和站内链接的保存/重读，临时数据库容器与图片目录已自动清理。开发服务已恢复；本地预览文章的插图、图注和目录正常返回。Agent 检查 Admin 时停在登录页；随后项目所有者确认本地查看没有问题。该确认不等同于自动化浏览器端到端覆盖或生产验收。

## 评审结论与已知边界

2026-09-02 评审结论为：保留 Next.js + Payload + PostgreSQL + R2 单体方案，局部收紧边界，不换技术栈。本次文档收尾及内容编辑补充不实施下列修复，也不把它们标记为解决。

| 边界            | 已确认事实与影响                                                                                                                                                           | 后续处理方向                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 生产认证 Cookie | Users 使用 `auth: true`，已安装 Payload 默认 `cookies.secure: false`；实际生产 Cookie 和额外 HSTS 保护未验证，不能宣称已经泄露。                                           | 显式配置生产 Secure 属性并验证实际响应。                                     |
| Media 删除      | 无引用预检；Game 外键 `SET NULL` 与 `cover_id NOT NULL` 冲突。本地 Payload 先删文件再删记录，可导致记录回滚而文件丢失；R2 走另一钩子，远端删除错误可能仅记日志并留下对象。 | 删除前保护引用、明确失败反馈与核查方式；不能仅依赖外键或数据库回滚保护文件。 |
| 发布数据契约    | slug 格式校验未保留 `random`/`preview` 等路由名；Review 封面只判非空，而 Next Image 限制远端来源。可保存出无法正常访问的文章地址或封面。                                   | Collection 级保留名校验，以及与图片加载配置一致的路径/URL 校验和测试。       |
| 浏览器存储降级  | Reviews 主题/阅读进度直接访问 localStorage；浏览器拒绝存储时可能抛错，影响可选功能甚至页面子树。                                                                           | 存储失败回退到默认值或内存状态。                                             |
| 备份与恢复      | PostgreSQL dump 上传链路已有证据；隔离 restore、Media 独立可恢复来源及备份 last-success 告警尚未形成完整验证闭环。                                                         | 按恢复手册做隔离演练，不在生产首次试验。                                     |

代码证据入口：[Users](../src/payload/collections/users.ts)、[Media](../src/payload/collections/media.ts)、[Media-only migration](../src/migrations/20260722_172809.ts)、[字段校验](../src/payload/fields/validators.ts)、[Reviews](../src/payload/collections/reviews.ts)、[主题状态](../src/features/reviews/components/reviews-experience-shell.tsx)。备份步骤和资产边界只维护在 [backup-and-recovery.md](./backup-and-recovery.md)。

小型站点可暂时接受 Games 的 100 条列表上限、Reviews 导航/随机与 Tools 的全量集合读取；接近规模边界时再评估服务端查询，不提前引入缓存或搜索平台。Media 是公开资源，不用于私密附件。发布后改变 slug 也会改变 Giscus 的评论映射地址。

## 后续维护原则

- 当前停止无明确需求的功能扩展；根据实际故障、内容规模和维护成本决定下一项工作。
- 优先处理认证、Media 安全和内容发布边界；是否实施及何时实施由项目所有者另行决定，不自动开启修复、迁移或部署。
- Production 内容、外链和素材来源由站主持续维护。此次收尾没有重新逐条审计内容，不能将“网站基本完成”解释为所有来源、链接、日期或评论均已核验。
- 对外说明只描述已实现的能力；不宣称高并发实测、完整灾难恢复、全面安全认证或尚未实施的修复。
- 新功能按 [产品路线](./product-roadmap.md) 判断必要性；不为“显得完整”新增框架、服务、页面或文档。
