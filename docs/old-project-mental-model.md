# 旧项目整体心智模型

这份笔记用来回忆 `_reference/old-project` 到底是什么，以及它和现在的 `kita` 项目是什么关系。

## 旧项目是什么

旧项目不是一个干净的新工程，而是一个已经做过很多实验的原型项目。

它分成两个独立项目：

```txt
_reference/old-project/
  kralgame-frontend/  Next.js 前端
  kralgame-backend/   Payload CMS 后端
```

前端负责页面、视觉效果、路由和交互。  
后端负责 Payload Admin、collections、media、API 和数据库连接。

旧项目的方向是：

```txt
Galgame / visual novel 风格个人网站
  首页强视觉入口
  游戏条目
  测评文章
  壁纸背景
  随机句子/引用
  关于页
  工具/笔记页
```

这个方向和现在的 `kita` 是一致的。

## 旧项目前端在做什么

旧前端的核心不是普通博客首页，而是一个带视觉风格的入口界面。

它大致由这些部分组成：

```txt
Homepage
  DynamicWallpaper      动态背景图轮播
  BottomNavigation      底部大字导航
  SideNavigation        滚动后出现的侧边导航
  RainyWindow           雨滴/玻璃折射效果
  VersesContent         随机句子和打字动画
```

视觉目标很明确：

```txt
全屏背景图
暗色遮罩
超大导航文字
hover 颜色变化
galgame / visual novel 氛围
```

这部分很值得保留。

## 旧项目后端在做什么

旧后端已经用了 Payload CMS。

主要内容模型是：

```txt
Games       游戏条目
Reviews     测评文章
Wallpapers  首页壁纸
Verses      首页随机句子
Media       媒体资源
About       关于页内容
Users       管理员/作者
```

这说明我之前的思路已经不是完全空想，而是已经尝试过用 CMS 管理内容。

这些 collection 的方向是有价值的，但旧代码不能直接搬。

## 为什么不能直接复制旧项目

旧项目的问题是：它是学习和实验过程的集合。

里面混着：

- 真实 API fetch
- mock 数据
- 大量学习注释
- 硬编码 `localhost:3000`
- 前端和后端分离时留下的 URL 逻辑
- MongoDB 配置
- Cloudinary 上传逻辑
- `.env`
- `.git`
- `.next`
- `node_modules`

这些东西在参考目录里可以用于分析，但不能直接成为 `kita` 的正式代码。

## 旧项目对 kita 的价值

旧项目最有价值的不是工程配置，而是三个东西。

第一，视觉方向：

```txt
galgame 风格首页
背景图驱动界面
大字号导航
氛围优先
```

第二，内容模型：

```txt
games
reviews
wallpapers
verses
about
media
```

第三，组件经验：

```txt
背景轮播应该抽组件
雨滴效果应该抽组件
导航数据应该集中管理
数据获取不应该散落在 UI 组件里
```

## 现在的判断

旧项目不是要搬家，而是要提炼。

正确关系应该是：

```txt
old-project
  作为参考资料、视觉原型、内容模型草稿

kita
  作为新的正式工程
  用更干净的结构重新实现
```

一句话总结：

> 旧项目证明了我要做什么，kita 要重新定义我应该如何更干净地做。
