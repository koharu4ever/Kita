# Kita Games 与 OpenList 文件索引方案评估

> 评估日期：2026-07-13（America/Los_Angeles）
>
> 评估性质：产品与架构想法评估，不代表已经决定实施。
>
> 边界：本次没有修改业务代码、Payload schema、migration、Compose、Coolify、生产环境、数据库、secret 或 Volume。
>
> 2026-07-20 实施结果：方案 A 已落地。Games 仍是 Kita 的封面画廊与资料入口，archive 按钮通过现有公开 URL 打开独立 OpenList；Kita 不调用 OpenList API，也不保存其 storage 凭据。最终 storage provider 尚未确定，当前测试挂载可丢弃。实时部署与恢复事实以 OpenList 边界评估和灾难恢复 Runbook 为准，本文其余内容保留为产品/UX 决策记录。

## 1. 结论先行

这个方向**有产品价值，但不应该被理解为“在 Payload 后端加一个 Go 服务”**。

更准确的判断是：

1. 当前 Games 和 Reviews 确实存在内容模型重叠；
2. 解决重叠本身不需要 OpenList，只要重新定义两个栏目的职责就够了；
3. 如果确实有一批经过授权、需要公开整理的游戏相关文件或云盘目录，OpenList 才是合理的新增能力；
4. 最适合 Kita 初版的接入方式不是重写 `/games`，而是让 OpenList 独立部署在子域名；现有 Games 继续作为封面展示区，lightbox 的第一个按钮保留 Kita 资料详情，第二个按钮改为打开对应 OpenList 文件夹；
5. 这个交互在 UX 和品牌气质上是成立的：它把 OpenList 降为“资源层”，不会抢走 Games 封面画廊的视觉主位；
6. 暂时不建议把 OpenList SPA 反代到 `/games`，也不建议让 Next.js 直接深度调用 OpenList API。

一句话方案：

```text
Reviews = 我对游戏的主观评论和长文
Games   = 我整理的游戏资料卡、封面画廊和资源入口
OpenList = 独立的文件目录、预览和下载服务
```

因此，本想法的建议状态是：**产品方向通过，深度集成暂缓，优先采用“独立 OpenList + Games lightbox 第二按钮外链”的低耦合方案。**

### 1.1 2026-07-13 交互方案澄清

项目所有者进一步明确了真正想要的交互：

```text
/games 封面墙
  -> 点击封面
  -> 打开现有全屏 lightbox
       右上按钮 1：进入 Kita /games/[slug] 资料详情
       右上按钮 2：打开该游戏的 OpenList 资源目录
```

这个方案比“在 Games 详情页底部放普通外链”更直接，也比反代或 API 集成简单。它保留了当前页面像图书馆陈列架一样的视觉逻辑：封面负责发现，lightbox 负责预览，内部资料按钮负责说明，第二个按钮负责进入外部资源库。

当前 `game-shared-modal.tsx` 已经具备两个按钮：第一个按钮通过 `getDetailHref()` 打开 `/games/[slug]`；第二个按钮当前使用 `currentGame.cover.src` 和 `download` 属性下载封面图片。未来实施时只需改变第二个按钮的目标与可访问性文案，不需要重做 gallery、lightbox 或详情页。

建议最终语义是：

| 按钮         | 目标                              | 是否离开 Kita |
| ------------ | --------------------------------- | ------------- |
| 资料详情按钮 | `/games/[slug]`                   | 否            |
| 资源目录按钮 | `https://archive.example.com/...` | 是，新标签页  |

如果某个 Games 条目没有配置 OpenList 链接，第二个按钮应当隐藏，而不是保留一个无效按钮，也不应回退为下载封面。

### 1.2 UX、站点定位与设计气质评估

#### 明确结论

**适合做，而且比把文件列表直接嵌进 Kita 更符合当前设计。**

