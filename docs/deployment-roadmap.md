# Kita Deployment Roadmap

这份文档记录 Kita 从本地开发环境走向 VPS + Coolify + Cloudflare 部署环境的路线图。

它不是一份马上照着执行的命令清单，而是一份上线前的地图：告诉自己每一步在解决什么问题、什么时候该做、哪些东西现在已经跑通、哪些东西还没有跑通。

当前项目目标：

```text
GitHub 管理源码
Docker / Dev Container 管理本地开发环境
Next.js 负责前台页面和应用结构
Payload CMS 负责 Admin、Collections、CRUD、API
PostgreSQL 负责持久化数据
Coolify 负责 VPS 上的部署管理
Cloudflare 负责 DNS、HTTPS 和基础防护
```

## 当前状态

已经完成：

```text
Next.js App Router 工程基座
ESLint / Prettier / TypeScript / typedRoutes
Dev Container
Docker-in-Docker 本地开发方式
PostgreSQL 本地容器
Payload CMS 最小闭环
Users collection
Tools collection
/tools 从 Payload/PostgreSQL 读取真实数据
Dockerfile 生产镜像构建
compose.yaml 中的 web + postgres 服务
GitHub 首次 commit 和 push
```

还没有完成：

```text
VPS 初始化
Coolify 安装
Cloudflare DNS 接入
生产环境变量配置
生产 PostgreSQL 数据卷和备份策略
Coolify 从 GitHub 自动部署
生产环境 Payload admin 创建
生产环境 Tools 数据录入
生产环境 /tools 验证
```

所以现在的准确状态是：

```text
本地闭环已经基本跑通。
GitHub 仓库已经建立。
部署链路还没有真正跑通。
```

## 为什么选择 Coolify

选择 Coolify 的原因不是为了完全逃避底层，而是为了用一个更清楚的界面组织底层能力。

Coolify 背后仍然是这些东西：

```text
Linux VPS
SSH
Docker
Docker Compose / 容器编排
GitHub 仓库
环境变量
反向代理
HTTPS 证书
日志
数据库 volume
```

Coolify 帮我们做的是：

```text
把 GitHub 仓库连接到服务器
根据 Dockerfile / compose.yaml 构建应用
管理应用容器和数据库容器
管理环境变量
管理域名和 HTTPS
查看部署日志和运行日志
触发自动部署
管理数据库和服务
```

这很适合当前阶段。

如果完全手写部署，需要同时学习：

```text
Linux 用户和权限
Docker Engine
Docker Compose
Nginx 或 Caddy
HTTPS 证书
systemd
数据库备份
GitHub webhook
日志排查
```

这些当然值得学，但不适合在项目第一版全部压上来。

Coolify 的位置可以理解为：

```text
不是替代 Docker。
不是替代 GitHub。
不是替代 VPS。
而是在 VPS 上帮我们管理 Docker 应用部署。
```

## 推荐 VPS 方案

当前推荐使用：

```text
Vultr High Performance
2 vCPU
4 GB RAM
100 GB NVMe
5 TB bandwidth
Ubuntu 24.04 LTS
```

这个规格适合当前 Kita 项目。

原因：

```text
Coolify 本身需要占用一部分资源。
Next.js + Payload 是 Node.js 应用，会占用内存。
PostgreSQL 需要独立运行并保存数据。
以后还可能加图片、后台、备份和监控。
```

2 GB 内存也许能跑，但会比较紧张。  
4 GB 内存是更稳的第一台正式 VPS。  
8 GB 更舒服，但对当前个人站第一版来说暂时不是必须。

保守估计，这台 2c/4GB VPS 可以承载：

```text
1 个 Kita 这样的 Next.js + Payload + PostgreSQL 项目：比较舒服
2 个类似的动态站：需要关注内存和构建压力
3 到 5 个静态或轻量 Next.js 站点：通常可以
更多数据库型项目：建议升级或拆分服务器
```

