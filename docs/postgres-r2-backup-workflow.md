# Kita PostgreSQL 到 Cloudflare R2 的备份工作流

> 状态：仓库实现和本地隔离验证已完成；尚未在 Coolify 填写生产 R2 变量，尚未完成真实 R2 上传与恢复演练。
>
> 目标：在不拆分现有 Compose、不开放 PostgreSQL 端口、不污染开发电脑和 VPS 宿主环境的前提下，把生产 PostgreSQL 定期导出到私有 Cloudflare R2 Bucket。

## 1. 当前情况

Kita 生产环境不是“Coolify Application + 独立 Coolify Database Resource”，而是由仓库中的 `compose.yaml` 一次部署两个服务：

```text
Coolify Compose Application
├─ web
└─ postgres
   └─ postgres-data named volume
```

这套结构有几个已经确认的特点：

- `web` 通过 Compose 内部主机名 `postgres:5432` 连接数据库。
- PostgreSQL 16 的数据保存在 Docker named volume `postgres-data`。
- 生产 PostgreSQL 没有发布宿主机 `5432`，公网无法直接连接。
- Coolify 把整个仓库视为一个 Docker Compose Application。
- Compose 内的 `postgres` 不是 Coolify 单独创建的 Database Resource。

最后一点决定了：Coolify 的原生 `Backups / Scheduled Backups` 页面不会出现在当前资源中。该功能主要面向 Coolify 单独管理的数据库资源，不能直接为 Compose 内的 `postgres` 自动建立任务。

目前 Cloudflare 和 Coolify 已完成：

- 私有 R2 Bucket：`kita-postgres-backups`。
- 仅限该 Bucket 的 `Object Read & Write` Token。
- Coolify S3 Storage：`cloudflare-r2-kita-backups`。
- Coolify 已将该 Storage 验证为 `Usable`。

这说明 R2、Endpoint、Bucket 和密钥都可用，但还缺少执行 `pg_dump` 并上传文件的生产者。

## 2. R2 在这里扮演什么角色

R2 是被动对象存储，不会主动连接 VPS，也不会主动读取 PostgreSQL：

```text
错误理解：R2 -> 主动抓取 PostgreSQL

实际过程：PostgreSQL -> pg_dump -> 备份文件 -> S3 API -> R2
```

因此完整备份链必须包含三个职责：

1. PostgreSQL 提供一致的数据导出。
2. 备份执行器调用 `pg_dump`、检查结果并上传。
3. R2 在 VPS 之外保存备份对象。

现在第 1、3 项已经存在，缺少第 2 项。

## 3. 推荐结构

实现采用仓库根目录 `docker` 分类，并在 Compose 中增加一个 `backup` service：

```text
D:\lipan\Kita
├─ src                         Next.js / Payload 业务代码
├─ public                      网站静态资源
├─ docs                        项目文档
├─ docker                      项目自己的容器辅助构建代码
│  └─ postgres-backup          PostgreSQL 备份容器
│     ├─ Dockerfile            构建备份容器
│     ├─ backup.sh             导出、验证、上传及清理流程
│     └─ README.md             配置、运行和恢复说明
├─ Dockerfile                  现有 Web 容器
├─ compose.yaml                生产基础编排
└─ compose.dev.yaml            本地开发覆盖配置
```

生产运行结构将变为：

```text
Kita Compose network
├─ web
│  └─ 连接 postgres:5432
├─ postgres
│  └─ 写入 postgres-data
└─ backup
   ├─ 只通过内部网络连接 postgres:5432
   ├─ 用 pg_dump 生成临时 dump
   ├─ 用 pg_restore --list 验证 dump 可读取
   ├─ 通过 S3 API 上传到 R2
   └─ 上传成功或失败后清理临时文件

Cloudflare R2
└─ kita-postgres-backups
   └─ 保存带时间戳的 dump
```

## 4. 为什么根目录使用 `docker/`

### 4.1 它表达的是“容器构建代码”

`docker/` 只存放项目专用的容器构建和运行脚本，不存放数据库数据，也不是 Windows 或 VPS 的 Docker 安装目录。

根目录现有 `Dockerfile` 负责构建 Web 应用；以后看到：

```text
Dockerfile
docker/postgres-backup/Dockerfile
```

可以直接理解为：

