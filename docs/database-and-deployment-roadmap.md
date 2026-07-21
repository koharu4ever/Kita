# 数据库与部署前路线图

> **历史记录（非当前事实源）**：本文记录 Payload/PostgreSQL 与生产部署尚未落地时的路线设计。文中的“当前”“下一阶段”和未完成项均属于当时快照。当前进度与操作边界以 [CODEX_HANDOFF.md](./CODEX_HANDOFF.md) 和 [current-project-status.md](./current-project-status.md) 为准。

这份笔记整理下一阶段思路：前端骨架完成后，项目准备进入 Payload CMS + PostgreSQL 阶段。我们继续参考 CJ 的 Next.js starter 和 self-host 相关视频，但不会照抄他的 Drizzle / Auth.js / Guestbook 技术栈。

当前项目目标仍然是：

```text
Next.js App Router
Payload CMS
PostgreSQL
Docker / Dev Container
VPS + Coolify
GitHub
```

现在的核心判断是：

```text
先在本地用 Docker 跑通 PostgreSQL + Payload。
等本地完整闭环后，再进入 VPS + Coolify + self-host 阶段。
```

## 参考来源

本阶段主要参考这些内容：

- CJ Next.js starter 视频：https://www.youtube.com/watch?v=dLRKV-bajS4&list=LL&index=3
- CJ self-host / deployment 相关视频：https://www.youtube.com/watch?v=RHjXPN_h1YA&list=LL&index=1
- Coolify / Docker 参考视频：https://www.youtube.com/watch?v=taJlPG82Ucw&list=LL&index=4
- Coolify 官方文档：https://coolify.io/docs
- w3cj/next-start：https://github.com/w3cj/next-start

这些视频和文档分别解决不同层的问题：

```text
Next.js starter 视频：
  工程化、env、数据库工具选择、Docker Postgres 思路。

self-host / Coolify 视频：
  当本地项目已经能跑后，如何部署到自己的服务器。

Coolify 官方文档：
  VPS、SSH、Docker、Coolify 安装和部署的基本要求。
```

## 当前项目状态

已经完成：

- Next.js 工程化底座。
- Dev Container。
- Dockerfile。
- compose.yaml 的基础 `web` 服务。
- ESLint / Prettier / TypeScript / typedRoutes。
- Typesafe env。
- 前端页面骨架。

还没有完成：

- Payload CMS 安装。
- Payload Collections。
- PostgreSQL 服务。
- 本地数据库 volume。
- Payload 与 PostgreSQL 连接。
- VPS。
- Coolify 部署。
- GitHub Actions。

当前 `compose.yaml` 只有一个 `web` 服务：

```yaml
services:
  web:
    build:
      context: .
    ports:
      - "3000:3000"
```

这说明现在的 Docker Compose 还不是完整应用编排，只是一个生产应用容器雏形。下一阶段需要加入 PostgreSQL。

## CJ 数据库部分哪些能借鉴

CJ 视频后半段的技术路线大概是：

```text
Next.js
Auth.js / NextAuth
Drizzle
PostgreSQL
NextAuth Drizzle Adapter
Guestbook
drizzle-zod
Server Actions
```

我们的项目不是这个路线。我们要用 Payload CMS 作为内容型后端，所以不能照抄 Drizzle 作为主数据层。

可以借鉴的部分：

```text
01:38:14 Database Libraries
01:43:11 docker postgres set up
02:10:53 Next.js Server Action Libraries
02:34:10 Create sample env
```

### Database Libraries

可以学习 CJ 如何比较数据库工具，理解为什么项目需要数据库访问层。

但是我们不是直接选择 Drizzle 作为主数据层，因为 Payload 会管理 CMS collections、CRUD、Admin UI 和数据库连接。

我们的路线是：

```text
Payload CMS -> PostgreSQL
Next.js 页面 -> Payload 数据层 / server helper
```

不是：

```text
Next.js 页面 -> Drizzle -> PostgreSQL
```

### docker postgres set up

这一段非常值得借鉴。

我们也需要用 Docker 启动 PostgreSQL：

- 数据库不装在本机。
- 用 Compose 管理数据库服务。
- 用 volume 保存数据库数据。
- 用 env 配置数据库地址和密码。
- 本地环境尽量接近部署环境。

这和我们的目标高度一致。

### Next.js Server Action Libraries

可以先了解，但第一版不急着做。

