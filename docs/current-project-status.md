# Kita 当前项目状态

> 最后核对：2026-08-12
>
> 本文是可变事实和待办的唯一来源。操作步骤见 [文档入口](./README.md) 中的专题文档。

## 代码与 Git

本轮文档整理基线：

```text
main: 400fe8e (PR #20 merge)
workspace: C:\dev\Kita
```

开始新任务时必须重新查询 Git；上述 SHA 是 2026-08-12 的基线证据，不代表永久 HEAD。

仓库当前包含：

- Next.js 16 App Router、React、TypeScript；
- Payload CMS Admin、REST/GraphQL route 和 Local API；
- PostgreSQL 16；
- Users、Media、Tools、Reviews、Games collections；
- server getter、mapper 和 feature DTO；
- 6 个 production migration；
- Dev Container + Docker-in-Docker；
- Docker multi-stage standalone Production image；
- repository Compose：web/postgres/backup；
- GitHub Actions required `quality`；
- 独立 OpenList Application 边界。

## 本地开发

正常目录为 `C:\dev\Kita`；D 盘旧工作区不再开发或提交。

已确认设计：

- Dev Container 使用 Node 22 和 `node` 用户；
- `node_modules` 与 `.next` 使用 targeted named volumes；
- 本地 PostgreSQL 运行在 Dev Container 的 Docker-in-Docker；
- `pnpm dev` 自动启动并等待 PostgreSQL healthy；
- 本地 Media 使用 `.payload-media`，不需要 R2 credentials。

2026-07-20 曾完成 C SSD 全新 clone 复建：Dev Container、全新本地 PostgreSQL、主要页面、36 Vitest、4 个 backup shell 场景、check 和 build 通过。此记录只证明当时的本地复建；当前代码验证结果应重新运行命令获得。

## 内容与 Payload

当前 Collections：Users、Media、Tools、Reviews、Games。

读取边界：

- Media/Tools 允许匿名读取；
- Reviews 匿名只读 `published`；
- Games 匿名只读 `published`；
- getter 使用 `overrideAccess: false`；
- Production 数据读取失败会抛错，不用静态 fallback 掩盖故障。

写权限边界：

- Media 显式要求登录才能 create/update/delete；
- Tools、Reviews、Games 当前只显式声明 read；Payload 默认行为不是项目级明确契约，因此显式写权限仍待完成。

Games Media-only 已完成：

- `cover` 是必填 Payload Media upload relationship；
- Production 图片在独立 Cloudflare R2 Media bucket；
- 公开 URL 使用 `media.kral-koharu.com` custom domain；
- 旧 `coverSrc`、`coverAlt`、`coverWidth`、`coverHeight` schema/列已删除；
- mapper 从 Media metadata 构造前端 cover DTO；
- 生产 6 条 Games 的 relationship、页面、Media URL 与 Redeploy 持久性曾于 2026-07-22 验证。

## Production 与数据库

Coolify 使用 repository `compose.yaml`。Production `web` 等待 PostgreSQL healthy，entrypoint 先执行 Payload migration，再启动 standalone server。

数据库事实边界：

- Production 数据库曾由项目所有者手动复建；
- 手动复建后 Admin、Tools、Reviews、Games 正常运行；
- PR #17 Media/relationship 和 PR #18 Media-only cleanup 增量 migration 成功；
- 上述事实不证明全部 6 个 migration 能从全新 PostgreSQL 自动建立当前 schema；
- 完整 fresh-database migration smoke 尚未进入 CI；
- PostgreSQL dump restore 尚未在隔离数据库演练。

不要在现有本地或 Production 数据库盲跑全部初始 migration，也不要为了测试删除 Volume。

## Backup 与恢复

已完成：

- PostgreSQL custom-format dump -> private R2 sidecar 已启用并有真实对象；
- backup shell 的 dump/校验/上传失败不会误报成功；
- 关键账户、配置键和 secret 位置已盘点到 Bitwarden；
- Coolify SSH keys/`authorized_keys` 的加密恢复归档曾完成 checksum 核对并上传 private R2；
- C SSD 本地工作区丢失复建已演练。

未完成或暂缓：

- 隔离 PostgreSQL 16 dump restore；
- private R2 SSH archive 再下载 round-trip；
- OpenList 最终 storage、data inventory 和 backup/restore；
- Coolify/VPS 端到端恢复；
- Production secret 轮换；
- backup last-success healthcheck/告警；
- Bitwarden 独立离线恢复副本确认。

不能把“有 R2 对象”“手动复建数据库”或“本地 clone 成功”写成完整灾难恢复闭环。

## OpenList

OpenList 以独立 Coolify Application 运行在 `https://archive.kral-koharu.com`。Kita 只在 Games links 中保存公开 URL；不共享数据库、Volume、secret、构建流程或登录。

最终 storage provider 尚未确定，当前测试挂载按可丢弃处理。OpenList data backup/restore 未闭环。

## 测试与 CI

GitHub Actions `quality` 运行 frozen install、format、lint、typecheck、tests 和 build；main ruleset 要求 PR 与 required check。

最近文档记录的代码基线包含 47 个 Vitest 与 4 个 backup shell 场景。本轮纯文档整理不会把旧测试数量当成新验证结果；提交前将重新运行适合本 PR 的格式、链接和差异检查。

测试缺口：

- 完整 PostgreSQL 16 migration smoke；
- 真实 Payload anonymous/published/authenticated write 集成测试；
- 首页、内容页和 Admin 的最小 Playwright smoke；
- Production health endpoint。

## 当前待办

### 下一项工程 PR

- [ ] Games/Reviews slug 增加小写 ASCII、数字、连字符验证；
- [ ] Tools URL 和 Games links 增加 `http/https` 绝对 URL 验证；
- [ ] Games、Reviews、Tools 显式声明 create/update/delete 为登录用户；
- [ ] 增加匿名/登录权限测试；
- [ ] 抽取 Games/Reviews 共用 Lexical 配置。

### 随后独立完成

- [ ] PostgreSQL 16 完整 migration smoke；
- [ ] 真实 published access 集成测试；
- [ ] About 替换 placeholder；
- [ ] Reviews/Games 录入真实内容并清理 placeholder；
- [ ] Tools 决定 CMS-only 还是保留 Development fallback；
- [ ] 统一 empty/error/not-found；
- [ ] 根 README 和准确作品集描述。

### 低优先级/条件触发

- [ ] 清理真实日期后再评估 `releaseDate` date migration；
- [ ] 出现误删痛点后再评估 Trash；
- [ ] 出现多人编辑后再评估角色和 drafts/versions；
- [ ] 数据价值提高后安排 restore/DR 演练和 last-success 监控；
- [ ] OpenList storage 定型后补 data backup。

## 当前不做

不因为“后端看起来简单”而引入 Redis、Prisma、微服务、Kubernetes、自建上传服务、大型监控平台、复杂角色系统或深度 OpenList API 集成。

## 下一步

文档整理合并后，优先执行一个小型后端质量 PR（validation + explicit write access + shared Lexical config），再单独做 PostgreSQL/权限集成 smoke。随后暂停工程底座扩张，回到真实内容和产品体验。
