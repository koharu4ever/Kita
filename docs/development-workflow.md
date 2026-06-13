# Kita 开发工作流

这份文档记录当前项目从“能跑起来”进入“可以稳定写功能”之后的工作方式。

当前项目的核心架构是：

```text
Next.js App Router
  前台页面、路由、Server Components、React 组件

Payload CMS
  Admin 后台、collections、CRUD、REST API、GraphQL API、Local API

PostgreSQL
  持久化保存 Payload 的数据

Docker-in-Docker Dev Container
  统一本地开发入口，让数据库和开发命令都在 Dev Container 里完成
```

## 当前是否已经具备写码基础

已经具备。

现在已经完成了：

```text
1. Next.js 工程化基座
2. Prettier / ESLint / TypeScript
3. Docker-in-Docker Dev Container
4. PostgreSQL 本地开发数据库
5. Payload CMS 基础接入
6. Users collection
7. Tools collection
8. Payload Admin 后台
9. /tools 从 Payload/PostgreSQL 读取真实数据
10. 前台页面第一版骨架
```

这意味着现在可以开始写正式功能，但建议继续保持“小步闭环”的方式。

## 当前还缺什么

第一版能写码，但还有一些后续会逐步补齐的部分：

```text
Media collection
  后面需要图片上传、背景图、封面图时再接。

Reviews / Games collections
  当前 reviews 和 games 还是前端模板数据。
  后续可以按 Tools 的模式接到 Payload。

Payload generated types
  payload.config.ts 已经配置输出位置。
  但当前 Payload CLI 和 Next 16 / TS collection 的组合还有兼容细节。
  暂时用前端展示类型 + mapper 维持类型边界。

正式 seed 脚本
  当前 seed:tools 是开发路由触发。
  后续可以改成专门脚本或 Payload 官方推荐的 seed 流程。

测试
  当前主要靠 lint/typecheck/build。
  后续功能复杂后再加组件测试或端到端测试。

部署配置
  VPS / Coolify 还没正式接入。
  本地闭环跑稳后再处理。
```

这些不是阻塞项。它们是后续工程化增强项。

## 日常启动流程

现在项目采用 Docker-in-Docker。日常开发命令都在 Dev Container 终端里执行。

先打开：

```text
Docker Desktop
VS Code
Reopen in Container
```

进入 Dev Container 后，检查工具：

```bash
pnpm --version
docker --version
docker compose version
```

启动数据库：

```bash
docker compose up -d postgres
```

查看数据库容器：

```bash
docker ps
```

启动 Next.js 和 Payload：

```bash
pnpm dev
```

常用地址：

```text
http://localhost:3000
http://localhost:3000/tools
http://localhost:3000/admin
```

如果是新数据库，先打开 `/admin` 创建 Payload 管理员账号，再执行：

```bash
pnpm seed:tools
```

这样会写入当前测试用的两条 Tools 数据：

```text
Textractor
VNDB
```

## 当前 Docker 架构

现在可以这样理解：

```text
Windows
  Docker Desktop
    Dev Container
      Node / pnpm / Next.js / Payload
      Docker-in-Docker
        PostgreSQL
```

外层 Docker Desktop 负责运行 Dev Container。

Dev Container 内部的 Docker 负责运行项目开发依赖服务，比如 PostgreSQL。

项目代码仍然挂载到容器里：

```text
D:\blackwater\kita
  -> /workspaces/kita
```

所以你在 VS Code 里改代码，`pnpm dev` 能直接热更新。

## 目录结构如何分工

当前主要目录职责如下：

```text
src/app
  Next.js 路由入口。
  不放复杂业务逻辑。

src/app/(site)
  前台网站路由。
  例如 /、/about、/tools、/reviews、/games。

src/app/(payload)
  Payload Admin 和 Payload API 路由。
  例如 /admin、/api/[...slug]、/api/graphql。

src/features
  前台功能模块。
  按页面/业务领域组织组件、展示类型、mapper、本地 fallback 数据。

src/server
  服务端读取和业务编排。
  例如从 Payload local API 读取数据。

src/payload
  Payload collections。
  定义后台数据模型、字段、权限、Admin 显示方式。

src/config
  typed env 和项目配置。

src/shared
  真正跨 feature 复用的组件、hooks、工具函数、类型。
```