Payload CMS 已经提供 Admin 后台和基础 CRUD。除非以后做自定义表单、留言板、前台投稿、用户操作，否则不需要一开始就引入 Server Action 表单库。

### Create sample env

这一段和我们已经完成的 `.env.example`、`src/config/env.ts` 对应。

这部分很适合保留：

```text
.env.example 说明项目需要哪些环境变量
src/config/env.ts 统一校验 env
ESLint 禁止业务代码到处 process.env
```

## CJ 数据库部分哪些不要照抄

这些部分不建议照抄：

```text
01:40:25 drizzle set up
01:47:04 drizzle configuration
01:48:02 Defining drizzle schema
01:54:20 drizzle kit config
01:58:08 drizzle migration set up
02:03:41 next-auth drizzle adapter set up
02:06:52 next-auth middleware issue
02:13:10 Building a Simple Guestbook
02:16:39 drizzle-zod
02:20:36 Add user id to next-auth Session
02:28:36 Defining table relations with drizzle
02:33:27 Consolidating migrations during development
```

原因是这些都围绕 CJ 的业务栈：

```text
Auth.js
Drizzle
Guestbook
自定义 SQL schema
NextAuth adapter
```

而我们的第一版内容后端是：

```text
Payload CMS
Payload Collections
Payload Admin
Payload API
PostgreSQL
```

如果现在照抄 Drizzle，会出现两个主数据层：

```text
Payload 管一套 schema
Drizzle 又管一套 schema
```

这对新手非常容易混乱，也会让后端边界不清楚。

## 现在的正确路线

你现在的理解是对的：

```text
本地先用 Docker 设置一个 PostgreSQL 数据库容器。
Next.js / Payload 在本地连接这个数据库。
等本地全部跑通后，再考虑 CJ 的 self-host 教程。
```

这条路线的好处是：问题被分层了。

```text
本地阶段解决：
  Payload 能不能启动
  数据库能不能连接
  Collection 能不能保存内容
  页面能不能读取内容
  Docker Compose 服务关系是否清楚

部署阶段解决：
  VPS 是否可用
  SSH 是否可用
  Coolify 是否安装成功
  GitHub 仓库是否能拉取
  生产 env 是否配置正确
  应用容器是否能启动
```

如果本地还没跑通就直接上 VPS，问题会混在一起。

你不知道失败原因是：

```text
代码问题
Payload 配置问题
数据库问题
Docker 问题
Coolify 问题
VPS 问题
域名或 HTTPS 问题
```

对初学者来说，这样排错会非常痛苦。

所以更稳的顺序是：

```text
先本地闭环
再部署闭环
```

## 本地闭环是什么意思

本地闭环不是只启动一个数据库容器。

它至少包括：

```text
docker compose 能启动 PostgreSQL
DATABASE_URI 能连上 PostgreSQL
Payload 能启动
Payload Admin 能打开
能创建一条测试内容
内容能保存到 PostgreSQL
Next.js 页面能读取一条 CMS 数据
pnpm build 能通过
```

这一步完成后，说明你的应用本身是健康的。后面部署到 VPS 时，如果出问题，就更可能是部署配置问题，而不是应用本身的问题。

## 什么时候进入 self-host / VPS / Coolify

建议等这些条件满足后再开始：

```text
Payload 本地安装完成
PostgreSQL 本地连接完成
至少一个 Collection 跑通
本地 build 通过
Docker Compose 本地服务关系清楚
.env.example 和 env.ts 已经覆盖必要变量
```

这时再看 CJ 的 self-host 教程、Coolify 教程，会更容易理解视频里的每一步。

self-host 阶段解决的是：

```text
如何把已经能跑的项目放到自己的服务器上
```

它不应该承担：

```text
一边学习 Payload
一边学习数据库
一边学习 Docker
一边学习 VPS
一边学习 Coolify
```

这些东西如果同时发生，学习曲线会太陡。

## Coolify 的位置

Coolify 不是替代 Docker 的东西，也不是替代 GitHub 的东西。

可以这样理解：

```text
VPS 提供服务器
Docker 提供容器运行能力
Coolify 提供部署管理界面
GitHub 提供代码来源
```

未来部署链路大概是：

```text
GitHub 仓库
  -> Coolify 拉取代码
  -> 使用 Dockerfile / Compose 构建和启动服务
  -> VPS 上运行 app + postgres
```

