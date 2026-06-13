# 前后端数据流转笔记

这份笔记用来重新理解：数据从 Payload 后台进入数据库，再到 Next.js 页面展示，中间到底发生了什么。

## 最简单的数据流

以一篇测评文章为例。

```txt
Payload Admin
  ↓ 编辑内容
Payload Collection: reviews
  ↓ 保存
Database
  ↓ 查询
Server-side data access
  ↓ 返回 typed data
Next.js page
  ↓ 传给组件
React components
  ↓ 渲染 HTML
Browser
```

也就是：

```txt
编辑内容 -> 存储内容 -> 读取内容 -> 组合页面 -> 渲染给用户
```

## Payload 在其中做什么

Payload 主要负责内容后端。

它提供：

- Admin 后台
- Collections
- Globals
- Media
- Access Control
- REST API
- GraphQL API
- Local API
- Type generation

旧项目里，Payload 管理了：

```txt
Games
Reviews
Wallpapers
Verses
About
Media
Users
```

这些就是网站内容的来源。

## Next.js 在其中做什么

Next.js 主要负责公开网站。

它提供：

- 路由
- layouts
- Server Components
- Client Components
- metadata
- images
- build/deploy structure

在新项目里，Next.js 不应该只是“拿数据然后随便塞 UI”。

更好的做法是：

```txt
src/app
  负责路由和页面组合

src/features
  负责业务展示逻辑

src/server
  负责读取 Payload 数据

src/shared
  负责通用 UI 和工具
```

## 旧项目的数据流问题

旧前端里很多地方直接这样写：

```ts
const serverUrl =
  process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000";
const res = await fetch(`${serverUrl}/api/games?depth=1`);
```

这个写法能跑，但有问题。

问题一：API 地址散落在组件里。

```txt
如果以后端口、域名、部署方式变了，要到处找。
```

问题二：前端组件知道太多后端细节。

```txt
组件不仅要负责展示，还要知道 Payload URL、query、depth、where、sort。
```

问题三：客户端组件也在拉 CMS 数据。

```txt
很多 CMS 内容其实应该先在服务器侧读取，再传给组件。
```

问题四：测试和迁移困难。

```txt
数据获取散落后，后续很难统一改缓存策略、错误处理、类型和权限。
```

## 新项目更好的数据流

新项目应该把数据获取集中到 `src/server`。

例如：

```txt
src/server/payload/get-games.ts
src/server/payload/get-reviews.ts
src/server/payload/get-wallpapers.ts
src/server/payload/get-verses.ts
```

页面这样使用：

```txt
src/app/games/page.tsx
  ↓ calls
src/server/payload/get-games.ts
  ↓ returns
Game[]
  ↓ passed to
src/features/games/components/game-grid.tsx
```

这样页面只关心“我要 games 数据”，不关心 Payload API 怎么拼 URL。

## Server Component 和 Client Component 的分工

在 Next.js App Router 中，默认组件是 Server Component。

适合放在服务器端的事情：

- 读取 Payload 数据
- 读取环境变量
- 处理权限
- 组合页面数据
- 做 SEO metadata

需要 Client Component 的事情：

- `useState`
- `useEffect`
- 浏览器事件
- scroll 监听
- hover 以外的复杂交互
- 定时器
- 动画状态

所以首页可以拆成：

```txt
page.tsx
  Server Component
  获取 wallpapers / verses / nav 数据

HomeLanding.tsx
  Client Component
  管理当前背景图 index
  管理滚动状态
```

## UI 组件不应该知道什么

一个纯展示组件最好不要知道：

- Payload URL
- 数据库
- fetch
- process.env
- REST query
- GraphQL query
- localhost

它应该只接收 props。

比如：

```ts
type SceneBackgroundProps = {
  images: Array<{
    id: string;
    src: string;
    alt?: string;
  }>;
  activeIndex: number;
};
```

这样它只负责展示背景图，不负责决定数据从哪里来。

## 一个推荐的数据流例子

首页可以这样流转：

```txt
Payload Admin
  ↓
wallpapers collection
  ↓
src/server/payload/get-home-wallpapers.ts
  ↓
src/app/page.tsx
  ↓
src/features/home/components/home-landing.tsx
  ↓
src/features/home/components/scene-background.tsx
```

`scene-background.tsx` 不需要知道 Payload。

它只知道：

```txt
我收到一组图片
我显示当前 activeIndex 对应的图片
我做淡入淡出动画
```

## 当前阶段的结论

旧项目最大的问题不是视觉效果，而是数据和外观耦合太多。

新项目应该遵守：

```txt
数据获取放 server
业务组合放 features
展示组件只吃 props
交互状态放 client components
路由入口放 app
```

一句话总结：

> Payload 管内容，server 层取内容，app 层组页面，features 层表达业务，components 层负责展示。
