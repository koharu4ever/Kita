# Day 1：Next.js 个人网站工程化基座总结

今天的目标不是写业务功能，而是先给个人网站项目搭一个干净、稳定、可解释的工程化基座。

这个项目未来会使用：

- Next.js：负责前台页面、React 组件、Server Components 和整体应用结构
- Payload CMS：负责内容型后端、文章、项目、媒体、站点配置和 Admin 后台
- PostgreSQL：负责持久化存储
- Docker / Dev Container / Coolify：让本地开发和 VPS 部署环境尽量接近

第一天只做工程基座，不接 Payload，不接数据库，不写 UI，不做业务功能。

## 参考来源

这次工程化设置主要参考了两个方向。

第一个是 CJ 的 Next.js starter 思路。主要借鉴的是工程习惯，而不是完整技术栈：

- VS Code settings
- Prettier
- ESLint
- 保存时格式化和 lint
- Tailwind CSS 编辑器支持
- 使用项目内 TypeScript 版本
- Next.js typed routes
- format / lint / typecheck scripts
- unused imports 清理
- `.env.example`
- typesafe env 的后续计划

没有照抄 CJ starter 中和当前项目不匹配的部分：

- 不引入 NextUI / HeroUI
- 不做 Navbar 组件库
- 不做 light / dark mode
- 不接 Auth.js / NextAuth
- 不接 Google OAuth
- 不使用 Drizzle 作为主数据层
- 不做 Guestbook
- 不接 drizzle-zod

原因是这个项目第一版的后端方向是 Payload CMS，而不是 Auth.js + Drizzle 的应用型后端。

第二个参考是 `bulletproof-react` 的项目结构思路。主要借鉴的是：

- 大多数代码放在 `src`
- 按业务 feature 组织代码
- `shared` 只放真正跨功能复用的代码
- 入口层只做组合，不堆业务逻辑
- 通过目录边界约束依赖方向

但没有直接照搬它的 React SPA 结构，因为本项目使用的是 Next.js App Router。

## 当前项目结构

当前核心目录是：

```txt
src/
  app/        Next.js 路由、layout、metadata、route handlers
  config/     配置和未来 typesafe env
  features/   文章、项目、站点设置等业务模块
  server/     Payload / PostgreSQL / server-only adapters
  shared/     跨 feature 复用的组件、hooks、lib、types
  testing/    测试工具和 fixtures
```

这个结构的重点不是“文件夹越多越高级”，而是提前确定边界。

未来写代码时，大致规则是：

- 页面入口和路由组合放在 `src/app`
- 文章、项目、站点设置等业务能力放在 `src/features`
- 真正复用的工具、组件、类型放在 `src/shared`
- Payload、数据库、server-only 逻辑放在 `src/server`
- 环境变量校验和站点配置放在 `src/config`

## 为什么保留 `src/app`

`bulletproof-react` 更偏普通 React SPA，它通常会有自己的 router 配置。

但 Next.js App Router 的约定是 `app` 目录本身就是路由系统，所以本项目必须保留：

```txt
src/app/
  layout.tsx
  page.tsx
  globals.css
```

`src/app` 的职责是：

- 定义路由
- 定义 layout
- 定义 metadata
- 组合 Server Components
- 放 route handlers
- 放 loading / error / not-found 等 Next 文件

原则是：`app` 可以组合功能，但不要承载大量业务逻辑。

## 为什么预留 `src/server`

这个项目后续会接 Payload CMS 和 PostgreSQL。

如果以后把 Payload 查询、数据库访问、server-only helper 直接写进 React 组件，会让项目越来越难维护。

所以现在预留：

```txt
src/server/
```

未来可以逐步加入：

```txt
src/server/payload/
src/server/database/
```

这样可以把服务端能力和 UI 组件分开。

## 为什么预留 `src/features`

未来个人网站会有多个业务模块，例如：

```txt
src/features/articles/
src/features/projects/
src/features/site-settings/
```

每个 feature 可以拥有自己的：

- components
- data
- types
- schemas
- tests

这样比把所有组件都放进一个巨大的 `components` 文件夹更清晰。

但现在还没有创建 `articles` 或 `projects`，因为第一天还没有开始业务开发。

## ESLint 做了什么

ESLint 负责检查代码质量。

当前使用的是新版 flat config：

```txt
eslint.config.mjs
```

配置内容包括：

- Next.js core web vitals 规则
- Next.js TypeScript 规则
- unused imports 检查

最重要的作用是：

