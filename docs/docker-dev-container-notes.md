# Docker 与 Dev Container 学习思路总结

这篇笔记记录的是我当前阶段对 Docker 和 Dev Container 的理解。

我现在还是初学者，所以重点不是马上掌握所有 Docker 命令，而是先理解它为什么值得用于个人网站项目，以及它和工程化开发环境有什么关系。

## 我的项目背景

这个项目未来计划使用：

- Next.js
- Payload CMS
- PostgreSQL
- Docker
- Dev Container
- VPS
- Coolify
- GitHub

所以 Docker 对我来说不是单独学一个工具，而是为了让本地开发环境、数据库环境和未来部署环境尽量接近。

## 我为什么想学 Docker

我之前最担心的问题是：本地开发环境会越来越乱。

比如：

- Node 到底装哪个版本？
- pnpm 是全局安装还是项目安装？
- npm 包装到哪里？
- 数据库要不要安装在本机？
- 本机环境变量会不会越来越乱？
- 以后不用这个项目了，残留文件怎么清理？
- 换电脑或者部署到服务器时，环境还能不能复现？

Docker 和 Dev Container 给我的思路是：

> 本机尽量只保留通用工具，项目专属环境尽量放进容器。

本机主要保留：

```txt
Docker Desktop
VS Code / Cursor
Git
浏览器
```

项目相关的东西尽量放进容器：

```txt
Node
pnpm
node_modules
项目 CLI
PostgreSQL
Redis
Payload 运行环境
开发 shell 工具
```

这样我的本地电脑会干净很多。

## Docker 的核心理解

Docker 可以先简单理解成：

> 用一个可复制、可删除、可重建的容器运行项目或服务。

比如 PostgreSQL 不一定要安装在 Windows 本机上，而是可以作为一个 Docker 容器运行。

这样以后如果不用了，可以删除容器、镜像和 volume，而不是在系统里到处找残留服务和配置。

## Image 和 Container

我现在可以先这样理解：

```txt
Image     像是应用运行环境的模板
Container 像是从这个模板启动出来的实际运行实例
```

比如：

```txt
postgres image
  ↓
postgres container
```

或者：

```txt
Next.js project image
  ↓
web container
```

## Dockerfile 是什么

Dockerfile 是一份说明书，描述如何把项目打包成一个镜像。

当前项目里的 Dockerfile 大概做了这些事：

```txt
使用 Node 22 镜像
启用 pnpm
安装依赖
执行 Next.js build
只保留生产运行需要的文件
启动 Next.js standalone server
```

它更偏生产部署。

也就是说：

```txt
Dockerfile = 这个应用如何被构建成生产镜像
```

## compose.yaml 是什么

Docker Compose 用来描述多个服务如何一起启动。

当前项目现在只有一个服务：

```txt
web
```

以后接 Payload 和 PostgreSQL 时，可能会变成：

```txt
web
postgres
```

甚至以后可能有：

```txt
web
postgres
redis
```

所以 Compose 的意义是：

> 不用手写一堆 docker run 命令，而是用一个文件描述整个项目需要哪些服务。

## Dev Container 是什么

Dev Container 不是单纯用 Docker 跑项目。

我现在的理解是：

> Dev Container 是把开发环境本身也放进一个容器里。

普通开发可能是：

```txt
Windows 本机
  Node
  pnpm
  npm global packages
  database tools
  shell tools
  project dependencies
```

Dev Container 的思路是：

```txt
Windows 本机
  Docker Desktop
  VS Code / Cursor
  Git

Dev Container
  Node
  pnpm
  project dependencies
  CLI tools
  development shell
```

这样开发环境更容易统一，也更容易删除和重建。

## CJ Dev Container 思路给我的启发

CJ 的 Dev Container 视频里，我理解到几个重点。

第一，Dev Container 可以保持开发环境一致。

也就是说，不同电脑打开同一个项目，可以使用同一个 Node 版本、同一套工具、同样的 VS Code 插件和同样的初始化命令。

第二，Dev Container 可以让开发环境更隔离。

项目目录被挂载进容器，容器主要访问项目目录和容器自己的文件系统。项目依赖和开发工具不需要散落在本机系统里。

第三，Docker-in-Docker 可以让开发更进一步容器化。

如果 Dev Container 里也能运行 Docker 命令，那么我可以在开发容器里启动数据库容器、Redis 容器等服务。

