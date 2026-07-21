# Payload + PostgreSQL 最小闭环计划

> **历史记录（非当前事实源）**：本文保留 Payload + PostgreSQL 最小闭环从计划到实现的过程。前半部分的“下一阶段”“尚未连接”等表述只描述当时状态；当前进度与操作边界以 [CODEX_HANDOFF.md](./CODEX_HANDOFF.md) 和 [current-project-status.md](./current-project-status.md) 为准。

这份笔记说明下一阶段要做什么：用最少的数据跑通完整链路。

目标不是一次性做完整 CMS，也不是马上把所有页面都接后端。目标是：

```text
Docker 里的 PostgreSQL
  -> Payload CMS
  -> Payload Admin 后台
  -> 1-2 条真实内容
  -> 类型安全的数据获取
  -> feature adapter
  -> 前端页面展示
```

只要这条链路跑通，后面扩展 Reviews、Games、About、Media 都只是重复这个模式。

## 为什么先做最小闭环

现在项目已经完成：

- 工程化底座。
- Dev Container。
- Dockerfile。
- 前端页面骨架。
- Typesafe env。
- `process.env` lint rule。

下一步最容易犯的错是：一次性设计很多 collection、很多字段、很多页面，然后调试时不知道哪里坏了。

所以第一版只做：

```text
一个最小 Collection
一两条真实数据
一个前端页面读取数据
```

建议第一个接后端的页面是：

```text
/tools
```

原因：

- Tools 页面当前数据结构最简单。
- 不需要 rich text。
- 不需要详情页。
- 不需要复杂关系字段。
- 很适合作为 Payload + Postgres 的第一条测试链路。

## 官方资料确认

Payload 官方文档说明，Payload 可以作为 Next.js fullstack framework 使用，提供 Admin Panel、数据库、REST / GraphQL API、认证、权限、文件上传等能力。

Payload 当前安装到已有 Next.js 应用时，需要安装：

```bash
pnpm i payload @payloadcms/next
```

使用 PostgreSQL 时，还需要：

```bash
pnpm i @payloadcms/db-postgres
```

Payload 官方文档也说明，Postgres adapter 使用 `postgresAdapter`，并通过 `pool.connectionString` 连接数据库。

官方安装文档还提到，Payload 需要 Node.js 20.9+，并且支持 Next.js 16.2.6+。我们当前项目是 Node 22 和 Next.js 16.2.7，方向上是匹配的。

## 最小数据选型

第一条链路建议做 `Tools` collection。

Payload 后台里只需要创建 1-2 条工具数据，例如：

```text
Textractor
Locale Emulator
```

每条数据只需要这些字段：

```ts
type Tool = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: "text-hooking" | "runtime" | "database" | "capture";
  sortOrder: number;
};
```

注意：这是概念类型。真正 Payload collection 里会用 Payload 的字段配置来定义。

## 数据从哪里到哪里

完整流向应该是：

```text
1. PostgreSQL container
   保存真实数据

2. Payload CMS
   定义 Tools collection
   提供 Admin 后台
   提供 Node API / REST API

3. Payload Admin
   用户手动创建 1-2 条工具数据

4. server data function
   在服务端调用 Payload Local API 查询 tools

5. adapter
   把 Payload 原始文档转成前端展示类型

6. feature page
   把展示类型传给组件

7. ToolsPage
   渲染页面
```

可以画成这样：

```text
Admin 手动录入
  ↓
Payload Tools Collection
  ↓
PostgreSQL
  ↓
server/tools/get-tools.ts
  ↓
Tool document -> ToolkitItem adapter
  ↓
features/tools/components/tools-page.tsx
  ↓
/tools 页面
```

## 为什么要有 adapter

不要让前端组件直接依赖 Payload 原始字段。

不推荐：

```text
ToolsPage 直接吃 Payload Document
```

推荐：

```text
Payload Document
  -> adapter
  -> ToolkitItem
  -> ToolsPage
```

原因是 Payload 生成的类型可能包含：

- `id`
- `createdAt`
- `updatedAt`
- 关系字段
- upload 字段
- draft / status 字段
- Payload 内部类型细节

前端页面不应该关心这些。

前端只需要：