Coolify 官方文档强调，自托管 Coolify 需要一台能 SSH 登录的服务器，并且推荐使用干净的新服务器。官方安装流程会安装 Docker Engine 等依赖。官方文档也给出了最低资源建议，比如 2 核 CPU、2GB RAM、30GB 存储左右。

这说明 VPS 很重要，但它属于部署阶段，不是本地开发阶段的第一步。

## CJ Self Host 101 视频如何对应我们的项目

你补充的这个视频：

```text
Self Host 101 / Coolify / Docker / VPS
https://www.youtube.com/watch?v=taJlPG82Ucw&list=LL&index=5
```

和我们的项目是很匹配的，但它对应的是“部署阶段”，不是“本地开发刚开始接数据库”的阶段。

这个视频大概覆盖了几类事情：

```text
VPS 创建
SSH 登录
服务器更新
安装 Coolify
域名和 HTTPS
防火墙
Coolify 账号安全
GitHub 连接
Next.js 部署
PostgreSQL 服务
Dockerfile / Docker Compose 部署
数据库备份
MinIO / S3 存储
VPS 监控
```

这些内容都很有用，但它们默认有一个前提：

```text
你已经大概知道自己的应用要怎么运行。
```

也就是说，CJ 这个 self-host 视频更像是：

```text
我已经有一个能跑的应用，现在我要把它放到自己的服务器上。
```

而我们现在还处在：

```text
我要先让 Payload + PostgreSQL 在本地跑通。
```

所以它和我们项目很配，但顺序应该是：

```text
本地 Docker Postgres
  -> 本地 Payload CMS
  -> 本地 Next.js 读取 Payload 数据
  -> 本地 Docker/Compose 关系清楚
  -> 再进入 CJ Self Host 101 / Coolify 部署流程
```

### 这个视频哪些部分以后会直接有用

这些部分和我们未来部署高度相关：

```text
02:09 Coolify minimum specs required
02:59 Create a VPS with Hetzner and Set Up with Cloud Config
06:16 ssh into VPS as root and update / upgrade
07:18 Install Coolify
11:51 Set up Coolify https instance domain and https wildcard domain
16:41 Create a firewall and lock down all unused ports
17:47 Update Coolify user password and setup 2fa
27:04 Create a basic Next.js project in Coolify
31:38 Create a Github application in Coolify
33:31 Deploy a Next.js app with auto deploy
35:41 Create a postgres database for a t3 application
52:06 Deploy a git repo with an existing docker compose file
01:00:56 Deploy a service with docker compose
01:07:00 Set up minIO / s3 compatible storage
01:10:42 Configure database backups
```

对应到我们的项目，大概是：

```text
Coolify minimum specs
  -> 选择 VPS 配置

Create VPS / SSH / update
  -> 服务器初始化

Install Coolify
  -> 部署面板安装

Domain / HTTPS / wildcard domain
  -> 站点域名和 HTTPS

Firewall / password / 2FA
  -> 服务器和 Coolify 安全

GitHub application / auto deploy
  -> GitHub push 后自动部署

Postgres database
  -> 生产数据库服务

Existing docker compose file
  -> 使用我们项目里的 compose.yaml 部署多服务

MinIO / S3 compatible storage
  -> Payload 媒体文件未来可能需要的对象存储

Database backups
  -> PostgreSQL 备份
```

### 这个视频哪些部分现在先不用做

现在不建议马上做这些：

```text
买 VPS
绑定域名
配置 HTTPS
配置生产防火墙
部署生产 Postgres
配置数据库备份
配置 MinIO
配置 Coolify 自动部署
```

不是因为它们不重要，而是因为它们属于后面的部署层。

如果现在就做，容易把问题叠在一起：

```text
Payload 还没本地跑通
PostgreSQL 还没本地连接
Collections 还没设计
Docker Compose 还没完整
却已经开始处理 VPS / DNS / HTTPS / Coolify / 防火墙
```

这会让排错变得很难。

### 对当前阶段最有用的结论

这个视频可以先当作“未来部署地图”来看，而不是现在立即执行的教程。

现在最有用的结论是：

```text
我们本地的 Docker Compose 设计，要尽量考虑未来能被 Coolify 理解和部署。
```

所以后面写 `compose.yaml` 时要尽量清楚：

```text
app 服务是什么
postgres 服务是什么
volume 放哪里
env 怎么传
端口怎么暴露
生产环境和开发环境有什么区别
```

这样以后进入 Coolify 时，就不是重新发明一套部署方式，而是把本地已经跑通的服务关系搬到 VPS 上。

### 当前最终判断

