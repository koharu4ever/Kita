# Kita Codex CLI 工作流

> 最后核对：2026-08-14

本文是 Codex CLI 在 Kita Dev Container 中的安装、登录、权限、持久化和清理说明。项目的一般开发命令仍以 [开发指南](./development.md) 为准；当前事实和待办仍只维护在 [当前项目状态](./current-project-status.md)。

## 设计目标

- Codex CLI 随 Dev Container 构建，不安装到 Windows，也不进入生产镜像；
- 登录凭据、个人配置和会话状态保存在本机 Docker named volume；
- clone 仓库的人只得到配置声明，不会得到现有登录凭据；
- 默认权限偏保守，Docker、数据库和生产环境操作继续受项目规则约束；
- CLI 版本显式固定，通过小型 PR 升级，不在每次 rebuild 时静默漂移。

## 文件与存储边界

| 位置                              | 内容                                             | 是否进入 Git     | 是否进入生产镜像 |
| --------------------------------- | ------------------------------------------------ | ---------------- | ---------------- |
| `.devcontainer/Dockerfile`        | 固定版本的 Codex CLI                             | 是               | 否               |
| `.devcontainer/codex-config.toml` | 无 secret 的初始权限模板                         | 是               | 否               |
| `AGENTS.md`                       | Kita 项目安全与工作规则                          | 是               | 否               |
| `/home/node/.codex`               | 登录、个人配置、历史和会话状态                   | 否，named volume | 否               |
| `kita-codex-home`                 | Docker Desktop 中承载 `CODEX_HOME` 的本机 volume | 否               | 否               |

`.dockerignore` 排除了 `.devcontainer`，Coolify 的根 `Dockerfile` 不会收到 Dev Container 文件。生产镜像继续只由根 `Dockerfile` 和 `compose.yaml` 构建。

named volume 只存在于创建它的 Docker engine。另一个人 clone 同一仓库时，会在自己的机器上得到一个新的空 volume，必须独立登录。volume 名相同不会跨电脑同步内容。

这个 volume 不是加密保险箱。同一台 Docker Desktop 上，任何被授予 Docker 控制权并明确挂载 `kita-codex-home` 的容器都可能读取其中内容；Windows 账户和 Docker Desktop 本身必须保持可信。不要在同一个 Docker engine 上让不可信仓库或不可信 clone 复用这个 volume。

## 第一次使用

合并本功能后，在 VS Code 执行 **Dev Containers: Rebuild Container**。Rebuild 完成后，在容器终端确认：

```bash
whoami
codex --version
echo "$CODEX_HOME"
```

预期用户是 `node`，当前固定版本是 `codex-cli 0.147.0`，`CODEX_HOME` 是 `/home/node/.codex`。

首次登录：

```bash
codex login
```

按浏览器流程使用自己的 ChatGPT 账户登录。不要把 `auth.json`、登录链接、一次性 code、token 或 API key 发到聊天、issue、PR 或文档中。OpenAI 官方说明 Codex CLI 支持浏览器登录，并会在本地保存登录状态；容器内没有可靠系统 keyring 时，本项目明确使用 volume 中的文件存储，因此整个 volume 都按 credential store 处理。

登录后从仓库根目录启动：

```bash
codex
```

先用 `/status` 和 `/permissions` 确认当前模型、工作目录、sandbox 与 approval。不要使用完全访问或绕过审批的模式作为日常默认值。

## 默认权限

首次创建 `kita-codex-home` 时，`post-create.sh` 会复制保守模板；如果 `config.toml` 已存在则不会覆盖个人设置。默认值是：

```toml
approval_policy = "untrusted"
sandbox_mode = "workspace-write"
cli_auth_credentials_store = "file"

[history]
persistence = "save-all"
max_bytes = 104857600

[sandbox_workspace_write]
network_access = false
```

`workspace-write` 允许修改当前工作区，默认不开放网络；`untrusted` 会让不在可信命令范围内的命令请求批准。它们是风险控制，不是对 Docker 和数据库语义的完整理解。根 `AGENTS.md` 还明确禁止删除 volume、清空数据库和擅自操作生产。

## Docker-in-Docker 与本地数据库

Kita 的 PostgreSQL 运行在 Dev Container 内部的 Docker-in-Docker daemon，和 Coolify/生产数据库无关。但 Codex CLI 与 Docker CLI 在同一个 Dev Container 中，获得批准的 Docker 命令仍可能影响本地 `postgres-data`。

日常建议：

1. 由开发者在一个终端运行 `pnpm dev`；
2. 在另一个终端运行 `codex`；
3. Codex 优先使用已经运行的服务，不主动管理 Docker 生命周期；
4. 涉及 migration、restore、seed 或数据库写入时，先确认目标是本地环境；
5. 需要破坏性实验时先导出本地备份，并在独立环境执行。

不要同时让 Codex Desktop 和 Codex CLI 修改同一个工作树。需要并行工作时使用不同 Git worktree 或先结束其中一个任务。

## Git 与 Pull Request

CLI 可以修改代码和运行本地检查，但不会因为安装完成就自动获得 GitHub 写权限。Git push/PR 仍取决于容器中的 Git credential 配置，并且只有用户明确要求时才能执行。

本项目没有因为 Codex CLI 而安装 GitHub CLI。是否使用 `gh` 是独立决定，不是 Codex CLI 的运行前提。

## 容量与维护

Codex CLI 程序安装在 Dev Container 镜像中，不在 `/home/node/.codex`。named volume 主要增长来源是会话和历史；模板把 `history.jsonl` 上限设为 100 MiB，但这不是整个目录的总容量上限。

偶尔检查：

```bash
du -sh /home/node/.codex
du -h --max-depth=2 /home/node/.codex | sort -h
```

不要用 `docker system prune` 清理。需要释放空间时，先确认具体子目录或执行下面的完整退出流程。

## 退出与彻底删除

如果只想取消登录：

```bash
codex logout
```

如果以后完全停用本工作流：

1. 在 Dev Container 内运行 `codex logout`；
2. 关闭 Kita Dev Container；
3. 在 Docker Desktop 的 **Volumes** 中确认目标名正是 `kita-codex-home`；
4. 只删除该 volume。

删除 `kita-codex-home` 会清除这个 Docker engine 上的 Codex 登录、个人配置和历史，不能恢复；不会删除项目、`node_modules`、`.next` 或 PostgreSQL volume。不要使用广泛的 volume prune 代替精确删除。

## 升级 Codex CLI

版本固定在 `.devcontainer/Dockerfile` 的 `CODEX_CLI_VERSION`。升级时：

1. 从官方来源确认新版本；
2. 修改一个版本号；
3. Rebuild Dev Container；
4. 运行 `codex --version`、`pnpm test`、`pnpm check` 和 `pnpm build`；
5. 通过独立 PR 合并。

不要改成无版本的 `latest`，也不要在 `postCreateCommand` 中每次联网重新安装。

## 官方参考

- [Codex CLI](https://learn.chatgpt.com/docs/codex/cli)
- [Authentication](https://learn.chatgpt.com/docs/auth)
- [Agent approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security)
- [Configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
- [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