```ts
type ToolkitItem = {
  id: string;
  title: string;
  postedOn: string;
  summary: string;
  links: Array<{
    label: string;
    href: string;
    note: string;
  }>;
};
```

所以 adapter 的职责是：

```text
把 CMS 数据翻译成前端页面真正需要的数据。
```

## 按 bulletproof-react 思路放在哪里

我们继续保持 feature-first。

Payload 后端配置建议放在专门区域：

```text
payload.config.ts
src/payload/collections/tools.ts
src/payload/collections/users.ts
src/payload/collections/media.ts
```

服务端数据获取放在：

```text
src/server/payload/get-payload.ts
src/server/tools/get-tools.ts
```

前端 feature 继续放在：

```text
src/features/tools
```

建议结构：

```text
payload.config.ts

src/payload/
  collections/
    tools.ts
    users.ts
    media.ts

src/server/
  payload/
    get-payload.ts
  tools/
    get-tools.ts

src/features/tools/
  components/
    tools-page.tsx
    tools-sidebar.tsx
  data/
    toolkit-items.ts
  types/
    toolkit-item.ts
  utils/
    map-tool-document-to-toolkit-item.ts
```

解释：

- `src/payload`：Payload 后台和 collection 定义。
- `src/server`：服务端读取数据，不放 UI。
- `src/features/tools`：Tools 页面自己的展示类型、组件和 adapter。
- `src/app/tools/page.tsx`：路由入口，只调用 feature 页面。

这样就不会把 Payload、数据库查询和 UI 混在一个组件里。

## Docker Postgres 应该怎么进入链路

当前 `compose.yaml` 只有 `web` 服务。

下一步要加入：

```text
postgres
postgres-data volume
```

概念上会变成：

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: kita
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

这里最重要的是 volume：

```text
postgres-data
```

它负责保存数据库数据。否则容器删掉后，数据库里的内容也会消失。

## DATABASE_URI 怎么理解

当前 `.env.example` 里有：

```env
DATABASE_URI=postgres://postgres:postgres@postgres:5432/kita
```

这里的 `postgres` 主机名，适合在 Docker Compose 网络内部使用。

如果你在宿主机直接连接数据库，可能会看到：

```env
postgres://postgres:postgres@localhost:5432/kita
```

这两者区别是：

```text
postgres
  Docker Compose 服务名。
  容器之间互相访问时使用。

localhost
  当前机器自己。
  宿主机访问映射端口时使用。
```

因为我们的开发环境有 Dev Container，需要实际实施时确认：

```text
Next/Payload 是在 Dev Container 里跑
Postgres 是 compose 服务
```

如果它们在同一个 Docker 网络里，通常用服务名 `postgres`。

如果 Next/Payload 从宿主机连数据库，通常用 `localhost`。

## Typesafe env 如何参与

我们已经有：

```text
src/config/env.ts
```

下一步 Payload 配置里不应该直接写：

```ts
process.env.DATABASE_URI;
process.env.PAYLOAD_SECRET;
```

而应该用：

```ts
import { env } from "@/config/env";

env.DATABASE_URI;
env.PAYLOAD_SECRET;
```

这样如果变量缺失或格式错误，会更早报错。

但要注意：Payload config、Next config、路径别名和 ESM 环境之间可能有兼容细节。真正实现时，如果 `payload.config.ts` 直接 import `@/config/env` 出现解析问题，可以调整为相对路径或专门的 env 文件。

原则不变：

```text
环境变量集中校验，不到处 process.env。
```

## Payload Admin 需要什么

Payload Admin 是后台管理界面。

官方安装文档说明，接入 Payload 后可以访问：

```text
http://localhost:3000/admin
```

第一次进入时会创建第一个 Payload 用户。

为了有 Admin 登录，通常需要一个 `Users` collection：

```text
Users
  email
  password
```

第一版不用做复杂权限。

建议最小权限策略是：

```text
Admin 可以管理 Tools。
前台只读取 Tools。
```

## Payload 类型安全怎么做

Payload 可以基于 collection 生成类型。

我们需要的类型层次大概是：

```text
Payload generated type:
  Tool

Frontend display type:
  ToolkitItem
```

不要把它们混成一个。

推荐数据转换：