- 检查 Next / React 写法问题
- 检查 TypeScript 相关问题
- 发现未使用的 import
- 用 `lint:fix` 自动修复一部分问题

当前 scripts：

```bash
pnpm lint
pnpm lint:fix
```

## Prettier 做了什么

Prettier 负责统一代码格式。

当前配置文件是：

```txt
prettier.config.mjs
```

配置内容包括：

- 使用分号
- 使用双引号
- 多行保留尾逗号
- 使用 `prettier-plugin-tailwindcss`

Tailwind 插件的作用是自动排序 Tailwind class，避免 class 字符串越来越乱。

当前 scripts：

```bash
pnpm format
pnpm format:check
```

## VS Code settings 做了什么

项目中加入了：

```txt
.vscode/settings.json
.vscode/extensions.json
```

这些配置的目的，是把开发习惯写进项目，而不是靠每个人手动记。

主要效果：

- 保存时自动格式化
- 保存时触发 ESLint fix
- 默认使用 Prettier
- 推荐安装 ESLint、Prettier、Tailwind CSS IntelliSense
- CSS 文件识别 Tailwind 语法
- 使用项目内 TypeScript 版本

其中 TypeScript workspace version 很重要，因为 VS Code 会使用项目自己的 TypeScript，而不是编辑器内置版本。

## Next.js typed routes

Next.js 配置中开启了：

```ts
typedRoutes: true;
```

它的作用是让路由更类型安全。

以后使用 Next.js 的链接和路由时，TypeScript 可以更早发现错误路径。

这是新版 Next.js 的稳定配置，不是旧的 `experimental.typedRoutes`。

## Tailwind CSS

当前项目接入的是 Tailwind CSS v4。

基础入口是：

```css
@import "tailwindcss";
```

PostCSS 配置中使用：

```txt
@tailwindcss/postcss
```

这和 Tailwind v3 时代的配置方式不完全一样。

目前只是接好 CSS 管线，没有写 UI。

## Docker 和 Dev Container

第一天也加入了 Docker 相关文件：

```txt
Dockerfile
compose.yaml
.dockerignore
.devcontainer/devcontainer.json
```

它们的目的不是马上复杂部署，而是让项目从一开始就接近未来的 VPS / Coolify 环境。

简单理解：

- `Dockerfile`：描述如何把项目打包成生产运行镜像
- `compose.yaml`：描述如何启动这个 web 服务
- `.dockerignore`：告诉 Docker 哪些东西不要打进镜像
- `devcontainer.json`：让 VS Code 可以在容器里开发

当前 Docker 只包含 Next.js web 服务，还没有 PostgreSQL，也没有 Payload。

## 当前 scripts

现在常用命令是：

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm typecheck
```

第一版最重要的健康检查命令是：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

这四个命令可以分别检查：

- 格式是否统一
- 代码规范是否通过
- TypeScript 类型是否正确
- Next.js 是否能成功生产构建

## 第一版必须理解的内容

第一版最重要的是理解这些：

- `src/app` 是 Next.js 路由入口
- `src/features` 放业务模块
- `src/shared` 只放真正复用的代码
- `src/server` 放未来 Payload / database / server-only 逻辑
- ESLint 管代码质量
- Prettier 管代码格式
- TypeScript 管类型安全
- `.env.example` 是环境变量样板，不是真实密钥
- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm build` 是项目健康检查

可以以后再深入的内容：

- Dockerfile 多阶段构建
- Dev Container 的完整工作方式
- Coolify 部署细节
- typedRoutes 的类型生成机制
- Tailwind v4 的底层编译机制
- typesafe env 的具体实现
- Payload CMS 的 collections 和 admin 配置
- PostgreSQL 连接和迁移策略

## 今天的总结

第一天完成的是项目地基，而不是业务功能。

这个地基做了几件事：

- 用 Next.js 初始化应用结构
- 用 TypeScript 保证类型安全
- 用 ESLint 保证代码质量
- 用 Prettier 保证代码格式
- 用 Tailwind v4 接好 CSS 管线
- 用 VS Code settings 固化开发习惯
- 用 typed routes 提升路由安全
- 用 Docker / Dev Container 为未来部署和环境一致性做准备
- 用 bulletproof-react 的思路建立目录边界
- 为 Payload CMS 和 PostgreSQL 预留位置，但暂时不接入

所以当前项目的状态可以概括为：

> 一个面向 Next.js + Payload CMS + PostgreSQL 的个人网站工程化基座。它还没有业务功能，但已经有清晰的目录边界、代码规范、格式化规则、类型检查、构建验证和未来容器化部署方向。
