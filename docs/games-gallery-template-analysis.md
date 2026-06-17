# Games Gallery Template Analysis

更新日期：2026-06-17

参考模板：Vercel Image Gallery Starter  
模板地址：https://vercel.com/templates/next.js/image-gallery-starter  
源码来源：Vercel 模板页指向的 Next.js / Vercel Blob 示例，通常通过 `with-vercel-blob` example 获取。

## 当前下载状态

源码已经下载到：

`D:\blackwater\kita\_reference\with-vercel-blob`

最终成功命令：

```bash
pnpm.cmd create next-app _reference/with-vercel-blob --example with-vercel-blob --use-pnpm
```

说明：

- 直接 `git clone` Next.js 仓库时 GitHub 连接失败。
- `pnpm` 在 PowerShell 里会碰到脚本执行策略，所以改用 `pnpm.cmd`。
- `pnpm.cmd` 需要访问用户缓存目录并联网，已通过提升权限成功创建示例项目。
- `_reference` 是参考源码区，不应该把这个 example 的代码直接混入 Kita 正式目录。

## 你的思路

你的想法是正确的，而且和 Kita 当前阶段很匹配：

- `/games` 不从零设计。
- 使用 Image Gallery Starter 的照片墙 layout。
- 点击某个游戏后进入 `/games/[slug]` 子页面。
- 子页面用 shadcn/ui 风格的基础组件改造，例如 badge、tabs、separator、button、card。
- 只使用模板的源码布局部分，不要它的数据层、部署配置、Vercel Blob 绑定和完整项目结构。
- 不是让 Kita 适配模板，而是把模板代码改造成 Kita 的 `src/features/games/*` 结构。

这点很重要：Kita 是主体，模板只是 layout 原料。

## 这个模板大概如何实现

Image Gallery Starter 是一个 Pages Router 项目，不是 App Router 项目。它的核心文件是：

- `pages/index.tsx`：照片墙首页。
- `pages/p/[photoId].tsx`：单张图片大图页。
- `components/Modal.tsx`：首页点击图片后的 modal 容器。
- `components/Carousel.tsx`：独立大图页容器。
- `components/SharedModal.tsx`：modal 和大图页共用的图片展示、按钮、缩略图导航。
- `utils/cachedImages.ts`：从 Vercel Blob 读取图片、用 sharp 生成尺寸和 blur placeholder。
- `utils/types.ts`：图片和 modal props 类型。

Image Gallery Starter 的核心逻辑可以拆成四层：

### 1. 图片数据源

原模板的图片来自 Vercel Blob，源码在 `utils/cachedImages.ts`：

- 从 Blob 存储读取图片列表。
- 用 `@vercel/blob` 的 `list()` API 获取 blobs。
- 按 `pathname` 排序。
- 对每张图片执行 `fetch()`，拿到 buffer。
- 用 `sharp` 读取图片宽高。
- 用 `sharp.resize(10)` 生成 base64 blur placeholder。
- 缓存在模块级变量 `cached` 里，避免重复计算。

这一层 Kita 不需要直接搬。

Kita 的 `/games` 初期应该继续使用本地静态数据，例如：

`src/features/games/data/game-items.ts`

后续如果接 Payload，再把数据源替换成：

`src/server/games/get-games.ts`

### 2. 图片元信息

图片墙需要的不只是图片 URL，还需要一些展示信息：

- 图片地址。
- 宽高或 aspect ratio。
- alt 文本。
- 唯一 id / slug。
- 可选 blur placeholder。
- 可选标题和简介。

迁移到 Kita 后，游戏条目可以整理成类似结构：

```ts
export type GameItem = {
  slug: string;
  title: string;
  developer?: string;
  releasedAt?: string;
  status?: "played" | "playing" | "planned";
  summary: string;
  cover: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  tags: string[];
};
```

### 3. 照片墙 layout

这是最值得借的部分。

模板的核心价值不是 Vercel Blob，而是 `pages/index.tsx` 里的瀑布流照片墙。它不是传统 CSS grid，而是 Tailwind 的 CSS columns：

```tsx
<div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
```

每张图片是一个 `Link`，使用 `mb-5 block w-full` 让图片自然落入 columns 流中：

```tsx
<Link
  href={`/?photoId=${id}`}
  as={`/p/${id}`}
  shallow
  className="group relative mb-5 block w-full cursor-zoom-in"
>
```

图片本身用 `next/image`，保留 blur placeholder 和 responsive sizes：

```tsx
<Image
  placeholder="blur"
  blurDataURL={blurDataUrl}
  src={url}
  width={720}
  height={480}
  sizes="(max-width: 640px) 100vw,
    (max-width: 1280px) 50vw,
    (max-width: 1536px) 33vw,
    25vw"
/>
```

可以借：

- 多列 responsive grid。
- 图片保持自身比例。
- 不强行裁成同一种尺寸。
- 用 `next/image` 做响应式图片。
- 图片之间留出稳定间距。
- hover 时有轻量反馈。
- 点击图片进入详情或打开更大的展示视图。

