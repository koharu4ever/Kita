# Games Gallery Implementation

更新日期：2026-06-17

## 做了什么

本次按 `_reference/with-vercel-blob` 和 `docs/games-gallery-template-analysis.md` 的结论，改造了 Kita 的 `/games` 页面。

目标不是把 Kita 改成 Vercel 模板项目，而是把模板里的照片墙布局改写成 Kita 自己的 feature 代码。

2026-06-17 追加调整：第一版过度强调 `/games/[slug]` 详情页，视觉上偏现代。本次改成更接近原版 Image Gallery Starter 的逻辑：点击封面先打开大图查看器，图上只有一个很小的 `↗` 图标入口，再进入子页面。界面里尽量不显示文字。

2026-06-17 再次修正：为了满足“按原项目源码最小复刻”，`game-lightbox.tsx` 改回原版 `Modal.tsx` 的容器职责，并新增 `game-shared-modal.tsx`，按原版 `SharedModal.tsx` 的结构组织主图、按钮层和底部缩略图层。现在代码结构更像从模板组件改过来，而不是另写一个相似版本。

## 参考源码

主要参考了这些文件：

- `_reference/with-vercel-blob/pages/index.tsx`
- `_reference/with-vercel-blob/pages/p/[photoId].tsx`
- `_reference/with-vercel-blob/components/Modal.tsx`
- `_reference/with-vercel-blob/components/Carousel.tsx`
- `_reference/with-vercel-blob/components/SharedModal.tsx`
- `_reference/with-vercel-blob/utils/types.ts`

最重要的是 `pages/index.tsx` 里的 CSS columns 瀑布流：

```tsx
columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4
```

Kita 现在也使用这个逻辑，而不是普通 `grid` 卡片墙。

## 修改文件

### `/games` 页面入口

文件：

- `src/app/(site)/games/page.tsx`

保持原来的 App Router 入口，只渲染 feature 层的 `GamesPage`。

### 新增 `/games/[slug]`

文件：

- `src/app/(site)/games/[slug]/page.tsx`

新增游戏详情页路由。它现在读取本地静态数据：

- `generateStaticParams()` 生成所有静态 slug。
- `generateMetadata()` 生成页面标题和描述。
- 找不到 slug 时调用 `notFound()`。

### 静态数据

文件：

- `src/features/games/data/game-items.ts`

把旧的简单 `GamePreview` 数据扩展成 `GameItem`：

- `slug`
- `title`
- `originalTitle`
- `developer`
- `releaseDate`
- `status`
- `summary`
- `note`
- `cover`
- `tags`
- `links`

目前仍然只用 `public` 里的本地图片，不连接 Payload，也不引入 Vercel Blob。

### 瀑布流组件

文件：

- `src/features/games/components/games-page.tsx`
- `src/features/games/components/games-gallery.tsx`
- `src/features/games/components/game-gallery-card.tsx`
- `src/features/games/components/game-lightbox.tsx`
- `src/features/games/components/game-shared-modal.tsx`

实现方式：

- 页面背景沿用 Kita 的暗色视觉。
- `games-gallery.tsx` 使用 CSS columns 瀑布流。
- 第一块是类似 Vercel 模板的 intro panel。
- 每个游戏条目是一个 `Link`，点击进入 `/games?photo=slug`，不直接进详情。
- 照片墙条目不再显示标题、状态或说明，只保留图片本身。
- 图片使用 `next/image`，保留 responsive `sizes`。
- 卡片 hover 使用亮度变化和轻微缩放，保持参考模板的图片优先逻辑。

### 大图查看器

文件：

- `src/features/games/components/game-lightbox.tsx`

实现方式：

- `game-lightbox.tsx` 对应原版 `Modal.tsx`，负责读取 URL、关闭、切换 index、监听键盘。
- `game-shared-modal.tsx` 对应原版 `SharedModal.tsx`，负责主图、按钮层和底部缩略图条。
- URL 为 `/games?photo=sea-side-fragment` 时打开全屏大图。
- 主图容器、按钮 class、右上角图标、左上角关闭、底部缩略图条都尽量按原版结构复刻。
- `↗` 图标进入详情页，使用 `title="Open fullsize version"` 做 hover 提示。
- `↓` 图标下载当前图片。
- 打开查看器时锁住 body 滚动，避免右侧出现页面滚动条。
- 支持键盘 `Escape`、`ArrowLeft`、`ArrowRight`。

这比第一版更接近原版 `Modal.tsx` / `SharedModal.tsx` 的交互逻辑，但没有引入 Framer Motion、Headless UI 或 swipe 依赖。

### 详情页组件

文件：

- `src/features/games/components/game-detail-page.tsx`

实现方式：

- 详情页现在更轻，只是一个极简文字档案页。
- 从详情页返回 `/games?photo=slug`，回到对应图片的大图查看器。
- 不再使用现代 dashboard / shadcn 式双栏信息面板。

## 没有搬什么

没有引入：

- `@vercel/blob`
- `sharp`
- `@headlessui/react`
- `framer-motion`
- `react-swipeable`
- `react-use-keypress`
- 模板的 Pages Router 结构
- 模板的 Blob 图片获取逻辑

原因是当前目标只是完成 `/games` 的照片墙和详情页静态前端，不需要完整大图 modal / carousel。

## 当前结果

- `/games` 是照片墙，不再是普通四列卡片网格。
- 点击游戏封面先打开全屏图片查看器。
- 图片查看器里有底部缩略图条、左右切换、关闭按钮和小图标详情入口。
- 点击 `↗` 才进入 `/games/[slug]`。
- 详情页展示游戏标题、原名、开发者、发售年份、状态、标签、简介、备注和外链。
- 数据仍然来自本地静态文件。
- 未连接数据库。
- 未改变 Kita 的工程结构。

## 后续建议

下一步可以做两件事：

1. 用真实游戏封面替换 `public` 里的占位图片。
2. 如果想要更接近 Vercel 模板，再单独迁移 modal / carousel 交互。

等视觉和字段稳定后，再考虑新增 Payload `Games` collection。
