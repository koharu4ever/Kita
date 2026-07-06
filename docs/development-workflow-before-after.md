# Kita 开发流程修复前后对比

> 对比日期：2026-07-06
>
> 对比范围：Dev Container、本地 PostgreSQL、Docker Compose、环境变量、代码检查、seed、fallback、生产构建与 Coolify 部署边界。
>
> 核心结论：这次没有重做 Kita 架构，而是在保留原有开发思路的前提下，把隐含规则变成明确、可验证、较难误操作的流程。

## 1. 一句话总结

原来的流程已经能运行，但很多事情依赖开发者记忆：

```text
记住怎样启动 PostgreSQL
记住本地和生产密码的关系
记住 build 前最好停掉 dev
记住 seed:games 会删数据
记住 PostgreSQL 启动后还要等它 ready
记住哪些 generated files 不应该阻塞格式检查
```

修复后的目标是：

```text
把这些规则写进配置、命令和文档
让错误更早暴露
让本地与生产结构一致
让本地与生产 secret 保持隔离
让危险操作变成安全操作
```

## 2. 总体对比

| 项目               | 修复前                            | 修复后                           | 为什么修改                                |
| ------------------ | --------------------------------- | -------------------------------- | ----------------------------------------- |
| 开发架构           | Dev Container + DinD + PostgreSQL | 保持不变                         | 原架构方向正确，不需要推倒重来            |
| 生产架构           | Coolify 读取 repository Compose   | 保持不变                         | 已经与实际部署匹配                        |
| PostgreSQL 端口    | `compose.yaml` 永久发布 5432      | 生产不发布；本地 override 才发布 | 避免生产数据库端口暴露                    |
| 本地服务启动       | 手写 Compose 命令                 | `pnpm dev:services`              | 降低记忆成本和输错参数概率                |
| 数据库 readiness   | 只有 `depends_on` 启动顺序        | healthcheck + `service_healthy`  | 避免 migration 抢在数据库 ready 前运行    |
| Dev Container 安装 | `pnpm install`                    | `pnpm install --frozen-lockfile` | 新电脑严格复现 lockfile                   |
| `.env.example`     | 只突出应用连接串                  | 同时列出 PostgreSQL service 参数 | 明确密码必须在同一环境内部匹配            |
| 本地/生产秘密      | 容易误以为必须相同                | 明确每套环境独立                 | 避免生产 secret 复制到开发机              |
| 格式检查           | generated files 导致失败          | generated files 被明确忽略       | 让 format gate 只检查应由开发者维护的文件 |
| Tools 空数据       | 生产可能显示本地 fallback         | 生产返回真实空状态               | 防止假数据掩盖生产数据库问题              |
| Games seed         | 删除已有 Games 后重建             | 按 slug upsert                   | 避免误删手工录入内容                      |
| 健康检查命令       | 分散执行                          | `pnpm check`                     | 建立统一提交前入口                        |
| dev 与 build       | 可能同时运行                      | 明确 build 前停止 dev            | 避免同时写入 `.next`                      |
| 文档               | 多篇历史文档互相矛盾              | 新增当前状态、对齐和对比文档     | 降低换电脑后的理解成本                    |

## 3. 没有改变的核心思路

这次保留了原项目最重要的设计。

### 3.1 仍然使用 Dev Container

```text
Windows 宿主机
  Docker Desktop
  VS Code
  Git

Dev Container
  Node
  pnpm
  Payload CLI
  Next.js
  Docker-in-Docker
```

没有要求在 Windows 全局安装 Node、pnpm、Payload 或 PostgreSQL。

### 3.2 仍然使用 Docker-in-Docker

本地 PostgreSQL 仍运行在 Dev Container 内部的 Docker daemon 中。

没有切换成：

- Windows PostgreSQL Service。
- Docker-outside-of-Docker。
- 新的远程开发数据库。
- Coolify 生产数据库作为本地开发库。

### 3.3 没有给依赖目录添加 named volume

没有为以下目录增加 Docker named volume：

```text
node_modules
.pnpm-store
.next
```

它们仍然是 bind-mounted 项目目录里的生成产物。这符合用户要求：按当前项目思路运行，不额外引入依赖 Volume 管理层。

### 3.4 仍然使用同一套应用代码

本地和生产继续共享：

```text
Next.js 代码
Payload collections
Payload generated types
migration files
Dockerfile
compose.yaml 的基础服务定义
```