真正限制通常不是带宽，而是：

```text
内存
构建时 CPU
数据库占用
图片和备份占用的磁盘
```

## 本地环境和部署环境的区别

本地开发环境：

```text
Windows
  Docker Desktop
    Dev Container
      Node / pnpm / Next.js / Payload
      Docker-in-Docker
        PostgreSQL
```

本地重点是：

```text
方便写代码
环境一致
不污染本机
可以反复删库重来
可以用 seed 数据测试
```

生产部署环境：

```text
VPS
  Docker Engine
    Coolify
    Kita web container
    Kita postgres container
    persistent volume
```

生产重点是：

```text
稳定运行
数据不能随便丢
环境变量不能泄露
日志要能查
数据库要备份
域名和 HTTPS 要正常
不要启用开发 seed
```

本地可以经常重建，生产不可以随便删 volume。

## 当前 compose.yaml 的部署含义

当前 `compose.yaml` 已经表达了两个服务：

```text
web
  Kita 的 Next.js + Payload 应用

postgres
  Kita 的 PostgreSQL 数据库
```

核心关系是：

```text
web 依赖 postgres
web 通过 DATABASE_URI 连接 postgres
postgres 使用 postgres-data volume 保存数据
```

生产环境里最重要的是这个：

```text
postgres-data volume 不能随便删除。
```

因为 Payload 的 Users、Tools、未来 Reviews、Games、Media 元数据都会存在 PostgreSQL 里。

## 生产环境变量

生产环境至少需要配置：

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
PAYLOAD_SECRET=replace-with-a-long-random-production-secret
DATABASE_URI=postgres://postgres:strong-password@postgres:5432/kita
ENABLE_DEV_SEED=false
```

注意：

```text
NEXT_PUBLIC_SITE_URL 可以暴露给浏览器。
PAYLOAD_SECRET 绝不能公开。
DATABASE_URI 绝不能公开。
ENABLE_DEV_SEED 生产环境必须是 false。
```

本地 `.env` 不提交到 GitHub。  
生产环境变量在 Coolify 面板里配置。

## 部署前必须确认的本地检查

每次准备部署前，至少在 Dev Container 里跑：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

如果改过 Payload collections，还要跑：

```bash
pnpm payload:types
```

如果本地数据链路需要确认：

```bash
docker compose up -d postgres
pnpm dev
pnpm seed:tools
```

然后检查：

```text
http://localhost:3000
http://localhost:3000/tools
http://localhost:3000/admin
```

本地都正常后，再考虑部署。

## 第一阶段部署路线

第一阶段目标不是完整上线所有功能，而是把最小生产闭环跑通。

目标：

```text
VPS 可访问
Coolify 可访问
GitHub 仓库连接成功
Kita 应用构建成功
PostgreSQL 服务启动成功
/admin 可打开
可以创建第一个 Payload 管理员
可以在生产 Admin 里手动创建 1 到 2 条 Tools
/tools 能读取生产数据库数据
```

### 1. 创建 VPS

建议选择：

```text
Ubuntu 24.04 LTS
2 vCPU / 4 GB RAM
100 GB NVMe
```

创建后记录：

```text
VPS IP
root 密码或 SSH key
服务器地区
```

### 2. SSH 登录 VPS

目标是确认自己能进入服务器。

大概形式：

```bash
ssh root@your-server-ip
```

第一次只做基础确认：

```bash
whoami
uname -a
df -h
free -h
```

### 3. 更新系统

目标是让基础系统处于较新状态。

常见命令：

```bash
apt update
apt upgrade
```

这一步属于服务器初始化，不是项目代码的一部分。

### 4. 安装 Coolify

按照 Coolify 官方安装文档执行。

官方 quick install 的核心思路是：

```text
在一台干净的 VPS 上运行安装脚本。
脚本会安装 Docker Engine、准备 Coolify 目录、启动 Coolify。
```

安装完成后，Coolify 会给出一个访问地址，通常类似：

```text
http://your-server-ip:8000
```

第一次打开后，要立刻创建 Coolify 管理员账号。

### 5. 设置域名和 Cloudflare

推荐结构：

```text
example.com
  -> Cloudflare DNS
  -> VPS IP
  -> Coolify proxy
  -> Kita app
