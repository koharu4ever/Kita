# Kita 简历作品集初版计划

## 结论

这个想法可行，而且比继续无限打磨更适合当前目标。

Kita 已经具备一个 Next.js 全栈作品的主要骨架：

```txt
Next.js App Router 前台
Payload CMS 管理后台
PostgreSQL 数据库
Local API 数据读取
DTO / Mapper 前后端边界
Docker 生产构建
Payload migration
Coolify + VPS 部署
```

现在的问题不是“项目能不能做出来”，而是“如何把已有能力收口成一版稳定、可展示、能够由本人解释的作品”。

推荐目标不是做成商业级平台，而是完成一个边界清晰的作品集版本：

> 页面可访问，核心数据链路真实运行，后台可以管理内容，部署稳定，代码结构能够解释，README 和简历描述准确。

## 为什么适合先完成初版

追求所有细节完美会不断引入新问题：

- 首页动画还可以继续优化。
- Reviews 可以发展成复杂文章系统。
- Games 可以接数据库、分类和搜索。
- Tools 可以增加更多字段。
- About 可以做成 CMS Global。
- 还可以继续加入登录、评论、收藏、多语言。

这些功能都没有自然终点，而且大部分不能显著提高第一版的简历价值。

对于作品集，更重要的是证明一条完整链路：

```txt
设计数据模型
-> 后台录入内容
-> PostgreSQL 保存
-> 服务端安全读取
-> Mapper 转成稳定 DTO
-> Next.js 页面渲染
-> Docker 构建
-> VPS 部署
```

Kita 已经跑通这条链路。下一阶段应该收口，而不是扩张。

## 初版定位

Kita 初版可以定位为：

> 一个视觉小说氛围的个人内容站，使用 Next.js、Payload CMS 和 PostgreSQL 构建，通过 Docker 和 Coolify 部署，包含 Reviews、Games、Tools 与 About 模块。

它不需要假装是大型商业项目。它真正有价值的部分是：

- 有鲜明的视觉方向，不是通用后台模板。
- 有真实 CMS 和数据库，不是纯静态页面。
- 有清晰的前后端数据边界。
- 有 migration 和生产部署流程。
- 能展示你对全栈数据流的理解。

## 当前完成度

### 已经完成

- Next.js 16 App Router 工程基座。
- TypeScript、ESLint、Prettier 和环境变量校验。
- 首页视觉、轮播背景和雨滴玻璃效果。
- `/games` 图片画廊、灯箱和详情页。
- `/about` 静态页面。
- `/tools` 前端、Payload collection、Local API 和生产数据链路。
- `/reviews` 列表页、详情页和顶部导航。
- Reviews Payload collection、mapper、server getter 和静态 fallback。
- 本地 Payload Admin 新建 Review 到前台显示的完整验证。
- PostgreSQL、Docker、Payload migration 和 Coolify 部署基础。

### 仍需收口

- Reviews 需要明确草稿与发布状态。
- Reviews schema 确认后需要生成生产 migration。
- Reviews 当前错误 fallback 需要区分开发和生产行为。
- 页面需要替换明显的 placeholder 文案。
- About、Tools、Reviews 需要放入少量真实内容。
- 需要一次完整的桌面端和移动端检查。
- 需要最终运行 format、lint、typecheck 和 production build。
- 项目 README 和交接文档需要更新到真实状态。
- 最好增加一套最小 GitHub Actions CI。

## 初版必须包含的内容

### 1. 首页

- 保留当前背景、雨滴效果和四个入口。
- 检查桌面端与移动端不溢出。
- 替换最终标题和简短文案。
- 不继续重写雨滴引擎。

### 2. Reviews

- Payload Admin 可以创建、编辑和发布 Review。
- 前台只显示已经发布的内容。
- `/reviews` 显示列表。
- `/reviews/[slug]` 显示详情。
- 没有记录时有明确空状态或开发 fallback。
- 生产查询失败时不能悄悄伪装成正常数据。