这个方案最有价值的地方是：**用户体验上结合紧密，系统架构上保持松耦合。** 用户从封面进入 lightbox，再从同一组操作按钮进入资料或资源，整个过程仍然像在浏览同一座私人游戏资料馆；但 OpenList 实际上独立运行，它的列表界面、故障和升级不会侵入 Kita 的主视觉和内容结构。

它不会天然损害设计品味。相反，只要坚持正确的主次关系，它会让 `/games` 从“另一套测评列表”变成更明确的产品：

```text
封面墙     = 展览与发现，是视觉主角
Kita 详情  = 编辑整理后的游戏资料，是内容主角
OpenList   = 需要时才进入的资源库，是功能配角
Reviews    = 个人观点和长文，是独立的评论栏目
```

这四层各自回答不同问题，站点定位会比现在更清楚，而不是更混乱。

#### 为什么与当前页面相配

截图中的 `/games` 已经具有比较强的“私人图书馆 / 视觉档案馆”感：深色背景、大面积封面、低密度文字和全屏预览让访客先感受作品，再决定是否深入。资源文件本身不适合直接铺在这个页面上；文件名、大小、目录和下载状态一旦进入封面墙，页面就会迅速变成普通网盘列表，失去现在的气质。

把 OpenList 放在 lightbox 的第二级操作里，恰好维护了这条层次：

1. 访客先被封面吸引；
2. 点击后在 lightbox 中确认作品；
3. 想了解内容时进入 Kita 资料详情；
4. 明确想找文件时才进入 OpenList。

因此 OpenList 与 Games 的**任务连接很紧**，但在视觉上不会喧宾夺主。这正是当前方案优于 iframe、子路径替换或 API 重做文件列表的原因。

#### 必须修正的按钮语义

现有第二个按钮使用下载图标并直接下载封面。将它改为 OpenList 入口时，不能只替换 URL 而保留原来的“立即下载”暗示，否则访客会预期文件马上开始下载，却看到一个新站点的目录页，产生落差。

实施时建议同时做到：

- 第一个按钮的功能保持不变；如果现有“方框外箭头”容易被误解为外链，可改成资料、书页或信息图标；
- 第二个按钮使用“文件夹 + 外部箭头”或清楚的资源库图标，不继续使用单纯向下下载箭头；
- hover / focus 提示写成“打开资源目录”，不要只写“下载”；
- 在新标签页打开，并通过图标或提示告诉访客将离开 Kita；
- 两个按钮的视觉权重相同或让内部资料按钮略强，不要把资源按钮做成高亮主按钮；
- 移动端不能只依赖 hover，至少保留可读的 `aria-label`，必要时在操作栏显示短文字；
- OpenList 链接缺失时隐藏按钮，避免出现空入口。

这样，资源功能会被用户自然理解为“这份馆藏还有对应档案”，而不是把 Kita 误解成软件下载站。

#### 可以添加、并且不会破坏页面的组件

可以继续美化，但建议只增加帮助识别和浏览的轻量组件：

- lightbox 底部增加一行低对比度元数据：游戏名、年份、开发商；
- 增加当前位置，例如 `06 / 18`，让画廊更像可浏览的馆藏；
- 在 lightbox 中以小型状态标记显示 `Archive available`，只在确实存在资源时出现；
- 封面 hover 时显示极简标题和年份，不在每张卡片上堆满按钮；
- 数据量明显增加后，再加入克制的标签筛选或馆藏分组；
- OpenList 页面使用相同站名、色彩和一个“返回 Kita Games”的链接，缓和跨域后的视觉跳转。

暂时不建议添加：

- 每张封面同时出现详情、下载、收藏、分享等一排按钮；
- 在 Games 首页直接嵌入文件数、文件大小、下载速度和目录树；
- 为了看起来“结合得更紧”而使用 iframe 嵌入 OpenList；
- 把 OpenList 的搜索、上传或管理员功能复制到 Kita；
- 大量发光徽章、进度条和动态状态，它们会把安静的陈列感变成工具面板。

