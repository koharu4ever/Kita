# Kita 测试与 CI

> 最后核对：2026-09-02

## 当前质量门禁

本地标准检查：

```bash
pnpm test
pnpm test:integration
pnpm check
pnpm build
```

`pnpm test` 运行快速 Vitest 与 PostgreSQL backup shell 场景。`pnpm test:integration` 启动一次性 PostgreSQL 16，验证 migration 和真实 Payload access。`pnpm check` 运行 Prettier check、ESLint 和 TypeScript。Build 前停止 dev server。

GitHub Actions `quality` 在对 `main` 的 Pull Request 和 `main` push 上运行：

1. frozen-lockfile install；
2. format check；
3. lint；
4. typecheck；
5. tests；
6. PostgreSQL/Payload integration smoke；
7. production build。

Workflow 使用 Node 22、pnpm packageManager 版本和只读 contents permission，不读取 Production secret。Main ruleset 要求 PR 和 required `quality`。

### 全新检出的 TypeScript 检查

`pnpm typecheck` 先运行 `next typegen`，再运行 `tsc --noEmit`，遵循 [Next.js 类型生成流程](https://nextjs.org/docs/app/api-reference/cli/next#next-typegen-options)。这会生成被 Git 忽略的 `next-env.d.ts` 和路由类型，同时加载 Next.js 的静态图片模块声明；不需要先启动开发服务器或完成一次 build。

不要提交自动生成的 `next-env.d.ts`，也不要用 `any` 声明掩盖图片导入错误。CI 必须在没有既存 `.next`、`next-env.d.ts` 或 TypeScript 增量缓存的全新检出上运行检查，否则本地生成文件可能掩盖准备步骤缺失。类型生成会读取 Next.js 配置：本地使用正常开发配置，CI 沿用 workflow 中的 `SKIP_ENV_VALIDATION=true`；此开关不用于 Production 运行时。

## 测试分层

### Feature mapper

与 feature 放在一起，验证 Payload document 到稳定 DTO 的映射、nullable 字段和 Media 元数据。Mapper 测试不连接数据库。

### Server getter

使用 mocked Payload client 验证：

- collection、sort、where 和 `depth`；
- `overrideAccess: false`；
- published 过滤；
- 空 Collection 返回空结果，查询故障继续抛给 error boundary；
- slug 查询和缺失结果。

### 配置和权限

验证环境变量解析、Media local/R2 fail-fast、公开 URL 构造和 Media authenticated write access。

### Backup shell

`docker/postgres-backup/tests/backup.test.sh` 直接执行真实 `backup.sh`，通过临时 `PATH` 注入 fake `pg_isready`、`pg_dump`、`pg_restore`、`rclone` 和 `sleep`，覆盖：

- dump 失败；
- archive 校验失败；
- 上传失败；
- 成功。

这些测试不连接 PostgreSQL/R2、不读取 Production secret、不修改 Coolify 或 Docker Volume。

### PostgreSQL 与 Payload integration smoke

`pnpm test:integration` 使用固定专用名称创建 `postgres:16` 临时容器：

- 数据目录是 `tmpfs`，不创建或挂载 named volume；
- 使用随机 localhost 端口，不连接现有 `kita-postgres-1`；
- 同名容器已存在时直接拒绝，不擅自删除；
- 结束时先核对 purpose label，再强制停止并移除这个精确命名的临时容器；
- 显式启用 `PAYLOAD_MIGRATING=true`，阻止测试初始化时的 development schema push。

Smoke 先执行全部注册 migration，再重复执行一次确认无待办，然后验证：

- `payload_migrations` 与当前注册列表一致；
- Users、Media、Tools、Reviews、Games 核心表存在；
- `games.cover_id` 为 `NOT NULL`，旧 4 个 cover 列不存在；
- `/api/health` 能通过 Payload 对临时 PostgreSQL 执行真实 readiness 查询；
- 匿名只能读取 published Review，登录用户可以读取 draft；
- 匿名 create/update/delete 返回 403，登录用户可以完成对应写入。

它不验证带 Production 数据升级、migration `down`、dump restore、R2 上传或所有 Collection 的完整 CRUD。不要把 fresh smoke 写成灾难恢复或 Production 验收。

## 新测试放在哪里

```text
src/features/<feature>/utils/__tests__/   mapper / pure rule
src/server/<feature>/__tests__/           getter query and failure behavior
src/config/__tests__/                     env / storage config
src/payload/access/__tests__/             access helper
docker/postgres-backup/tests/             shell workflow
tests/integration/                        real PostgreSQL / Payload smoke
src/testing/                              shared fixtures only
```

优先保护高价值规则，而不是追求覆盖率数字。测试名称应说明用户或系统行为。

## 当前缺口

按价值排序：

1. 首页、内容页和 Admin 的最小 Playwright smoke；
2. backup last-success 检查。

浏览器 smoke 不应连接 Production；health endpoint 只证明应用 readiness，不代替备份和恢复验证。

## PR 验证策略

| 变更              | 最低验证                                                    |
| ----------------- | ----------------------------------------------------------- |
| 纯 Markdown       | Prettier + link audit + `git diff --check`                  |
| 纯 UI             | mapper/unit（如适用）+ check + build + 页面 smoke           |
| Collection/getter | targeted + full test/check/build；access 变化加 integration |
| Migration         | up/down 审查 + `test:integration` + backup 前置条件         |
| Docker/Compose    | config/build/startup smoke，不删除既有 Volume               |
| Backup            | shell tests + 非生产隔离验证                                |

测试通过只证明所覆盖的边界，不自动证明 Production、恢复能力或未覆盖的外部服务。
