# Kita 项目代码审查与初版评估

> 审查日期：2026-07-09（America/Los_Angeles）
>
> 审查基线：`main` / `002c892 feat: add PostgreSQL R2 backup sidecar`
>
> 范围：Next.js/React、Payload CMS、PostgreSQL、migration、Dev Container、Docker/Coolify、R2 备份、测试与 CI。
>
> 边界：未读取或输出真实 secret，未修改生产环境，未删除 Volume，也未清理本地 `.next`。

## 0. 2026-07-10 状态更新

> 本节取代原报告中关于三个 P0 的旧结论；后续“本次实际验证”仍保留 2026-07-09 原始审查现场，便于追溯问题是如何发现的。

| P0                                | 当前状态                       | 关闭依据                                                                                                                          |
| --------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| P0-1 本地 `.next` 破坏质量门禁    | **已解决**                     | `.next` 由 `node` 重新生成；最终 `pnpm check`、`pnpm build` 均 exit 0；root 与 dev/build 并发守卫通过专项验证。                   |
| P0-2 生产 secret 与备份恢复未闭环 | **已关闭，剩余事项转后续增强** | 生产备份连续成功且 R2 存在对应对象；恢复演练和 secret 轮换未执行，由项目所有者明确接受为现阶段非阻断风险。                        |
| P0-3 migration 未从空库验证       | **已解决**                     | 项目所有者确认生产首次部署使用全新 PostgreSQL Volume，entrypoint 成功执行四个 migration，之后 Admin、Tools、Reviews、Games 正常。 |

因此，三个 P0 均已关闭。当前最高优先级转为 **P1-3：测试与 CI**。

本次状态更新只修改评估文档，没有连接生产数据库、修改 Coolify、输出 secret 或操作 Volume。P0-2 的关闭不代表恢复演练或 secret 轮换已经执行，而是“真实备份已验证，剩余风险已明确接受”。

## 1. 结论

Kita 作为初版是合格且有明显亮点的，整体约 **7/10**；只评价个人内容站初版的产品与架构完成度，可以给 **7.5/10**。

它不是“架构选错、需要推倒重写”的项目。主线设计清楚：Next.js App Router、Payload Local API、server getter、mapper、PostgreSQL 和 production migration 的职责基本分开，前台也已经形成自己的视觉性格。

2026-07-10 更新后，原报告的三个 P0 均已关闭：本地 build gate 已恢复并加入防复发守卫；生产 R2 备份已连续成功；完整 migration 链路已由首次生产空库部署验证。

当前短板主要集中在测试与 CI、备份最近成功时间监控，以及内容、性能、可访问性、错误/空状态和 SEO。恢复演练与 secret 轮换保留为后续安全增强，不再作为 P0 阻断。

一句话评价：**这是一个主架构可靠、三个 P0 已收口的合格初版；下一阶段应把人工验证固化为自动化测试和 CI。**

## 2. 评分

| 维度           | 评分 | 评价                                                                    |
| -------------- | ---: | ----------------------------------------------------------------------- |
| 架构选择       | 8/10 | Next.js + Payload + PostgreSQL 适合当前规模，没有无意义的中间层。       |
| 代码组织       | 8/10 | route、feature、server、collection、migration 分层合理。                |
| 功能完成度     | 7/10 | Home、About、Tools、Reviews、Games、Admin 和详情数据流已成形。          |
| 安全与配置     | 7/10 | 生产备份已运行；secret 轮换作为已接受的后续增强，环境校验细节仍需修复。 |
| 数据可靠性     | 8/10 | 生产空库 migration 与连续 R2 备份已有证据；恢复演练仍可作为后续增强。   |
| 测试与发布门禁 | 4/10 | 本地 build gate 已恢复并加守卫，但仍是 0 个测试、0 个 CI workflow。     |
| 前端体验与视觉 | 8/10 | 视觉鲜明，响应式基础不错；资源体积和可访问性仍需优化。                  |
| 可维护性       | 7/10 | 文档充分，但部分规则仍靠文档约束，文档也开始有漂移风险。                |

## 3. 本次实际验证