```ts
function mapToolDocumentToToolkitItem(tool: Tool): ToolkitItem {
  return {
    id: tool.id,
    title: tool.title,
    postedOn: tool.updatedAt,
    summary: tool.description,
    links: [
      {
        label: tool.title,
        href: tool.url,
        note: tool.description,
      },
    ],
  };
}
```

这只是示意，不是最终代码。

关键思想是：

```text
后端类型负责描述 CMS 文档。
前端类型负责描述页面显示。
adapter 负责翻译。
```

## 前端页面如何接收数据

当前 `/tools` 页面数据来自：

```text
src/features/tools/data/toolkit-items.ts
```

以后可以改成：

```text
src/app/tools/page.tsx
  -> getTools()
  -> <ToolsPage items={items} />
```

概念代码：

```tsx
import { ToolsPage } from "@/features/tools/components/tools-page";
import { getTools } from "@/server/tools/get-tools";

export default async function ToolsRoutePage() {
  const tools = await getTools();

  return <ToolsPage items={tools} />;
}
```

`ToolsPage` 不关心数据来自 mock 还是 Payload：

```tsx
type ToolsPageProps = {
  items: ToolkitItem[];
};
```

这样以后切换数据来源很简单。

## 最小闭环验收标准

第一阶段只要做到这些就算成功：

```text
1. docker compose 能启动 PostgreSQL
2. Payload 能连接 PostgreSQL
3. /admin 能打开
4. 能创建第一个 admin 用户
5. 能在 Admin 里创建 1-2 条 Tools 数据
6. 数据能保存到 PostgreSQL
7. /tools 页面能读取这 1-2 条数据
8. TypeScript 能通过
9. ESLint 能通过
10. pnpm build 能通过
```

这就是完整链路。

## 不在第一版做什么

第一版不要做：

- 复杂权限。
- 多角色用户。
- Reviews 富文本正文。
- Games 详情页。
- 图片上传。
- S3 / MinIO。
- 生产部署。
- Coolify。
- GitHub Actions。
- Drizzle。
- NextAuth。

这些以后都可以做，但不应该压进第一个数据库闭环。

## 实施时大概会修改哪些文件

可能会修改：

```text
package.json
pnpm-lock.yaml
compose.yaml
.env.example
src/config/env.ts
next.config.ts
tsconfig.json
src/app/tools/page.tsx
src/features/tools/components/tools-page.tsx
```

可能会新增：

```text
payload.config.ts
src/app/(payload)/*
src/payload/collections/users.ts
src/payload/collections/tools.ts
src/payload/collections/media.ts
src/server/payload/get-payload.ts
src/server/tools/get-tools.ts
src/features/tools/types/toolkit-item.ts
src/features/tools/utils/map-tool-document-to-toolkit-item.ts
```

这里的 `src/app/(payload)/*` 需要根据 Payload 官方 blank template 和当前版本来复制。官方文档说 Payload 需要在 `/app` 目录中放置 Payload 所需文件，通常会放在 route group 里。

## 推荐的执行顺序

真正开始写代码时，建议这样做：

```text
1. 安装 Payload 依赖
2. compose.yaml 加 postgres
3. 确认数据库能启动
4. 加 payload.config.ts
5. 加 Users / Tools collection
6. 加 Payload route group
7. 配置 withPayload
8. 配置 tsconfig 的 @payload-config
9. 启动 pnpm dev
10. 打开 /admin 创建用户
11. 创建 1-2 条 Tools 数据
12. 写 getTools server function
13. 写 adapter
14. 让 /tools 读取真实数据
15. 跑 format/lint/typecheck/build
```

每一步都应该小步验证，不要一次性全部写完才运行。

## 当前最重要的心智模型

你可以把整个系统理解成：

```text
PostgreSQL
  是数据库，只负责保存数据。

Payload
  是 CMS 后端，负责 Admin、Collections、CRUD、API、类型。

src/server
  是我们自己的服务端读取层，负责从 Payload 拿数据。

src/features
  是前端展示层，负责页面组件和展示类型。

src/app
  是 Next.js 路由入口。
```

数据流是：