你现在这句话是对的：

```text
先通过 Docker 在本地 container 里设置数据库。
本地 Payload + PostgreSQL + Next.js 全部跑通后。
再考虑 CJ 的 Self Host 101 / Coolify 教程。
```

这条路线很适合你的项目，也适合初学者。

它把学习路径分成两层：

```text
第一层：应用能不能在本地健康运行。
第二层：应用如何部署到自己的服务器。
```

现在我们应该继续完成第一层。

## CJ Docker 视频如何对应我们的项目

你补充的这个 Docker 视频：

```text
Docker Crash Course / Docker Desktop / Compose / Dockerfile / Dev Containers
https://www.youtube.com/watch?v=RHjXPN_h1YA&list=LL&index=1
```

它比 Coolify 视频更靠近我们现在的阶段。

如果说 Coolify / Self Host 101 视频解决的是：

```text
应用已经能跑了，如何部署到自己的 VPS？
```

那么这个 Docker 视频解决的是：

```text
本地开发时，如何用 Docker 跑数据库、组织服务、构建镜像、避免本机环境污染？
```

所以它非常适合放在当前阶段学习。

### 这个视频哪些部分最适合我们现在用

这些部分和我们下一步高度相关：

```text
02:30 Run an image with the docker CLI
06:21 docker CLI commands
08:50 A simple docker compose example
15:41 docker compose example with postgres
17:48 Persisting data with docker volumes
21:51 The case for custom images and containerization
23:32 Creating a custom image with a Dockerfile
30:02 Ignoring files with .dockerignore
33:58 Make code changes without re-building image
34:55 Create a volume for node_modules to prevent internalBinding errors
36:35 Better development workflow with devcontainers
38:03 Optimize docker layer order for faster builds
40:09 Create a multi-stage Dockerfile for dev, build and prod
46:23 Share docker-compose.yml configurations
```

对应到我们的项目：

```text
docker CLI
  -> 理解 docker ps、docker images、docker exec、docker logs 等基础命令。

simple docker compose
  -> 理解 compose.yaml 为什么可以一次启动多个服务。

postgres compose example
  -> 下一步给本地项目加入 PostgreSQL 服务。

docker volumes
  -> 保存数据库数据，避免容器删除后数据一起消失。

custom images / Dockerfile
  -> 理解项目根目录 Dockerfile 为什么存在，以及它如何用于生产构建。

.dockerignore
  -> 避免 node_modules、.next、临时文件进入镜像构建上下文。

code changes without rebuilding
  -> 理解开发环境为什么通常使用 bind mount，而不是每次改代码都重新 build 镜像。

node_modules volume
  -> 理解为什么容器内的 node_modules 和宿主机 node_modules 容易冲突。

devcontainers
  -> 对应我们现在的 VS Code Dev Container 工作流。

docker layer order
  -> 理解 Dockerfile 中先 copy package.json / lockfile，再 pnpm install，再 copy 源码的原因。

multi-stage Dockerfile
  -> 对应我们现在 Dockerfile 里的 base / deps / builder / runner。

share compose configurations
  -> 后面可能拆分 compose.yaml、compose.dev.yaml、compose.prod.yaml。
```

### 这个视频和我们现有 Dockerfile 的关系

我们现在已经有一个多阶段 Dockerfile：

```text
base
deps
builder
runner
```

这正好对应视频里的：

```text
40:09 Create a multi-stage Dockerfile for dev, build and prod
```

它的核心目的不是“开发时写代码”，而是：

```text
把 Next.js 应用构建成一个更适合生产运行的 Docker 镜像。
```

当前 Dockerfile 的大致逻辑是：

```text
base:
  准备 Node / pnpm / 工作目录

deps:
  只复制 package.json 和 pnpm-lock.yaml
  安装依赖

builder:
  复制源码
  执行 pnpm build

runner:
  只复制生产运行需要的文件
  用 node server.js 启动 Next standalone 输出
```

这样做的好处是：

- 镜像更小。
- 生产环境不需要完整源码和开发依赖。
- Docker layer 可以缓存依赖安装。
- 部署到 VPS / Coolify 时更清楚。

### 这个视频和 compose.yaml 的关系

我们现在的 `compose.yaml` 还很简单，只有 `web`：

```text
web
```

下一步接数据库时，它会变成至少：

```text
web
postgres
volumes
```

这正好对应视频里的：

```text
08:50 A simple docker compose example
15:41 docker compose example with postgres
17:48 Persisting data with docker volumes
```