- 第一个构建网站容器。
- 第二个构建备份容器。

### 4.2 它不会混入业务代码

备份逻辑不属于页面、Payload collection 或 React component，因此不应放进：

- `src/`
- `public/`
- `payload.config.ts`
- Next.js API route

否则基础设施职责会和业务职责混在一起。

### 4.3 它比 `ops/` 更直观

`ops`、`infra` 都是常见名称，但对不熟悉运维术语的人不够直观。当前新增内容全部与 Docker 容器有关，因此 `docker/postgres-backup` 的含义更具体。

### 4.4 它避免根目录继续堆文件

如果直接在根目录添加：

```text
Dockerfile.backup
backup.sh
restore.sh
```

以后很难快速判断哪个文件属于 Web、数据库还是部署辅助。使用一个明确的分类目录可以保持根目录稳定。

### 4.5 它是当前规模下的合理实现，但不是强制标准

根目录 `docker/` 是常见且容易迁移的组织方式，但不是 Docker 或 Coolify 的硬性要求。它是否合理取决于边界是否保持清楚：

- 目录里只放容器相关源文件。
- 不把真实备份写入 Git 仓库。
- 不把生产密钥写进 Dockerfile、脚本或 README。
- Compose 明确引用该目录作为 `backup` 的 build context。

满足这些条件时，这个目录不会改变 Next.js/Payload 的代码结构，也不会增加业务代码的理解负担。

## 5. `docker/postgres-backup` 不是什么

这个目录不是：

- R2 Bucket 的本地副本。
- PostgreSQL 数据目录。
- 生产 dump 的长期保存位置。
- 新的管理后台。
- 需要手动进入维护的服务器目录。
- Windows 宿主机安装的软件。

真正的生产数据仍然只在：

```text
在线数据：postgres-data Docker volume
异地备份：Cloudflare R2 / kita-postgres-backups
```

备份容器只在自身临时目录保存正在处理的单个 dump；上传结束后立即删除。

## 6. 备份容器的最小职责

`backup.sh` 只负责一条容易审计的流水线：

```text
检查必要变量
  -> 等待 PostgreSQL ready
  -> 创建带 UTC 时间戳的临时文件
  -> pg_dump --format=custom
  -> pg_restore --list 验证结构
  -> 上传到 R2
  -> 确认上传命令成功
  -> 删除临时文件
  -> 记录成功或失败日志
```

推荐文件名示例：

```text
kita/2026/07/kita-20260708T030000Z.dump
```

使用 UTC 可以避免 VPS、Coolify、浏览器和东京本地时间之间产生歧义。

### 为什么使用 `pg_dump`，不直接复制 volume

PostgreSQL 运行时会持续写入数据文件。直接压缩正在使用的 volume 可能得到内部状态不一致的文件。

`pg_dump` 通过 PostgreSQL 自己的接口生成逻辑备份，适合当前个人项目，也能在数据库继续运行时创建一致快照。

### 为什么使用 custom format

计划使用：

```text
pg_dump --format=custom --no-owner --no-acl
```

custom format 支持 `pg_restore`、对象列表检查和更可控的恢复流程，也与 Coolify 官方 PostgreSQL 备份采用的方向一致。

## 7. 安全边界

备份 service 应保持以下限制：

- 不声明 `ports`，公网无法访问它。
- 不挂载 `/var/run/docker.sock`。
- 不挂载 PostgreSQL 的 `postgres-data` volume。
- 只通过 Compose 私有网络访问 `postgres:5432`。
- 临时 dump 只写入容器临时目录。
- 尽可能使用只读根文件系统和 `/tmp` 临时文件系统。
- 不以备份逻辑修改数据库。
- 不在日志打印数据库密码、Access Key 或 Secret Key。
- R2 Token 只允许访问 `kita-postgres-backups`。
- R2 Bucket 保持私有，不开启 `r2.dev` 或公开域名。

即使 R2 Token 泄露，权限范围也被限制在单个备份 Bucket；它不能修改 DNS、网站配置或其他 R2 Bucket。

但“私有 Bucket”不等于“不可删除备份”。`Object Read & Write` Token 为了让上传工具正常工作，也具有对象读写能力；拿到该 Token 的人仍可能删除这个 Bucket 中的对象。当前通过单 Bucket 权限把风险限制在可接受范围，后续只有在数据价值明显提高后，才需要评估 Bucket Lock、独立只写流程或更严格的不可变备份方案。

