# 当前项目的 Docker 与 Dev Container 配置说明

这篇笔记解释当前项目里的 Docker / Dev Container 文件分别做什么，以及它们在开发流程中的位置。

现在这个项目已经完成了第一阶段工程化基座：

- Docker Desktop 已安装
- WSL 2 已安装
- VS Code Dev Containers 扩展已安装
- Dev Container 可以成功打开项目
- 容器内 `format / lint / typecheck / build / dev` 都已经跑通

这说明开发环境已经从“只在 Windows 本机运行”推进到了“可以在容器里开发”。

## 当前相关文件

项目里和 Docker / Dev Container 相关的文件主要有：

```txt
Dockerfile
compose.yaml
.dockerignore
.devcontainer/devcontainer.json
next.config.ts
```

它们分成两类：

```txt
开发环境相关：
  .devcontainer/devcontainer.json

生产打包 / 部署相关：
  Dockerfile
  compose.yaml
  .dockerignore
  next.config.ts 里的 output: "standalone"
```

## 开发环境和生产环境的区别

这几个概念要先分清楚。

开发环境是我写代码的地方：

```txt
VS Code
Dev Container
Node
pnpm
Next.js dev server
http://localhost:3000
```

开发时使用：

```bash
pnpm dev
```

生产环境是网站正式运行给用户访问的地方：

```txt
VPS
Docker
Coolify
真实域名
真实数据库
真实环境变量
```

生产部署前通常会经历：

```bash
pnpm build
docker build
docker run / docker compose / Coolify deploy
```

所以：

```txt
Dev Container = 开发时用
Dockerfile = 生产打包和部署时用
```

它们都使用 Docker，但目的不一样。

## `.devcontainer/devcontainer.json`

这个文件告诉 VS Code：

> 打开这个项目时，可以用一个指定的容器作为开发环境。

当前配置是：

```json
{
  "name": "kita",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm",
  "postCreateCommand": "corepack enable && pnpm install",
  "remoteUser": "node"
}
```

### `name`

```json
"name": "kita"
```

这是 Dev Container 的名字。

打开成功后，VS Code 左下角会显示类似：

```txt
Dev Container: kita
```

### `image`

```json
"image": "mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm"
```

这表示开发容器使用微软官方的 Node.js 开发镜像。

其中：

```txt
javascript-node  表示这是 JavaScript / Node 开发环境
1-22-bookworm    表示 Node 22，基于 Debian Bookworm
```

这让项目不用依赖 Windows 本机安装的 Node，而是使用容器里的 Node。

这次实际验证到容器内版本是：

```bash
node --version
pnpm --version
```

并且能正常运行项目命令。

### `customizations.vscode.extensions`

```json
"extensions": [
  "bradlc.vscode-tailwindcss",
  "dbaeumer.vscode-eslint",
  "esbenp.prettier-vscode"
]
```

这表示进入 Dev Container 后，VS Code 会为这个容器环境安装项目推荐的插件：

- Tailwind CSS IntelliSense
- ESLint
- Prettier

这样开发工具也跟着项目走，而不是完全依赖本机 VS Code 的状态。

### `customizations.vscode.settings`