差异只存在于环境专属配置和 secret。

## 4. Compose 使用方式的变化

## 4.1 修复前

原 `compose.yaml` 同时包含：

```yaml
web:
  ports:
    - "3000:3000"

postgres:
  ports:
    - "5432:5432"
```

本地开发时，这样很方便：Dev Container 里的 Next.js 可以通过 `localhost:5432` 访问内层 PostgreSQL。

但同一份 Compose 被 Coolify 用于生产部署。于是本地需求：

```text
需要把数据库映射到开发容器的 localhost
```

和生产需求：

```text
web 与 postgres 只需通过内部 Docker network 通信
数据库不应发布到 VPS 宿主机
```

混在了同一个文件里。

## 4.2 修复后

基础 `compose.yaml` 保留生产安全语义：

```text
web
postgres
postgres-data
内部 Docker network
不发布 PostgreSQL 5432
```

新增 `compose.dev.yaml`：

```yaml
services:
  postgres:
    ports:
      - "5432:5432"
```

本地组合使用：

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres
```

Coolify 生产仍只读取：

```text
compose.yaml
```

## 4.3 为什么这样做

它实现了两个目标：

```text
服务结构一致
  本地和生产都是 PostgreSQL 16、相同数据库名和相同应用代码

环境暴露不同
  只有本地需要 localhost:5432
  生产只需要 Docker 内部 postgres:5432
```

这比复制两份完全独立的 Compose 更不容易漂移，也比让生产继续发布数据库端口更安全。

## 5. 数据库启动顺序的变化

## 5.1 修复前

```yaml
depends_on:
  - postgres
```

这个配置只说明 Docker 先创建/启动 postgres container，再启动 web。

它不保证：

```text
PostgreSQL 完成初始化
PostgreSQL 已经监听 5432
目标数据库已经接受连接
```

而生产 `docker-entrypoint.sh` 会立即执行：

```bash
payload migrate
```

如果数据库还没 ready，migration 会失败，`set -eu` 会让 web 容器直接退出。

## 5.2 修复后

PostgreSQL 增加：

```text
pg_isready
5 秒检查间隔
5 秒超时
12 次重试
10 秒启动缓冲
```

web 改为等待：

```yaml
condition: service_healthy
```

## 5.3 为什么这样做

应用启动依赖的不是“数据库容器存在”，而是“数据库能够接受连接”。

修复后的顺序更接近真实依赖：

```text
postgres container start
  -> pg_isready healthy
  -> web start
  -> Payload migrate
  -> Next.js server
```

## 6. 新电脑依赖安装的变化

## 6.1 修复前

```json
"postCreateCommand": "sudo corepack enable && pnpm install"
```

它通常能工作，但 `pnpm install` 在某些情况下可以更新 lockfile 或接受依赖描述与 lockfile 的差异。

## 6.2 修复后

```json
"postCreateCommand": "sudo corepack enable && pnpm install --frozen-lockfile"
```

## 6.3 为什么这样做

换电脑的目标是复现，而不是重新解析一套依赖。

```text
package.json
  声明允许的依赖范围

pnpm-lock.yaml
  记录已经确认的精确依赖图

--frozen-lockfile
  要求安装结果服从 lockfile
```

如果两者不一致，初始化应明确失败，让开发者先处理仓库问题，而不是在新电脑上悄悄产生一个不同环境。

## 7. 环境变量表达的变化

## 7.1 修复前

`.env.example` 主要包含：

```env
NEXT_PUBLIC_SITE_URL
PAYLOAD_SECRET
ENABLE_DEV_SEED
DATABASE_URI
```

Compose 内部还有：

```text
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
```

这导致应用连接变量和数据库初始化变量分散在两个位置，不容易看出密码匹配关系。

## 7.2 修复后

`.env.example` 明确包含完整本地变量组：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYLOAD_SECRET=<本地开发密钥>
ENABLE_DEV_SEED=false
POSTGRES_DB=kita
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URI=postgres://postgres:postgres@localhost:5432/kita
```

当前新电脑的本地 `.env` 也已补齐 PostgreSQL 三项；该文件仍被 Git 忽略。

## 7.3 为什么这样做

为了把下面这个约束直接写出来：

```text
同一环境中：
DATABASE_URI 内的用户、密码、数据库
  必须匹配
POSTGRES_USER、POSTGRES_PASSWORD、POSTGRES_DB
```