```text
Admin 输入内容
  -> Payload Collection
  -> PostgreSQL 保存
  -> server function 查询
  -> adapter 转换
  -> feature component 渲染
  -> 用户在浏览器看到页面
```

这个模型跑通之后，后面所有页面都可以按这个模式扩展。

## 下一步建议

下一步可以正式开始实现最小闭环。

建议第一句话目标写成：

```text
请实现 Payload + PostgreSQL 最小闭环，只创建 Users 和 Tools collections，并让 /tools 页面读取 1-2 条真实 Tools 数据。
```

这个目标足够小，但覆盖了完整链路。

## 参考资料

- Payload 文档：<https://payloadcms.com/docs>
- Payload 安装文档：<https://payloadcms.com/docs/getting-started/installation>
- Payload PostgreSQL 文档：<https://payloadcms.com/docs/database/postgres>
- bulletproof-react 项目结构：<https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md>

## 实现记录：Payload + PostgreSQL 最小闭环

本轮已经按“先跑通链路，不扩展业务”的原则完成了最小闭环：

```text
Docker PostgreSQL
  -> Payload CMS collections
  -> Next.js server function
  -> /tools 页面
```

这次只创建了两个 collections：

```text
Users
Tools
```

没有接 Auth.js，没有接 Drizzle，没有写复杂业务功能，也没有把 reviews/games 先接入数据库。

### 安装了什么

新增运行依赖：

```text
payload
@payloadcms/next
@payloadcms/db-postgres
sharp
```

作用分别是：

```text
payload
  Payload CMS 核心。

@payloadcms/next
  让 Payload Admin、REST API、GraphQL API 可以挂到 Next.js App Router 里。

@payloadcms/db-postgres
  让 Payload 使用 PostgreSQL 作为数据库。

sharp
  Payload 处理图片/媒体时常用的图像处理依赖。
  当前还没有创建 Media collection，所以配置里暂时没有启用它。
```

`sharp` 先装着但不急着配置，是因为第一阶段只做 Users 和 Tools。等后面接 Media collection 时再把它正式接进 `payload.config.ts`，会更容易理解。

### Docker PostgreSQL 做了什么

`compose.yaml` 里新增了 `postgres` 服务：

```text
postgres:
  image: postgres:16
  ports:
    - "5432:5432"
  environment:
    POSTGRES_DB: kita
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  volumes:
    - postgres-data:/var/lib/postgresql/data
```

这里的意思是：

```text
image: postgres:16
  使用官方 PostgreSQL 16 镜像。

ports: "5432:5432"
  把容器里的 5432 暴露到本机/宿主 Docker 网络。

POSTGRES_DB: kita
  默认创建 kita 数据库。

POSTGRES_USER / POSTGRES_PASSWORD
  本地开发账号密码，方便第一版调试。

postgres-data volume
  让数据库数据保存在 Docker volume 里。
  容器删除后，只要 volume 不删，数据还在。
```

本地 Dev Container 里的 Next/Payload 连接 Docker Desktop 里的 Postgres 时，`.env` 使用的是：

```env
DATABASE_URI=postgres://postgres:postgres@host.docker.internal:5432/kita
```

原因是：Next.js 运行在 Dev Container 里，而 PostgreSQL 是 Docker Desktop 管理的另一个容器。`host.docker.internal` 可以让开发容器访问宿主 Docker 暴露出来的端口。

### Payload 配置做了什么

新增了根目录文件：

```text
payload.config.ts
```

它负责告诉 Payload：

```text
1. 后台登录用户用哪个 collection
2. 项目有哪些 collections
3. 数据库怎么连接
4. secret 从哪里读取
5. Payload 类型文件以后输出到哪里
```

核心结构是：

```text
admin.user = users
collections = [Users, Tools]
db = postgresAdapter(...)
secret = PAYLOAD_SECRET
typescript.outputFile = src/payload/payload-types.ts
```

这里有一个重要细节：`payload.config.ts` 会被 Next.js 读取，也会被 Payload CLI 读取。所以它没有直接复用 `src/config/env.ts`，而是在文件内部用 `zod` 对 `DATABASE_URI` 和 `PAYLOAD_SECRET` 做一次最小校验。

这样做的原因是：

