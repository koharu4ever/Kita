# Kita 前端阶段总结

> **历史记录（非当前事实源）**：本文保留前端静态骨架阶段的设计与拆分思路。文中的“当前”“以后接 Payload”和“尚未接 PostgreSQL”均指当时状态，不代表现状。当前进度与操作边界以 [CODEX_HANDOFF.md](./CODEX_HANDOFF.md) 和 [current-project-status.md](./current-project-status.md) 为准。

这份笔记记录当前 `Kita` 个人网站第一阶段的前端工作。它不是最终设计稿，也不是后端接入方案，而是一次“先把前端壳子、页面气质、目录结构和组件边界定下来”的阶段总结。

当前项目仍然没有接 Payload CMS、没有接 PostgreSQL、没有写真实业务数据。页面里的内容都属于前端占位数据，目的是先确认视觉方向、组件拆分方式，以及未来接 CMS 时哪些地方需要替换。

## 当前目标

这一阶段的目标是先完成前端体验骨架：

- 首页做成 galgame / visual novel 氛围的入口页。
- `/about` 复刻旧项目里偏 VNDB 风格的静态说明页。
- `/tools` 做成 90s 纯 HTML / 复古资源站风格的工具目录页。
- `/reviews` 和 `/games` 先用简单模板卡片搭出列表页。
- 不引入 UI 库，不接 Payload，不接数据库。
- 代码按 feature 拆分，为后面接后端留出清晰边界。

这不是常规 SaaS 首页，也不是普通博客首页。它更像一个以视觉场景为核心的个人网站入口。

## 思路来源

这阶段主要参考了三个方向：

- CJ 的 Next.js starter 视频：工程化、格式化、ESLint、typed routes、目录结构、VS Code 设置等思路。
- `bulletproof-react`：按 feature 组织代码，不把所有组件都堆进 `app` 目录。
- 旧项目 `_reference/old-project`：提供首页、About、Tools 等页面的视觉参考。

我们没有照抄 CJ 视频后半段的 UI 技术栈：

- 没有 NextUI / HeroUI。
- 没有 shadcn/ui 依赖。
- 没有 Navbar 组件库。
- 没有 light / dark mode。
- 没有 Auth.js。
- 没有 Drizzle 作为主数据层。

当前前端是自定义实现。`/reviews` 和 `/games` 虽然用了类似 shadcn 的卡片布局语言，但并没有安装或引入 shadcn/ui。

## 总体目录结构

当前前端主要按 App Router + feature 组织：

```text
src/app
src/features
src/app/globals.css
public
```

`src/app` 负责路由入口：

```text
src/app/page.tsx
src/app/about/page.tsx
src/app/tools/page.tsx
src/app/reviews/page.tsx
src/app/games/page.tsx
```

`src/features` 负责具体页面功能：

```text
src/features/home
src/features/about
src/features/tools
src/features/reviews
src/features/games
```

这样做的原因是：`app` 目录不承担复杂 UI 逻辑，只作为 Next.js 路由入口；真正的页面结构、数据占位和组件拆分都放在各自 feature 下面。

## App Router 的职责

App Router 的页面文件现在都很薄。

例如首页：

```tsx
import { HomePage } from "@/features/home/components/home-page";

export default function Home() {
  return <HomePage />;
}
```

这样做有几个好处：

- 路由入口不变复杂。
- 每个页面的 UI 可以在 `features/*` 下独立维护。
- 后面接 Payload 时，可以在 feature 层或 server 层替换数据来源。
- typed routes 仍然可以保护路由链接。

## 首页结构

首页相关文件：

```text
src/features/home/components/home-page.tsx
src/features/home/components/home-experience.tsx
src/features/home/components/scene-background.tsx
src/features/home/components/main-visual-nav.tsx
src/features/home/components/floating-visual-nav.tsx
src/features/home/components/rainy-window.tsx
src/features/home/components/verse-panel.tsx

src/features/home/data/home-content.ts
src/features/home/hooks/use-rotating-index.ts
src/features/home/hooks/use-scroll-threshold.ts
src/features/home/types/home.ts
```

首页资源：

