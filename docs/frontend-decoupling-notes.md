# 前端组件解耦笔记

这份笔记用来提醒自己：旧前端组件为什么显得耦合，以及新项目应该怎么拆。

## 什么是耦合

耦合就是一个组件知道了太多不属于自己的事情。

例如一个组件同时负责：

- 请求 Payload API
- 读取环境变量
- 处理错误状态
- 管理动画状态
- 渲染背景图
- 渲染导航
- 处理滚动监听
- 处理布局

这个组件就太重了。

旧项目的 `HomepageClientLayout` 就有这个趋势。

它做了很多事：

```txt
管理 scrolled
管理 currentImageIndex
启动定时器
监听 scroll
渲染底部导航
渲染侧边导航
渲染背景图
渲染雨滴效果
渲染 verses
处理 error
拼接 serverUrl
```

它能跑，但后续很难维护。

## 外观和数据为什么要分开

外观组件应该回答：

```txt
我长什么样？
我如何响应 props？
```

数据逻辑应该回答：

```txt
数据从哪里来？
数据怎么过滤？
数据失败怎么办？
数据类型是什么？
```

如果一个组件同时回答这两组问题，它就会变得很难复用。

例如：

```txt
DynamicWallpaper
```

它最理想的职责只是：

```txt
给我 images 和 activeIndex
我负责显示对应背景并做动画
```

它不应该关心：

```txt
wallpapers 是从 Payload 来的
Payload 的 media 字段叫 image
API 地址是 localhost:3000
```

## 推荐拆法

以后可以按四层拆。

第一层：route layer

```txt
src/app/page.tsx
```

职责：

- 路由入口
- 调用 server data functions
- 组合 feature
- 提供 metadata

第二层：feature layer

```txt
src/features/home/components/home-landing.tsx
```

职责：

- 表达首页这个业务区域
- 组织背景、导航、引用、滚动效果
- 管理必要的 client 状态

第三层：presentational components

```txt
src/features/home/components/scene-background.tsx
src/features/home/components/main-visual-nav.tsx
src/features/home/components/rainy-window.tsx
src/features/home/components/featured-verse.tsx
```

职责：

- 只负责一块 UI
- 尽量只通过 props 工作

第四层：data/config

```txt
src/features/home/data/home-nav-items.ts
src/server/payload/get-home-wallpapers.ts
src/server/payload/get-featured-verses.ts
```

职责：

- 管理导航数据
- 管理 CMS 数据读取
- 管理数据格式转换

## 首页可以怎么拆

旧的首页可以拆成：

```txt
HomePage
  HomeLanding
    SceneBackground
    MainVisualNav
    FloatingVisualNav
    RainyWindow
    FeaturedVerse
```

数据流：

```txt
page.tsx
  gets wallpapers
  gets verses
  defines navItems
  passes props to HomeLanding

HomeLanding
  owns active wallpaper state
  owns scrolled state
  passes props down
```

这样 `HomeLanding` 还是 client component，但它比旧的 `HomepageClientLayout` 更清晰。

## 导航数据不要写死在 JSX 里

旧项目里导航是这样写在 JSX 中的：

```txt
REVIEWS -> /reviews -> purple
GAMES   -> /games   -> blue
TOOLS   -> /tools   -> green
ABOUT   -> /about   -> amber
```

这可以整理成数据：

```ts
export const homeNavItems = [
  { label: "REVIEWS", href: "/reviews", accent: "purple" },
  { label: "GAMES", href: "/games", accent: "blue" },
  { label: "TOOLS", href: "/tools", accent: "green" },
  { label: "ABOUT", href: "/about", accent: "amber" },
];
```

好处：

- 底部导航和侧边导航可以复用同一份数据
- 以后新增栏目只改一处
- active/hover 逻辑更好管理

## 样式也要分层

不要把所有 CSS 都堆进 `globals.css`。

`globals.css` 适合放：

- Tailwind import
- CSS variables
- base reset
- 全局字体变量
- 少量全局 utility

feature 级别的视觉效果可以放在对应组件或 feature 样式里。

例如：

```txt
rainy-window styles
wallpaper breathing animation
home nav typography
```

这些属于首页 feature，不一定都应该变成全局样式。

## 什么可以保留为 client component

需要浏览器能力的组件可以是 client component。

例如：

- 背景自动轮播
- scroll 后显示侧边导航
- 鼠标 hover 的复杂动画
- 打字机效果
- 雨滴随机生成

但不要因为一个小组件需要 client，就把整个页面都变成 client。

推荐：

```txt
page.tsx               server
HomeLanding.tsx        client
SceneBackground.tsx    presentational
MainVisualNav.tsx      presentational
RainyWindow.tsx        client
FeaturedVerse.tsx      client 或 server+client 拆分
```

## 什么应该留在 server

这些应该留在 server：

- Payload 查询
- 环境变量读取
- 数据排序和过滤
- 404 判断
- metadata
- 数据格式转换

例如：

```txt
getGameById()
getPublishedReviews()
getHomeWallpapers()
getAboutPage()
```

不要让 UI 组件到处写这些。

## 当前阶段的结论

旧项目的视觉是对的，但组件职责太混。

新项目要保留视觉，重建结构。

核心原则：

```txt
页面负责组合
server 负责取数
feature 负责业务表达
component 负责展示
client 只负责必要交互
```

一句话总结：

> 组件越靠近视觉，越应该少知道数据来源；组件越靠近 server，越应该少知道视觉细节。