```

可以先规划这些域名：

```text
coolify.example.com
  Coolify 管理面板

kita.example.com
  Kita 网站
```

Cloudflare 里建议：

```text
DNS 记录指向 VPS IP
开启代理
SSL/TLS 使用 Full (strict)
```

后续更安全的做法：

```text
用 Cloudflare Access 保护 coolify.example.com
用 Cloudflare Access 或 Coolify/Caddy 保护 /admin
服务器防火墙只开放 22、80、443
```

### 6. 在 Coolify 连接 GitHub

目标：

```text
Coolify 能拉取 GitHub 上的 Kita 仓库。
```

当前仓库：

```text
https://github.com/koharu4ever/Kita
```

建议使用 GitHub App 方式连接，而不是手动复制 token。

### 7. 在 Coolify 创建 Kita 应用

有两条可能路线：

```text
路线 A：使用仓库里的 Dockerfile 构建 web 应用
路线 B：使用仓库里的 compose.yaml 同时启动 web + postgres
```

对当前项目，第一版更推荐路线 B。

原因：

```text
项目本身就需要 PostgreSQL。
compose.yaml 已经描述了 web 和 postgres 的关系。
这样更接近本地 Docker 闭环。
```

但是要注意：

```text
生产数据库 volume 必须稳定保存。
生产环境变量必须在 Coolify 里重新配置。
不要把本地 .env 上传。
```

### 8. 配置生产环境变量

Coolify 里需要设置：

```env
NEXT_PUBLIC_SITE_URL=https://kita.example.com
PAYLOAD_SECRET=一个足够长的随机字符串
DATABASE_URI=postgres://postgres:强密码@postgres:5432/kita
ENABLE_DEV_SEED=false
```

如果使用 `compose.yaml` 默认的 postgres 用户名和数据库名，也要认真设置数据库密码。

生产环境不要继续用：

```text
postgres / postgres
```

### 9. 第一次部署

第一次部署主要看三件事：

```text
构建是否成功
web 容器是否启动
postgres 容器是否启动
```

如果失败，优先看 Coolify logs。

常见问题类型：

```text
环境变量缺失
DATABASE_URI 不正确
PAYLOAD_SECRET 太短或没设置
Dockerfile 构建失败
PostgreSQL 连接失败
端口或域名配置错误
```

### 10. 创建生产 Payload 管理员

部署成功后打开：

```text
https://kita.example.com/admin
```

第一次进入 Payload Admin 时，创建管理员账号。

注意：

```text
生产管理员邮箱和密码不需要写进代码。
不需要告诉 AI。
不要提交到 GitHub。
```

### 11. 在生产 Admin 中创建 Tools 数据

因为生产环境 `ENABLE_DEV_SEED=false`，所以不使用开发 seed。

第一版建议手动创建：

```text
Textractor
VNDB
```

这样可以确认：

```text
Admin 能写入 PostgreSQL
PostgreSQL 能持久化保存
/tools 能读取生产数据
```

### 12. 验证生产页面

检查：

```text
https://kita.example.com
https://kita.example.com/about
https://kita.example.com/tools
https://kita.example.com/reviews
https://kita.example.com/games
https://kita.example.com/admin
```

第一阶段最关键的是：

```text
/admin 能登录
/tools 能显示数据库里的 Tools
```

这两个通过，说明生产数据闭环跑通。

## 第二阶段部署路线

第一阶段跑通后，再处理这些增强项。

### 自动部署

目标：

```text
push 到 GitHub main
Coolify 自动重新部署
```

这一步由 Coolify GitHub integration / webhook 处理。

以后工作流变成：

```text
本地开发
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
git commit
git push
Coolify 自动部署
```

### 数据库备份

生产数据库必须备份。

最低要求：

```text
Coolify 中配置 PostgreSQL backup
定期下载或同步备份
确认备份可以恢复
```

后续可以考虑：

```text
对象存储备份
异地备份
定期恢复演练
```

### Admin 保护

Payload Admin 不是公开内容页面，应该额外保护。

可以逐步考虑：

```text
强密码
Cloudflare Access
Coolify/Caddy basic auth
限制登录路径访问
开启 2FA，如果后续方案支持
```

第一版最实用的是 Cloudflare Access。

### 媒体文件存储

如果以后 Payload 加 Media collection，要决定图片存哪里。

选择：

```text
本地 volume
S3-compatible storage
Cloudflare R2
MinIO
```

第一版如果图片很少，可以先用本地 volume。  
但如果图片会越来越多，建议尽早考虑对象存储。

### 监控

第一版先看 Coolify 面板和 logs。

后续再考虑：

```text
Uptime Kuma
Coolify resource view
VPS provider metrics
简单告警
```

不要一开始就把 Grafana / Prometheus 全部接上。  
当前阶段重点是让项目稳定上线。

## 第三阶段部署路线

当项目开始稳定更新后，再考虑更完整的工程链路。

可以逐步加入：

```text
GitHub Actions
pull request 检查
自动运行 lint/typecheck/build
生产部署前检查
staging 环境
数据库迁移策略
备份恢复演练
日志归档
```

GitHub Actions 第一版只需要做：

```text
pnpm install
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