但不同环境之间不要求相同：

```text
本地 PAYLOAD_SECRET ≠ 生产 PAYLOAD_SECRET
本地 POSTGRES_PASSWORD ≠ 生产 POSTGRES_PASSWORD
本地 DATABASE_URI host = localhost
生产 DATABASE_URI host = postgres
```

## 8. 开发服务命令的变化

## 8.1 修复前

开发者需要记住完整命令：

```bash
docker compose up -d postgres
```

分离 Compose 后，如果继续要求开发者每天手写两个 `-f` 参数，很容易漏掉开发 override。

## 8.2 修复后

`package.json` 新增：

```bash
pnpm dev:services
pnpm dev:services:stop
```

日常只需要：

```bash
pnpm dev:services
pnpm dev
```

## 8.3 为什么这样做

脚本不是为了隐藏 Docker，而是把项目约定固定下来。

```text
Docker 细节仍在 compose.yaml / compose.dev.yaml
开发者入口统一放在 package.json scripts
```

换电脑后不需要先读完所有 Compose 细节才能正确启动项目。

## 9. 代码健康检查的变化

## 9.1 修复前

提交前分别运行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

其中 `format:check` 会因为 Payload generated files 失败：

```text
src/payload/payload-types.ts
src/migrations/*.json
```

结果是健康检查长期处于“知道会失败但先忽略”的状态。

## 9.2 修复后

generated files 被加入 `.prettierignore`，同时新增：

```bash
pnpm check
```

它按顺序运行：

```text
format:check
lint
typecheck
```

## 9.3 为什么这样做

自动生成文件的格式来源是 Payload generator，不应由 Prettier gate 反复制造无语义 diff。

手写 migration TypeScript 没有被忽略，仍需要格式检查。

修复后，`pnpm check` 的失败才代表真实需要处理的问题，不再有“这个红灯是正常的”这种含糊状态。

## 10. Tools fallback 的变化

## 10.1 修复前

```text
Payload 查询成功，但 tools 表为空
  -> 返回静态 toolkitItems
```

这个行为在 development 和 production 中相同。

风险：生产数据库没有内容时，页面仍然显示看似正常的工具数据，可能掩盖：

- 生产内容未录入。
- 连接到了错误数据库。
- migration/部署流程没有完成。

## 10.2 修复后

```text
development + 空数据库
  -> 静态 fallback，方便 UI 开发

production + 空数据库
  -> 空列表，反映真实生产状态

production + 数据库错误
  -> 抛出错误，不伪装成功
```

## 10.3 为什么这样做

开发环境优先保证开发连续性；生产环境优先保证数据真实性。

生产页面显示假数据比显示空状态更危险，因为它会让部署错误长期不被发现。

## 11. Games seed 的变化

## 11.1 修复前

```text
查询最多 100 条 Games
逐条删除
创建 WHITE ALBUM2
```

即使有 `ENABLE_DEV_SEED` 保护，这个行为仍然有问题：

- 误操作会删除本地手工内容。
- 超过 100 条时只删除一部分。
- 命令名 `seed:games` 没有表达 reset 行为。
- 与 Tools seed 的 upsert 语义不一致。

## 11.2 修复后

```text
按 slug 查询 white-album-2
  -> 存在：update
  -> 不存在：create
```

其他 Games 不受影响。

## 11.3 为什么这样做

Seed 应该尽量满足：

```text
可重复执行
结果稳定
不破坏无关数据
```

需要清空数据时，应使用名字明确、带额外确认的 reset 命令，而不是把删除行为藏在普通 seed 中。

## 12. dev 与 build 流程的变化

## 12.1 修复前

文档列出了：

```bash
pnpm dev
pnpm build
```

但没有突出说明它们不能同时操作同一个工作区。

本次实际验证时，在 `next dev` 运行期间执行 `next build`，生产构建虽然成功，但旧开发进程失去响应。

原因：

```text
next dev
next build
```

都会使用 `.next`，但生成内容和生命周期不同。

## 12.2 修复后

明确流程：

```bash
pnpm check
# 在 dev 终端按 Ctrl+C
pnpm build
pnpm dev
```

## 12.3 为什么这样做

这不是代码架构错误，而是 Next.js 工作目录的操作规则。把它写进流程后，可以避免把开发进程失效误判成数据库、Dev Container 或 Coolify 故障。

## 13. 文档体系的变化

## 13.1 修复前