```text
src/config/env.ts
  更偏 Next.js 应用运行时。

payload.config.ts
  既要服务 Next，也要服务 Payload 自己的 CLI 和后台。
```

这不是两套业务配置，而是为了让工具链边界更清楚。

### Collections 放在哪里

新增目录：

```text
src/payload/collections
```

当前文件：

```text
src/payload/collections/users.ts
src/payload/collections/tools.ts
```

`users.ts`：

```text
slug: users
auth: true
useAsTitle: email
```

它是 Payload Admin 登录用的用户表。现在没有额外字段，因为第一版只需要后台能有用户系统。

`tools.ts`：

```text
slug: tools
read: public
fields:
  title
  description
  url
  category
  sortOrder
```

这里的设计很克制：

```text
title
  工具名称。

description
  工具说明。

url
  外部链接。

category
  工具分类，先用 select 固定几个值，避免后台随手写乱。

sortOrder
  前台排序字段。
```

`read: public` 的意思是前台可以读取 Tools 数据。创建、修改、删除仍然交给 Payload Admin，不开放给普通访问者。

### Payload 路由挂在哪里

新增 route group：

```text
src/app/(payload)
```

它不会改变 URL 里的路径，只是帮我们在 App Router 里组织 Payload 相关路由。

里面主要有：

```text
src/app/(payload)/admin/[[...segments]]/page.tsx
src/app/(payload)/api/[...slug]/route.ts
src/app/(payload)/api/graphql/route.ts
src/app/(payload)/layout.tsx
src/app/(payload)/admin/importMap.ts
```

对应关系是：

```text
/admin
  Payload 后台页面。

/api/[...slug]
  Payload REST API。

/api/graphql
  Payload GraphQL API。

layout.tsx
  Payload Admin 所需的 RootLayout、server functions、import map。

importMap.ts
  Payload Admin 自定义组件映射。
  当前没有自定义 admin 组件，所以是空对象。
```

`next.config.ts` 也接入了：

```text
withPayload(nextConfig)
```

这是 Payload 和 Next.js 集成的关键包装器。

### /tools 页面如何读取真实数据

这次没有让 React 组件自己去懂 Payload，也没有在组件里写数据库逻辑。

实际数据链路是：

```text
src/app/tools/page.tsx
  -> getTools()
  -> Payload local API
  -> PostgreSQL tools 表
  -> mapToolDocumentToToolkitItem()
  -> ToolsPage 组件
```

对应文件：

```text
src/server/payload/get-payload.ts
src/server/tools/get-tools.ts
src/features/tools/utils/map-tool-document-to-toolkit-item.ts
src/features/tools/types/toolkit-item.ts
src/features/tools/components/tools-page.tsx
src/app/tools/page.tsx
```

职责拆分如下：

```text
src/server/payload/get-payload.ts
  创建 Payload local API client。

src/server/tools/get-tools.ts
  服务端读取 Tools collection。
  如果数据库暂时不可用或没有数据，则回退到本地 toolkitItems。

map-tool-document-to-toolkit-item.ts
  把 Payload 的 Tool 文档转换成前端页面需要的 ToolkitItem。

toolkit-item.ts
  定义前端展示层需要的数据形状。

tools-page.tsx
  只负责渲染 items，不关心数据来自数据库还是 fallback。

src/app/tools/page.tsx
  Next.js 路由入口，负责调用 getTools，然后把结果传给展示组件。
```

这个结构参考了 bulletproof-react 的思想：

```text
features/tools
  放工具页面自己的展示组件、展示类型、映射函数、本地 fallback 数据。

server/tools
  放服务端读取逻辑。

payload/collections
  放 CMS 数据模型。

app/tools
  放 Next.js 路由入口。
```

这样以后要把 `/reviews` 或 `/games` 接到 Payload，也可以复制这个模式，而不是把数据库查询塞进组件里。

### 为什么 /tools 是 dynamic

`src/app/tools/page.tsx` 中设置了：

```ts
export const dynamic = "force-dynamic";
```

意思是：

```text
/tools 不是构建时生成一份死页面。
每次请求时，它可以去服务器端读取 Payload/Postgres 数据。
```

这对 CMS 页面很重要。否则你在后台改了 Tools，前台可能仍然看到构建时的旧内容。

### 为什么保留 fallback 数据

