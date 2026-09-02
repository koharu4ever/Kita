# Kita Codex 交接

> 最后核对：2026-09-02
>
> 正常项目根目录：`C:\dev\Kita`。D 盘旧工作区已经退役。

## 开始任何工作前

1. 完整阅读本文；
2. 遵守仓库根目录 `AGENTS.md` 的稳定安全规则；
3. 阅读 [当前项目状态](./current-project-status.md)；
4. 根据任务从 [文档入口](./README.md) 选择一份专题文档；
5. 只读检查 `git status --short --branch`、当前分支和最近提交；
6. 确认 Dev Container 绑定的是 `C:\dev\Kita`；
7. 不输出 secret、不删除 Volume、不修改 Production。

可直接复制给新 Codex：

```text
请先完整阅读 docs/CODEX_HANDOFF.md 和 docs/current-project-status.md，再从 docs/README.md 选择与任务相关的一份专题文档。先只读检查 Git、工作区和 Dev Container；不要读取或输出 secret，不要删除数据库/Volume，不要修改 Coolify、Cloudflare 或生产环境。确认状态后再提出或实施范围明确的修改。
```

## 项目是什么

Kita 是基于 Next.js 16、Payload CMS 和 PostgreSQL 16 的自托管游戏目录与评论发布平台，包含 Home、About、Tools、Reviews、Games 和 Payload Admin。

核心数据流：

```text
Route -> server getter -> Payload Local API -> PostgreSQL
                          -> mapper -> feature DTO -> UI

Games.cover -> Payload Media -> local storage (development)
                              -> Cloudflare R2 (production)
```

Production 通过 Coolify 使用仓库 `compose.yaml` 运行 `web`、`postgres` 和 `backup`。OpenList 是独立 Application，不属于 Kita `v1.0` 核心架构。

详细结构只维护在 [architecture.md](./architecture.md)。

## 如何确认当前状态

合并/部署基线、测试证据、生产数据库历史和未处理的评审边界统一读取 [current-project-status.md](./current-project-status.md)。不要从旧 PR 的“下一步”继续自动扩展功能，也不要把文档收尾理解为已修复其中全部问题。

Games/Media 的数据模型和内容维护步骤见 [Payload 内容与 Media](./payload-content-and-media.md)；恢复是否已经演练必须单独核对，不能由网站正常运行推断。

## 正常开发入口

所有项目命令在 Dev Container 内以 `node` 用户运行：

```bash
pnpm dev
```

Dev Container 同时提供 Codex CLI；其凭据与会话只保存在本机 named volume。安装、登录和权限边界见 [Codex CLI 工作流](./codex-cli.md)。

提交前停止 dev server，再按风险运行：

```bash
pnpm test
pnpm test:integration # migration、Payload access 或 CI 变更时
pnpm check
pnpm build
```

使用功能分支 -> commit -> push -> Pull Request -> required `quality` -> merge。具体流程与排障见 [development.md](./development.md)。

## 数据与 Production 安全边界

未经项目所有者明确授权，不得：

- 修改 Coolify、Cloudflare、DNS、R2 或 VPS；
- 读取、输出、复制或提交真实 secret；
- 删除、重建或清空 PostgreSQL/Media/OpenList Volume；
- 在 Production 首次尝试 restore 或破坏性 migration；
- 删除真实 Payload 内容或 R2 对象；
- 通过切旧镜像忽略数据库 schema 兼容性。

`.env` 永不提交。真实配置保存在 Coolify/Bitwarden。恢复边界见 [backup-and-recovery.md](./backup-and-recovery.md)。

## 如何选择后续工作

可变优先级只维护在 [current-project-status.md](./current-project-status.md)；[product-roadmap.md](./product-roadmap.md) 只描述稳定的维护原则。没有新的明确授权时，不自动实施修复、迁移、合并或部署。

不要优先引入 Redis、Prisma、微服务、Kubernetes、复杂角色系统、Payload drafts/versions 或大型监控平台。选择依据见 [product-roadmap.md](./product-roadmap.md)。

## 文档规则

`docs/README.md` 是唯一目录。当前工作树不保留历史计划或事故全文；需要追溯时查 Git 历史。发生冲突时以当前代码、Git 状态、`current-project-status.md` 和对应专题文档为准。

## 工作原则

```text
先读后改
先检查 Git 状态
保留用户已有修改
所有项目命令在 Dev Container 运行
只处理被授权的范围
不输出 secret
不提交 .env
不删除 Volume
不擅自操作 Production
修改后运行与风险相称的验证
事实只维护在一个位置
```
