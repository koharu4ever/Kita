# PostgreSQL R2 备份容器

这个目录保存生产 Docker Compose 使用的轻量备份容器源文件。它属于基础设施代码，不是备份数据目录。

容器只执行以下步骤：

1. 等待 `postgres` service ready；
2. 创建 PostgreSQL custom-format dump；
3. 使用 `pg_restore` 检查 archive 是否可读取；
4. 使用 rclone 上传到私有 Cloudflare R2 Bucket；
5. 删除容器内的临时 dump。

它不开放端口、不挂载 PostgreSQL volume、不挂载 Docker socket，而且只有显式设置 `POSTGRES_BACKUP_ENABLED=true` 才会执行备份。

## 生产环境变量

以下变量由项目所有者填写到 Coolify Production Environment Variables。真实凭据不得提交到 Git。

```text
POSTGRES_BACKUP_ENABLED=true
POSTGRES_BACKUP_INTERVAL_SECONDS=86400
POSTGRES_BACKUP_RETRY_SECONDS=3600
POSTGRES_BACKUP_WAIT_SECONDS=120
POSTGRES_BACKUP_R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
POSTGRES_BACKUP_R2_BUCKET=kita-postgres-backups
POSTGRES_BACKUP_R2_ACCESS_KEY_ID=<secret>
POSTGRES_BACKUP_R2_SECRET_ACCESS_KEY=<secret>
```

这些变量只需要 Runtime 可用，不要勾选 Buildtime。Coolify 全局 S3 Storage 中保存的密钥不会自动注入 Compose，因此这里仍需由项目所有者填写同一组受限 Token。

这个 service 复用现有 Compose 的 `POSTGRES_DB`、`POSTGRES_USER` 和 `POSTGRES_PASSWORD`。启用后的容器启动时会立即备份一次；以后每次成功备份后约 24 小时再执行下一次。

R2 对象路径和时间戳统一使用 UTC：

```text
kita/postgres/YYYY/MM/<database>-YYYYMMDDTHHMMSSZ.dump
```

## 验证与恢复

R2 中出现对象、日志显示成功，只能证明导出和上传链路成功，不能替代恢复演练。正式依赖这套备份前，应下载一个 dump，并恢复到临时 PostgreSQL 16 数据库。

第一次恢复演练不得直接操作生产数据库。完整的部署、保留、恢复和回滚说明见 `docs/postgres-r2-backup-workflow.md`。

Compose 将 `/tmp` 限制为 256 MiB。当前数据库 dump 远小于该限制；如果未来日志出现 `No space left on device`，应先评估数据库体积，再调整 `compose.yaml` 的 backup tmpfs 大小。