`getTools()` 里保留了本地 `toolkitItems` fallback。

这不是最终业务方案，而是第一阶段很实用：

```text
数据库没启动
Payload 初始化失败
Tools collection 暂时没有数据
```

遇到这些情况时，`/tools` 仍然可以显示页面，不会因为后端没准备好就白屏。

等后面进入正式内容阶段，可以决定是否去掉 fallback，改成空状态或错误页面。

### 种子数据如何写入

新增了开发用 seed 路由：

```text
src/app/api/dev/seed-tools/route.ts
```

它只在非 production 环境可用。当前写入两条 Tools 数据：

```text
Textractor
VNDB
```

执行方式：

```bash
pnpm dev
pnpm seed:tools
```

`package.json` 中新增脚本：

```json
"seed:tools": "curl -X POST http://localhost:3000/api/dev/seed-tools"
```

本轮已经实际写入 Docker PostgreSQL，并用 SQL 验证过：

```text
id | title      | category     | sort_order
1  | Textractor | text-hooking | 10
2  | VNDB       | database     | 20
```

### 当前验证结果

已通过：

```bash
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm build` 中可以看到：

```text
/admin/[[...segments]]     Dynamic
/api/[...slug]             Dynamic
/api/dev/seed-tools        Dynamic
/api/graphql               Dynamic
/tools                     Dynamic
```

这说明 Payload Admin、Payload API、seed route 和 `/tools` 都已经进入 Next.js App Router 的动态服务端路由体系。

### 关于 Payload generated types

`payload.config.ts` 已经配置了：

```text
typescript.outputFile = src/payload/payload-types.ts
```

也就是说，后续 Payload 生成的 collection 类型会放到这里。

本轮尝试过生成类型，但当前 `Payload CLI + Next 16 + TS collection 文件导入` 这条链路在本地环境里还有兼容细节，暂时没有把 `payload-types.ts` 作为必须产物纳入闭环。

当前代码仍然有类型安全边界：

```text
Payload collection config
  约束后台字段。

ToolkitItem
  约束前台展示数据。

mapToolDocumentToToolkitItem
  明确处理 Payload 数据到前台数据的转换。
```

等 Users/Tools 字段稳定后，再单独解决 Payload CLI 类型生成，会比现在为了工具命令强行打散目录结构更稳。

### 现在应该如何理解完整数据流

可以这样记：

```text
1. PostgreSQL 只是存数据。
2. Payload 定义 Users/Tools 的数据模型，并提供 Admin + API。
3. Next.js 的 /tools 页面不直接碰数据库。
4. /tools 通过 src/server/tools/get-tools.ts 读取 Payload。
5. Payload local API 从 PostgreSQL 拿数据。
6. mapper 把后端文档转换成前端展示数据。
7. ToolsPage 只负责渲染。
```

用图表示就是：

```text
Payload Admin
  -> Tools Collection
  -> PostgreSQL tools table
  -> getPayloadClient()
  -> getTools()
  -> mapToolDocumentToToolkitItem()
  -> ToolsPage
  -> Browser
```

这就是本项目第一条真正跑通的 CMS 数据链路。

## 实现记录：迁移到 Docker-in-Docker 开发数据库

今天我们把本地数据库运行方式从“外层 Docker Desktop 里的兄弟容器”调整成了“Dev Container 内部 Docker 管理的数据库容器”。这个选择不是为了炫技，而是为了让日常开发流程更统一。

### 迁移前是什么结构

迁移前，我们用 Windows PowerShell 执行：

```powershell
docker compose up -d postgres
```

当时的结构是：

```text
Windows
  Docker Desktop
    Dev Container: kita
    Postgres Container: kita-postgres-1
```

也就是说：

```text
Dev Container 和 Postgres 是兄弟容器。
```

这种方式能用，也很常见。问题是每天开发时要在两个地方切换：

```text
PowerShell
  启动数据库

Dev Container terminal
  启动 pnpm dev
```

对刚开始学习 Docker 的阶段来说，这种切换容易让人忘记“这个命令到底应该在哪个终端执行”。

### 迁移后是什么结构

现在我们改成了 Docker-in-Docker。新的结构可以理解成：