```text
public/home-rain-harbor.jpg
public/home-sunset-field.jpg
public/home-sea-girl.jpg
public/home-night-sky.jpg
```

首页组件关系大概是：

```text
HomePage
  HomeExperience
    FloatingVisualNav
    SceneBackground
    MainVisualNav
    RainyWindow
    VersePanel
```

### HomePage

`HomePage` 是首页 feature 的入口。它从 `home-content.ts` 取静态数据，然后传给 `HomeExperience`。

现在它相当于前端数据装配层。以后接 Payload 时，最可能先改这里，或者在它上面加 server 数据获取层。

### HomeExperience

`HomeExperience` 负责组合整个首页体验：

- 当前背景图索引。
- 是否滚动过首屏。
- 首屏主视觉。
- 下滑后的雨滴玻璃区域。
- 右侧浮动导航。
- 简短介绍文字。

当前滚动模型是：

```text
首屏：
  fixed inset-0
  SceneBackground
  MainVisualNav

首屏之后：
  mt-[100svh]
  min-h-[200svh]
  RainyWindow
  VersePanel
```

含义是：

- 背景图固定在视口后面。
- 第一屏没有玻璃罩。
- 用户向下滚动一屏后，玻璃罩和雨滴层覆盖上来。
- 玻璃罩区域继续向下延伸，不会只停留一屏。

### SceneBackground

`SceneBackground` 是全站首页唯一负责完整背景图的组件。

今天比较重要的结论是：不要让 `RainyWindow` 再画一张完整背景图。否则滚动后会出现上下两张同样图片错位拼接的问题。

现在的原则是：

```text
SceneBackground 负责唯一完整背景。
RainyWindow 只负责雨滴和玻璃覆盖层。
```

### MainVisualNav

`MainVisualNav` 渲染首屏底部的大字导航：

```text
REVIEWS
GAMES
TOOLS
ABOUT
```

它使用 `Bebas Neue` 字体，目标是接近旧项目那种高而窄、galgame 菜单感的标题字体。

### FloatingVisualNav

`FloatingVisualNav` 是用户下滑后右侧出现的小导航。它和首屏导航复用同一份 `homeNavItems` 数据，所以以后改导航只需要改一处。

### RainyWindow

`RainyWindow` 负责雨滴层。

之前用过 `Math.random()` 生成水滴位置，容易导致 hydration warning。现在改成固定 seed 的伪随机：

```ts
createSeededRandom(20260609);
```

这样看起来仍然随机，但服务端和客户端结果一致，减少 React hydration mismatch。

### VersePanel

`VersePanel` 显示玻璃层上的短句介绍。现在是前端静态文案，以后可以替换成 Payload CMS 中的站点介绍、quote、短文摘要等。

## 首页数据

首页静态数据在：

```text
src/features/home/data/home-content.ts
```

主要包括：

```ts
homeNavItems;
homeWallpapers;
homeVerses;
```

这几类数据现在都是“前端展示数据”，不是 Payload 数据结构。

未来更推荐保持一层转换：

```text
Payload 原始数据 -> server adapter -> HomeWallpaper / HomeVerse -> UI components
```

这样 UI 组件只关心自己要显示什么，不直接依赖 CMS 字段细节。

## About 页面

About 页面相关文件：

```text
src/app/about/page.tsx
src/features/about/components/about-page.tsx
src/features/about/components/about-overlay-nav.tsx
src/features/about/components/about-overlay-nav.module.css
public/about-bg.jpg
```

这个页面主要参考旧项目的 `/about`。它的风格是：

- 背景图固定。
- 中间一块深红半透明内容框。
- 内容框不是铺满宽度，而是 `max-w-4xl mx-auto`。
- 有黑色边框和阴影。
- 右上角有圆形菜单按钮。
- 菜单展开时使用 `clip-path` 做覆盖层动画。

今天这里反复调整过一个重点：内容框不能太宽。

旧代码的核心是：

```text
max-w-4xl
mx-auto
my-16 sm:my-24
p-6 sm:p-10
bg-[#35020990]
border border-black/50
rounded-lg
shadow-2xl
```