## 8. 环境变量边界

仓库只保存变量名称和非秘密默认值。计划使用的生产变量类似：

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

数据库名、用户和密码应复用当前 Compose 的生产配置，避免维护第二套不一致的数据库凭据。

以下内容不得进入 Git：

- 生产 PostgreSQL 密码。
- R2 Access Key ID。
- R2 Secret Access Key。
- 实际 dump 文件。

真实值只保存在 Coolify Production Environment Variables 中。

Compose 中的 R2 变量不应写成 `${POSTGRES_BACKUP_R2_SECRET_ACCESS_KEY:?}` 这种“配置解析阶段强制存在”的形式。否则新电脑即使只想启动本地 `postgres`，Compose 也可能在读取整个文件时因为缺少生产密钥而失败。

推荐边界是：

- Compose 允许备份变量为空。
- `POSTGRES_BACKUP_ENABLED` 默认是 `false`。
- `backup.sh` 只在 `POSTGRES_BACKUP_ENABLED=true` 时校验 R2 和数据库备份变量。
- 生产缺少任何必要变量时，备份任务必须明确失败，不能假装成功。

### 为什么 Coolify S3 Storage 中已经有密钥，Compose 仍需要变量

Coolify 会加密保存 S3 Storage 凭据，但不会自动把平台内部保存的密钥注入任意 Compose service。这样可以避免一个应用默认读取整个平台的存储秘密。

因此 `backup` service 需要自己的环境变量引用。可以继续使用同一组受限 R2 Token，但真实值仍由 Coolify Secret UI 保存，不写进仓库。

现有 `cloudflare-r2-kita-backups` Storage 可以保留：

- 它已经证明 R2 Endpoint、Bucket 和 Token 可用。
- 未来可用于 Coolify 自身配置备份。
- 如果将来数据库改为独立 Coolify Database Resource，也可以直接使用。

## 9. 本地开发不会执行生产备份

