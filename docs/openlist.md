# Kita 与 OpenList

> 最后核对：2026-09-01

## 当前决策

OpenList 是独立的 Coolify Application，不属于 Kita repository、Compose、Payload 或 PostgreSQL，也不属于 Kita `v1.0` 核心用户流程。Game 的通用 `links` 可以指向经确认可公开的外部资料，但不为商业游戏提供专用下载入口。

```text
Authorized external resource
  -> public HTTPS URL
       -> independent OpenList Application
            -> storage provider
```

两边不共享数据库、Volume、secret、容器网络、构建流程或登录状态。OpenList 故障不能阻止 Kita 的 Games/Reviews/Media 正常工作。

## 为什么保持独立

- OpenList 已自带 Web UI、API、Admin 和 storage drivers；
- Kita 不需要 fork OpenList 或重写文件列表前端；
- 可以独立部署、重启、回滚和备份；
- 文件服务不会扩大 Kita Production image 和 Payload 权限；
- 链接是最简单、可解释、可替换的边界。

放在同一个 Coolify Project 只是管理方便，不代表同一个 Application。

## 产品边界

Games 是视觉馆藏和资料入口，Reviews 是主观内容，OpenList 只可承载项目所有者有权公开分发的附属资源。Kita 不为商业游戏提供专用下载入口；公开内容必须有明确授权和语境，不要让 Kita 变成无说明下载站。

Game 仅在资源的授权和用途都清楚时复用现有 `links`：

```text
label: Authorized project files
href: https://<authorized-public-host>/<public-path>
```

Kita 不调用 OpenList API，不缓存目录，不保存 storage credential，也不根据 OpenList 可用性决定页面是否渲染。

## Production inventory

安全位置应记录：

- Application 名称和 Coolify Project/Environment；
- 固定 image tag；
- domain、port、UID/GID；
- Admin credential 的 Bitwarden 位置；
- data Volume 和 storage mount；
- storage provider、备份和 restore 方法。

不要在 Git 中保存 OpenList 密码、token 或 storage key。

## 当前未完成

- 最终 storage provider 尚未确定；
- 当前测试挂载按可丢弃处理；
- OpenList data Volume/storage 尚无已验证 backup/restore；
- 完整 Coolify/VPS 恢复演练未包含 OpenList 数据恢复。

Storage 定型后，先完成 inventory 和独立 backup/restore，再增加数据价值。不要在这之前把测试挂载写成正式持久化能力。

## 变更原则

- 修改外部资源 URL 不生成 Kita migration；它是普通 Game 内容更新。
- 不把 OpenList 加入 `compose.yaml`。
- 不为定制 UI 创建 fork，除非标准 UI 出现明确且持续的产品限制。
- 不复用 Kita PostgreSQL、Media R2 或 database backup token。
- OpenList 升级前记录当前 image tag、配置和回滚点。