对我们来说，Compose 的价值是：

```text
不用手动分别运行 app 容器和 postgres 容器。
用一个 compose 文件描述它们之间的关系。
```

未来本地可能会是：

```text
postgres:
  保存 Payload 数据

web / app:
  运行 Next.js + Payload

volumes:
  保存 PostgreSQL 数据
```

### 这个视频和 Dev Container 的关系

视频里提到：

```text
36:35 Better development workflow with devcontainers
```

这正好对应我们已经在用的开发模式。

要再次分清楚：

```text
Dev Container
  是写代码的开发环境。

Dockerfile
  是应用生产镜像的构建方式。

compose.yaml
  是多个服务如何一起运行。
```

在本项目里：

```text
.devcontainer/devcontainer.json
  给 VS Code 用。
  解决开发环境一致的问题。

Dockerfile
  给 docker build / Coolify 用。
  解决应用如何被打包运行的问题。

compose.yaml
  给 docker compose / Coolify 用。
  解决 app + postgres 等服务如何一起运行的问题。
```

### node_modules volume 这一段为什么重要

视频里提到：

```text
34:55 Create a volume for node_modules to prevent internalBinding errors
```

这和我们之前遇到的问题很接近。

原因是：

```text
Windows 宿主机上的 node_modules
Linux 容器里的 node_modules
```

它们不应该混用。

Node 依赖里有些包包含平台相关内容。如果在 Windows 上安装，再拿到 Linux 容器里用，可能会出现奇怪错误。

所以我们现在的思路是：

```text
node_modules 不进 Git
node_modules 在 Dev Container 内安装
必要时删除 node_modules 后让 pnpm install 重新生成
```

这也解释了为什么之前我们可以删除依赖目录后重新安装：它是可再生的构建/安装产物，不是源码。

### .dockerignore 这一段为什么重要

视频里提到：

```text
30:02 Ignoring files with .dockerignore
```

这对我们很重要。

`.dockerignore` 的作用类似 `.gitignore`，但目标不同：

```text
.gitignore
  控制哪些文件不提交到 Git。

.dockerignore
  控制哪些文件不发送给 Docker build。
```

常见不应该进 Docker build context 的内容：

```text
node_modules
.next
.git
本地 env 文件
日志
临时文件
```

这样做可以：

- 加快 docker build。
- 避免把本地垃圾文件放进镜像。
- 避免把本地秘密文件打进镜像。
- 减少 Windows / Linux 依赖混用问题。

### 当前阶段应该如何使用这个 Docker 视频

这个视频现在就可以学，但不要一口气把所有内容都做完。

建议按我们的项目进度这样看：

```text
现在：
  docker CLI 基础
  docker compose 基础
  postgres compose
  volumes
  .dockerignore
  devcontainers

接 Payload 时：
  compose 中加入 postgres
  app 如何连接 postgres
  是否需要 dev/prod compose 拆分

准备部署时：
  Dockerfile 多阶段构建
  compose 配置复用
  Coolify 使用 existing docker compose file
```

### Docker 视频和 Coolify 视频的关系

这两个视频是前后关系：

```text
Docker 视频：
  教你容器、镜像、compose、volume、Dockerfile 是什么。

Coolify 视频：
  教你把这些东西放到 VPS 上，用 Coolify 管起来。
```

所以我们的学习顺序应该是：

```text
Docker 基础
  -> 本地 Postgres
  -> 本地 Payload
  -> 本地 compose 跑通
  -> Coolify / VPS
```

不是反过来。

### 对我们项目最重要的结论

这个 Docker 视频对我们项目最重要的结论是：

```text
本地数据库应该先用 Docker Compose 跑。
数据库数据要用 volume 持久化。
应用镜像用 Dockerfile 构建。
开发环境用 Dev Container 保持一致。
node_modules 不提交，不跨系统混用。
本地 compose 关系要尽量为未来 Coolify 部署做准备。
```

这和我们当前路线完全一致。

## 本地 Docker 与 VPS Docker 的关系

本地和 VPS 不是两套完全无关的东西。

我们希望它们尽量相似：

```text
本地：
  Dev Container 写代码
  Docker Compose 跑 Postgres
  Next.js / Payload 连接本地 Postgres

VPS：
  Coolify 拉 GitHub 代码
  Docker 运行 app 容器
  Docker 运行 Postgres 或连接外部数据库
```

但它们仍然有区别：

