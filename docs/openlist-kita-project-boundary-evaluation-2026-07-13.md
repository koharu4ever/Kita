# Kita 与 OpenList 项目边界和部署结构评估

> 评估日期：2026-07-13（America/Los_Angeles）
>
> 原始状态：架构决策建议；评估当时尚未部署 OpenList，也没有修改 Kita 业务代码或生产环境。
>
> 关联评估：[Games 与 OpenList 文件索引方案评估](./games-openlist-index-evaluation-2026-07-13.md)
>
> 2026-07-20 实施结果：该边界方案已经落地。OpenList 以 `openlistteam/openlist:v4.2.2` 作为独立 Coolify Application 运行在 `https://archive.kral-koharu.com`；Kita 只在 Games 数据中保存公开 URL，不共享数据库、Volume、secret 或构建流程。最终 storage provider 与 OpenList data backup 有意延期。当前部署与恢复状态以灾难恢复 Runbook 为准，本文其余内容保留为决策依据。

## 1. 结论先行

需要先把“新开一个项目”拆成不同层次。推荐结论是：

1. **OpenList 本身有完整前端，不需要 Kita 再开发一个文件列表前端。**
2. **第一版不需要新建自己的 OpenList GitHub 仓库，也不需要 fork 官方仓库。**
3. **在 Coolify 中应新建一个独立 Application；它可以和 Kita 放在同一个 Coolify Project / Production Environment 下管理。**
4. **OpenList 不应加入 Kita 当前的 `compose.yaml`，也不应成为 Payload 内部服务。**
5. **Kita 和 OpenList 的产品连接点就是一个公开 HTTPS 目录 URL。** URL 保存到 Payload Games 的现有 `links` 字段，由 lightbox 第二个按钮打开。
6. 两边不共享数据库、Volume、secret、容器网络、构建流程或登录状态。

推荐结构可以概括为：

```text
同一个业务：Kita
  |
  +-- Kita Application
  |     Next.js + Payload + PostgreSQL + backup
  |     https://kita.kral-koharu.com
  |
  +-- OpenList Application
        官方完整镜像：Go 服务 + 配套 Web UI
        https://archive.kral-koharu.com
        独立 data Volume + 独立配置 + 独立存储凭据

唯一产品连接：
Payload Games.links 中的一条 https://archive... URL
```

这叫做：**同一产品体系下的独立应用，通过稳定链接进行松耦合集成。**

## 2. “新项目”到底指什么

| 层次                     | 是否新建 | 推荐做法                                                     |
| ------------------------ | -------- | ------------------------------------------------------------ |
| GitHub 仓库              | 否       | 第一版直接使用官方 OpenList Docker 镜像，不复制源码          |
| Kita 源码目录            | 否       | 不把 OpenList 源码、Go 后端或 SolidJS 前端放进 Kita          |
| Kita `compose.yaml` 服务 | 否       | 保持现有 web、postgres、backup 边界                          |
| Coolify Project          | 通常不必 | 可以继续放在现有 Kita Project 中，方便按同一业务查看         |
| Coolify Application      | **是**   | 新建独立的 OpenList Application                              |
| 域名                     | **是**   | 使用 `archive.kral-koharu.com` 一类独立子域名                |
| 持久化数据               | **是**   | OpenList 使用自己的 data Volume                              |
| 数据库                   | 独立     | 第一版使用 OpenList 默认 SQLite 即可，不复用 Kita PostgreSQL |
| 前端项目                 | 否       | 使用官方镜像自带的配套前端                                   |

因此，“新开一个项目”最准确的说法是：

> 在 Coolify 的同一个业务 Project 下，新建一个独立 Application；不是新建一套要由你维护的源代码项目。

如果以后决定修改 OpenList 源码、长期自定义其前端，才有理由创建单独的 GitHub fork 或专用仓库。即使到那时，也更适合使用独立仓库，而不是塞进 Kita monorepo。

## 3. OpenList 本身有没有前端

答案是：**有，而且是完整可用的 Web 前端。**

官方当前把源码分成两个主要仓库：