```text
Windows
  Docker Desktop
    Dev Container: kita
      inner Docker daemon
        Postgres Container
```

也就是说：

```text
开发容器里有 Docker 能力。
数据库容器由 Dev Container 内部的 Docker 管理。
```

以后日常命令都在 Dev Container 终端里执行：

```bash
docker compose up -d postgres
pnpm dev
pnpm seed:tools
```

这更接近 CJ 视频里强调的思路：

```text
打开项目
Reopen in Container
开发命令都在容器里完成
```

### 为什么选择 Docker-in-Docker

这次选择 Docker-in-Docker，主要是为了这些目标：

```text
1. 开发入口统一
2. 减少 PowerShell 和 Dev Container 之间来回切换
3. 让项目相关服务更集中在开发容器体系里
4. 更符合 CJ 的 Dev Container 学习路线
5. 数据库是测试数据，迁移成本很低
```

我们没有选择 Docker-in-Docker 是因为它“更高级”，而是因为当前项目很适合：

```text
旧数据库里只有一个 Payload 管理员和两条 Tools seed 数据。
丢掉旧数据库没有实际成本。
```

所以现在切换比以后内容多了再切换更轻松。

### 为什么没有用 docker-outside-of-docker

`docker-outside-of-docker` 也能让 Dev Container 里执行 Docker 命令，但它本质上仍然是在控制外层 Docker Desktop。

结构还是：

```text
Windows
  Docker Desktop
    Dev Container
    Postgres Container
```

它的优点是简单、稳定、容易排查。

但它没有改变数据库容器的位置，只是把命令入口从 PowerShell 搬到了 Dev Container 终端。

这次我们更想按 CJ 的思路学习完整容器化开发环境，所以选择了 Docker-in-Docker。

### 实际改了哪些文件

改动了：

```text
.devcontainer/devcontainer.json
.env
.env.example
```

`.devcontainer/devcontainer.json` 加了：

```json
"features": {
  "ghcr.io/devcontainers/features/docker-in-docker:3": {}
}
```

这里使用的是官方当前的 `docker-in-docker:3` feature。CJ 视频里可能是旧版本号，但思路一样。

同时 `postCreateCommand` 改成：

```json
"postCreateCommand": "sudo corepack enable && pnpm install"
```

原因是 `corepack enable` 会尝试写入 `/usr/local/bin/pnpm`，普通 `node` 用户没有权限，所以需要 `sudo`。

### 为什么 .env 改成 localhost

迁移前，Dev Container 里的 Next/Payload 连接外层 Docker Desktop 里的数据库，所以用：

```env
DATABASE_URI=postgres://postgres:postgres@host.docker.internal:5432/kita
```

迁移后，数据库从 Dev Container 内部 Docker 启动。对 Dev Container 里运行的 `pnpm dev` 来说，数据库入口变成：

```env
DATABASE_URI=postgres://postgres:postgres@localhost:5432/kita
```

所以当前 `.env` 使用：

```env
DATABASE_URI=postgres://postgres:postgres@localhost:5432/kita
```

`compose.yaml` 里仍然保留：

```text
DATABASE_URI=postgres://postgres:postgres@postgres:5432/kita
```

那是给未来直接用 compose 启动 `web` 服务时用的。在 compose 网络里，`web` 容器访问 `postgres` 服务名，所以是 `postgres:5432`。

### 为什么要删除旧数据库

旧数据库属于外层 Docker Desktop：

```text
kita-postgres-1
kita_postgres-data
postgres:16 image
```

切到 Docker-in-Docker 后，项目数据库以 Dev Container 内部 Docker 为准。旧数据库继续存在只会增加理解成本：

```text
我现在连的是旧数据库还是新数据库？
为什么 admin 用户不一样？
为什么 /tools 数据不一样？
```

所以我们删除了外层旧数据库容器、旧 volume 和旧 `postgres:16` image。

删除后，外层 Docker Desktop 只保留：

```text
当前 Dev Container
Dev Container image
DinD 保存内部 Docker 状态的 volume
VS Code volume
```

这让边界更清晰：

```text
外层 Docker Desktop 负责运行 Dev Container。
项目数据库由 Dev Container 内部 Docker 负责。
```