| 检查              | 结果       | 说明                                                                 |
| ----------------- | ---------- | -------------------------------------------------------------------- |
| Git 基线          | 通过       | 审查开始时 `main` 与 `origin/main` 对齐，工作树干净。                |
| Prettier          | 通过       | `pnpm format:check` 明确 exit 0。                                    |
| 定向 ESLint       | 通过       | `eslint src payload.config.ts next.config.ts` 明确 exit 0。          |
| 完整 `pnpm check` | 未取得结论 | 外层命令 124 秒超时；拆分后确认 format 和定向 lint 通过。            |
| TypeScript        | 当前失败   | 被忽略的 `.next/dev/types/validator.ts` 语法损坏，并非仓库源码报错。 |
| `pnpm build`      | 当前失败   | `node` 无法删除 root 拥有的 `.next/build/...js`，报 `EACCES`。       |
| `.next` 所有权    | 异常       | 发现 2,102 个非 `node` 用户拥有的 `.next` 条目。                     |
| Compose           | 通过       | base + dev override 的 `config --quiet` 通过。                       |
| 备份脚本语法      | 通过       | `sh -n docker/postgres-backup/backup.sh` 通过。                      |
| 测试 / CI         | 缺失       | 0 个 test/spec，0 个 `.github/workflows`。                           |
| 静态资源          | 偏重       | `public/` 约 9.2 MiB，其中 `cover.png` 约 4.1 MiB。                  |

当前 build/typecheck 的失败首先证明的是**本地生成物状态不健康**，不能直接推断业务源码无法构建；但在重新得到 exit 0 前，也不能把当前提交记作“构建已通过”。

## 4. 做得好的地方

### 4.1 主架构没有过度设计

项目没有额外引入 Express、Prisma、Redis 或独立 API 层。Payload 已承担 CMS、CRUD、认证、Local API 和 schema/migration 职责，符合当前规模。

```text
Payload Admin
  -> Collection
  -> PostgreSQL
  -> Payload Local API
  -> server getter
  -> mapper
  -> feature component
  -> App Router page
```

### 4.2 生产环境不再用 fallback 掩盖数据库问题

Tools、Reviews、Games 的 getter 明确区分 development 与 production。生产数据库为空时返回真实空结果，查询失败时抛错，不会用本地演示数据伪装成功。

### 4.3 Payload 公开读取边界基本正确

Reviews 和 Games 对匿名访问只返回 published 内容，登录用户才能读 draft；server getter 还显式使用 `overrideAccess: false`，slug 有数据库唯一约束。

### 4.4 migration 设计较谨慎

仓库有四个显式 migration。Games 图片字段迁移先添加 nullable 字段、回填、检查未知值，再改成 NOT NULL，down migration 的破坏性也没有被隐藏。

### 4.5 容器和 secret 边界意识较好

- Dev Container 固定 Node 22，并用 `pnpm install --frozen-lockfile`。
- PostgreSQL 16 有 healthcheck，web 等待 `service_healthy`。
- 生产基础 Compose 不发布 PostgreSQL 5432。
- `.env`、dump、依赖和构建产物都有忽略规则。
- runtime secret 不需要进入 Docker build 阶段，web runner 使用非 root 用户。

### 4.6 备份 sidecar 的方向合理

backup service 不挂载 Docker socket 或数据库 Volume，不开放端口，使用只读根文件系统、非 root、cap drop、no-new-privileges 和 tmpfs。脚本按 `pg_dump -> pg_restore --list -> R2 -> cleanup` 执行，失败后受控重试。

### 4.7 前端已有自己的性格

首页轮播、WebGL 雨滴、桌面能力判断、局部 reduced-motion、游戏图片墙和富文本详情页形成了明确视觉方向，组件规模总体也可控。

## 5. P0：最高优先级问题（均已关闭）

### P0-1：本地 `.next` 已破坏质量门禁 — 已解决

污染的 `.next` 已在核对路径和进程后安全清理，并由 `node` 重新生成。最终非 `node` 条目为 0，`pnpm check` 与 `pnpm build` 均为 exit 0。package scripts 和 `next.config.ts` 已加入 workspace root 防护，dev/build 并发守卫也完成专项验证。

正常开发入口现在默认安全；任意 root shell 仍可故意绕过仓库守卫，这是 Linux 权限模型的客观边界，不影响本项关闭。完整证据见 `docs/first-priority-next-build-gate-remediation-2026-07-10.md`。

### P0-2：生产 secret 与备份恢复未闭环 — 已关闭（部分事项转后续增强）

关闭依据：

- Coolify backup service 已启用并完成初始备份。
- 日志显示 2026-07-08、09、10 连续完成 dump、archive 校验和 R2 上传。
- 每次成功后明确记录 `Backup completed`，随后进入 86400 秒的下一次计划。
- R2 bucket 中存在与日志 object key、时间和大小相符的三个 `.dump` 对象。
- bucket public access 为 Disabled。

需要诚实保留的边界：临时数据库完整恢复演练和生产 secret 轮换尚未执行。项目所有者已明确决定现阶段不要求执行，并接受其作为后续安全增强。因此本项通过“真实备份已验证 + 剩余风险已接受”关闭，不能写成恢复演练或轮换已经完成。

### P0-3：完整 migration 链路尚未从空库验证 — 已解决