这套逻辑非常适合 `/games`，因为游戏封面、CG、截图天然适合照片墙。

Kita 应该保留这种视觉逻辑，不要改成普通 SaaS 卡片列表。

### 4. 详情页或查看层

原模板有两套查看逻辑：

- 在首页点击图片时，用 shallow routing 把 URL 变成 `/p/[photoId]`，同时在当前页面打开 modal。
- 如果直接打开 `/p/[photoId]`，会进入独立大图页，显示同一个图片查看器。

具体实现：

- `pages/index.tsx` 从 `router.query.photoId` 判断是否显示 `<Modal />`。
- `Modal.tsx` 使用 `@headlessui/react` 的 `Dialog` 做可访问 modal。
- `SharedModal.tsx` 负责主图片、左右切换按钮、关闭按钮、下载按钮、底部缩略图导航。
- `Carousel.tsx` 负责直接访问 `/p/[photoId]` 时的大图查看。
- `react-use-keypress` 支持键盘左右切图和 Escape。
- `react-swipeable` 支持触摸滑动。
- `framer-motion` 负责图片切换动画。

Kita 可以把这个逻辑改成：

- `/games`：照片墙。
- `/games/[slug]`：游戏详情页，或者先用 parallel-route/modal 风格做图片详情。

详情页不需要完全复制模板，因为 Kita 的游戏详情不仅是大图，还会有：

- 标题。
- 会社 / 开发者。
- 游玩状态。
- 发布时间。
- 简介。
- 标签。
- 个人笔记。
- 外部链接。

这里适合用 shadcn/ui 思路做结构化信息区。

## Kita 可以使用哪些内容

### 可以直接借鉴

#### CSS columns 瀑布流结构

这是第一优先级。

目标是让 `/games` 看起来像一个视觉库，而不是普通列表页。可以借：

- `columns-1 sm:columns-2 xl:columns-3 2xl:columns-4` 的瀑布流容器。
- 响应式列数。
- 图片间距。
- 图片比例处理。
- hover 动效。
- 点击区域。
- 图片加载策略。

#### `next/image` 使用方式

可以借：

- `sizes` 写法。
- `placeholder="blur"` 或类似占位策略。
- 图片宽高声明方式。
- alt 文本组织方式。

注意：如果 Kita 初期使用 `public` 本地图片，`next/image` 会更简单，不需要 Blob URL。

#### 图片条目的数据 shape

模板的 `ImageProps` 很小：

```ts
export interface ImageProps {
  id: number;
  url: string;
  width: number;
  height: number;
  blurDataUrl: string;
}
```

可以参考它如何表示：

- src / url。
- width。
- height。
- blurDataURL。
- id。

然后改造成 Kita 的 `GameItem`。

#### 点击图片的交互逻辑

可以保留：

- 图片整体可点击。
- hover 时轻微放大或变暗。
- shallow route / modal 的思想。
- 关闭后回到上次浏览位置。
- 键盘左右切换。
- 触摸滑动。
- 底部缩略图导航。

Kita 第一版可以先简化：点击进入 `/games/[slug]` 详情页。等基础版本稳定后，再考虑把模板的 modal / carousel 交互迁移过来。

### 可以暂时不搬但值得记住

#### Modal / Carousel 结构

模板的 modal 很完整，但依赖比较多：

- `@headlessui/react`
- `framer-motion`
- `react-swipeable`
- `react-use-keypress`
- `@heroicons/react`

Kita 目前不一定需要一次性引入这些。更适合的做法是：

- 第一阶段只借照片墙。
- 第二阶段如果确实需要图片查看器，再用 shadcn/dialog 或原生 route 做一个更轻的版本。
- 如果需要保留完整体验，再评估是否引入 Framer Motion 和 swipe。

### 可以改造后使用

#### 上传逻辑

如果模板包含图片上传到 Vercel Blob 的逻辑，暂时不要搬。

未来如果 Kita 需要媒体库，应该优先考虑 Payload 自己的 media collection，而不是直接接 Vercel Blob。

#### 图片列表获取逻辑

模板可能从 Blob list API 获取图片。Kita 应改成：

初期：

```ts
import { gameItems } from "@/features/games/data/game-items";
```

后期：

```ts
import { getGames } from "@/server/games/get-games";
```

#### route 结构

模板的 route 结构不一定适合 Kita。

Kita 应保持：

- `src/app/(site)/games/page.tsx`
- `src/app/(site)/games/[slug]/page.tsx`
- `src/features/games/components/games-page.tsx`
- `src/features/games/components/games-gallery.tsx`
- `src/features/games/components/game-detail-page.tsx`
- `src/features/games/data/game-items.ts`
- `src/features/games/types/game-item.ts`

## 不应该使用的内容

### 不搬 Vercel Blob 数据层

理由：

- Kita 当前部署在 VPS + Coolify。
- 后台数据主线是 Payload + PostgreSQL。
- 媒体管理未来更适合走 Payload media collection。
- 直接引入 Vercel Blob 会让部署链路变复杂。

### 不搬完整项目结构