```json
"settings": {
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

这些是容器内 VS Code 的项目设置：

- 默认用 Prettier 格式化
- 保存时自动格式化
- 使用项目内安装的 TypeScript

这和项目根目录的 `.vscode/settings.json` 是同一个方向：把开发习惯写进项目。

### `postCreateCommand`

```json
"postCreateCommand": "corepack enable && pnpm install"
```

这是容器创建完成后自动执行的命令。

它做两件事：

```bash
corepack enable
pnpm install
```

`corepack enable` 用来启用 pnpm 这类包管理器。

`pnpm install` 用来在容器里安装项目依赖。

这次实际踩到的点是：Windows 下已有的 `node_modules` 不能直接相信。因为 Dev Container 是 Linux 环境，最好让容器自己安装一遍依赖。

当出现找不到包的问题时，可以在容器里执行：

```bash
rm -rf node_modules .next tsconfig.tsbuildinfo
pnpm install --frozen-lockfile
```

然后再运行健康检查。

### `remoteUser`

```json
"remoteUser": "node"
```

这表示在容器里默认使用 `node` 用户，而不是 root 用户。

这样更接近正常开发环境，也避免所有文件都由 root 创建。

## `Dockerfile`

`Dockerfile` 是生产镜像的说明书。

它回答的问题是：

> 如果我要把这个 Next.js 项目部署到服务器，应该怎样构建一个能运行的 Docker image？

当前 Dockerfile 使用了多阶段构建。

### `base` 阶段

```dockerfile
FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app
RUN corepack enable
```

这一段准备基础环境：

- 使用 Node 22
- 关闭 Next.js telemetry
- 设置 pnpm 路径
- 把工作目录设为 `/app`
- 启用 corepack

### `deps` 阶段

```dockerfile
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
```

这一段只安装依赖。

它先只复制：

```txt
package.json
pnpm-lock.yaml
```

原因是 Docker 有缓存。只要依赖文件没变，依赖安装层就可以复用，构建更快。

`--frozen-lockfile` 的意思是严格按照 lockfile 安装，不允许偷偷改依赖版本。

### `builder` 阶段

```dockerfile
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build
```

这一段负责构建 Next.js 应用：

- 复制上一步安装好的 `node_modules`
- 复制项目文件
- 执行 `pnpm build`

构建完成后会生成 `.next` 生产产物。

### `runner` 阶段

```dockerfile
FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
```

这是最终真正运行的生产镜像。

它不会保留完整开发环境，只保留运行应用需要的文件。

### 创建非 root 用户

```dockerfile
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 nextjs
```

这表示生产容器里不用 root 运行应用，而是创建一个 `nextjs` 用户。

这是一种更安全的生产运行习惯。

### 复制 standalone 产物

```dockerfile
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
```

这里依赖 Next.js 的 standalone 输出。

项目的 `next.config.ts` 中有：

```ts
output: "standalone";
```

这会让 Next.js 构建出更适合 Docker 运行的独立产物。

最终镜像只需要复制：

- `public`
- `.next/standalone`
- `.next/static`

不用把完整项目源码全部放进生产镜像。

### 启动应用

```dockerfile
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

含义是：

- 使用 `nextjs` 用户运行
- 容器暴露 3000 端口
- Next.js 监听 `0.0.0.0`
- 容器启动时执行 `node server.js`

`server.js` 来自 Next.js standalone 构建产物。

## `compose.yaml`

`compose.yaml` 用来描述如何启动服务。

当前内容是：

```yaml
services:
  web:
    build:
      context: .
    ports:
      - "3000:3000"
    environment:
      NEXT_TELEMETRY_DISABLED: "1"
      NODE_ENV: production
```

现在只有一个服务：

```txt
web
```

它会用当前目录的 Dockerfile 构建镜像：

```yaml
build:
  context: .
```

端口映射：

```yaml
ports:
  - "3000:3000"
```

意思是：

```txt
容器里的 3000 端口
映射到
电脑上的 3000 端口
```

所以以后可以通过：

```txt
http://localhost:3000
```

访问容器里的应用。

当前 Compose 没有 PostgreSQL，因为第一阶段还没有接数据库。

未来可能会扩展成：

```txt
web
postgres
```

甚至再加入：

```txt
redis
```

## `.dockerignore`

`.dockerignore` 告诉 Docker 构建镜像时不要复制哪些文件。

当前忽略：

```txt
node_modules
.next
out
dist
build
coverage
.git
.env
.env.*
!.env.example
*.log
```

原因：

- `node_modules` 应该在容器里重新安装
- `.next` 应该由 Docker 构建过程重新生成
- `.env` 可能有密钥，不能打进镜像
- `.git` 对运行应用没必要
- 日志和构建产物不应该进入镜像