```text
Dev Container 是开发环境
Dockerfile 是应用镜像
compose.yaml 是多服务编排
Coolify 是部署管理
```

不要把这四个概念混成一个东西。

## 下一步本地数据库要做什么

下一步大概率会修改：

```text
compose.yaml
.env.example
src/config/env.ts
package.json
pnpm-lock.yaml
```

可能新增：

```text
src/payload.config.ts
src/collections/*
```

`compose.yaml` 需要从只有 `web`，变成至少有：

```text
web
postgres
```

Postgres 服务大概会需要：

```yaml
postgres:
  image: postgres:16
  environment:
    POSTGRES_DB: kita
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  volumes:
    - postgres-data:/var/lib/postgresql/data
  ports:
    - "5432:5432"
```

注意：这只是思路示例，不是最终代码。真正写之前要结合 Payload 当前版本的推荐配置。

## env 如何配合

我们已经做了 typesafe env：

```text
src/config/env.ts
```

当前已有变量：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYLOAD_SECRET=replace-with-a-long-random-secret-value
DATABASE_URI=postgres://postgres:postgres@postgres:5432/kita
```

接数据库后，这些变量会真正被使用。

关键规则：

```text
DATABASE_URI 是 server-only
PAYLOAD_SECRET 是 server-only
NEXT_PUBLIC_SITE_URL 可以暴露给浏览器
```

不要写：

```env
NEXT_PUBLIC_DATABASE_URI=...
NEXT_PUBLIC_PAYLOAD_SECRET=...
```

因为 `NEXT_PUBLIC_` 代表会暴露给浏览器。

## Payload 和 PostgreSQL 的关系

Payload 是 CMS 后端。

PostgreSQL 是持久化存储。

可以理解为：

```text
Payload 负责：
  Admin 后台
  Collections
  字段定义
  CRUD
  权限
  API
  媒体管理

PostgreSQL 负责：
  真正保存数据
  表
  行
  索引
  持久化
```

你平时不会直接手写 SQL 管文章、游戏、工具这些内容，而是通过 Payload 的 collection 定义和 Admin 后台管理。

所以第一版不需要 Drizzle。

## 是否以后永远不用 Drizzle

不一定。

只是第一版不需要。

以后如果项目里出现 Payload 不适合管理的高度自定义业务数据，比如：

- 用户行为统计。
- 复杂排行榜。
- 自定义任务队列。
- 高性能查询。
- 非 CMS 型业务表。

那时可以考虑单独引入 Drizzle。

但第一版不要同时上 Payload + Drizzle，学习成本和边界都会变乱。

## 建议的下一阶段任务

### 任务 1：设计 Payload 第一版 Collections

先只设计，不写太多业务：

```text
Posts / Reviews
Games / Projects
Tools
Media
SiteSettings
```

每个 Collection 只保留最小字段。

### 任务 2：本地 Compose 加 PostgreSQL

让数据库先在本地 Docker 跑起来。

验证目标：

```bash
docker compose up postgres
```

能看到数据库正常启动。

### 任务 3：安装 Payload 并连接 PostgreSQL

安装 Payload 相关依赖，配置 `payload.config.ts`，使用 `DATABASE_URI` 和 `PAYLOAD_SECRET`。

验证目标：

```text
Payload Admin 能打开
数据库里能保存内容
```

### 任务 4：让一个前端页面读取 CMS 数据

先选最小页面，不要一口气全接。

推荐从 `About` 或 `Tools` 开始，因为它们数据结构简单。

### 任务 5：准备 VPS + Coolify

等本地跑通后，再做：

```text
买 VPS
SSH 登录
安装 Coolify
连接 GitHub
配置 env
部署应用
```

## 当前判断

不建议现在马上设置 VPS。

建议下一步先做：

```text
本地 Docker Postgres + Payload CMS 最小接入
```

等本地能跑通，再准备 VPS + Coolify。

这样排查问题最清楚，也最适合初学者。

## 一句话总结

CJ 的数据库部分，我们学的是工程化顺序和 Docker Postgres 思路，不照抄 Drizzle/Auth.js/Guestbook。

CJ 的 self-host / Coolify 部分，适合放在本地应用跑通之后再学。

我们的下一阶段应该是：

```text
先本地 Docker 跑 PostgreSQL
再本地接 Payload
再设计最小 Collections
再让一个页面读 CMS 数据
最后进入 VPS + Coolify self-host
```

VPS 很重要，但它不是现在的第一步。
