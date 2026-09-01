# Kita 当前架构

> 最后核对：2026-09-01
>
> 本文只描述当前结构与长期边界；完成度和待办见 [current-project-status.md](./current-project-status.md)。

## 一句话定义

Kita 是一个使用 Next.js 16、Payload CMS 和 PostgreSQL 构建的自托管游戏目录与评论发布平台。Payload 提供 Admin、内容模型和 Local API；Next.js server 层读取并映射数据；feature 组件只消费稳定的页面 DTO；生产通过 Docker Compose 和 Coolify 运行。

## 运行拓扑

```text
Browser
  -> Next.js routes / React UI
       -> server getter
            -> Payload Local API (overrideAccess: false)
                 -> PostgreSQL 16
                 -> Media metadata / relationship
                      -> local .payload-media (development)
                      -> Cloudflare R2 (production)
```

生产 Compose 另外运行 PostgreSQL backup sidecar，将 custom-format dump 上传到独立私有 R2 bucket。Media bucket 与 database backup bucket 不共享用途或凭据。

## 目录职责

```text
src/app/          路由、layout、Payload Admin/API 接入和页面组合
src/features/     页面业务、稳定 DTO、mapper、组件与 feature 测试
src/server/       Payload client、server getter 和 seed 逻辑
src/payload/      Collections、access helpers 和 generated types
src/migrations/   可审查的生产 schema migration
src/config/       环境变量、站点 metadata 与 Media storage 配置
src/testing/      跨 feature 的测试 fixture
docker/           PostgreSQL backup sidecar
public/           仍由前端直接使用的版本化静态资源
```

放置新代码时按依赖方向判断：

```text
app -> server -> Payload/PostgreSQL
app -> features
server -> feature mapper / DTO
feature component -> feature DTO
```

页面组件不应直接查询 Payload，视觉组件不应知道数据库字段，collection 配置不应依赖前端组件。

## 内容数据流

Tools、Reviews 和 Games 使用同一种结构：

```text
Payload document
  -> src/server/<feature>/get-*.ts
  -> src/features/<feature>/utils/map-*.ts
  -> feature DTO
  -> route / page component
```

Getter 明确使用 `overrideAccess: false`。匿名访问只读取 published Reviews/Games；production 查询失败会抛错，不使用静态 fallback 掩盖故障。Development 可以使用 feature 内的静态 fixture，方便空数据库和 UI 开发。

Games getter 使用 `depth: 1` 解析必填的 `cover` Media relationship。Mapper 从 Media 的 display/original 元数据构造封面 DTO；Game 表不再保存重复的 cover URL、alt、width 或 height。

## Payload 当前边界

Collections：

- `users`：Payload auth collection；
- `media`：图片 upload collection；匿名可读；
- `tools`：公开读取；
- `reviews`：匿名只读 `published`，登录用户可在 Admin 查看全部；
- `games`：匿名只读 `published`，登录用户可在 Admin 查看全部，封面必须关联 Media。

Media、Tools、Reviews 和 Games 的 create/update/delete 均复用 authenticated access helper，写操作要求登录。常用 text/textarea 字段的非空白、slug 和绝对 URL 规则集中在 `src/payload/fields`，并先保留 Payload 原生 required/长度校验。

Reviews 与 Games 共用同一份 Lexical editor 配置，避免两个内容模型的编辑能力分别漂移。

## Development 与 Production 的隔离

本地开发：

- VS Code Dev Container 使用 Node 22 和 `node` 用户；
- `node_modules` 与 `.next` 使用 Dev Container targeted named volumes，避开 Windows bind mount 小文件性能瓶颈；
- Docker-in-Docker 运行本地 PostgreSQL；
- Media 默认写入 `.payload-media`；
- `pnpm dev` 自动启动并等待 PostgreSQL healthy。

生产：

- Coolify 使用仓库 `compose.yaml`；
- `web` 使用 standalone multi-stage image 和非 root 用户；
- entrypoint 先运行 Payload production migrations，再启动 `server.js`；
- PostgreSQL 使用 `postgres-data` named volume；
- Media 必须使用 R2，拒绝落入临时容器文件系统；
- backup sidecar 默认只在显式启用时上传数据库 dump。

Development 的 Docker daemon、PostgreSQL Volume 和 targeted volumes 与宿主 Docker/Coolify production 无关。不要把 Dev Container 的 named volumes 写成生产架构的一部分。

## 关键取舍

- 使用 Payload，而不是自行开发 CRUD Admin、upload API 和权限框架。
- 使用 server getter + mapper，隔离 CMS document 与 UI contract。
- Development 允许 fallback，Production fail closed。
- Development schema push 方便迭代；Production 只执行 migration。
- 使用一个 repository Compose 管理 web/postgres/backup；其他外部工具不进入 Kita 核心运行链路。
- Media/R2 使用 Payload storage adapter，不自建上传服务。
- 保持单体，不引入 Redis、Prisma、微服务、Kubernetes或大型监控平台，除非出现具体需求。

## 架构变更准入问题

引入新服务、依赖或数据层前必须回答：

1. 它解决了哪个已存在的问题？
2. 当前代码或 Payload 原生能力为什么不够？
3. 是否新增备份、恢复、secret、部署或监控责任？
4. 能否独立回滚？
5. 是否有与复杂度相称的测试？

无法明确回答时，不扩张技术栈。