不要一开始就让 GitHub Actions 直接部署生产。  
先让 Coolify 负责部署，会更容易理解。

## 部署时不要做的事

不要把 `.env` 提交到 GitHub。

不要在生产环境开启：

```env
ENABLE_DEV_SEED=true
```

不要在生产数据库里随便执行：

```bash
docker compose down -v
```

因为 `-v` 会删除 volume，可能直接删除数据库数据。

不要把生产数据库密码写进文档或聊天记录。

不要一开始同时部署太多服务：

```text
Kita
PostgreSQL
Coolify
Cloudflare
backup
monitoring
object storage
CI/CD
```

建议顺序是：

```text
先部署 Kita + PostgreSQL。
再做域名和 HTTPS。
再做备份。
再做 Admin 保护。
再做自动部署。
再做监控。
```

## 最小上线验收标准

只有下面这些都通过，才算第一阶段部署完成：

```text
VPS 能 SSH 登录
Coolify 能正常访问
Cloudflare DNS 指向正确
Kita 应用部署成功
PostgreSQL 容器运行中
postgres-data volume 存在
NEXT_PUBLIC_SITE_URL 配置为生产域名
PAYLOAD_SECRET 已设置为生产 secret
ENABLE_DEV_SEED=false
/admin 能创建并登录管理员
Tools collection 能创建内容
/tools 能读取生产 Tools 内容
重启 web 容器后数据仍然存在
重启 postgres 容器后数据仍然存在
```

这个验收标准比“页面能打开”更重要。  
因为我们的项目不是纯静态站，而是 Next.js + Payload + PostgreSQL 的完整应用。

## 当前最推荐的下一步

现在不要急着把所有部署细节一次做完。

推荐下一步是：

```text
1. 购买或确认 VPS。
2. 选择 Ubuntu 24.04 LTS。
3. 只做 SSH 登录和基础系统更新。
4. 安装 Coolify。
5. 给 Coolify 配一个域名。
6. 在 Coolify 里连接 GitHub。
7. 尝试部署 Kita。
```

如果第一次部署失败，不要慌。  
部署失败通常不是项目崩了，而是：

```text
环境变量没配
数据库地址不对
域名没解析
HTTPS 还没就绪
容器日志里有明确错误
```