### 3. Games

- 保留当前静态图片画廊和灯箱逻辑。
- 每个游戏有封面、灯箱查看和详情入口。
- 初版不必连接 Payload。
- 静态数据不会削弱项目的全栈属性，因为 Reviews 和 Tools 已经展示了完整后端链路。

### 4. Tools

- 保留现有 Payload 数据链路。
- 填入少量真实工具内容。
- 检查链接、分类、排序和空状态。
- 不在初版扩展复杂标签或搜索系统。

### 5. About

- 使用真实的个人介绍、技术方向和联系方式。
- 可以保持静态，不必为了“全站 CMS 化”增加复杂度。
- 不放真实住址、手机号或不必要的私人信息。

### 6. 工程与部署

- Reviews migration 能在新数据库正确执行。
- `pnpm build` 成功。
- Docker 镜像构建成功。
- Coolify 部署成功。
- 线上 `/`、`/reviews`、Review 详情、`/games`、`/tools`、`/about` 和 `/admin` 均正常。
- 生产数据库有备份方案。

## 初版明确不做什么

以下内容全部延期：

- 用户注册与普通用户登录。
- 评论区、点赞、收藏和 Guestbook。
- tRPC。
- 额外引入 Drizzle 或 Prisma。
- Go 或 Python 后端重写。
- Games 数据库化。
- About CMS 化。
- 全站搜索。
- 多语言系统。
- 复杂评分统计。
- 为了抽象而新增大量 Service、Repository 接口。
- 继续寻找新的整站模板。
- 大规模 UI 库迁移。

初版的原则是：没有直接改善作品展示、稳定性或可解释性的功能，都不进入范围。

## 推荐实施顺序

### 阶段一：完成 Reviews

1. 确定发布机制，推荐使用 Payload drafts 或最小 `status` 字段。
2. server getter 只读取 published Reviews。
3. 保留 `coverImage` 文本路径。
4. 使用基础 Payload Lexical Rich Text，不加入上传、自定义 Blocks 或复杂关系。
5. 重新生成 Payload types。
6. 本地验证列表页和详情页。
7. 确认 schema 后生成 migration。

这一阶段结束后，Kita 的第二条真实 CMS 数据链路完成。

### 阶段二：填充最小真实内容

建议最低内容量：

```txt
Reviews：2 至 3 篇
Games：4 至 6 个展示项
Tools：6 至 10 个链接
About：一份真实介绍
```

内容不必很长，但不能继续出现明显的 `Placeholder` 或解释模板实现的演示文案。

### 阶段三：质量检查

运行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

然后检查：

- 桌面宽屏。
- 普通笔记本宽度。
- 手机宽度。
- 键盘可访问性。
- 图片加载和比例。
- 空数据状态。
- 404 页面行为。
- 页面 metadata。
- 外部链接是否有效。

### 阶段四：部署与生产验证

1. 提交 migration 和代码。
2. 推送 GitHub。
3. 观察 Coolify build 和 migration 日志。
4. 在生产 Admin 填写正式内容。
5. 逐页检查线上站点。
6. 配置 PostgreSQL 备份。

### 阶段五：作品集包装

完善 README：

- 项目介绍。
- 技术栈。
- 架构图。
- 数据链路。
- 本地启动方式。
- Docker 与部署方式。
- 页面截图。
- 技术决策和已知限制。

README 不需要写成教程，但需要让面试官在几分钟内看懂项目价值。

## 推荐的完成标准

满足以下条件就可以宣布初版完成：

```txt
[ ] 所有公开页面可以访问
[ ] Reviews 和 Tools 使用真实 Payload 数据
[ ] Review 草稿不会公开显示
[ ] Games 静态画廊和详情工作正常
[ ] 页面没有明显 placeholder
[ ] 移动端没有文字和布局重叠
[ ] format / lint / typecheck / build 全部通过
[ ] production migration 成功
[ ] Coolify 部署成功
[ ] README 能解释项目架构
[ ] 本人可以口头讲清一条完整数据链路
```

