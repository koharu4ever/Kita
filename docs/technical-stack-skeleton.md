# Kita 技术栈骨架总结

这份文档总结 Kita 当前的完整技术骨架。

`docs/project-structure.md` 主要解释代码目录如何组织；这份文档更高一层，解释整个项目为什么这样搭、每一层解决什么问题、数据如何流动、以后如何在这个骨架上继续扩展。

当前 Kita 不是单纯的前端页面，也不是只跑一个 CMS 的后台。它的目标是一个小型但完整的个人全栈网站：

```text
Next.js 前台
Payload CMS 后台
PostgreSQL 数据库
Docker / Dev Container 本地开发
GitHub 代码管理
VPS + Coolify 部署
Cloudflare / 域名 / HTTPS
```

## 一句话总结

Kita 当前的技术栈骨架是：

```text
用 Next.js 做应用外壳和前台体验。
用 Payload CMS 做内容后台和 CRUD。
用 PostgreSQL 保存真实数据。
用 Docker 统一本地和部署环境。
用 GitHub 管理源码。
用 Coolify 把项目部署到自己的 VPS。
用 Cloudflare 管理域名、防护和 HTTPS 入口。
```

这套组合的重点不是“技术很多”，而是每一层都有明确职责。

## 技术来源和取舍

这个项目的思路主要参考了三类来源：

```text
CJ 的 Next.js starter 视频
  学习工程化基座、编辑器设置、格式化、lint、typesafe env、typed routes。

bulletproof-react
  学习 feature-oriented 的项目结构，不把所有代码都堆在 app 或 components 里。

CJ 的 Docker / Dev Container / Coolify 相关视频
  学习本地容器化开发、PostgreSQL 容器、VPS + Docker + Coolify 部署思路。
```

但 Kita 没有完整照抄 CJ 的技术栈。

没有采用：

```text
NextAuth / Auth.js
Google OAuth
Drizzle 作为主数据层
NextAuth Drizzle Adapter
Guestbook
NextUI / HeroUI
完整 UI 组件库路线
```

原因是 Kita 第一版的核心不是 SaaS，也不是用户登录系统，而是一个内容型个人网站。

所以更适合的主后端是：

```text
Payload CMS
```

而不是：

```text
Auth.js + Drizzle + 自己手写所有后台 CRUD
```

## 当前技术栈分层

可以把 Kita 理解成这些层：

```text
用户访问层
  域名、Cloudflare、HTTPS

部署运行层
  VPS、Coolify、Docker

应用层
  Next.js App Router

内容后端层
  Payload CMS Admin、Collections、API、Local API

数据层
  PostgreSQL

工程化层
  TypeScript、ESLint、Prettier、typedRoutes、typesafe env

本地开发层
  Docker Desktop、Dev Container、Docker-in-Docker、pnpm

代码管理层
  Git、GitHub
```

每一层只解决自己的问题。

这也是项目能继续扩展的原因：以后即使换 UI 库、换 ORM、甚至换一部分后端语言，也不是把整个项目推倒重来，而是替换某一层。

## Next.js 的职责

Next.js 是 Kita 的前台应用框架。

它负责：

```text
路由
页面结构
layouts
Server Components
React 组件组合
metadata
静态页面和动态页面
调用服务端读取逻辑
生产构建
```

当前主要页面：

```text
/
  视觉首页。

/about
  静态介绍页，保留老项目视觉风格。

/tools
  已经接入 Payload/PostgreSQL，读取真实 Tools 数据。

/reviews
  当前还是前端模板，未来可接 Payload。

/games
  当前还是前端模板，未来可接 Payload。

/admin
  Payload Admin 后台。
```

Next.js 不应该直接承担所有数据库细节。

更好的边界是：

```text
页面负责组合。
server 模块负责读取数据。
Payload 负责 CMS 和数据库映射。
PostgreSQL 负责持久化。
```

## Payload CMS 的职责

Payload CMS 是 Kita 当前的内容型后端。

它负责：

```text
Admin 后台
Users collection
Tools collection
未来 Reviews / Games / Media collections
基础 CRUD
权限控制
REST API
GraphQL API
Local API
与 PostgreSQL 的连接
生成 Payload 类型
```

当前已经建立的最小闭环：

```text
Users
  用于 Payload Admin 登录。

Tools
  用于 /tools 页面展示真实数据库内容。
```

Payload 的意义是：

```text
不需要从零手写管理后台。
不需要自己先实现所有 CRUD。
不需要第一版就设计复杂的 ORM 数据层。
```