设计原则可以概括为：**增加策展信息，不增加后台工具感。**

#### 对站点定位的影响

如果 Kita 的定位是“个人游戏文化档案、收藏与评论”，这个方案非常合适：Reviews 提供主观声音，Games 提供可视化馆藏，OpenList 提供经过筛选的附属资料。三者共同形成的是一个有作者选择的私人档案馆，而不是三个重复栏目。

如果 OpenList 最终主要公开游戏安装包、破解文件或大量无说明下载，那么站点在访客眼中会迅速从“有审美的个人档案馆”变成“下载站”，资源功能也会反过来压过 Reviews 和 Games。这不仅是版权风险，也是品牌风险。因此 OpenList 中放什么，比按钮放在哪里更决定最终气质。

适合 Kita 的内容是经过选择、带有语境并且有权公开的资料；资源入口应当是馆藏的补充，而不是页面存在的唯一理由。

#### UX 成功标准

第一版不需要用复杂指标判断，只需确认：

- 新访客不看说明也能区分“资料详情”和“资源目录”；
- 点击资源按钮后，不会误以为 Kita 出现跳转错误；
- OpenList 不可用时，封面墙、lightbox 和内部详情仍完整可用；
- 没有资源的游戏仍然是一张完整的馆藏卡，而不是“缺少下载”的残缺条目；
- 用户首先记住的是 Kita 的封面馆藏和内容，而不是 OpenList 的文件列表。

满足这些条件，就说明 OpenList 与 Kita 已经足够紧密，但没有破坏主次。

## 2. Games 与 Reviews 现在是否重合

答案是：**有明显重合，但不是完全相同。**

当前 `Reviews` collection 包含：

- 标题、游戏名、摘要、封面；
- 评分、发布日期、阅读时间；
- tags；
- rich-text 正文。

当前 `Games` collection 包含：

- 标题、开发商、发行日期、游玩状态；
- 摘要、封面；
- tags、links；
- rich-text 正文。

两者都要求填写封面、摘要、标签和长正文，所以如果 Games 详情页也继续写完整测评，它就会成为另一套 Reviews。

真正应该区分的是内容意图：

| 栏目     | 回答的问题                         | 主要内容                               |
| -------- | ---------------------------------- | -------------------------------------- |
| Reviews  | “我怎么看这款游戏？”               | 观点、评价、评分、长文                 |
| Games    | “这是什么游戏，我收藏了哪些资料？” | 元数据、封面、状态、简短介绍、资源入口 |
| OpenList | “具体文件在哪里？”                 | 文件夹、文件列表、预览、下载           |

这个职责划分成立后，Games 就不再是第二个 Reviews，而是一个视觉化的个人游戏档案库。

## 3. OpenList 在架构中的正确位置

OpenList 官方将其定义为支持多种存储的文件列表程序，并提供独立的 Docker 部署、管理界面、文件预览、API 和反向代理方式。它默认监听 `5244`，拥有自己的配置、数据库、管理员账号、JWT secret、存储凭据和持久化数据目录。

因此推荐架构是：

```text
Browser
  |
  +--> kita.kral-koharu.com/games
  |      Next.js Games UI
  |        -> Payload Games metadata
  |        -> title / cover / summary / tags / links
  |
  +--> archive.kral-koharu.com
         OpenList 独立应用
           -> cloud drive / object storage / WebDAV / S3
```

不推荐把它描述成：

```text
Payload
  -> 内部增加 Go 服务
```

Payload 和 OpenList 没有天然的父子关系。Payload 负责内容管理，OpenList 负责文件索引；二者最多通过 URL 或 API 发生连接。

## 4. 三种接入方式比较

