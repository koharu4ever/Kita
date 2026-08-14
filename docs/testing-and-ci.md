# Kita 测试与 CI

> 最后核对：2026-08-12

## 当前质量门禁

本地标准检查：

```bash
pnpm test
pnpm check
pnpm build
```

`pnpm test` 运行 Vitest 与 PostgreSQL backup shell 场景。`pnpm check` 运行 Prettier check、ESLint 和 TypeScript。Build 前停止 dev server。

GitHub Actions `quality` 在对 `main` 的 Pull Request 和 `main` push 上运行：

1. frozen-lockfile install；
2. format check；
3. lint；
4. typecheck；
5. tests；
6. production build。

Workflow 使用 Node 22、pnpm packageManager 版本和只读 contents permission，不读取 Production secret。Main ruleset 要求 PR 和 required `quality`。

## 测试分层

### Feature mapper

与 feature 放在一起，验证 Payload document 到稳定 DTO 的映射、nullable 字段和 Media 元数据。Mapper 测试不连接数据库。

### Server getter

使用 mocked Payload client 验证：

- collection、sort、where 和 `depth`；
- `overrideAccess: false`；
- published 过滤；
- Development fallback 与 Production fail-closed；
- slug 查询和缺失结果。

### 配置和权限

验证环境变量解析、Media local/R2 fail-fast、公开 URL 构造和 Media authenticated write access。

### Seed

验证 Games seed 的 upsert 行为与非破坏性边界。

### Backup shell

`docker/postgres-backup/tests/backup.test.sh` 直接执行真实 `backup.sh`，通过临时 `PATH` 注入 fake `pg_isready`、`pg_dump`、`pg_restore`、`rclone` 和 `sleep`，覆盖：

- dump 失败；
- archive 校验失败；
- 上传失败；
- 成功。

这些测试不连接 PostgreSQL/R2、不读取 Production secret、不修改 Coolify 或 Docker Volume。

## 新测试放在哪里

```text
src/features/<feature>/utils/__tests__/   mapper / pure rule
src/server/<feature>/__tests__/           getter / seed orchestration
src/config/__tests__/                     env / storage config
src/payload/access/__tests__/             access helper
docker/postgres-backup/tests/             shell workflow
src/testing/                              shared fixtures only
```

优先保护高价值规则，而不是追求覆盖率数字。测试名称应说明用户或系统行为。

## 当前缺口

按价值排序：

1. PostgreSQL 16 service 上执行完整 migration smoke；
2. 真实 Payload Local API 的匿名 published / 未登录写入 / 登录写入集成测试；
3. 首页、内容页和 Admin 的最小 Playwright smoke；
4. Production health endpoint 与 backup last-success 检查。

第一项不能使用当前手动复建的数据库作为证据；应创建隔离临时数据库，并保证不触碰现有 Volume。

## PR 验证策略

| 变更              | 最低验证                                                 |
| ----------------- | -------------------------------------------------------- |
| 纯 Markdown       | Prettier + link audit + `git diff --check`               |
| 纯 UI             | mapper/unit（如适用）+ check + build + 页面 smoke        |
| Collection/getter | targeted tests + full test/check/build + Admin/API smoke |
| Migration         | up/down 审查 + 隔离数据库验证 + backup 前置条件          |
| Docker/Compose    | config/build/startup smoke，不删除既有 Volume            |
| Backup            | shell tests + 非生产隔离验证                             |

测试通过只证明所覆盖的边界，不自动证明 Production、恢复能力或未覆盖的外部服务。