项目所有者确认首次生产部署满足：

```text
全新的 postgres-data
  → web 启动
  → docker-entrypoint.sh 执行 payload migrate
  → 四个 migration 成功
  → Next.js 启动
  → Admin、Tools、Reviews、Games 正常读写
```

生产库 `payload_migrations` 记录四个 migration，首次启动没有 `table already exists` 等冲突。首次生产部署本身就是比额外临时库更真实的空库验证，因此 P0-3 关闭，不需要为关闭该问题重复创建临时数据库。

未来在 CI 使用一次性 PostgreSQL 16 重跑 migration 仍有价值，但属于防回归测试，不再是生产链路未验证的 P0。

## 6. P1：重要代码与工程问题

### P1-1：`SKIP_ENV_VALIDATION=false` 仍会跳过校验

位置：`src/config/env.ts:26`

```ts
skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
```

非空字符串 `"false"` 也是 truthy。若平台显式配置 `SKIP_ENV_VALIDATION=false`，应用反而会跳过校验。`payload.config.ts` 已使用严格的 `=== "true"`，两处行为不一致。

建议改成：

```ts
skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
```

这是本次确认的真实逻辑错误。

### P1-2：生产 Compose 允许默认数据库凭据

位置：`compose.yaml:8`、`compose.yaml:23`

基础 Compose 允许 `DATABASE_URI` 和 `POSTGRES_PASSWORD` 回退到 `postgres/postgres`。这对本地方便，但 `compose.yaml` 同时是生产 source of truth；Coolify 漏配时应尽早失败，而不是带默认密码启动。

建议让生产基础 Compose 对 `DATABASE_URI`、`POSTGRES_PASSWORD` 使用 required 语义，或增加自动校验，证明生产部署没有使用模板默认值。

### P1-3：测试和 CI 完全缺失

当前 0 个 test/spec、0 个 GitHub Actions workflow。以下规则都只能人工验证：

- production 不使用 fallback；
- 匿名用户只能读取 published；
- Games seed 不删除其他记录；
- mapper 能处理 nullable tags/links；
- migration 与 collection 保持一致；
- backup 失败不会误报成功。

第一批只需增加高价值测试：三个 mapper；getter 的正常、空、异常和环境分支；seed upsert；少量页面 smoke test。CI 建议执行 install → format:check → lint → typecheck → test → build，不必追求覆盖率数字。具体方案见 `docs/testing-and-github-actions-guide-2026-07-10.md`。

### P1-4：备份容器 Running 不代表最近备份成功

`backup.sh` 会永久循环并在失败后重试，因此凭据失效、R2 故障或 tmpfs 空间不足时，容器仍可能显示 Running。当前没有 healthcheck、last-success 文件、指标或告警。

真实上传和恢复演练完成后，应至少记录最近成功时间，并让 healthcheck 或外部检查判断是否超过允许窗口。

当前 R2 Token 具备对象读写能力，dump 也没有应用层加密。对当前单人项目可作为已知取舍，但 Token 泄露意味着攻击者可能读取或删除备份；数据敏感度提高后应考虑对象锁、权限隔离或客户端加密。

### P1-5：首页资源和 GPU 生命周期偏重

`public/` 约 9.2 MiB，`cover.png` 单文件约 4.1 MiB。`SceneBackground` 同时创建所有 wallpaper 的 CSS background，浏览器很可能较早下载多张背景，也无法获得 `next/image` 的响应式优化。

`rain-renderer.ts:120-127` 创建四个 texture，但 `destroy()`（第 96 行）只删除 program 和 position buffer，没有保存并 `deleteTexture`。壁纸轮换和 resize 会重复重建场景，长时间停留首页可能积累 GPU 资源。

建议先压缩/转换 WebP 或 AVIF，只预载当前和下一张背景，并完整释放 WebGL texture。

### P1-6：CMS 字段缺少 slug、URL 和资源路径验证

Reviews/Games slug、Tools.url、Reviews.coverImage、Games.coverSrc、Games.links.href 主要是普通 text。管理员录入错误会造成坏路由、坏链接或 `next/image` 运行错误；`next.config.ts` 又没有远程图片白名单。

建议统一 slug 小写/连字符校验，明确 URL 和站内资源路径策略，并把 releaseDate、readingTime 等改成更适合校验和排序的类型。

### P1-7：错误、空状态和数据上限没有形成产品行为

getter 固定上限为 Tools 20、Reviews 20、Games 100，但没有分页或“查看更多”；超过后内容会静默消失。生产数据库为空时多个页面没有明确空状态，查询异常也没有站点级 `error.tsx`。

至少应补：空列表说明、统一 404/错误页、明确分页策略和结构化错误日志。