这意味着很多开发相关的东西都可以被限制在容器体系内，而不是污染本机。

第四，现代 Dev Container 可以保持 hot reload / hot refresh。

以前 container-based development 可能会慢，是因为代码和容器之间经常需要同步，或者文件监听体验不好。

Dev Container 的方式更像是把项目目录直接挂载进容器。编辑器改的是同一份项目文件，容器里的 Next.js dev server 可以直接看到文件变化，所以仍然可以热更新。

## docker-in-docker 的理解

docker-in-docker 可以简单理解成：

> 在开发容器里面继续使用 Docker 能力。

比如我人在 Dev Container 里写代码，同时在这个容器里运行：

```bash
docker compose up postgres
```

这样数据库服务也由容器体系管理。

不过对初学者来说，这个概念一开始可能有点绕。

所以我现在的学习顺序应该是：

```txt
先理解 Docker Desktop
再理解普通 Docker container
再理解 Docker Compose
再理解 Dev Container
最后再理解 docker-in-docker
```

## 当前项目为什么还没有完全使用 CJ 的 Dev Container 配置

CJ 的配置更像一个通用开发容器模板，里面可能包括：

- common-utils
- Oh My Zsh
- docker-in-docker
- sshd
- 自定义 workspaceMount

当前项目的配置更克制，只做了第一阶段需要的东西：

- 使用 Node 22 devcontainer image
- 使用普通 `node` 用户
- 自动执行 `corepack enable && pnpm install`
- 配置 VS Code 插件
- 配置 Prettier / ESLint / Tailwind / TypeScript

原因是我现在还没有接 Payload 和 PostgreSQL。

如果一开始就加入太多高级配置，会同时引入很多概念：

```txt
Docker Desktop
Dev Container
docker-in-docker
compose
postgres
volume
network
sshd
workspace mount
```

这对第一阶段来说太多了。

所以当前思路是：

> 先用轻量 Dev Container 跑通 Next.js 工程基座，等接数据库和 Payload 时，再升级成更完整的 compose-based Dev Container。

## Dev Container 能解决什么问题

它最吸引我的地方是：

- 不用在本机安装各种项目专属工具
- 不用纠结全局 npm 包和局部 npm 包
- 不用把 PostgreSQL 安装成本机系统服务
- 不同项目之间环境隔离
- 项目不用了可以删除容器和 volume
- 新电脑上更容易重新搭建环境
- 本地开发环境更接近未来部署环境

这对个人学习和长期维护项目都很有价值。

## 需要避免的误解

Dev Container 很有用，但不是魔法。

我仍然需要在本机安装：

```txt
Docker Desktop
VS Code / Cursor
Dev Containers 扩展
Git
```

项目级环境变量仍然需要配置，只是不再污染系统级环境变量。

真实密钥仍然需要认真管理，不能提交到 Git。

Docker 也会有自己的学习成本，比如：

- image
- container
- volume
- network
- port mapping
- compose
- rebuild
- logs

所以不能把 Docker 神化成“一切都会自动变好”。

更准确地说，它是一种工程化管理开发环境和部署环境的方法。

## 我现在应该怎么学

我现在不需要一次性学完所有 Docker。

比较合理的学习顺序是：

1. 安装 Docker Desktop
2. 理解 image 和 container
3. 跑 `hello-world`
4. 学会 `docker ps`、`docker run`、`docker stop`
5. 理解 `compose.yaml`
6. 用当前项目跑 `docker compose up --build`
7. 安装 VS Code Dev Containers 扩展
8. 用 `Reopen in Container` 打开当前项目
9. 理解 Dev Container 里的终端和本机终端有什么区别
10. 等接 PostgreSQL 时，再学习 volume、network、docker-in-docker

## 我对这个思路的总结

Docker 和 Dev Container 对我最大的意义，是让我从一开始就用工程化的方式管理开发环境。

我不再把所有项目依赖、数据库、CLI 工具都安装到本机，而是把它们放进可复制、可删除、可重建的容器环境里。

这样项目环境更干净，不同项目之间更隔离，也更接近未来部署到 VPS 和 Coolify 的方式。

当前阶段我不需要精通 Docker，但需要理解它的价值：

> Docker 负责让服务和环境可复制，Dev Container 负责让开发环境可复制。它们一起帮助我减少本机污染、降低环境不一致的问题，并为未来部署打基础。