- [OpenListTeam/OpenList](https://github.com/OpenListTeam/OpenList)：Go 后端，负责 API、认证、配置、存储驱动、文件操作和 Web 服务；
- [OpenListTeam/OpenList-Frontend](https://github.com/OpenListTeam/OpenList-Frontend)：独立前端源码，官方说明由 SolidJS 驱动，仓库包含 TypeScript、`vite.config.ts` 和前端构建流程。

但是“源码分成两个仓库”不等于生产环境必须运行两个容器。

官方源码构建说明要求先构建前端，再把生成的 `dist` 复制到后端的 `public` 目录。官方配置文档同时说明，发布版本可以使用程序内置的前端 dist；Go 后端还会读取并处理 `index.html`。因此标准 OpenList Docker 镜像已经是面向使用者的完整应用：

```text
Browser
  -> OpenList :5244
       -> Web UI
       -> API
       -> Admin UI
       -> storage drivers
```

第一版不需要：

- 单独部署 SolidJS 容器；
- 单独建立 Vite 项目；
- 用 Kita Next.js 重写 OpenList 文件列表；
- 配置 Kita 到 OpenList 的内部 API token；
- 自己编译 Go 和前端源码。

只需要部署官方稳定镜像，并为它提供独立持久化目录和域名。

## 4. 推荐的生产拓扑

当前 Kita 的生产拓扑是：

```text
Coolify Compose Application: Kita
  |-- web
  |-- postgres
  |-- backup
  `-- postgres-data
```

推荐不要改成：

```text
Kita compose
  |-- web
  |-- postgres
  |-- backup
  `-- openlist
```

推荐新增为：

```text
Coolify Project: Kita
  `-- Environment: Production
       |-- Compose Application: Kita
       |     |-- web
       |     |-- postgres
       |     |-- backup
       |     `-- postgres-data
       |
       `-- Application: OpenList
             |-- official pinned OpenList image
             |-- openlist-data Volume
             |-- archive.kral-koharu.com
             `-- cloud drive / object storage provider
```

放在同一个 Coolify Project 只是为了管理方便，不代表两个应用共享运行资源。它们必须可以独立部署、重启、回滚和备份。

## 5. Kita 与 OpenList 到底怎样连接

### 5.1 第一版连接只有 URL

从应用角度看，确实只有一个连接点：

```text
Payload Games document
  links[0].href
    = https://archive.kral-koharu.com/path/to/game

Kita lightbox
  -> <a href="that URL" target="_blank">
  -> Browser 请求 OpenList
```

这里不是 Kita 服务器去请求 OpenList。是用户浏览器先访问 Kita，再根据普通链接访问 OpenList。

因此第一版没有：

- Kita -> OpenList 的服务端 API 请求；
- Kita -> OpenList 的内部 Docker hostname；
- OpenList 管理 token；
- CORS 集成；
- 共享 session 或单点登录；
- 共享数据库表；
- 共享文件 Volume。

这使链接本身成为一个很小、很稳定的数据契约：

```text
输入：一个 HTTPS 目录 URL
输出：用户进入对应公开资源目录
```

### 5.2 为什么这种连接已经足够紧密

“结合紧密”不等于必须共享代码或 API。用户在 Kita 中先完成内容发现，再从当前游戏的 lightbox 精确进入对应目录，业务上下文已经由 URL 表达。

它有三个优点：

1. 用户不是被送到 OpenList 首页，而是进入当前游戏的具体目录；
2. OpenList 故障不会让 Kita Games 无法渲染；
3. 以后把 OpenList 替换成别的文件服务，只需保持 URL 或更新 Payload link。

建议始终使用自己的稳定子域名，而不要把云盘 provider 的临时直链直接存入 Payload。这样底层存储改变时，Kita 的内容记录不必跟着变化。

### 5.3 连接边界图

```text
                    只保存公开 URL
Payload Games  --------------------------+
                                         |
                                         v
User -> Kita /games -> lightbox -> archive.kral-koharu.com/game-folder
         |                                |
         |                                +-> OpenList Web UI
         |                                +-> OpenList API
         |                                `-> storage provider
         |
         +-> 即使 OpenList 不可用，封面、详情、Reviews 仍正常
```

OpenList API、数据库结构和管理员身份都不应成为 Kita 需要理解的内容。

## 6. 为什么不把 OpenList 加入 Kita Compose

把 OpenList 写进当前 `compose.yaml` 技术上可以运行，但不适合这个项目的实际边界。

当前 Kita Compose 的 web、postgres 和 backup 属于同一个发布单元：

- web 必须依赖 postgres；
- backup 明确备份 Kita PostgreSQL；
- 三者由同一仓库版本和同一次 Coolify 部署管理。

OpenList 则不同：

- 它不依赖 Kita PostgreSQL；
- Kita 页面也不依赖它才能启动；
- 它有自己的发布节奏、配置、管理员和数据备份；
- 它需要的存储凭据不应进入 Kita Compose；
- OpenList 更新不应触发 Kita migration 或 web 重建；
- Kita PR 合并也不应无故重启 OpenList。

把两者放进一个 Compose 只会制造“看起来在一起”的部署耦合，没有带来实际 UX 收益。

## 7. OpenList 前端应该怎样处理

### 7.1 第一版：使用官方前端

这是推荐方案。

官方前端已经提供文件列表、目录导航、预览、搜索、登录和管理界面。第一版应先通过 OpenList 自身的站点配置、颜色、标题和少量样式能力建立基本品牌连续性，而不是 fork 整个前端。

Kita 负责入口体验；OpenList 负责进入后的文件体验。两边不需要像同一个 SPA 一样完全一致，只需要做到：

- 使用相近的站点名称与深色基调；
- OpenList 中有清楚的“返回 Kita Games”链接；
- 不让默认标题、图标和无关功能显得像另一个陌生站点；
- 公开访客只看到需要的只读功能。

### 7.2 为什么暂时不单独部署官方前端仓库

官方配置文档明确说明前端构建产物与后端处理的 `index.html`、版本和静态资源需要匹配。把前端独立部署到 Pages，再随意指向另一个版本的后端，会增加路由、静态资源、CORS 和版本兼容问题。

对 Kita 第一版而言，单独部署前端没有明显收益，却新增：

- 第二套前端 CI；
- Node / pnpm 构建；
- 前后端版本配对；
- CDN 与缓存失效；
- CORS 与 API 地址；
- 自定义前端的维护责任。

所以应把官方完整镜像看成一个产品，而不是必须拆开的 Go 服务和 SolidJS 网站。

### 7.3 什么时候才值得 fork 前端

只有同时满足下面情况，才考虑单独 fork `OpenList-Frontend`：

- OpenList 自带主题能力无法满足品牌要求；
- 文件浏览界面确实需要结构性改造，而不是换颜色和 Logo；
- 愿意持续跟进官方前后端版本变化；
- 愿意增加独立测试、构建、发布和安全更新；
- 已经证明外部跳转造成真实用户流失或理解问题。

即使 fork，也建议创建独立仓库，例如：

```text
Kita                   -> 当前 Next.js / Payload 仓库
Kita-OpenList-Frontend -> 将来的定制 OpenList 前端 fork
```

不要把它放进 Kita 的 `src/`，因为两套前端使用不同框架、依赖、发布节奏和许可证边界。

## 8. 方案比较

| 方案                                | 源码关系               | 生产关系             | 复杂度 | 建议                 |
| ----------------------------------- | ---------------------- | -------------------- | -----: | -------------------- |
| OpenList 加入 Kita Compose          | 同仓库或同 Compose     | 同一发布单元         |     中 | 不推荐               |
| 独立 Coolify Application + 官方镜像 | 无源码依赖             | 同 Project、独立应用 |     低 | **推荐**             |
| 单独 Coolify Project + 官方镜像     | 无源码依赖             | 完全独立管理         |     低 | 可行，但当前没有必要 |
| Kita 调用 OpenList API 并重写 UI    | Kita 依赖 OpenList API | 强运行依赖           |     高 | 暂不做               |
| fork OpenList 前端和后端            | 两个额外源码项目       | 自行构建维护         |   很高 | 当前不做             |

同一个 Coolify Project 与单独 Coolify Project 的区别主要是管理分组，不改变应用隔离。对一个人维护的初版，放在同一 Project 下更容易理解；如果以后 OpenList 有不同维护者、账单、权限或生命周期，再拆 Project。

## 9. 独立应用必须拥有的边界

### 9.1 独立数据

OpenList 官方默认可使用 SQLite，并将配置、数据库等运行数据放在自己的 data 目录。第一版建议：

- 使用独立 `openlist-data` Volume；
- 不挂载或复用 `postgres-data`；
- 不让 OpenList 连接 Kita PostgreSQL；
- 不把云盘内容复制进 Kita repository；
- 为 OpenList 配置和数据库建立自己的备份办法；
- 不删除、改名或重建现有 Kita Volume。

OpenList data Volume 通常保存应用配置和索引状态；实际文件仍位于所挂载的云盘、对象存储或其他 provider。两者都需要分别理解其备份和恢复边界。

### 9.2 独立凭据

OpenList 应拥有自己的：

- 管理员密码；
- JWT secret；
- 存储 provider token / access key；
- 域名与 TLS 配置；
- 需要时的目录密码。

这些值只保存在 OpenList 对应的 Coolify Application 或其持久化配置中，不进入：

- Kita `.env`；
- Kita Payload 内容；
- GitHub Actions；
- Markdown；
- 聊天记录；
- 浏览器端 JavaScript。

Kita 保存的只有访客本来就能看到的公开 HTTPS URL。

### 9.3 独立版本与升级

生产环境应在部署时选择并记录一个明确的稳定镜像版本，不要长期无审查地追随 `latest`。升级时单独完成：

1. 确认 OpenList data 备份；
2. 阅读版本说明；
3. 更新 OpenList；
4. 验证登录、目录、预览和下载；
5. 确认 Kita 的旧 URL 仍然有效。

OpenList 升级失败时，应能只回滚 OpenList，而不回滚 Kita。

## 10. 推荐实施顺序

### 阶段 A：独立 OpenList 概念验证

先不修改 Kita：

1. 选择一个非敏感、允许公开的测试目录；
2. 使用官方稳定镜像启动独立 OpenList；
3. 使用独立临时或正式 data Volume；
4. 验证官方前端、管理员登录、只读访客、目录预览和下载；
5. 验证重启后配置仍存在；
6. 验证不公开私人根目录和管理凭据。

这一步可以先在受控环境验证；任何生产 Coolify、DNS 或真实存储修改都应由项目所有者明确确认后执行。

### 阶段 B：建立稳定子域名

将验证通过的 OpenList 绑定到例如：

```text
https://archive.kral-koharu.com
```

先直接访问并验证具体目录 URL，不急着修改 Kita。

### 阶段 C：Kita 小型代码 PR

在 Kita 中只做一个独立 PR：

- 从现有 `game.links` 选择资源目录链接；
- lightbox 第二个按钮改为打开该 URL；
- 没有资源链接时隐藏按钮；
- 使用正确图标、`title`、`aria-label`、`target="_blank"` 和 `rel`；
- 增加相应测试；
- 不修改 Payload schema 和 migration。

为了以后 links 中能同时存在官网、购买地址等链接，实施时应再决定是暂用 `links[0]` 约定，还是增加一个可识别的 label/type。当前数据量小时可以先使用明确 label 约定，但代码不应把任意第一个链接都误当成下载目录。

### 阶段 D：录入一个真实链接验收

最后才在 Payload Admin 中为一个 Games 条目填写对应 OpenList 目录 URL，并验证完整路径：

```text
/games
  -> 点击封面
  -> lightbox
  -> 资源目录按钮
  -> archive 子域名的正确游戏目录
```

第一版不做 API、iframe、单点登录或自定义 OpenList 前端。

## 11. 验收标准

架构层面：

- [ ] OpenList 是独立 Coolify Application；
- [ ] Kita `compose.yaml` 没有加入 OpenList；
- [ ] 没有新建不必要的 OpenList 源码 fork；
- [ ] 使用官方完整前端，而不是另写文件列表页面；
- [ ] OpenList 有独立 data Volume、配置和凭据；
- [ ] OpenList 不连接 Kita PostgreSQL；
- [ ] OpenList 停止时 Kita 仍能正常运行；
- [ ] Kita 只保存公开目录 URL；
- [ ] 目录 URL 指向具体游戏目录，而不是模糊的 OpenList 首页；
- [ ] OpenList 升级与 Kita 发布可以独立完成。

UX 层面：

- [ ] 访客能区分 Kita 内部资料按钮与外部资源按钮；
- [ ] 外部资源在新标签页打开；
- [ ] 没有资源链接时不显示空按钮；
- [ ] OpenList 页面可以返回 Kita Games；
- [ ] 用户首先感受到的是 Kita 的馆藏，而不是一个突然出现的管理后台。

安全层面：

- [ ] 公开目录只包含有权公开的内容；
- [ ] 匿名访客没有上传、删除、移动或管理权限；
- [ ] 存储凭据没有进入 Kita、Git 或浏览器；
- [ ] 使用明确稳定镜像版本；
- [ ] OpenList data 有独立备份和恢复说明。

## 12. 最终决策

这个结构适合 Kita，但应按下面的边界实施：

```text
不是：
Kita 仓库 + OpenList 源码 + 新 SolidJS 前端 + 共享数据库

而是：
同一 Coolify Project
  + 独立 Kita Application
  + 独立 OpenList Application（官方完整镜像）
  + 独立子域名
  + 独立数据与凭据
  + Payload 中一条公开目录 URL
```

所以，对最开始的问题可以直接回答：

- **OpenList 有前端。**
- **标准 Docker 镜像已经包含可用前端和后端。**
- **第一版不需要新建 GitHub 项目，也不需要自己写 SolidJS。**
- **Coolify 中需要新建独立 Application。**
- **Kita 与 OpenList 的业务连接只通过链接完成。**
- **这不是临时凑合，而是当前需求下最清晰、最可靠的正式架构。**

下一步应该先形成一份独立 OpenList 部署清单，再由项目所有者确认子域名、存储 provider、公开内容范围和生产变更窗口；不应直接把 OpenList 塞进 Kita Compose。

## 13. 官方依据

- [OpenList 后端官方仓库](https://github.com/OpenListTeam/OpenList)
- [OpenList 官方前端仓库](https://github.com/OpenListTeam/OpenList-Frontend)
- [OpenList 从源码构建：先构建前端，再把 dist 交给后端](https://doc.oplist.org/guide/installation/source)
- [OpenList Docker 部署与 data Volume](https://doc.oplist.org/guide/installation/docker)
- [OpenList 配置：内置 dist、前端版本配套、SQLite 与 dist_dir](https://doc.oplist.org/configuration/configuration)
- [Games 与 OpenList UX 和产品方案评估](./games-openlist-index-evaluation-2026-07-13.md)