这套结构参考 bulletproof-react，但做了 Next.js App Router 和 Payload CMS 适配。

## 为什么有 (site) 和 (payload)

`(site)` 和 `(payload)` 是 Next.js route group。它们不会出现在 URL 里。

也就是说：

```text
src/app/(site)/tools/page.tsx
  URL 仍然是 /tools

src/app/(payload)/admin/[[...segments]]/page.tsx
  URL 仍然是 /admin
```

这样拆分是因为前台网站和 Payload Admin 都需要自己的 root layout。

前台网站需要：

```text
中文 lang
前台字体变量
全局 CSS
网站视觉结构
```

Payload Admin 需要：

```text
Payload RootLayout
Payload CSS
Payload server functions
Payload importMap
```

如果都放在同一个 `src/app/layout.tsx` 下，Payload Admin 会产生嵌套 `<html>` / `<body>` 的 hydration 问题。

所以现在的结构更清楚：

```text
(site)
  管前台

(payload)
  管后台和 Payload API
```

## 前端网站结构是否完成

第一版骨架已经完成，但业务内容还没有完全完成。

当前前台状态：

```text
/
  已完成第一版视觉首页。

/about
  已完成静态页面第一版。

/tools
  已接入 Payload/PostgreSQL，能读取真实 Tools 数据。

/reviews
  当前是简单模板数据，还没接 Payload。

/games
  当前是简单模板数据，还没接 Payload。
```

所以更准确地说：

```text
前端视觉骨架完成。
Tools 数据闭环完成。
Reviews / Games 还需要后续接 CMS。
```

后面写功能时，不建议一口气把所有页面都接数据库。应该按 Tools 的模式，一个 collection 一个 collection 地接。

## 当前数据链路如何工作

以 `/tools` 为例：

```text
用户访问 /tools
  -> src/app/(site)/tools/page.tsx
  -> getTools()
  -> getPayloadClient()
  -> Payload local API 查询 tools collection
  -> Payload 从 PostgreSQL 读取 tools 表
  -> mapToolDocumentToToolkitItem()
  -> ToolsPage 渲染
```

对应文件：

```text
src/app/(site)/tools/page.tsx
src/server/tools/get-tools.ts
src/server/payload/get-payload.ts
src/features/tools/utils/map-tool-document-to-toolkit-item.ts
src/features/tools/components/tools-page.tsx
```

这个模式的重点是：

```text
页面不直接碰数据库。
React 展示组件不直接懂 Payload。
Payload 文档通过 mapper 转成前端展示类型。
```

这样前端组件不会被后端数据结构锁死。

## Payload API 有哪几种

当前项目里 Payload 提供三类使用方式。

第一类是 Admin 后台：

```text
http://localhost:3000/admin
```

用于人工创建、编辑、删除内容。

第二类是 REST API：

```text
/api/[...slug]
```

例如 Tools collection 理论上可以通过类似下面的接口访问：

```text
/api/tools
```

这个适合外部系统或浏览器端需要 HTTP API 时使用。

第三类是 GraphQL API：

```text
/api/graphql
```

当前暂时没有重点使用。

第四类是 Local API：

```ts
const payload = await getPayloadClient();
await payload.find({ collection: "tools" });
```

这是当前前台 Server Components 最适合用的方式。

因为 `/tools` 是服务端渲染，可以直接在服务器端调用 Payload local API，不需要绕一圈 HTTP。

当前推荐：

```text
Next.js Server Component / server function
  优先用 Payload local API

外部调用或未来开放接口
  再考虑 REST API 或 GraphQL API
```

## 后端 CRUD 如何开发

Payload 的标准 CRUD 不是先写 controller，而是先写 collection。

例如 Tools：

```text
src/payload/collections/tools.ts
```

这里定义：

```text
slug
字段
权限
Admin 显示方式
默认列
排序字段
```

Payload 根据 collection 自动提供：