达到这些标准后，不应该因为某个阴影、动画速度或字体间距还不完美而推迟投递。

## 代码工作如何分配

Codex 可以负责：

- 梳理和实现剩余代码。
- Reviews 发布机制和生产行为。
- Payload schema、types 和 migration。
- 前端适配和响应式修复。
- 自动化检查和构建错误。
- CI、README 和技术文档。
- Docker、Coolify 部署问题排查。
- 代码 review 和最终质量检查。

本人需要负责：

- 决定公开展示的个人信息。
- 提供或修改 Reviews、Games、Tools 和 About 内容。
- 决定视觉上是否接受。
- 保管生产账号和密钥。
- 理解并能够解释项目关键结构。
- 在简历和面试中准确描述自己的参与方式，不虚构商业用户或团队经验。

不需要手写每一行代码才算自己的项目，但必须理解关键数据链路、技术选择和常见故障。

## 面试前真正需要掌握的内容

不建议只背孤立面试题。优先围绕 Kita 掌握这些问题：

### Next.js

- App Router 的 route、layout 和 Server Component 分别是什么。
- 为什么页面数据在服务端读取。
- `force-dynamic` 的作用。
- Server Component 与 Client Component 的边界。
- 为什么 `useSearchParams` 可能需要 Suspense。

### 后端数据流

- Collection、数据库表和前端 DTO 的区别。
- Payload Local API 与 REST API 的区别。
- mapper 为什么存在。
- 为什么 React 组件不应该认识 Payload document。
- Route、Service、Repository、Database、DTO 分别负责什么。

### PostgreSQL 与 migration

- 开发数据库和生产数据库为什么分开。
- migration 为什么需要进入 Git。
- 数据库结构和数据库内容为什么不是同一件事。
- 为什么推送代码不会自动把本地 Review 内容带到生产。

### Docker 与部署

- Dockerfile 的 build 和 runner 阶段。
- Docker Compose 中 web 与 postgres 的关系。
- volume 为什么用于数据库持久化。
- Coolify 如何从 GitHub 构建并启动项目。
- 为什么生产容器启动前要执行 migration。

### TypeScript 与架构

- `ReviewPreview` 是什么。
- Payload 生成类型和手写 DTO 有什么区别。
- 为什么 `src/app` 不放大量业务代码。
- `features`、`server`、`payload` 各自的职责。

掌握这些以后，再补 JavaScript、React、HTTP、数据库和算法常见题，会比单纯背答案更牢固。

## 简历可以如何准确描述

项目描述示例：

> 使用 Next.js、TypeScript、Payload CMS 与 PostgreSQL 构建个人内容站，设计 Reviews/Tools 内容模型及 Local API 数据链路，通过 DTO/Mapper 隔离 CMS 文档与前端组件，并使用 Docker、Payload migration、Coolify 完成 VPS 部署。

技术亮点可以写：

- 基于 Next.js App Router 和 feature-oriented 目录组织页面与业务模块。
- 使用 Payload CMS + PostgreSQL 实现内容管理和服务端数据读取。
- 通过 mapper 将 Payload document 转换为稳定前端 DTO，降低 UI 与数据库结构耦合。
- 使用 Docker 多阶段构建和 production migration 管理部署流程。
- 实现自定义 WebGL/CSS 雨滴视觉和基于开源模板改造的 Games 图片画廊。

描述必须与仓库和线上效果一致，不写没有实现的高并发、微服务、分布式系统或大规模用户量。

## 下一步唯一优先事项

从现在开始先不要新增模块。

第一件事是完成 Reviews 发布机制：

```txt
草稿 / 发布规则
-> getter 只读取已发布内容
-> 本地验证
-> 生成 types
-> 生成 migration
-> 质量检查
-> commit
```

完成这一项以后，再进入真实内容填充和全站验收。这样 Kita 会从“持续开发中的项目”变成“可以投递、可以展示、可以继续迭代的初版作品”。