它让 Kita 先把“内容生产 -> 数据保存 -> 前台展示”这条链路跑通。

## PostgreSQL 的职责

PostgreSQL 是真实数据的持久化层。

它负责保存：

```text
Payload 用户
Tools 数据
未来文章、项目、游戏、评论、媒体元数据
Payload 内部需要的表
```

PostgreSQL 不直接暴露给前端。

数据流应该是：

```text
Next.js 页面
  -> server data access
  -> Payload local API
  -> PostgreSQL
```

而不是：

```text
React 组件
  -> 直接连接 PostgreSQL
```

这样可以保持前后端边界清楚，也方便以后替换实现。

## Docker 和 Dev Container 的职责

Docker 解决的是环境一致性问题。

本地开发时，我们不希望每台电脑都手动安装一堆东西：

```text
Node 版本
pnpm 版本
PostgreSQL
系统依赖
构建依赖
数据库环境
```

Dev Container 的意义是：

```text
用容器定义开发环境。
打开项目后进入一致的 Linux 开发环境。
减少本机残留。
减少“我电脑能跑、另一台电脑不能跑”的问题。
```

当前本地结构可以理解为：

```text
Windows
  Docker Desktop
    Dev Container
      Node / pnpm / Next.js / Payload
      Docker-in-Docker
        PostgreSQL
```

这套方式的好处是：

```text
代码仍然在本机文件夹。
命令在容器里执行。
数据库也由容器管理。
换电脑后主要依赖 Docker Desktop、VS Code、Dev Containers 扩展。
```

## Dockerfile 和 compose.yaml 的职责

`Dockerfile` 描述 Kita 应用如何被打包成生产镜像。

它回答的是：

```text
如何安装依赖？
如何构建 Next.js？
生产环境如何启动？
最终容器里需要哪些文件？
```

`compose.yaml` 描述多个服务如何一起运行。

它回答的是：

```text
web 应用如何运行？
PostgreSQL 如何运行？
web 如何连接 postgres？
数据库数据保存在哪里？
哪些环境变量要传给容器？
```

当前服务关系：

```text
web
  Next.js + Payload 应用

postgres
  PostgreSQL 数据库

postgres-data
  数据库持久化 volume
```

本地和部署都可以参考这个模型。

## GitHub 的职责

GitHub 是源码和协作入口。

它负责：

```text
保存代码历史
远程备份项目
作为 Coolify 部署来源
未来接 GitHub Actions
记录 commit
管理分支
```

当前项目已经完成第一次 commit 和 push。

这意味着项目已经从“本地文件夹”进入“可被部署系统拉取的代码仓库”。

## VPS、Coolify、Cloudflare 的职责

VPS 是运行项目的服务器。

它负责提供：

```text
CPU
内存
磁盘
公网 IP
Linux 系统
Docker 运行环境
```

Coolify 运行在 VPS 上，负责部署管理：

```text
连接 GitHub
拉取代码
构建 Docker 镜像
启动 web 和 postgres
管理环境变量
管理域名
查看日志
自动部署
数据库备份
```

Cloudflare 位于用户和 VPS 之间，负责：

```text
DNS
HTTPS 入口
基础防护
代理
未来保护 /admin 或 Coolify 面板
```

部署后的访问链路大概是：

```text
用户浏览器
  -> 域名
  -> Cloudflare
  -> VPS
  -> Coolify proxy
  -> Kita web container
  -> Payload
  -> PostgreSQL
```

## 当前数据流

以 `/tools` 为例，当前真实数据流是：

```text
管理员登录 /admin
  -> 在 Payload Admin 创建 Tools 数据
  -> Payload 写入 PostgreSQL

用户访问 /tools
  -> Next.js route
  -> getTools()
  -> Payload local API
  -> PostgreSQL 查询 tools 数据
  -> mapper 转成前端展示类型
  -> React 组件渲染页面
```

这条链路很重要。

它说明 Kita 已经不是单纯静态页面，而是具备了：

```text
后台录入
数据库保存
服务端读取
前台展示
```

这就是一个全栈内容网站的最小闭环。

## 当前代码结构骨架

当前主要目录职责：

```text
src/app
  Next.js 路由入口。

src/app/(site)
  前台网站页面。

src/app/(payload)
  Payload Admin 和 Payload API。

src/features
  前台功能模块，例如 home、about、tools、reviews、games。

src/server
  服务端读取逻辑，例如从 Payload 取数据。

src/payload
  Payload collections 和 generated types。

src/config
  typed env 和项目配置。

src/shared
  跨功能复用的工具、组件、类型。

src/testing
  未来测试工具和 mocks。
```