```text
Admin CRUD 页面
REST CRUD API
GraphQL schema
Local API CRUD 方法
PostgreSQL 表结构同步
```

所以后端 CRUD 的标准流程是：

```text
1. 设计 collection 字段
2. 在 src/payload/collections 里实现 collection config
3. 在 payload.config.ts 注册 collection
4. 启动 pnpm dev，让 Payload 同步 schema
5. 打开 /admin 测试后台 CRUD
6. 写 src/server/... 读取函数
7. 写 mapper 转换成前端类型
8. 接到 feature 页面
9. 跑验证命令
```

不要一开始就自己写数据库 SQL。

第一版应该尽量让 Payload 管数据建模和 CRUD。

## 新增一个 CMS 页面时的标准流程

假设后面要把 `/reviews` 接入 Payload。

推荐流程：

```text
1. 新增 src/payload/collections/reviews.ts
2. 在 payload.config.ts 注册 Reviews
3. 确认 /admin 出现 Reviews
4. 手动创建 1-2 条 review 数据
5. 新增 src/server/reviews/get-reviews.ts
6. 新增 src/features/reviews/types/review-item.ts
7. 新增 mapper，把 Payload Review 转成 ReviewItem
8. 修改 src/app/(site)/reviews/page.tsx 读取真实数据
9. 保留 fallback 或空状态
10. 跑 typecheck / lint / build
```

每次只接一个 collection。

每次只做一个最小闭环。

## 新增字段时的标准流程

比如给 Tools 增加一个字段：

```text
icon
```

推荐流程：

```text
1. 修改 src/payload/collections/tools.ts
2. 启动 pnpm dev
3. 进入 /admin 查看字段是否出现
4. 创建或修改一条 Tools 数据
5. 修改 mapper
6. 修改 ToolkitItem 类型
7. 修改 ToolsPage 展示组件
8. 跑 pnpm typecheck
9. 跑 pnpm lint
10. 跑 pnpm build
```

顺序很重要：先确认后台字段存在，再接前台。

## 前端组件如何写

前端组件尽量放在对应 feature 里：

```text
src/features/tools/components
src/features/reviews/components
src/features/games/components
```

组件分工建议：

```text
page component
  组合页面整体。

card / list / section component
  负责局部展示。

data
  只放 fallback 或前端静态草稿数据。

types
  放前端展示类型。

utils
  放 mapper 或 feature 内部工具函数。
```

前端组件不要直接 import Payload collection 类型，也不要直接调用 `getPayloadClient()`。

推荐边界：

```text
src/server
  懂 Payload。

src/features
  懂前端展示。

mapper
  负责把 Payload 文档转成前端展示数据。
```

## Server 层如何写

服务端读取逻辑放在：

```text
src/server
```

例如：

```text
src/server/tools/get-tools.ts
```

它负责：

```text
调用 Payload local API
处理排序、limit、where
处理错误 fallback
返回前端需要的数据
```

不要把这些逻辑写进 React 展示组件。

这样以后你要换数据源、加缓存、加权限判断，都可以在 server 层处理。

## Mapper 为什么重要

Payload 的数据库文档可能长这样：

```text
id
title
description
url
category
sortOrder
createdAt
updatedAt
```

前端 Tools 页面需要的是：

```text
id
title
postedOn
summary
links
```

这两个结构不一样，所以需要 mapper：

```text
mapToolDocumentToToolkitItem
```

mapper 的作用是隔离后端和前端：

```text
后端字段改动
  先改 mapper

前端展示改动
  先改前端类型和组件
```

不要让组件直接依赖 Payload 原始文档。

## 写功能时的推荐节奏

以后每次写功能，建议按这个顺序：

```text
1. 明确这是前端展示功能，还是 CMS 数据功能
2. 如果需要数据，先设计 collection
3. 在 Payload Admin 里手动验证 CRUD
4. 写 server 读取函数
5. 写 mapper
6. 写前端组件
7. 接 route
8. 跑验证命令
9. 记录文档
```

不要一边写 UI，一边写数据库，一边改 Docker。

一次只解决一个层的问题。