这能让镜像更干净，也避免泄露本地环境变量。

## `next.config.ts` 里的 Docker 相关设置

当前 `next.config.ts` 中和 Docker 部署最相关的是：

```ts
output: "standalone";
```

它的作用是让 Next.js 在 `pnpm build` 后生成 standalone 产物。

这正好对应 Dockerfile 里的：

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
```

所以这两个配置是一组：

```txt
next.config.ts 生成 standalone
Dockerfile 复制 standalone 并运行 server.js
```

## 当前已经验证通过的命令

在 Dev Container 里，已经验证通过：

```bash
node --version
pnpm --version
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

其中：

```bash
pnpm dev
```

成功启动 Next.js：

```txt
Local: http://localhost:3000
GET / 200
```

页面空白是正常的，因为当前首页是：

```tsx
export default function Home() {
  return null;
}
```

## 这次踩过的几个点

### 1. WSL 安装失败 403

最开始 `wsl --install` 返回 403。

这不是项目问题，而是 Windows 自动下载 WSL 组件时网络被拦或下载失败。

最终 WSL 和 Ubuntu 安装成功后，Docker Desktop 才能正常使用 WSL 2 backend。

### 2. WSL 需要 Unix 用户

Ubuntu 第一次启动会要求创建默认 Unix 用户。

这是正常的。WSL 里的 Ubuntu 是一个 Linux 环境，需要自己的用户和密码。

这个密码主要用于 Linux 里的 `sudo`。

### 3. Wayland socket 挂载失败

第一次 Dev Container 启动失败，关键错误是：

```txt
stat /run/guest-services/distro-services/ubuntu.sock: no such file or directory
```

原因是 VS Code Dev Containers 尝试挂载 WSLg / Wayland GUI socket。

这个项目不需要 Linux GUI，所以关闭：

```json
"dev.containers.mountWaylandSocket": false
```

之后 Dev Container 可以正常进入。

这是 VS Code 用户设置，不是项目代码问题。

### 4. Windows 的 `node_modules` 不能直接给 Linux 容器用

进入 Dev Container 后，最开始出现：

```txt
Cannot find package
Cannot find module
Cannot find namespace React
```

原因是项目目录从 Windows 挂载进 Linux 容器，已有的 `node_modules` 可能来自 Windows 环境，不能直接信任。

解决方式是在容器里重新安装依赖：

```bash
rm -rf node_modules .next tsconfig.tsbuildinfo
pnpm install --frozen-lockfile
```

之后所有检查都通过。

## 以后日常怎么用

### 开发时

打开 Docker Desktop。

打开 VS Code，进入项目：

```txt
D:\blackwater\kita
```

执行：

```txt
Dev Containers: Reopen in Container
```

进入容器后：

```bash
pnpm dev
```

访问：

```txt
http://localhost:3000
```

### 提交前检查

写代码后建议运行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

这四个命令是当前项目的健康检查。

### 生产镜像验证

以后想测试 Dockerfile / Compose 时，可以在项目目录运行：

```bash
docker compose up --build
```

访问：

```txt
http://localhost:3000
```

停止：

```bash
Ctrl + C
```

后台运行时停止：

```bash
docker compose down
```

## 当前阶段的结论

现在 Docker / Dev Container 基座已经完成。

可以这样理解当前状态：

```txt
开发：
  VS Code
  Dev Container
  pnpm dev
  hot reload

构建验证：
  pnpm format:check
  pnpm lint
  pnpm typecheck
  pnpm build

生产打包：
  Dockerfile
  next standalone
  docker compose

未来部署：
  GitHub
  Coolify
  VPS
```

这一步的意义是：以后写业务代码时，不再只依赖本机杂乱环境，而是有一个可复制、可重建、接近部署环境的开发基础。

下一阶段就可以开始真正写项目代码了。