当前本地标准命令是：

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres
```

它明确只启动 `postgres`，不会启动 `web` 或未来的 `backup`。

为了防止有人误执行完整的 `docker compose up`，备份脚本还应采用安全默认值：

```text
POSTGRES_BACKUP_ENABLED=false
```

只有 Coolify Production 显式设置为 `true` 时，调度循环才运行。开发电脑不需要持有任何生产 R2 密钥。

所有备份依赖都封装在 backup 镜像内，不会在 Windows 安装：

- PostgreSQL client。
- S3/R2 上传客户端。
- cron 或其他调度工具。

如果本地误执行完整的 `docker compose up`，disabled 状态的 backup 容器也不得进入不断退出、不断重启的循环。具体实现需要选择安静等待或不启用重启策略，并在本地验证容器行为。

## 10. 调度与保留策略

当前数据量小，推荐先采用简单策略：

```text
频率：每天一次
启动：生产 backup 容器启动后先执行一次
间隔：24 小时
R2 保留：最初 30 天
```

第一版不需要引入复杂的 WAL 归档、增量备份或时间点恢复。对于当前个人内容站，日级 `pg_dump` 的恢复粒度足够。

第一版如果采用“执行后休眠 86400 秒”的最小循环，它表示大约每 24 小时一次，并不保证每天固定在 UTC 03:00：容器重启或 Coolify Redeploy 会立即增加一次备份，之后的执行时刻也会随重启移动。这是用极小实现换取简单性的明确取舍。

如果未来要求严格固定时刻，再改用容器内 cron 或专用调度器；当前没有必要先增加这层复杂度。

保留策略优先由 R2 Lifecycle Rule 管理，而不是让备份脚本自行大量删除对象。这样职责更清楚：

```text
backup 容器：生成和上传
R2：保存和过期清理
```

正式配置 Lifecycle Rule 前，应先完成一次成功备份和恢复验证，避免配置错误导致刚上传的对象被提前删除。

## 11. 首次实施顺序

### 阶段 A：只修改和检查仓库（已完成）

1. 创建 `docker/postgres-backup/`。
2. 编写最小 Dockerfile、`backup.sh` 和 README。
3. 在 `compose.yaml` 增加 `backup` service。
4. 在 `.env.example` 只增加变量说明，不写真实值。
5. 运行 Compose 配置解析检查。
6. 构建 backup 镜像。
7. 检查未意外启动本地生产备份。
8. 给可能的本地临时 dump 增加防御性 Git ignore 规则。
9. 检查 Git diff，确认没有 secret 或 dump 文件。

### 阶段 B：提交前由项目所有者确认（进行中）

重点确认：

- 新目录名称是否容易理解。
- `compose.yaml` 是否仍然以 `web + postgres` 为核心。
- backup 是否没有端口和数据库 volume。
- 默认是否关闭生产备份。
- 文档是否能说明恢复方式。

### 阶段 C：Push 和 Coolify 配置

1. Commit 并 push 到 GitHub。
2. 在 Coolify Production 增加备份环境变量。
3. 不把真实值发送到聊天或截图。
4. 重新部署 Compose Application。
5. 确认 `web`、`postgres`、`backup` 三个容器状态。

### 阶段 D：首次生产验证

1. 查看 backup 容器日志。
2. 确认 `pg_dump` 返回成功。
3. 确认 `pg_restore --list` 检查通过。
4. 打开 R2 Bucket，确认出现新的 `.dump` 对象。
5. 检查对象大小大于 0。
6. 再次验证 Kita 网站、Payload Admin 和 PostgreSQL healthcheck。

备份日志至少应包含：

- UTC 开始和结束时间。
- 数据库名。
- R2 对象键。
- dump 文件大小。
- 成功或失败状态。

日志绝不能包含数据库密码、Access Key 或 Secret Key。脚本必须使用 `trap` 清理临时文件；`pg_dump`、archive 检查或上传任一步失败，当前轮次都会返回失败、输出 `ERROR`，然后在 3600 秒后受控重试，不能继续输出“成功”。

因为进程会保留并负责重试，Coolify 显示容器 `Running` 不能证明最近一次备份成功。第一阶段必须同时检查 backup 日志和 R2 对象；后续再按实际需要接入 Coolify 失败通知或健康检查，不先搭建额外监控系统。

## 12. 恢复验证

“R2 中存在文件”不等于“数据库一定可以恢复”。至少要进行两层验证。

### 第一层：轻量检查

下载一个 dump，在具有匹配 PostgreSQL client 的隔离环境中运行：

```bash
pg_restore --list <backup-file>
```

这能检查 custom-format archive 是否可解析，但不能证明所有数据都能完整写入数据库。

### 第二层：临时数据库恢复演练

1. 创建临时 PostgreSQL 16 容器和临时 volume。
2. 将 dump 恢复到临时数据库。
3. 检查 Payload 关键表和少量内容记录。
4. 销毁临时容器和临时 volume。

禁止第一次恢复演练直接覆盖生产 `kita` 数据库。

## 13. 故障和回滚

backup service 与 PostgreSQL 数据 volume 解耦，因此回滚边界很小。

### 暂停备份

在 Coolify 设置：

```text
POSTGRES_BACKUP_ENABLED=false
```

然后重新部署 backup 配置。网站和 PostgreSQL 不需要因此停机。

### 移除备份组件

从 `compose.yaml` 删除 `backup` service，并删除 `docker/postgres-backup/` 后重新部署。该操作不会删除：

- `postgres-data`。
- R2 中已经存在的备份。
- 网站代码和 Payload 数据。

### R2 凭据疑似泄露

1. 在 Cloudflare 撤销旧 Token。
2. 创建新的单 Bucket `Object Read & Write` Token。
3. 更新 Coolify Environment Variables。
4. 重新部署 backup service。

## 14. 为什么暂不选择其他方案

### 14.1 暂不迁移成独立 Coolify Database Resource

优点是可以直接使用 Coolify 原生 Backups UI；缺点是需要迁移现有数据库、修改生产连接串和 Compose，并改变当前已经确认的开发/生产结构。

数据量虽然很小，但为了增加备份而先制造一次数据库迁移，收益不成比例。

### 14.2 暂不在 VPS 宿主机安装 cron、rclone 或 AWS CLI

宿主机脚本可以工作，但会形成 Git 仓库之外的隐藏配置：

- 换 VPS 时容易遗漏。
- Coolify 重新部署不会管理它。
- 新维护者不能只看仓库理解完整架构。
- 容器名称变化可能使脚本失效。

将备份执行器放进 Compose 更符合当前“仓库 Compose 是生产单一事实来源”的原则。

### 14.3 暂不部署大型备份面板

当前只有一个小型 PostgreSQL 数据库，不需要新的 Web 管理面板、用户系统、数据库和反向代理入口。一个只执行 `pg_dump -> validate -> upload` 的容器更容易审计和回滚。

### 14.4 不直接备份正在运行的 PostgreSQL volume

直接复制数据目录可能得到不一致快照，也与 PostgreSQL 主版本和内部存储格式强绑定。当前首选逻辑 dump。

## 15. 第一版的权限取舍

为了不立刻增加 PostgreSQL 角色管理复杂度，第一版计划复用当前生产 PostgreSQL 用户执行 `pg_dump`。这意味着 backup 容器持有较高数据库权限，因此必须同时满足：

- 没有公网端口。
- 没有 Web UI。
- 没有 Docker socket。
- 没有数据库 volume 挂载。
- 密钥只通过 Coolify runtime environment 注入。

以后如果数据库出现更多业务角色、敏感数据或多人管理，再创建专用备份角色。当前单用户个人项目可以先接受这一取舍，但文档必须明确它不是权限最小化的终点。

## 16. 实现时的容器细节检查

实施阶段还需要验证以下细节，而不是只让镜像“能够启动”：

- PostgreSQL client 主版本固定为 16，与当前数据库一致。
- 固定 Alpine 3.23 分支和 PostgreSQL client 主版本 16，不使用 `latest`；同一分支内的安全更新由重新构建镜像获取。
- build context 只使用 `docker/postgres-backup`。
- `depends_on` 等待 `postgres` healthcheck。
- 使用 `read_only` 根文件系统时，把 `/tmp` 和上传工具需要的 HOME/cache 放到临时文件系统。
- 使用 `init: true` 或等效的信号处理，确保 Redeploy 能正常终止等待循环。
- 上传失败时记录 `ERROR` 并在 `POSTGRES_BACKUP_RETRY_SECONDS` 后重试；`restart: unless-stopped` 只负责宿主机或容器生命周期恢复，不用于高频上传重试。
- `/tmp` 当前限制为 256 MiB；数据库增长后必须关注 dump 大小和 `No space left on device` 日志。

## 17. 结构结论

在当前 Kita 项目里增加根目录 `docker/postgres-backup` 是合理实现，原因不是“大家都这么命名”，而是它满足以下边界：

- 备份是生产 Compose 的一个明确 service。
- 容器构建代码与 `src` 业务代码分离。
- 配置跟随 Git，不成为 VPS 上的隐藏手工状态。
- secret 留在 Coolify，不进入 Git。
- 备份文件留在 R2，不进入项目目录。
- 本地开发默认不运行生产备份。
- 可以单独停用或删除，不影响 `web`、`postgres` 和 `postgres-data`。

它增加了一个必要的新职责，但没有改变现有网站和数据库的所有权关系。相较于迁移数据库或安装大型备份系统，这是当前复杂度最低、结构最清楚、最容易回滚的方案。

## 18. 当前验证记录

仓库实现完成后已在 Kita Dev Container 内执行：

- `sh -n docker/postgres-backup/backup.sh`：通过。
- `docker compose ... config --quiet`：通过。
- backup 镜像构建：通过。
- PostgreSQL client：16.14。
- rclone：1.72.1，能够识别环境变量定义的 `r2:` remote。
- 默认禁用测试：只输出 disabled 状态，不执行 dump 或上传。
- 本地 PostgreSQL 负向链路测试：成功生成并验证 60,367 字节 custom dump；使用故意无效的 R2 凭据时上传失败被明确记录，未误报成功，并进入受控重试。

负向测试没有使用真实 R2 secret，也没有向 Bucket 写入对象。仍待生产完成：

1. 在 Coolify 填写真实备份变量。
2. Redeploy 并确认初次真实上传。
3. 在 R2 检查对象路径和大小。
4. 下载一个 dump 并执行临时 PostgreSQL 16 恢复演练。
5. 成功恢复后为 Bucket 配置 30 天 Lifecycle Rule。