## 验证命令

最常用的健康检查：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

如果 `.next` 生成类型出奇怪错误，可以清理：

```bash
sudo rm -rf .next
pnpm typecheck
```

如果 `node_modules` 权限异常，可以清理：

```bash
sudo rm -rf node_modules .pnpm-store
pnpm install
```

这两个目录都是生成产物，不是源码。

## 数据库相关命令

启动数据库：

```bash
docker compose up -d postgres
```

查看容器：

```bash
docker ps
```

停止数据库：

```bash
docker compose stop postgres
```

删除当前 DinD 内部数据库容器和 volume：

```bash
docker compose down -v
```

注意：`down -v` 会删除数据库数据。只有确定不要当前开发数据时再执行。

## Payload 后台使用流程

第一次新数据库：

```text
1. pnpm dev
2. 打开 /admin
3. 创建第一个管理员账号
4. 进入 Collections
5. 查看 Users / Tools
6. 手动创建或编辑内容
```

Tools seed：

```bash
pnpm seed:tools
```

seed 只是开发辅助，不是正式业务接口。

## 什么时候写自定义 API

当前阶段优先使用 Payload 自动生成能力：

```text
Admin CRUD
REST API
Local API
GraphQL API
```

只有在这些不够用时，再写自定义 Next route handler。

适合自定义 API 的情况：

```text
表单提交
第三方 webhook
复杂聚合接口
需要隐藏内部 Payload 结构的公开接口
特殊权限逻辑
```

不适合自定义 API 的情况：

```text
只是读取一组 posts
只是展示 tools
只是后台编辑内容
只是普通 CRUD
```

这些交给 Payload 就好。

## 当前最重要的心智模型

可以把项目理解成四层：

```text
App Router
  负责 URL 和页面入口。

Features
  负责前台 UI 和展示模型。

Server
  负责从 Payload 读取数据，并整理给前台。

Payload
  负责 CMS 后台、CRUD、权限、数据库模型。

PostgreSQL
  负责最终存储。
```

数据流是：

```text
Payload Admin
  -> Collection
  -> PostgreSQL
  -> Payload local API
  -> src/server
  -> mapper
  -> src/features
  -> src/app route
  -> Browser
```

写功能时，要先想清楚自己正在改哪一层。

## 下一阶段建议

下一阶段不要先大改 UI，也不要马上做复杂认证。

推荐顺序：

```text
1. 确认 Docker-in-Docker 日常流程稳定
2. 确认 /admin 能稳定 CRUD Tools
3. 把 Reviews 接成 Payload collection
4. 把 Games 接成 Payload collection
5. 再接 Media collection
6. 再考虑 Payload generated types
7. 最后考虑 VPS / Coolify 部署
```

这样项目会一步一步变完整，不会把前端、后端、数据库、部署一次性搅在一起。

## 第一次架构风险收敛记录

这次 review 后做了一轮小范围修正，目标不是新增业务功能，而是把当前工程从“能跑”整理到“更不容易误操作、更接近可部署”。

### 1. Dockerfile 构建期环境变量

问题：

`Dockerfile` 会在镜像构建阶段执行 `pnpm build`，但是 `.dockerignore` 会排除 `.env`。同时，`compose.yaml` 里的 `environment` 只在容器运行时生效，不会自动传给镜像 build 阶段。

处理：

在 `Dockerfile` 的 builder 阶段只加入：

```text
SKIP_ENV_VALIDATION
```

然后在 `payload.config.ts` 中判断这个开关。构建阶段使用内部占位值完成配置校验，运行阶段仍然必须从真实环境变量读取 `DATABASE_URI` 和 `PAYLOAD_SECRET`。

为什么这么做：

构建镜像和运行容器是两个阶段。构建阶段只需要“合法的配置形状”让代码编译通过；运行阶段才需要真实数据库地址和真实 secret。这样可以避免 Docker build 因为缺少 `.env` 失败，同时也避免把 secret 写进 Dockerfile 的 `ARG` / `ENV`。

### 2. compose.yaml 不再硬编码生产 secret

问题：