排错顺序永远是：

```text
先看 Coolify build logs
再看 app runtime logs
再看 postgres logs
再检查 env
再检查 DNS / HTTPS
```

## 参考资料

- CJ Next.js starter: https://www.youtube.com/watch?v=dLRKV-bajS4
- CJ Self Host / Coolify: https://www.youtube.com/watch?v=taJlPG82Ucw
- Coolify installation docs: https://coolify.io/docs/get-started/installation
- Docker Compose docs: https://docs.docker.com/compose/
- Cloudflare Full strict SSL mode: https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/

## 测试应该什么时候做

测试不是部署之后才做的事情，也不是项目第一天就必须把所有测试框架都装满。

更适合 Kita 的节奏是：

```text
工程化阶段：
  先用 lint / typecheck / build 保证项目能稳定构建。

最小后端闭环阶段：
  先人工验证 Payload Admin、PostgreSQL、/tools 数据读取链路。

开始稳定写业务后：
  再补单元测试和集成测试。

准备正式部署前：
  再补少量端到端测试，验证关键用户路径。
```

也就是说，当前阶段不需要急着追求“测试覆盖率”，更应该先建立“每次改完都能确认项目没有坏”的习惯。

## bulletproof-react 的测试思路

bulletproof-react 的项目结构里有一个 `testing` 目录。

它的思路不是把所有测试文件都集中塞进 `testing`，而是把测试用到的公共工具放在那里。

可以这样理解：

```text
src/testing
  放测试环境的公共 helper、mock、测试数据工厂、测试渲染工具。

src/features/xxx
  功能自己的测试可以靠近功能代码。

src/app
  Next.js 路由层一般少写复杂测试，更多通过集成测试或 E2E 验证。
```

这和我们当前架构是兼容的。

Kita 不应该变成：

```text
所有测试都堆到 src/testing
```

而应该是：

```text
测试工具集中放。
具体功能测试靠近对应功能。
关键页面流程用 E2E 测。
```

## Kita 里测试应该放在哪里

推荐结构：

```text
src/testing
  render.tsx
  test-utils.ts
  factories/
  mocks/

src/features/tools
  components/
  utils/
  __tests__/

src/server/tools
  __tests__/

e2e/
  home.spec.ts
  tools.spec.ts
  admin-smoke.spec.ts
```

解释一下：

```text
src/testing
  只放通用测试基础设施。
  例如测试用 render 函数、mock payload client、测试数据生成器。

src/features/tools/__tests__
  放 Tools 这个前端功能自己的测试。
  例如 mapper 是否正确把 Payload document 转成前端展示数据。

src/server/tools/__tests__
  放服务端读取逻辑的测试。
  例如 getTools 在 Payload 有数据、无数据、报错时分别如何处理。

e2e
  放浏览器级测试。
  例如打开 /tools 后能看到从数据库来的工具项。
```

第一版不需要一次创建所有这些目录。

真正需要写测试时再创建对应位置。

## 当前阶段应该做哪些测试

现在最重要的是健康检查，不是复杂测试框架。

每次重要修改后，先跑：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

这四个命令解决的问题分别是：

```text
format:check
  检查代码风格有没有乱。

lint
  检查明显的代码问题、未使用 import、项目规则问题。

typecheck
  检查 TypeScript 类型是否成立。

build
  检查 Next.js 生产构建是否能通过。
```

对现在的 Kita 来说，这四个比一上来写很多测试更重要。

因为项目刚进入 Payload + PostgreSQL 阶段，最大风险还是：

```text
环境变量错误
Payload 配置错误
Next.js 构建失败
Docker 构建失败
前后端类型边界不清楚
```

这些问题不一定靠单元测试发现，反而更靠 typecheck / build / 手动链路验证发现。

## 什么时候开始写单元测试

当某段代码满足下面任意一个条件，就适合写单元测试：