| 方案                    | 做法                                                                 | 前端改动 | 运维复杂度 | 结论     |
| ----------------------- | -------------------------------------------------------------------- | -------: | ---------: | -------- |
| A. 独立子域名外链       | OpenList 部署到 `archive.example.com`，Games 的 `links` 指向对应目录 |     很低 |         中 | **推荐** |
| B. 子路径反代           | 将 OpenList SPA/API 反代到 `/games/files` 或直接替换 `/games`        |       中 |       中高 | 暂缓     |
| C. Next.js 深度调用 API | 保留自定义 UI，由 Kita 服务端请求 OpenList API                       |       高 |         高 | 当前不做 |

### 4.1 方案 A：独立子域名外链

这是当前最适合 Kita 的方案。

现有 Games schema 已经有：

```text
links[]
  label
  href
```

现有详情页已经把每个 link 渲染为新窗口外部链接，lightbox 也已经拥有第二个操作按钮。因此第一版不需要修改 schema、migration 或 mapper，只需：

1. 在 Payload 的 Games `links` 中为每个游戏保存一个 OpenList 目录链接；
2. 在 `game-shared-modal.tsx` 中让第二个按钮读取这个链接；
3. 删除该按钮当前的 `download` 属性，改为 `target="_blank"` 与 `rel="noreferrer"`；
4. 将 `title` / `aria-label` 从“下载封面”改成“打开游戏资源目录”；
5. 没有资源链接时不渲染第二个按钮。

第一版可以约定每个 Games 条目的第一个 `links` 项就是资源目录：

```text
links[0].label = Open game archive
links[0].href  = https://archive.example.com/Game-Name/
```

这适合当前规模。如果以后一个游戏需要官方主页、购买地址、攻略、多个资料库等多种链接，再为 `links` 增加稳定的语义类型；现在没有必要为了这个按钮立即生成 migration。

优点：

- 保留现在好看的 Games 画廊、lightbox 和内部资料详情；
- 只修改一个现有按钮的链接来源和语义，不重写 Next.js UI；
- 不让 OpenList 故障拖垮 Kita 页面；
- 不把 OpenList 管理 token 放入 Payload、浏览器或 GitHub Actions；
- OpenList 可以独立升级、备份和回滚；
- 将来不想继续使用 OpenList，也只需替换链接。

缺点是视觉风格从 Kita 跳转到 OpenList 后会发生变化，但这是合理的服务边界，可以通过同一品牌名称、颜色和返回 Kita 的链接缓解。

### 4.2 方案 B：反代到 Kita 子路径

OpenList 官方支持反向代理，也支持通过 `site_url` 配置子目录。不过放在 `/games` 下会产生真实冲突：

- Next.js 已经拥有 `/games` 和 `/games/[slug]`；
- OpenList SPA 自己也需要静态资源、API、登录和文件下载路径；
- 必须正确处理 `Host`、`X-Forwarded-Proto`、Range、缓存和大文件；
- Coolify、CDN 和 OpenList 的 base path 必须保持一致；
- cookie、重定向和生成下载 URL 的错误更难排查。

如果以后一定要使用子路径，更合理的是 `/archive`，而不是占用现有 `/games`。

### 4.3 方案 C：Kita 直接消费 OpenList API

这会得到最统一的视觉效果，但不符合“不要改太多前端”的目标。

它需要处理：

- API 鉴权和 token 生命周期；
- 文件列表、分页、排序、搜索和错误状态；
- 直链签名和过期；
- OpenList 不可用时的 fallback；
- 缓存、限流与 provider API 变化；
- OpenList API/AGPL 版本升级带来的兼容性。

OpenList 官方文档还说明存在可访问全部 API、通常固定且不失效的 token。这类 token 不能进入浏览器，也不应存入 Payload 内容字段。若以后做 API 集成，只能放在 Kita server-only 环境变量或独立 secret store 中。

## 5. 这项变化实际会新增什么

即使采用最简单的方案，也不是“只多一个 Go 进程”。至少新增：