项目保留了大量学习笔记、路线图和阶段计划。它们有价值，但部分内容仍描述：

```text
Payload 尚未接入
Reviews/Games 仍是纯静态模板
Compose 只有 web
Coolify 尚未部署
旧电脑路径 D:\blackwater\kita
```

这些描述已经落后于当前代码。

## 13.2 修复后

新增三个当前入口：

```text
current-project-status.md
  当前功能、环境变量和部署状态

development-environment-architecture-review.md
  完整架构审计与风险分析

development-production-alignment.md
  修复后的标准开发、构建、部署和密钥轮换流程
```

本文负责解释前后变化：

```text
development-workflow-before-after.md
```

## 13.3 为什么这样做

历史文档不应该直接删除，因为它们记录了设计推导；但必须有一份明确的 current source of truth，否则换电脑后很容易执行过时步骤。

## 14. 修复前后的日常命令

### 修复前

```bash
docker compose up -d postgres
pnpm dev

pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

隐含问题：

- 不知道命令是在宿主机还是 Dev Container 执行。
- format 当前会失败。
- build 可能与 dev 同时运行。
- Compose 同时带着生产不需要的 PostgreSQL host port。

### 修复后

全部在 Dev Container 中执行。

开始开发：

```bash
pnpm dev:services
pnpm dev
```

日常检查：

```bash
pnpm check
```

生产构建检查：

```text
先在 dev 终端按 Ctrl+C
```

```bash
pnpm build
```

继续开发：

```bash
pnpm dev
```

结束开发数据库服务但保留数据：

```bash
pnpm dev:services:stop
```

## 15. 本次验证证明了什么

本次不是只修改配置，没有验证。

实际结果：

```text
Compose base + dev override     通过
PostgreSQL container recreate  通过，Volume 保留
PostgreSQL healthcheck          healthy
pg_isready                      accepting connections
pnpm format:check               通过
pnpm lint                       通过
pnpm typecheck                  通过
pnpm check                      通过
pnpm build                      通过
Next.js dev restart             通过
/                               200
/tools                          200
/games                          200
/admin                          200
```

Next.js 同时报告 Windows bind mount 文件系统较慢。首次编译 `/` 需要较长时间，但后续 `/games` 已降到毫秒级响应。

这说明：

```text
当前主要是 I/O 性能问题
不是依赖缺失
不是数据库未启动
不是 TypeScript 错误
不是生产构建失败
```

## 16. 这次刻意没有做什么

没有：

- 给依赖目录增加 named volume。
- 安装宿主机 Node、pnpm 或 PostgreSQL。
- 把生产 `.env` 复制到本地。
- 修改生产数据库数据。
- 自动替用户轮换线上密码。
- 删除任何 PostgreSQL Volume。
- 增加 Redis、Prisma、微服务或新框架。
- 删除旧学习文档。

原因是这些操作要么违背当前项目思路，要么会扩大修改范围，要么涉及不可逆的生产状态。

## 17. 当前仍需要项目所有者完成的生产操作

代码修复已经完成，但 Coolify 生产不会自动读取本地未提交变化。

仍需：

```text
1. 审查本次 Git diff。
2. commit。
3. push GitHub。
4. Coolify Redeploy。
5. 检查 postgres healthcheck 和 web migration log。
```

此前截图暴露的生产 secret 还需要在确认备份后轮换：

```text
PAYLOAD_SECRET
POSTGRES_PASSWORD
DATABASE_URI 中的数据库密码
```

数据库密码必须先在 PostgreSQL 内部真正修改，再同步 Coolify 环境变量，不能只改 `POSTGRES_PASSWORD` 后直接重启。

## 18. 最终评价

### 原流程的问题

不是“架构错误”，而是：

```text
同一个配置承担了本地和生产的不同暴露需求
若干安全规则只写在人的记忆里
健康检查没有形成统一成功标准
演示数据可能掩盖真实生产状态
seed 的破坏性与名字不匹配
历史文档和当前代码脱节
```

### 修复后的改进

```text
核心架构保持不变
本地/生产服务结构一致
端口和 secret 按环境隔离
数据库 readiness 可判断
新电脑依赖可复现
seed 可重复且不破坏无关数据
生产不再显示假 fallback
检查和构建有明确入口
文档有当前 source of truth
```

这次改进的本质是：

> 不增加无关技术，而是让现有技术之间的边界更明确，让正确操作更容易，让危险操作更难发生。