### P1-8：Lightbox 还不是完整的可访问 modal

已有 `role="dialog"`、`aria-modal`、Esc、方向键和 body scroll lock，但仍缺焦点进入、focus trap、关闭后恢复焦点和背景 inert。多个按钮使用 `focus:outline-none`，没有等价的 `focus-visible` 样式。

`GameSharedModal` 的 `loaded` state 换图时不会重置，`direction` prop 当前也没有使用。

### P1-9：reduced-motion 降级不完整

雨滴层会关闭，但 wallpaper 仍自动轮换和执行缩放动画，caret 仍持续闪烁。应在 reduced-motion 下同时停止 wallpaper breathing、自动轮换/长过渡和 caret blink。

### P1-10：页面仍暴露明显 placeholder

- `src/features/about/components/about-page.tsx:44` 直接告诉访客正文是 placeholder。
- `src/features/tools/components/tools-page.tsx:60` 显示 `STATIC FRONT-END DRAFT`。

这比很多技术细节更直接影响访客对初版完成度的判断，上线展示前应优先替换。

## 7. P2：中低优先级改进

- Reviews/Games 详情页的 `generateMetadata()` 与 page 各查询一次，可用 React `cache()` 做同请求去重。
- 所有内容页都 `force-dynamic`；以后可评估 revalidate/tag invalidation。
- 全局 description 仍是工程骨架文案，`NEXT_PUBLIC_SITE_URL` 尚未用于 metadataBase、canonical、OG、sitemap、robots。
- collection 的 create/update/delete 建议显式声明 authenticated 权限，便于审计。
- 缺少根 `README.md`，现有 docs 很充分但开始有 source of truth 漂移风险。
- PostgreSQL 有 healthcheck，web 没有专用 liveness/readiness endpoint。
- Payload 未配置邮件 adapter；若 V1 需要找回密码，应在上线前处理。

## 8. 推荐执行顺序

### 第一阶段：恢复可信开发门禁 — 已完成

1. `.next` 已由 `node` 重新生成。
2. 最终 `pnpm check`、`pnpm build` 均为 exit 0。
3. root 与 dev/build 并发防护已加入。
4. `SKIP_ENV_VALIDATION` 和 production fail-fast 仍列在 P1，不影响 P0-1 关闭。

### 第二阶段：完成 P0 数据可靠性闭环 — 已完成

1. 生产首次空库部署已验证四个 migration。
2. Coolify R2 backup 已启用并连续生成真实对象。
3. 恢复演练和生产 secret 轮换由项目所有者接受为后续增强。
4. 保留策略、last-success 监控和告警继续作为 P1/P2 改进。

### 第三阶段：建立最小工程护栏 — 当前最高优先级

1. mapper/getter/seed 的高价值测试。
2. 最小 GitHub Actions：format、lint、typecheck、test、build。
3. error、not-found、empty state 和 health endpoint。
4. slug/URL/资源路径校验。

### 第四阶段：让初版更像成品

1. 替换 About 与 Tools 的 draft 文案。
2. 压缩首页图片、释放 WebGL texture。
3. 补 Lightbox 焦点管理和完整 reduced-motion。
4. 补 metadataBase、canonical、OG、sitemap、robots。
5. 根据内容量决定分页与缓存策略。

## 9. 现在不建议做的事情

当前没有证据支持引入 Prisma、Redis、微服务、Kubernetes、消息队列、大型监控/备份面板，或为 `node_modules`、`.next`、`.pnpm-store` 擅自增加 named volume。这些不会解决当前最紧迫的问题。

## 10. 审查与状态更新限制

原始审查没有进行真实生产日志审查、Coolify 修改、真实 R2 上传、恢复演练、浏览器多设备回归、Lighthouse/axe、在线依赖漏洞 audit 或渗透测试，因此本报告不能替代完整生产验收或安全测试。

2026-07-10 的状态更新依据：本地修复执行记录、用户提供的 Coolify/R2 截图，以及项目所有者对首次生产空库部署过程的明确确认。本次更新没有重新登录生产数据库独立查询 `payload_migrations`。恢复演练与 secret 轮换也没有执行，二者是已明确接受的剩余风险。

## 11. 最终判断

Kita 的三个 P0 已经关闭：本地 build gate 恢复且有防复发守卫；生产 R2 备份持续成功；完整 migration 链路由首次生产空库部署验证。恢复演练与 secret 轮换并未伪装成已执行，而是由项目所有者接受为后续增强。

当前最值得优先处理的是 P1-3 测试与 CI，其次是 backup last-success 监控和产品层收口。主架构不需要推倒重来；把人工验证固化为自动化门禁后，项目会明显更适合长期维护。