- 一个独立 OpenList 容器或 Coolify application；
- 一个持久化数据目录，用于配置、SQLite 数据库、日志或索引；
- 管理员密码、JWT secret 和各存储 provider 的凭据；
- 独立域名、TLS 和反向代理；
- guest/匿名访问范围；
- 文件直链签名策略；
- OpenList 数据与配置备份；
- 镜像版本更新、安全修复和健康检查；
- 云盘 API 限流、失效、封禁或下载速度变化的处理。

OpenList 默认可以使用 SQLite，因此没有必要一开始复用 Kita PostgreSQL。把两套应用强行放进同一个数据库，反而会增加权限和升级耦合。

同理，不建议第一步就把 OpenList 加进 Kita 的 `compose.yaml`。更稳妥的是在 Coolify 中作为独立应用部署：Kita 发布不重启 OpenList，OpenList 更新也不影响 Payload。

## 6. 关键风险

### 6.1 文件权限与直链泄露

OpenList 官方提醒：关闭直链签名后，公网场景可能绕过文件夹密码访问私人文件。第一版应默认：

- 只挂载明确允许公开的目录；
- 使用只读或权限最小化的 provider 凭据；
- 保持直链签名开启；
- 不开放匿名上传、删除、复制和离线下载；
- 不把管理员界面和公开访客权限混为一谈。

### 6.2 云盘账号和 provider 风险

OpenList 可能通过 HTTP 302 或服务端转发提供文件。实际流量路径取决于存储驱动和配置。云盘服务可能限流、改变 API、让 token 失效，甚至依据服务条款限制账号。

因此不能把它当成永久稳定的自有对象存储。Games 页面应保存稳定的内容元数据，OpenList 只是可替换的资源入口。

### 6.3 内容授权与版权

公开索引游戏安装包、破解内容、未经授权的媒体或其他受版权保护文件，可能带来投诉、域名/CDN/主机封禁和法律风险。本文只建议索引你有权公开的文件，例如：

- 自己制作的资料；
- 开源或明确允许再分发的内容；
- 个人截图、存档说明、补丁说明；
- 官方公开下载链接或合法购买入口。

这不是法律意见；正式公开前仍应根据所在地、主机商、CDN 和存储服务条款自行确认。

### 6.4 AGPL-3.0

OpenList 官方仓库和 API 文档均标注 AGPL-3.0。独立运行官方镜像并从 Kita 链接过去，能够保持最清楚的软件边界；若以后修改 OpenList 源码、分发自定义版本或将其代码深度合并进 Kita，应单独复核 AGPL 的源码提供义务。

## 7. 推荐的分阶段路线

### 阶段 0：只改变栏目定义

先不部署 OpenList，也能立即消除重合：

```text
Reviews：完整测评
Games：封面画廊 + 元数据 + 一段简短介绍 + 外部链接
```

Games 的 `body` 暂时可以只放背景介绍、版本说明或收藏理由，不再重复评分和完整观点。

### 阶段 1：独立概念验证

只有当确实存在需要整理的文件时，再做一次小型验证：

- 独立 OpenList 容器；
- 一个测试目录或专门的只读存储账号；
- 不使用真实私人根目录；
- 不写入 Kita repo 的 secret；
- 验证匿名访问、签名直链、预览、下载和日志；
- 验证 OpenList 不可用时 Kita Games 仍可正常打开。

### 阶段 2：独立生产部署

- 使用独立子域名；
- 固定明确版本，而不是长期无审查地追随 `latest`；
- 使用独立持久化目录；
- 设置管理员密码、备份和最小权限；
- 第一批只公开一个低风险目录。

### 阶段 3：在 Payload 录入资源入口并连接 lightbox 按钮

使用当前 `links` 字段添加 OpenList 目录链接，不生成 migration，不改 Games 页面结构。唯一的 UI 代码改动集中在 `game-shared-modal.tsx`：保留第一个资料详情按钮，把第二个封面下载按钮改为 OpenList 目录入口。

建议链接文案：

```text
Browse archive
Open resource folder
View screenshots
Official download
```

不要把不明确的链接统一写成 `Download`，应让访客知道它将打开外部文件目录。