### 为什么出现过 node_modules 权限问题

迁移过程中出现过：

```text
EACCES: permission denied
```

原因是之前有些命令用 root 身份执行过，导致 `.next` 或 `node_modules` 里部分文件归 root 所有。

后来我们处理了两类生成产物：

```text
.next
  Next.js 生成缓存，可以删除重建。

node_modules / .pnpm-store
  pnpm 依赖安装产物，可以删除后 pnpm install 重建。
```

这类目录不是源码，删除不会丢业务代码。

### 为什么加了 (site) route group

这不是 Docker 相关问题，而是 Payload Admin 接入 Next.js App Router 时发现的布局问题。

原来项目有：

```text
src/app/layout.tsx
```

它为整个项目渲染：

```tsx
<html>
  <body>{children}</body>
</html>
```

而 Payload Admin 的 `RootLayout` 自己也会渲染一套：

```tsx
<html>
  <body>Payload Admin</body>
</html>
```

结果访问 `/admin` 时会变成非法结构：

```html
<html>
  <body>
    <html>
      <body>
        Payload Admin
      </body>
    </html>
  </body>
</html>
```

浏览器和 React 会报：

```text
<html> cannot be a child of <body>
Hydration failed
```

所以我们把前台页面移到：

```text
src/app/(site)
```

Payload 后台保留在：

```text
src/app/(payload)
```

这样变成两个独立的 root layout：

```text
(site)
  前台网站自己的 html/body

(payload)
  Payload Admin 自己的 html/body
```

URL 没变：

```text
/        首页
/about   About
/tools   Tools
/reviews Reviews
/games   Games
/admin   Payload Admin
```

这符合 Next.js App Router 的 route group 思路，也没有破坏 bulletproof-react 的 features 结构。

### 为什么手动补了 importMap

Payload Admin 进入后台后提示：

```text
getFromImportMap: PayloadComponent not found in importMap
@payloadcms/next/rsc#CollectionCards
```

这说明 Payload Admin Dashboard 需要一个组件映射。

通常可以通过 Payload CLI 自动生成 import map，但当前项目的 `Payload CLI + Next 16 + TypeScript collection` 组合还有一些兼容细节。

所以我们先手动补了最小映射：

```ts
import { CollectionCards } from "@payloadcms/next/rsc";

export const importMap = {
  "@payloadcms/next/rsc#CollectionCards": CollectionCards,
};
```

这不是业务功能，只是让 Payload Admin Dashboard 能找到自己需要的内置组件。

### 当前新的日常启动流程

以后进入项目后，推荐流程是：

```text
1. 打开 Docker Desktop
2. 打开 VS Code
3. Reopen in Container
4. 在 Dev Container 终端里执行 docker / pnpm 命令
```

常用命令：

```bash
docker --version
docker compose version
```

启动数据库：

```bash
docker compose up -d postgres
```

查看内部 Docker 里的容器：

```bash
docker ps
```

启动 Next.js + Payload：

```bash
pnpm dev
```

第一次使用新数据库时：

```text
打开 http://localhost:3000/admin
创建新的 Payload 管理员账号
```

写入 Tools seed 数据：

```bash
pnpm seed:tools
```

然后访问：

```text
http://localhost:3000/tools
```

### 当前架构如何理解

现在可以这样理解整个本地开发环境：

```text
Windows
  Docker Desktop
    Dev Container
      Node / pnpm / Next.js / Payload
      Docker-in-Docker
        PostgreSQL
```

项目代码仍然通过挂载进入 Dev Container：

```text
D:\blackwater\kita
  -> /workspaces/kita
```

所以你在 VS Code 里改文件，Dev Container 里的 `pnpm dev` 能立刻看到变化，hot reload 仍然成立。

### 当前边界

当前选择的边界是：

```text
本机 Windows
  只负责 Docker Desktop、VS Code、浏览器、Git。

Dev Container
  负责 Node、pnpm、Next.js、Payload、项目依赖、开发命令。

DinD 内部 Docker
  负责项目开发依赖服务，比如 PostgreSQL。
```

这就是这次迁移的核心意义：

```text
不是为了多一层 Docker，而是为了让开发入口统一、环境更可复制、项目相关服务更集中。
```
