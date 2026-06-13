# 从 Kralgame 旧项目迁移到 Kita 的笔记

这份笔记记录旧项目哪些值得迁移，哪些不应该迁移，以及迁移到 `kita` 时应该怎么做。

## 迁移原则

不要直接复制旧代码。

应该这样做：

```txt
旧项目
  ↓ 分析
提炼视觉、内容模型、组件职责
  ↓
kita 中重新实现
```

旧项目是参考资料，不是正式源码。

## 可以迁移的东西

### 1. 视觉方向

强烈保留。

包括：

- 全屏背景图
- galgame / visual novel 氛围
- 底部大字号导航
- hover 时不同颜色
- 暗色遮罩
- 背景轮播
- 雨滴玻璃效果
- 打字机句子

这些是网站气质的核心。

### 2. 图片素材

可以先作为本地开发素材使用。

旧项目素材在：

```txt
_reference/old-project/kralgame-frontend/public/
```

包括：

```txt
wallpaper1.jpg
wallpaper2.jpg
wallpaper3.jpg
wallpaper4.jpg
blue.jpg
blue1.jpg
white.jpg
yellow.jpg
purple.jpg
green.jpg
red.jpg
```

正式上线前需要检查来源和版权。

### 3. Payload 内容模型

可以参考，但要重建。

可参考的模型：

```txt
games
reviews
wallpapers
verses
about
media
users
```

新项目第一版可以先保留：

```txt
media
games
reviews
site-settings 或 about
```

`wallpapers` 和 `verses` 可以作为首页体验增强项。

### 4. CSS 动画思路

可以保留思路：

- `raindrop-life`
- `breathing-cycle`
- `darken-sky`

但需要整理命名、减少全局污染、删掉超长注释。

### 5. 页面意图

旧项目已经有这些页面意图：

```txt
/              首页视觉入口
/games         游戏列表
/games/[id]    游戏详情
/reviews       测评列表
/reviews/[id]  测评详情
/about         关于页
/tools         工具/笔记页
```

这些路线可以作为新项目的信息架构参考。

## 不应该迁移的东西

### 1. 旧工程配置

不要迁移：

- 旧 `package.json`
- 旧 `eslint.config.mjs`
- 旧 `tsconfig.json`
- 旧 `next.config.ts`
- 旧 lockfile

原因是 `kita` 已经有新的工程化基座。

### 2. node_modules 和 .next

不要迁移：

```txt
node_modules
.next
```

这些是生成物，不是源码。

### 3. .env

不要迁移旧 `.env`。

旧 `.env` 可能包含真实密钥或旧环境配置。

新项目应该使用：

```txt
.env.example
.env.local
Coolify environment variables
```

### 4. 硬编码 localhost

旧项目里有很多：

```txt
http://localhost:3000
```

迁移时要清理掉。

新项目应该封装数据访问，不让 URL 到处散落。

### 5. Cloudinary hook

旧 Media collection 接了 Cloudinary。

这个思路以后可以研究，但第一版不要直接搬。

因为它会立刻引入：

- Cloudinary account
- API key
- upload hook
- 部署环境变量
- 图片远程加载配置

第一版先简单一点。

## 推荐的新结构映射

旧项目首页：

```txt
kralgame-frontend/app/page.tsx
kralgame-frontend/app/_components/HomepageClientLayout.tsx
kralgame-frontend/app/_components/DynamicWallpaper.tsx
kralgame-frontend/app/_components/RainyWindow.tsx
kralgame-frontend/app/_components/VersesContent.tsx
```

迁移到：

```txt
src/app/page.tsx
src/features/home/components/home-landing.tsx
src/features/home/components/scene-background.tsx
src/features/home/components/rainy-window.tsx
src/features/home/components/featured-verse.tsx
src/features/home/data/home-nav-items.ts
```

旧 games：

```txt
kralgame-frontend/app/games/page.tsx
kralgame-frontend/app/games/GameGrid.tsx
kralgame-frontend/app/games/GlassCard.tsx
```

迁移到：

```txt
src/app/games/page.tsx
src/features/games/components/game-grid.tsx
src/features/games/components/game-card.tsx
src/server/payload/get-games.ts
```

旧 reviews：

```txt
kralgame-frontend/app/reviews/page.tsx
kralgame-frontend/app/reviews/_components/*
```

迁移到：

```txt
src/app/reviews/page.tsx
src/features/reviews/components/*
src/server/payload/get-reviews.ts
```

旧 Payload collections：

```txt
kralgame-backend/src/collections/*
```

迁移到未来的：

```txt
src/server/payload/collections/*
```

## 第一版迁移顺序

不要一次迁移所有东西。

推荐顺序：

1. 先迁移静态视觉首页
2. 再整理图片资源
3. 再做 home nav 数据化
4. 再做 games/reviews 静态 mock 展示
5. 再接 Payload collections
6. 再把 mock 数据替换成 Payload 数据
7. 最后加动态壁纸、verses、雨滴等增强效果

这样每一步都能验证。

## MVP 应该怎么定

第一版不要做完整社区，也不要做用户系统。

比较合理的 MVP：

```txt
首页
  全屏背景
  底部导航
  基础 hover 效果

Games
  游戏列表
  游戏详情

Reviews
  测评列表
  测评详情

About
  简单关于页

Payload
  games
  reviews
  media
```

先让内容流通起来，再补视觉细节。

## 关于旧项目注释

旧项目里有大量学习注释。

这些注释很有学习价值，但不适合直接放进正式源码。

处理方式：

```txt
学习解释
  放 docs/

生产代码
  只保留必要注释
```

如果有重要概念，比如 Payload collection、CSS variables、Server Component 数据流，可以整理成文档，而不是塞在组件里。

## 关于 `_reference`

`_reference` 是参考资料，不是正式源码。

未来 Git 提交前要注意：

```txt
_reference/old-project/**/.env
_reference/old-project/**/.git
_reference/old-project/**/node_modules
_reference/old-project/**/.next
```

这些不应该进入正式仓库。

后续可以选择：

- 整个 `_reference/` 加入 `.gitignore`
- 或者清理后只保留必要源码和图片
- 或者把旧项目单独放在仓库外

## 当前结论

旧项目是很好的原型，但不是干净源码。

可以保留：

```txt
视觉方向
内容模型
图片素材
组件经验
页面信息架构
```

不应该保留：

```txt
旧依赖
旧配置
硬编码 URL
杂乱注释
生成目录
敏感环境文件
```

一句话总结：

> Kita 应该继承 Kralgame 的气质，而不是继承它的混乱。