```text
它有明确输入和输出。
它不依赖浏览器。
它不依赖真实数据库。
它会被多个页面复用。
它改错后不容易肉眼发现。
```

当前 Kita 最适合先测的是 mapper 和纯工具函数。

例如：

```text
src/features/tools/utils/map-tool-document-to-toolkit-item.ts
```

这个文件适合单元测试，因为它的职责很清楚：

```text
输入 Payload Tool document
输出前端 Toolkit item
```

如果以后 Reviews、Games 也从 Payload 接数据，它们的 mapper 也适合写单元测试。

不建议一开始测试：

```text
纯视觉 CSS 效果
动画细节
Next.js route group 本身
Payload Admin 内部 UI
```

这些测试成本高，收益暂时不大。

## 什么时候写集成测试

当一个功能跨过了多个层，就适合写集成测试。

例如 `/tools` 的真实链路是：

```text
PostgreSQL
  -> Payload local API
  -> getTools()
  -> mapper
  -> /tools 页面
```

这个链路不是单元测试能完全覆盖的。

但第一版可以先人工验证：

```text
docker compose up -d postgres
pnpm dev
打开 /admin 创建 Tools
打开 /tools 看是否显示
```

等 Tools、Reviews、Games 都接入 Payload 后，再考虑写自动化集成测试。

集成测试适合验证：

```text
Payload 能连接测试数据库。
getTools 能读到真实数据。
空数据库时页面不会崩。
数据库报错时开发环境有 fallback，生产环境不静默失败。
```

## 什么时候写 E2E 测试

E2E 测试就是用真实浏览器模拟用户访问。

它适合部署前检查最关键的用户路径。

Kita 第一版最值得做的 E2E 测试很少：

```text
首页能打开。
/about 能打开。
/tools 能打开并显示至少一个工具。
/admin 能打开登录页或创建首个用户页。
```

不要一开始就写很多 E2E。

原因：

```text
E2E 慢。
E2E 容易受环境影响。
E2E 对新手排错成本更高。
```

它应该用来兜住核心链路，而不是替代日常开发判断。

## 建议的测试工具选择

后续可以按这个顺序引入：

```text
Vitest
  单元测试和轻量集成测试。

React Testing Library
  React 组件行为测试。

Playwright
  E2E 浏览器测试。
```

不建议现在一次性全部安装。

推荐顺序：

```text
第一步：
  继续使用 format / lint / typecheck / build。

第二步：
  当第一个 mapper 或复杂工具函数稳定后，引入 Vitest。

第三步：
  当前端组件开始有复杂交互后，引入 React Testing Library。

第四步：
  准备 Coolify 正式部署前，引入 Playwright 做 2 到 4 条冒烟测试。
```

## 测试和部署的关系

未来 GitHub Actions 可以先只跑：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

等引入测试后，再变成：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

等引入 E2E 后，再考虑：

```bash
pnpm test:e2e
```

不过第一版不建议让 E2E 阻塞所有部署。

更稳的做法是：

```text
本地开发：
  format / lint / typecheck / build

GitHub Actions：
  format / lint / typecheck / build

上线前人工检查：
  /admin
  /tools
  数据是否持久化

项目成熟后：
  加 Vitest
  加少量 Playwright
```

## 当前结论

现在不用急着写测试框架。

当前 Kita 的测试路线应该是：

```text
1. 继续把 pnpm format:check / lint / typecheck / build 当作日常健康检查。
2. 等 Reviews 或 Games 开始接 Payload 数据时，给 mapper 写第一批单元测试。
3. 等多个页面都读 Payload 后，给 server data access 写集成测试。
4. 部署前，给首页、/tools、/admin 写少量 E2E 冒烟测试。
5. 最后再把这些检查逐步放进 GitHub Actions。
```

测试不是为了显得专业，而是为了让自己以后敢改代码。

第一版最重要的是：

```text
测试少一点也可以。
但每个测试都要对应真实风险。
```
