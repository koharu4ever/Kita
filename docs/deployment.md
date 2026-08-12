# Kita 部署指南

> 最后核对：2026-08-12
>
> Production 使用 Coolify 的 repository Docker Compose 部署。本文不包含真实 secret。

## Production 拓扑

```text
Coolify Compose Application
  ├─ web       Next.js standalone + Payload
  ├─ postgres  PostgreSQL 16 + postgres-data volume
  └─ backup    pg_dump/pg_restore/rclone sidecar

Independent Coolify Application
  └─ OpenList  archive.kral-koharu.com
```

`web` 等待 PostgreSQL healthy。`docker-entrypoint.sh` 先执行 Payload migrations，再运行 `node server.js`。Production image 使用 multi-stage build 和 UID 1001 的非 root 用户。

## 环境变量

真实值保存在 Coolify/Bitwarden；Git 只记录键和作用域。

### Kita 应用

| 变量                         | Build | Runtime | 说明                                    |
| ---------------------------- | ----- | ------- | --------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`       | 否    | 是      | 公开站点 URL；当前代码只校验 runtime 值 |
| `PAYLOAD_SECRET`             | 否    | 是      | 至少 32 字符，secret                    |
| `DATABASE_URI`               | 否    | 是      | 指向 Compose `postgres`，包含凭据       |
| `POSTGRES_DB`                | 否    | 是      | 数据库名                                |
| `POSTGRES_USER`              | 否    | 是      | 数据库用户                              |
| `POSTGRES_PASSWORD`          | 否    | 是      | secret；必须与 URI 一致                 |
| `ENABLE_DEV_SEED`            | 否    | 是      | Production 固定 `false`                 |
| `MEDIA_STORAGE_MODE`         | 是    | 是      | Production 固定 `r2`                    |
| `MEDIA_R2_PUBLIC_URL`        | 是    | 是      | HTTPS custom domain                     |
| `MEDIA_R2_BUCKET`            | 否    | 是      | Media 专用 bucket                       |
| `MEDIA_R2_ENDPOINT`          | 否    | 是      | R2 S3 endpoint                          |
| `MEDIA_R2_ACCESS_KEY_ID`     | 否    | 是      | bucket-scoped credential                |
| `MEDIA_R2_SECRET_ACCESS_KEY` | 否    | 是      | secret                                  |

Media 凭据不可作为 Build Variable。`MEDIA_R2_ENDPOINT` 是 S3 API endpoint，`MEDIA_R2_PUBLIC_URL` 是浏览器访问图片的 custom domain，不能互换。

### Database backup

| 变量                                   | Runtime 说明                |
| -------------------------------------- | --------------------------- |
| `POSTGRES_BACKUP_ENABLED`              | Production 显式启用         |
| `POSTGRES_BACKUP_INTERVAL_SECONDS`     | 备份周期                    |
| `POSTGRES_BACKUP_RETRY_SECONDS`        | 失败重试周期                |
| `POSTGRES_BACKUP_WAIT_SECONDS`         | 等待 PostgreSQL 时间        |
| `POSTGRES_BACKUP_R2_ENDPOINT`          | Backup bucket endpoint      |
| `POSTGRES_BACKUP_R2_BUCKET`            | Database backup 专用 bucket |
| `POSTGRES_BACKUP_R2_ACCESS_KEY_ID`     | bucket-scoped credential    |
| `POSTGRES_BACKUP_R2_SECRET_ACCESS_KEY` | secret                      |

Database backup bucket/token 与 Media bucket/token 必须分离。

## 标准发布流程

1. 本地分支完成 test/check/build 和必要 smoke。
2. Push 并创建 Pull Request。
3. Required `quality` 通过后合并 `main`。
4. Coolify 自动部署 `main`。
5. 观察 build、migration、startup 日志。
6. 验证公开站点、关键页面、Admin 和相关 API。
7. 对 Media 变更验证 `media` custom domain；对数据变更验证 Redeploy 后持久性。

不要为了普通发布手工清空 PostgreSQL 或重建 Volume。

## Migration 发布边界

- 破坏性 migration 合并前确认生产内容满足前置条件，并确认最近备份对象存在。
- Production 数据库曾由项目所有者手动复建；当前证据只证明复建后的运行和后续增量 migration，不证明 6 个 migration 能从全新数据库自动建立当前 schema。
- Development schema push 与 Production migration 记录不是同一事实源。
- 回滚旧镜像前确认旧代码需要的列和约束。不能只切镜像而忽略 schema。

PR #18 的 Media-only cleanup `down` 能从当前 Media metadata 重建旧 cover 字段，提供旧代码兼容数据，但不会恢复四个旧字段曾经的逐字历史值。精确恢复历史状态需要匹配时间点的 PostgreSQL dump。

## 发布 smoke

最低检查：

```text
/
/tools
/reviews
/games
/admin
```

涉及内容时再检查具体详情页、公开 API、Media URL、登录后的 Admin CRUD。不要在 smoke 中创建不可辨识的长期 placeholder；临时数据测试后由项目所有者确认是否删除。

## 回滚原则

1. 先判断是代码、配置、migration、数据还是外部服务问题。
2. 保留失败日志和当前版本信息。
3. 配置问题优先修正配置并 Redeploy。
4. 代码问题通过 revert PR 或已知正常 commit 回滚。
5. Schema 不兼容时先按对应 migration 的回滚说明处理数据库，再切旧镜像。
6. 需要恢复数据时使用隔离验证过的 dump，不直接在 Production 首次试验 restore。

任何数据库、Volume、secret、Cloudflare 或 Coolify 破坏性操作都需要明确授权和备份确认。