### 阶段 4：有真实需求后再考虑 API

只有出现下面需求时才值得做深度集成：

- 访客明显不愿离开 Kita；
- 需要跨游戏统一搜索；
- 需要在 Games 页面显示实时文件数、大小或目录状态；
- 已有稳定的错误处理、缓存和 token 管理方案。

在这之前，API 集成属于过度工程化。

## 8. 第一版验收边界

如果未来实施，建议至少满足：

- [ ] OpenList 与 Kita 独立部署、独立重启；
- [ ] OpenList 停止时 `/games` 仍正常展示；
- [ ] Git、Payload 内容和浏览器响应中没有存储凭据或管理 token；
- [ ] 匿名访客只能看见明确公开的目录；
- [ ] 匿名访客不能上传、删除、移动或发起离线下载；
- [ ] 直链签名与文件夹访问策略已验证；
- [ ] OpenList 持久化数据有备份办法；
- [ ] lightbox 第一个按钮仍进入 Kita 内部资料详情；
- [ ] lightbox 第二个按钮只在存在 OpenList 链接时显示；
- [ ] 第二个按钮没有 `download` 属性，并明确提示会在新标签页打开外部资源目录；
- [ ] 只索引有权公开的内容；
- [ ] 没有为了 OpenList 删除或复用 Kita 现有 PostgreSQL Volume。

## 9. 最终建议

从产品、UX 和视觉层级三个角度综合判断，**这个想法适合 Kita，建议实施低耦合第一版**。它不是为了给页面强行增加一个下载功能，而是把现有 Games 封面画廊明确塑造成“视觉馆藏入口”，再把具体文件留给更合适的独立服务。

但它不应该只因为“Games 和 Reviews 重合”就仓促上线。内容重合只需重新定义栏目；OpenList 仍应由真实、合法且值得整理的文件需求来证明其必要性。

如果你已经有大量合法、可公开的游戏相关资料需要分类，那么建议采用：

```text
保留当前 Games 封面墙与 lightbox
  + 按钮 1 进入 Kita 内部游戏资料详情
  + 按钮 2 读取 game.links 并打开独立 OpenList 子域名
  + Reviews 继续承载完整测评
```

这条路线只需调整 lightbox 的一个现有按钮，不生成 migration、不让 Payload 承担文件服务，也不会把 Kita 变成复杂的多语言单体。对访客而言，它像同一座资料馆的两个区域；对系统而言，它仍是两个可以独立维护的应用。

最终应坚持三个产品约束：

1. Kita 的封面、资料和评论始终是主角；
2. OpenList 只在用户明确寻找资源时出现；
3. 只增加策展信息，不把 Games 页面改造成网盘控制台。

在这三个约束下，这项功能不仅不会破坏当前设计品味，反而会让 `/games` 的存在理由、浏览路径和品牌性格更加完整。

## 10. 参考资料与核对限制

- [OpenList 官方仓库与 AGPL-3.0 声明](https://github.com/OpenListTeam/OpenList)
- [OpenList Quick Start](https://doc.oplist.org/guide)
- [OpenList Docker 部署](https://doc.oplist.org/guide/installation/docker)
- [OpenList 反向代理](https://doc.oplist.org/guide/installation/reverse-proxy)
- [OpenList 配置、SQLite 与 JWT secret](https://doc.oplist.org/configuration/configuration)
- [OpenList 直链签名安全说明](https://doc.oplist.org/configuration/global)
- [OpenList API 文档入口](https://doc.oplist.org/api/apidocs)
- [用户提供的参考站点 zi6.cc](https://zi6.cc/)

`zi6.cc` 在本次自动化读取中返回错误，因此本文没有声称独立验证其实际前端框架、服务端实现或部署拓扑；“SolidJS SPA + Vite、Go + Gin、Docker + 反代、多存储源”作为用户提供的参考假设参与评估。OpenList 部分则依据其官方仓库与官方文档核对。
