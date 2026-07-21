# 下一阶段前端开发步骤

> **历史记录（非当前事实源）**：本文记录前端骨架开始实现前的阶段计划。文中的“当前状态”“下一阶段”和“先不接 Payload”均指当时决策，不代表现状。当前进度与操作边界以 [CODEX_HANDOFF.md](./CODEX_HANDOFF.md) 和 [current-project-status.md](./current-project-status.md) 为准。

这份笔记用来把“总结阶段”连接到“开始写码阶段”。

当前状态：

```txt
工程基座完成
Docker / Dev Container 完成
旧项目已放入 _reference
旧项目已完成只读分析
```

下一阶段目标不是一次性复刻旧项目，而是先做一个干净的前端骨架。

## 第一步：先做静态首页骨架

先不要接 Payload。

先实现：

```txt
src/app/page.tsx
src/features/home/components/home-landing.tsx
src/features/home/components/scene-background.tsx
src/features/home/components/main-visual-nav.tsx
src/features/home/data/home-nav-items.ts
```

目标：

```txt
全屏背景
底部大字导航
hover 颜色
基础响应式
```

暂时不做：

- 雨滴效果
- verses
- CMS 数据
- 复杂页面动画

## 第二步：整理视觉资源

从旧项目中挑选少量图片进入正式项目。

建议先只选：

```txt
3-4 张首页背景图
1 张 reviews 背景
1 张 games 背景
1 张 about 背景
```

不要把旧 `public` 整个复制过来。

图片进入正式项目前，需要考虑：

- 文件名是否清楚
- 文件大小是否合理
- 来源和版权是否能接受
- 是否真的会在第一版用到

## 第三步：把导航数据化

不要在 JSX 里重复写导航。

先建一份数据：

```txt
REVIEWS -> /reviews -> purple
GAMES   -> /games   -> blue
TOOLS   -> /tools   -> green
ABOUT   -> /about   -> amber
```

这样底部导航和未来侧边导航都可以复用。

## 第四步：建立 feature 边界

未来至少会有：

```txt
src/features/home
src/features/games
src/features/reviews
src/features/about
```

但不要一次性创建很多空文件。

用到哪个 feature，再建哪个。

## 第五步：再考虑 Payload

前端静态骨架跑通后，再接 Payload。

Payload 第一版建议从这些开始：

```txt
media
games
reviews
```

不要一开始就接：

- 用户评论
- 登录系统
- Cloudinary
- 复杂权限
- 搜索筛选

## 第六步：把 mock 数据替换成 CMS 数据

先用 mock 数据验证 UI：

```txt
mock games
mock reviews
mock wallpapers
```

等 Payload collections 稳定后，再替换成：

```txt
src/server/payload/get-games.ts
src/server/payload/get-reviews.ts
src/server/payload/get-home-wallpapers.ts
```

## 第七步：加视觉增强

最后再加：

- 动态背景轮播
- rainy window
- verses 打字机
- 滚动后侧边导航
- not-found 页面视觉化

这些是加分项，不是第一版骨架的前置条件。

## 每一步都要验证

每次完成一个小阶段，都跑：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

如果在 Dev Container 里开发，就在 Dev Container 终端中运行。

## 当前最重要的原则

```txt
先结构，后效果
先静态，后动态
先 mock，后 CMS
先页面跑通，后视觉打磨
```

一句话总结：

> 下一阶段不是重写旧项目，而是用 kita 的新结构重新长出旧项目里真正有价值的部分。