之前 `compose.yaml` 里直接写了本地 `PAYLOAD_SECRET` 和数据库默认值。作为本地学习可以，但如果以后把同一个文件交给 Coolify/VPS 使用，就容易误把开发 secret 当生产 secret。

处理：

`PAYLOAD_SECRET` 改成必须从外部环境变量读取：

```text
PAYLOAD_SECRET: ${PAYLOAD_SECRET:?PAYLOAD_SECRET is required}
```

数据库名、用户名、密码保留本地默认值，但也支持外部覆盖：

```text
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
```

为什么这么做：

本地开发要方便，生产部署要明确。`PAYLOAD_SECRET` 是真正的应用密钥，不能在部署模板里写死；数据库默认值则可以作为本地开发兜底，到了 VPS/Coolify 再用面板环境变量覆盖。

### 3. seed 接口改成显式开关

问题：

`/api/dev/seed-tools` 会写数据库。之前它只在 `NODE_ENV === "production"` 时关闭，这意味着只要某个非生产环境暴露到公网，就可能被别人触发写入。

处理：

新增环境变量：

```text
ENABLE_DEV_SEED=true
```

只有同时满足：

```text
NODE_ENV !== "production"
ENABLE_DEV_SEED === true
```

seed 接口才会工作。

为什么这么做：

写数据库的开发接口必须显式打开。这样你本地 `.env` 可以设置 `ENABLE_DEV_SEED=true`，继续使用 `pnpm seed:tools`；但 `.env.example` 默认是 `false`，别人拿到项目不会无意中开启写入接口。

### 4. /tools 不再在生产环境静默回退

问题：

`/tools` 从 Payload 读取失败时会回退到本地 `toolkitItems`。这对早期开发很友好，但生产环境如果数据库坏了，页面还显示假数据，会掩盖真正的问题。

处理：

保留开发环境 fallback：

```text
development/test: 数据库失败时使用本地 fallback
production: 数据库失败时抛出错误
```

为什么这么做：

开发环境重视“不被数据库打断”；生产环境重视“错误要暴露”。这两个目标不一样，所以不能用同一套行为。

### 5. Payload 类型生成进入标准流程

问题：

之前 `/tools` 的 Payload 文档类型是手写的，字段一多就容易和 CMS collection 脱节。

处理：

新增脚本：

```bash
pnpm payload:types
```

它会根据 `payload.config.ts` 和 collections 生成：

```text
src/payload/payload-types.ts
```

`map-tool-document-to-toolkit-item.ts` 现在从这个生成文件里读取 `Tool` 类型，再映射成前端真正需要的 `ToolkitItem`。

为什么这么做：

Payload collection 是后端数据结构的来源。前端不应该自己猜 Payload 字段，而应该使用 Payload 生成的类型，再通过 mapper 转成页面组件需要的结构。

### 6. package.json 标记为 ESM

问题：

Payload CLI 在生成类型时，需要加载 `payload.config.ts`，而这个 config 又会继续导入 `src/payload/collections/*.ts`。在当前 Node / Payload / TypeScript 组合下，如果项目没有明确标记 ESM，CLI 容易在 ESM 和 CJS 边界上出错。

处理：

在 `package.json` 中加入：

```json
"type": "module"
```

并让 `payload:types` 使用 Payload 官方支持的 SWC 路径：

```bash
payload generate:types --use-swc
```

因此新增了开发依赖：

```text
@swc-node/register
@swc/core
```

为什么这么做：

这是为了让 Payload CLI、Next.js 配置、TypeScript source files 都按一致的模块规则运行。这个改动不属于业务功能，而是让“生成类型”这条工具链稳定。

### 7. 当前推荐工作流

每次修改 Payload collection 后：

```bash
pnpm payload:types
pnpm typecheck
```

每次改前端页面或 server 数据流后：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
```

准备提交前：

```bash
pnpm build
```

如果要重新写入本地示例 Tools 数据：

```bash
pnpm dev
pnpm seed:tools
```

注意：`pnpm seed:tools` 需要本地 `.env` 里有：

```text
ENABLE_DEV_SEED=true
```