这里参考了 bulletproof-react 的思路，但做了 Next.js 和 Payload 适配。

关键不是目录名字，而是依赖方向：

```text
app 组合页面
features 管功能展示
server 管服务端读取
payload 管 CMS 数据模型
shared 放真正复用的基础能力
```

## 当前工程化骨架

当前工程化已经包括：

```text
TypeScript
ESLint
Prettier
format on save
lint on save
typedRoutes
project TypeScript version
typesafe env
remove unused imports
.env.example
Dockerfile
compose.yaml
Dev Container
```

这些不是装饰。

它们解决的是：

```text
代码风格不漂移
类型错误尽早暴露
环境变量缺失尽早失败
本地环境可复现
生产构建可验证
新电脑可以重新搭起来
部署系统能理解项目如何运行
```

## 为什么这不是玩具项目

Kita 目前还不是成熟商业项目，但已经不是简单玩具项目。

玩具项目通常只有：

```text
几个页面
一些 CSS
本地能跑
没有真实部署链路
没有数据库
没有后台
没有环境管理
没有工程化约束
```

Kita 当前已经具备：

```text
前台页面
后台 CMS
真实数据库
本地容器化开发
生产 Dockerfile
Compose 服务编排
GitHub 仓库
部署路线
环境变量校验
项目结构规范
数据流边界
```

所以更准确的定位是：

```text
一个处于早期阶段的小型全栈个人产品。
```

还需要补的是生产级能力，而不是基础骨架。

## 现在还缺什么

当前还需要继续补：

```text
真实 VPS 部署
Coolify 首次上线
Cloudflare DNS 和 HTTPS 配置
生产 Payload 管理员创建
生产数据库备份
Admin 访问保护
Media collection
Reviews / Games collections
基础测试
GitHub Actions
监控和日志策略
```

这些都是在当前骨架上增加，不需要推倒重来。

## 未来可以替换哪些部分

这套骨架不是把技术锁死。

以后可以局部替换：

```text
UI 层
  可以继续手写 CSS。
  也可以引入 shadcn/ui。
  也可以局部使用 Headless UI。

CMS 层
  当前使用 Payload。
  如果未来需要，可以换成自定义后端。

数据访问层
  当前主要通过 Payload。
  如果以后某些业务需要复杂查询，可以局部引入 ORM。

后端语言
  当前是 Next.js + Payload。
  如果未来需要，可以把部分 API 换成 Go 服务。

部署层
  当前计划 Coolify。
  如果未来熟悉 Linux，也可以手写 Docker Compose / Caddy / systemd。
```

真正重要的是边界已经建立：

```text
前端不直接依赖数据库。
页面不直接塞复杂业务。
Payload collections 不混进展示组件。
环境变量集中管理。
部署配置和应用代码有明确关系。
```

只要边界清楚，未来替换局部就不会太痛苦。

## 当前推荐的继续路线

接下来建议按这个顺序走：

```text
1. 保持当前本地开发工作流稳定。
2. 用当前域名跑通 Cloudflare / DNS / Coolify。
3. 把 Kita 部署到 VPS。
4. 在生产 Payload Admin 创建管理员。
5. 在生产环境创建 1 到 2 条 Tools 数据。
6. 确认 /tools 读取生产数据库。
7. 配置数据库备份。
8. 保护 /admin 和 Coolify 面板。
9. 再开始扩展 Reviews / Games / Media。
10. 最后补测试和 GitHub Actions。
```

不要一口气追求完美。

当前最重要的是把这条链路跑通：

```text
本地开发
  -> GitHub
  -> Coolify
  -> VPS
  -> PostgreSQL
  -> Payload Admin
  -> 前台页面
```

这条链路跑通后，Kita 就从“能写代码的项目”变成“能真实上线和维护的项目”。

## 总结

Kita 当前技术品味的核心是：

```text
不追求炫技。
先建立稳定骨架。
让每一层职责清楚。
让本地、数据库、后台、部署可以解释。
以后在这个骨架上逐步替换和增强。
```

这是一条适合个人全栈项目的路线。

它没有把复杂度藏起来，也没有一开始就把所有底层细节都手写一遍。  
它是在“可理解”和“可落地”之间取了一个比较稳的平衡。
