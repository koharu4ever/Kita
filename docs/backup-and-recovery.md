# Kita 备份与恢复

> 最后核对：2026-08-12
>
> 本文只记录键名、资产类型和步骤，不记录真实 secret。生产数据库曾手动复建，这不等于 dump restore 或完整灾难恢复已经演练。

## 当前能力边界

| 能力                           | 状态         | 准确边界                                                              |
| ------------------------------ | ------------ | --------------------------------------------------------------------- |
| C 盘本地开发环境从 GitHub 复建 | 已验证       | Clone、`.env`、Dev Container、全新本地 PostgreSQL、页面和质量检查通过 |
| PostgreSQL custom dump 上传 R2 | 已运行       | 有真实对象；shell 失败路径有测试                                      |
| Payload Media 存储 R2          | 已验证       | Production 上传、公开 URL、Games relationship 和 Redeploy 持久性通过  |
| Coolify SSH key 恢复归档       | 已制作并上传 | 加密归档与本地 checksum 曾核对                                        |
| Production 增量 migration      | 已验证       | PR #17/#18 在手动复建后的生产库成功                                   |
| 全部 migration 从空库自动执行  | 未验证       | 需要隔离 PostgreSQL/CI smoke                                          |
| PostgreSQL dump restore        | 未演练       | R2 对象存在不等于可恢复                                               |
| OpenList data backup           | 未完成       | 最终 storage 尚未确定，当前测试挂载可丢弃                             |
| Coolify/VPS 端到端恢复         | 未演练       | 不能宣称完整 DR 闭环                                                  |
| 密码库独立离线副本             | 未确认完成   | Bitwarden 可用不等于 vault 有第二份恢复副本                           |

## 资产分层

| 位置       | 保存内容                                    | 不保存内容                      |
| ---------- | ------------------------------------------- | ------------------------------- |
| GitHub     | 代码、migration、`.env.example`、文档、键名 | secret、数据库内容、private key |
| Bitwarden  | 平台登录、API key、恢复码、环境变量真实值   | 大型 dump、公开文件             |
| Private R2 | PostgreSQL dump、加密恢复包、checksum       | 明文 `.env`、解密密码           |
| Media R2   | Payload 图片对象                            | PostgreSQL dump、secret         |
| 离线介质   | 加密密码库导出、关键恢复包和 checksum       | 唯一一份未加密 secret           |

备份材料必须独立于被恢复对象。解密密码不能和加密归档放在同一 bucket；Media、database backup 和 recovery archive 使用不同 bucket/token 边界。

## 必须盘点的外部资产

### 账户和身份

- GitHub、Cloudflare、VPS provider、Coolify、Bitwarden、邮箱和 Tailscale 登录；
- 2FA 方法与 recovery codes；
- 域名注册商和 DNS 管理权；
- SSH private/public key 的安全位置。

### Kita Production

- Coolify Project/Environment/Application 名称；
- repository、branch、domain 和 Compose 路径；
- [deployment.md](./deployment.md) 中所有环境变量键；
- PostgreSQL version、database/user、Volume 名和 backup object prefix；
- Media bucket、custom domain、endpoint 和 token scope；
- 最近一次成功部署、数据库 backup 和 Media upload smoke 的日期。

### OpenList

- 独立 Application、image tag、domain、port、UID/GID；
- Admin 凭据位置；
- data Volume、storage provider 和挂载；
- backup/restore 方法。最终 storage 未确定前，不伪造已完成 inventory。

## PostgreSQL backup

Backup sidecar：

- 等待 `postgres` healthy；
- 使用 `pg_dump --format=custom`；
- 使用 `pg_restore --list` 校验 archive；
- 通过 `rclone` 上传私有 R2；
- 失败后按 retry interval 重试；
- read-only root filesystem，临时 dump 写入 256 MiB tmpfs；
- 默认开发环境禁用。

对象结构：

```text
kita/postgres/YYYY/MM/<database>-YYYYMMDDTHHMMSSZ.dump
```

R2 成功对象只能证明导出/上传链路，不证明数据可恢复或应用可用。

## 隔离 restore 演练

第一次演练禁止操作 Production 数据库。

1. 选择一个已知时间的 R2 dump，记录对象 key、大小和时间。
2. 下载到临时工作目录并校验传输结果。
3. 启动全新的临时 PostgreSQL 16，使用不同 container/Volume/port。
4. 创建空目标数据库。
5. 使用 `pg_restore` 恢复 dump。
6. 检查表、migration 记录和关键 collection 行数。
7. 使用临时 `DATABASE_URI` 启动同版本应用，验证 Admin、Tools、Reviews、Games 和 Media metadata。
8. 记录 RTO、失败点、命令版本和验收结果。
9. 明确确认目标是临时环境后清理临时资源。

演练前后都不得输出真实 secret。若 restore 需要生产凭据，应由项目所有者在受控终端输入。

## 本地磁盘丢失恢复

已验证的最短路径：

1. 在 SSD clone GitHub `main` 到 `C:\dev\Kita`；
2. 从 `.env.example` 与 Bitwarden 的开发记录重建 `.env`；
3. Reopen in Container；
4. 确认 `node` 用户、Node 22、pnpm 和 Docker-in-Docker；
5. `pnpm dev` 启动全新本地 PostgreSQL；
6. 验证主要页面和 Admin；
7. 运行 test/check/build；
8. 确认 Git 工作树干净且与 `origin/main` 对齐。

该演练不恢复 Production 内容，也不证明 VPS/Coolify 可恢复。

## 完整灾难恢复顺序

```text
恢复账户/2FA/SSH
  -> 新建或恢复 VPS
  -> 恢复 Coolify 控制面和 managed server
  -> 恢复 DNS/TLS
  -> 部署 Kita 代码和环境变量
  -> 创建 PostgreSQL 并从已验证 dump restore
  -> 验证 migrations 与应用内容
  -> 配置 Media R2 并验证对象 URL
  -> 恢复 backup sidecar
  -> 独立恢复 OpenList 与 storage/data
  -> 完整 smoke、记录 RTO/RPO
```

不要先把域名切到未验证的新环境。不要通过删除旧 Volume 来“验证”恢复。

## 维护周期

- 每月确认最新 PostgreSQL backup 对象和错误日志；
- 数据价值提高后增加 last-success healthcheck/告警；
- 每季度核对 Bitwarden inventory、R2 token scope 和 SSH recovery package；
- 重大 schema/基础设施变化后更新本文；
- 至少完成一次隔离 PostgreSQL restore，再评估更完整的 Coolify/VPS 演练；
- OpenList storage 定型后立即补 data backup/restore。

## 恢复完成定义

只有在隔离或重建环境中实际恢复并验收以下内容，才能称对应范围“已恢复”：

- 账户和访问权；
- 代码与部署配置；
- PostgreSQL 内容；
- Payload Media 对象与 metadata；
- DNS/TLS；
- OpenList data/storage（如果纳入范围）；
- 页面、Admin、API、备份任务和后续 Redeploy。

“有备份”“能登录平台”“手动重建过数据库”都不等于完整恢复演练。