模板项目可能有自己的 `app`、`components`、`lib`、配置文件和环境变量。

Kita 不应该被这些结构影响。只把 layout 拆成 feature 组件。

### 不搬模板依赖

模板当前依赖包括：

- `@vercel/blob`
- `sharp`
- `@headlessui/react`
- `@heroicons/react`
- `framer-motion`
- `react-hooks-global-state`
- `react-swipeable`
- `react-use-keypress`

其中 `@vercel/blob` 和 Blob 相关逻辑初期不要搬。Modal 相关依赖也不要一次性搬，除非明确要做和原模板一样的大图查看器。

只有当某个依赖是 gallery layout 必需的，才考虑引入。

### 不复制默认品牌和文案

Kita 需要的是游戏墙，不是 Vercel demo gallery。标题、说明、空状态、按钮都要改成 Kita 自己的表达。

## 建议迁移方案

### 第一步：源码落地到参考目录

网络可用后，把源码放到：

`D:\blackwater\kita\_reference\with-vercel-blob`

推荐方式之一：

```bash
pnpm create next-app _reference/with-vercel-blob --example with-vercel-blob --use-pnpm
```

如果使用 Git sparse checkout，也可以先下载 Next.js 仓库 example，再只保留 `examples/with-vercel-blob`。

注意：`_reference` 已经被项目忽略，不应该进入正式提交。

### 第二步：只读分析源码

源码已经下载，优先读这些位置：

- 页面入口：`pages/index.tsx`
- 单图页面：`pages/p/[photoId].tsx`
- 图片查看器：`components/Modal.tsx`
- 大图页容器：`components/Carousel.tsx`
- 共用查看器：`components/SharedModal.tsx`
- 图片列表逻辑：`utils/cachedImages.ts`
- 类型：`utils/types.ts`
- Blob 相关逻辑：`utils/cachedImages.ts`
- 样式：`app/globals.css`、Tailwind class

目标是确认：

- columns 瀑布流是怎么排的。
- 图片比例怎么处理。
- 点击后 route 和 modal 如何配合。
- 数据对象长什么样。
- 哪些依赖只是 Blob 上传用的。

### 第三步：在 Kita 建立 games 类型

建议新增或整理：

`src/features/games/types/game-item.ts`

初期字段建议：

- `slug`
- `title`
- `developer`
- `releasedAt`
- `status`
- `summary`
- `cover`
- `tags`

暂时不要建复杂 CMS 模型。

### 第四步：改造 `/games` 照片墙

建议组件结构：

```text
src/features/games/components/
  games-page.tsx
  games-gallery.tsx
  game-gallery-card.tsx
```

职责：

- `games-page.tsx`：页面整体容器、标题、背景、导航。
- `games-gallery.tsx`：grid layout。
- `game-gallery-card.tsx`：单张图片卡片。

### 第五步：新增 `/games/[slug]`

建议新增：

```text
src/app/(site)/games/[slug]/page.tsx
src/features/games/components/game-detail-page.tsx
```

详情页可以用 shadcn/ui 思路做：

- badge：状态、标签。
- separator：内容分区。
- tabs：简介 / 笔记 / 链接。
- button：外部链接。

但不要把页面做成 SaaS dashboard。视觉上仍然要服务于图片和游戏条目。

## 建议视觉原则

- `/games` 第一屏应该先看到图片墙。
- 图片是主角，不要用大段说明压住图片。
- 文字信息可以在 hover 或详情页里出现。
- 保留照片墙模板的视觉逻辑，避免改成普通 card grid。
- 详情页可以更结构化，但不要过度 UI 化。
- 封面尺寸和截图比例要稳定，避免页面跳动。

## 与 Payload 的关系

当前阶段先不要急着接 Payload。

推荐顺序：

1. 用本地 `game-items.ts` 改造前端。
2. 满意后再决定 Payload 字段。
3. 再新增 `Games` collection。
4. 生成 migration。
5. 再把 `getGames()` 接到 Payload。

理由：

- `/games` 的视觉和内容模型还在探索。
- 先接 CMS 会被数据库字段绑住。
- 本地静态数据更适合快速调整 layout。

## 初版验收标准

第一版 `/games` 改造完成后，应满足：

- `/games` 是照片墙，不是普通列表。
- 点击游戏能进入 `/games/[slug]`。
- 详情页能显示游戏基本信息。
- 数据仍来自本地静态文件。
- 不引入 Vercel Blob。
- 不改变 Kita 的工程结构。
- 不重写首页、about、tools、reviews。
- `pnpm lint` 和 `pnpm typecheck` 通过。

## 结论

这个模板非常适合拿来作为 `/games` 的 layout 原料，尤其是照片墙和图片点击逻辑。

但 Kita 只应该使用它的前端展示思想和少量组件源码，不应该继承它的数据层和部署假设。最佳做法是：先把源码放进 `_reference`，读懂 grid 和 image card，再把它改写成 Kita 自己的 `src/features/games/*` 组件。

等源码能成功下载后，下一步应该补一版“逐文件拆解”，明确每个模板文件对应 Kita 的哪个目标文件。