我之前加过 `lg:max-w-[1340px]`，导致深红区域铺得太宽，两边背景露出太少。现在已经改回旧源码的窄版阅读宽度。

这个页面目前是静态占位文案。以后如果接 Payload，可以把 About 文案替换成 CMS 内容，但布局本身不用大改。

## Tools 页面

Tools 页面相关文件：

```text
src/app/tools/page.tsx
src/features/tools/components/tools-page.tsx
src/features/tools/components/tools-sidebar.tsx
src/features/tools/data/toolkit-items.ts
```

Tools 页面参考旧项目 `/tools`，目标是 90s 日本个人网站 / 纯 HTML 资源站的感觉：

- 深蓝黑主背景。
- 荧光绿色文字。
- `VT323` 复古字体。
- 内容像工具目录，不像现代卡片 UI。
- 右侧是绿色色块导航。
- 导航按钮是白底、黑框、粗字、带 hover 位移。

字体在全局布局中注册：

```text
src/app/layout.tsx
```

并在 `globals.css` 里定义：

```css
.kita-retro {
  font-family: var(--font-vt323), "Courier New", monospace;
}
```

旧源码里的字号是比较克制的：

```text
标题：text-5xl md:text-6xl
条目标题：text-3xl
日期：text-sm
摘要：text-lg
```

一开始我写得太大，像展示页，不像目录页。后来已经按旧源码比例收回。

当前工具数据在：

```text
src/features/tools/data/toolkit-items.ts
```

里面先放了几类 galgame 常用工具方向：

- 文本抓取。
- 区域和运行库。
- 资料库。
- 截图和缩放。

这些只是前端占位数据。后面如果要把工具目录放进 Payload，可以先保持同样的 `ToolkitItem` 展示类型，再写 adapter 转换。

## Reviews 页面

Reviews 页面相关文件：

```text
src/app/reviews/page.tsx
src/features/reviews/components/reviews-page.tsx
src/features/reviews/components/review-card.tsx
src/features/reviews/data/review-items.ts
```

旧项目的 `/reviews` 问题是页面直接承担了后端查询：

- 拼 Payload query。
- 读 `NEXT_PUBLIC_PAYLOAD_URL`。
- fetch `/api/reviews`。
- 假设返回 `data.docs`。
- 直接依赖 `Review` 后端类型。
- 第一篇直接作为 hero review。

这会让前端和后端字段锁死。后端结构一变，列表页和卡片组件都可能跟着坏。

所以当前新项目里先做了简单模板版：

- 一个主推评测卡片。
- 下面两个普通评测卡片。
- 使用图片、标题、游戏名、日期、评分、标签、摘要。
- 不请求后端。
- 不创建详情页链接。

数据类型是前端展示类型：

```ts
type ReviewPreview = {
  slug: string;
  title: string;
  gameTitle: string;
  date: string;
  excerpt: string;
  coverImage: string;
  rating: number;
  tags: string[];
};
```

以后接 Payload 时，不建议让组件直接吃 Payload 原始文档，而是：

```text
Payload Review Doc -> ReviewPreview -> ReviewCard
```

这样组件稳定，后端字段变化只影响转换层。

## Games 页面

Games 页面相关文件：

```text
src/app/games/page.tsx
src/features/games/components/games-page.tsx
src/features/games/components/game-card.tsx
src/features/games/data/game-items.ts
```

旧项目的 `/games` 有两个问题：

- 有些代码已经和后端分页结构绑定。
- `GlassCard` 依赖后端 `Game` 类型、Payload 图片路径，以及旧项目里的 UI 组件。

当前新项目先做成简单的游戏资料卡网格：

- 背景图。
- 4 个游戏卡片。
- 图片封面。
- 标题。
- 开发者。
- 发售年份。
- 状态。
- 标签。

数据类型是：

```ts
type GamePreview = {
  slug: string;
  title: string;
  developer: string;
  releaseDate: string;
  coverImage: string;
  status: "planned" | "playing" | "finished";
  tags: string[];
};
```

同样，后面接 Payload 时建议这样做：

```text
Payload Game Doc -> GamePreview -> GameCard
```

现在没有加 `/games/[slug]` 链接。原因是项目启用了 Next.js `typedRoutes`，但详情路由还不存在。提前写动态链接会让 TypeScript 报错。等真正做详情页时，再把链接加回来。

## 为什么 Reviews / Games 不急着接后端

这两个页面以后确实最适合接 Payload，但第一版不要直接从旧代码搬 fetch。

原因是旧代码里有很多后端细节泄漏到组件：

```text
data.docs
author.email
game.coverImage.url
content rich text
NEXT_PUBLIC_PAYLOAD_URL
where/status/depth/sort query
```

这些都不是卡片组件应该关心的。

更好的方式是分三层：

```text
Payload 原始数据
  -> server 获取与转换
  -> 前端展示类型
  -> UI 组件
```

当前静态模板的价值就是先确定展示类型。等 Payload 接入时，只需要替换数据来源，不需要重写页面视觉。

## 全局样式和字体

全局样式在：

```text
src/app/globals.css
```

当前主要包括：

- 页面基础背景色。
- `.kita-display`：Bebas Neue，大标题和首页导航使用。
- `.kita-retro`：VT323，Tools 页面使用。
- 背景呼吸动画。
- 雨滴样式 `.raindrop`。
- 雨滴生命周期动画 `raindrop-life`。
- 打字机光标 `typewriter-caret`。

字体在：

```text
src/app/layout.tsx
```

当前注册了：

```ts
Bebas_Neue;
VT323;
```

## 当前页面状态

当前前端页面状态：

```text
/        首页，galgame 风格入口
/about   静态说明页，参考旧项目 About
/tools   复古工具目录页
/reviews 简单评测模板页
/games   简单游戏卡片模板页
```

这些页面目前都是静态前端，没有真实业务功能。

## 当前验证命令

今天相关修改后跑过：

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

开发预览：

```bash
pnpm dev
```

打开：

```text
http://localhost:3000
http://localhost:3000/about
http://localhost:3000/tools
http://localhost:3000/reviews
http://localhost:3000/games
```

当前生产构建中这些路由都能静态生成：

```text
/
/_not-found
/about
/games
/reviews
/tools
```

## 现在必须理解的部分

第一版最重要的是理解这些：

- `src/app` 是路由入口，不是复杂组件存放处。
- `src/features/*` 是具体页面功能。
- 页面数据先用展示类型，不直接使用后端原始类型。
- 首页只有一个完整背景来源：`SceneBackground`。
- `RainyWindow` 只做雨滴和玻璃罩，不再重复铺完整背景。
- `/reviews` 和 `/games` 现在只是模板，为 Payload 接入做准备。
- `typedRoutes` 会阻止不存在的动态路由链接，这是好事。

## 可以以后再深入的部分

这些可以等后面再慢慢研究：

- 雨滴更真实的物理折射。
- 打字机完整动画。
- 移动端精细适配。
- Payload 数据获取。
- Payload rich text 渲染。
- 图片上传和媒体库。
- `/reviews/[slug]` 详情页。
- `/games/[slug]` 详情页。
- 分页、筛选、搜索。
- 真实 shadcn/ui 是否要引入。

## 下一步建议

前端壳子现在已经可以算第一阶段完成。接下来更合理的顺序是：

1. 复习并确认当前前端目录结构。
2. 确认每个页面的展示数据类型是否够用。
3. 开始设计 Payload Collections：Reviews、Games、Tools、Site Settings、Media。
4. 写 server 层数据获取和 adapter。
5. 用 Payload 数据替换当前 `data/*.ts` mock 数据。

关键原则是：不要让 UI 组件直接依赖 Payload 原始字段。先转换成稳定的前端展示类型，再传给组件。

## 总结

今天前端部分真正完成的是“页面骨架和职责边界”：

```text
首页：视觉入口和雨滴玻璃滚动体验
About：静态介绍页
Tools：复古工具目录页
Reviews：简单评测模板
Games：简单游戏模板
```

这些页面还不是最终内容，但已经形成了一个清楚的前端基础：

```text
路由入口薄
feature 拆分明确
mock 数据集中
展示类型独立
后端接入位置可预期
```

这就是后续接 Payload CMS 前最重要的前端准备。
