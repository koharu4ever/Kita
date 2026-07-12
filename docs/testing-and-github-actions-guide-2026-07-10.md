# Kita 测试与 GitHub Actions 入门及实施建议

> 初稿日期：2026-07-10
>
> PR 1 执行日期：2026-07-12
>
> PR 2 执行日期：2026-07-12
>
> 状态：**P1-3 第一阶段测试与 CI 闭环已完成**；PR 1、PR 2 已合并，`quality` 已在 GitHub 真实运行通过，main Ruleset 已启用
>
> 技术栈：Next.js 16、Payload 3、PostgreSQL 16、Node.js 22、pnpm 10、Vitest 4.0.18

## 一、结论

Kita 目前不是“代码不能用”，而是许多关键规则只能靠人工记住和验证。后续改动即使页面看似正常，也可能破坏 production fallback、published 权限、seed upsert、nullable 字段、migration 或备份失败判断。

建议按四个小 PR 推进：

1. [x] Vitest 单元测试：三个 mapper、getter 分支、Games seed upsert。
2. [x] 基础 GitHub Actions：自动执行 install、format、lint、typecheck、test、build；GitHub 首次运行已通过，main 已要求 `quality`。
3. [ ] 临时 PostgreSQL 16 与 Playwright：migration、published 权限、页面 smoke。
4. [x] backup shell 失败分支：4 个 fake-command 场景已实现并接入 `pnpm test`（2026-07-12）。

原清单 `install → format → lint → typecheck → build` 漏了 `test`。CI 如果不运行测试，测试文件可能长期无人执行。有效顺序应是：

```text
install → format:check → lint → typecheck → test → build
```

第一阶段不需要 production secret，不连接生产数据库，不删除任何 Volume，也不修改 Coolify。

## 二、测试与 GitHub Actions 是什么

测试就是“能够重复执行的代码验收清单”。例如，“Game 的 tags/links 为 null 时不能报错”可以写成断言；以后 mapper 被改坏，测试会立即变红并指出失败位置。

GitHub Actions 是 GitHub 临时提供的一台干净 Linux 机器。push 或创建 Pull Request 时，它会下载代码、安装指定的 Node/pnpm、依次运行检查、显示绿色或红色结果，然后销毁临时机器。它不是生产服务器，也不应该连接 Coolify、生产 PostgreSQL 或生产 R2。

| 类型      | Kita 的例子                         | 依赖             | 速度 |
| --------- | ----------------------------------- | ---------------- | ---- |
| 单元测试  | mapper、getter、seed upsert         | 通常没有         | 最快 |
| 集成测试  | 空库 migration、匿名 published 权限 | 临时数据库       | 中等 |
| E2E/smoke | 浏览器打开 `/games`，确认不是 500   | 临时应用和浏览器 | 最慢 |

第一批以单元测试为主；数据库和浏览器测试后续独立增加，失败时更容易定位。

## 三、实施前仓库状态

截至 2026-07-10，只读检查确认：

- `package.json` 没有测试脚本和测试依赖；
- 没有 `.github/workflows`；
- Node 基线为 22，包管理器为 `pnpm@10.28.2`；
- 已有 `format:check`、`lint`、`typecheck`、`build` 和 workspace 用户守卫；
- 三个 mapper、server getters、Games seed route 适合成为第一批测试目标；
- production 由 Coolify 管理，CI 不应获得生产数据库或 R2 凭据。

所以在 2026-07-10 方案制定时，P1-3 的判断成立：检查命令虽然存在，但还没有“自动执行并阻止回归”的闭环。该历史缺口已在 2026-07-12 通过 PR 1、PR 2 和 main Ruleset 关闭。

## 四、第一批具体测什么

### 1. 三个 mapper

- `src/features/tools/utils/map-tool-document-to-toolkit-item.ts`：正常映射、日期、category/link 形状。
- `src/features/reviews/utils/map-review-document-to-review-preview.ts`：正常映射、tags 为 null/undefined、空白 tag。
- `src/features/games/utils/map-game-document-to-game-detail.ts`：正常映射、tags/links 为 null、link 字段。

这些是纯函数测试，不需要 Payload、PostgreSQL 或 Next.js。

### 2. getters 的正常、空、异常和环境分支

目标是 `src/server/tools/get-tools.ts`、`src/server/reviews/get-reviews.ts`、`src/server/games/get-games.ts`。用 `vi.mock()` 替换 `getPayloadClient()`，控制查询结果而不接触数据库。

| 场景          | development 预期    | production 预期                     |
| ------------- | ------------------- | ----------------------------------- |
| 返回正常 docs | 映射 CMS 数据       | 映射 CMS 数据                       |
| 返回空 docs   | 本地 fallback       | 空数组/not found，绝不泄漏 fallback |
| 查询抛异常    | 记录错误并 fallback | 继续抛错，让监控发现故障            |
| nullable 字段 | mapper 安全返回     | mapper 安全返回                     |

每个用例后执行 `vi.restoreAllMocks()` 和 `vi.unstubAllEnvs()`，防止测试互相污染。

### 3. Games seed upsert

当前 `src/app/api/dev/seed-games/route.ts` 同时处理 HTTP、环境保护、seed 数据和 upsert。建议把 find → update/create 提取到 `src/server/games/seed-games.ts`，route 只负责权限检查和调用。

测试提供假的 `find`、`update`、`create`，验证：

1. slug 已存在时 update，不创建重复数据；
2. slug 不存在时 create；
3. 其他 Games 记录不受影响；
4. 实现没有调用 delete。

fake client 可以故意不提供 `delete`；以后代码误加删除操作时，测试会立即失败。

### 4. 页面 smoke

后续用 Playwright 检查 `/`、`/about`、`/tools`、`/reviews`、`/games`、`/admin`：导航成功、有主要标题/区域、没有 500。它不检查动画像素。因为需要浏览器和临时应用，应在 Vitest 与基础 CI 稳定后再加。

## 五、已选定的测试目录约定

> 决策日期：2026-07-10
>
> 决策：Kita 测试目录采用 [bulletproof-react](https://github.com/alan2207/bulletproof-react) 当前示例使用的 feature-local `__tests__` 模式，不采用测试文件与实现文件完全平铺的模式。

该决定与 Kita 现有 feature-based architecture 保持一致：功能专属测试归属对应 feature；server 层测试靠近对应 server 模块；共享测试基础设施集中管理；E2E 独立于 `src`。

正式目录约定：

```text
src/
├─ features/
│  ├─ tools/
│  │  └─ utils/
│  │     └─ __tests__/
│  │        └─ map-tool-document-to-toolkit-item.test.ts
│  ├─ reviews/
│  │  └─ utils/
│  │     └─ __tests__/
│  │        └─ map-review-document-to-review-preview.test.ts
│  └─ games/
│     └─ utils/
│        └─ __tests__/
│           └─ map-game-document-to-game-detail.test.ts
│
├─ server/
│  ├─ tools/
│  │  └─ __tests__/
│  │     └─ get-tools.test.ts
│  ├─ reviews/
│  │  └─ __tests__/
│  │     └─ get-reviews.test.ts
│  └─ games/
│     └─ __tests__/
│        ├─ get-games.test.ts
│        └─ seed-games.test.ts
│
└─ testing/
   ├─ fixtures/
   ├─ mocks/
   └─ test-utils.ts

e2e/
└─ tests/
   └─ public-pages.spec.ts
```

约束说明：

- `__tests__` 只存放相邻模块自己的测试，不把所有测试集中到根目录。
- `src/testing` 只存放跨测试复用的 fixtures、mocks、render helpers 和 test utilities，不存放所有业务测试。
- `e2e/tests` 只存放 Playwright E2E/smoke 测试。
- `.test.ts` 由 Vitest 执行，`.spec.ts` 由 Playwright 执行，两类测试通过配置分开。
- 不提前创建空目录；只有真正出现共享 fixture、mock 或 helper 时才增加对应目录。
- Kita 的 `src/server` 是项目自身的 Payload/Next.js 服务端层；将其测试放进模块相邻的 `__tests__`，是对 bulletproof-react“测试跟随所属模块”原则的项目适配。

现有 Vitest include `src/**/*.test.ts` 可以匹配上述 `__tests__` 文件。后续 Playwright 配置应明确使用 `testDir: "./e2e/tests"`。

## 六、Vitest 第一版

PR 1 已在 Dev Container 的 `node` 用户下执行 `pnpm add -D -E vitest@4.0.18`。没有在 Windows 宿主机安装 Node、pnpm 或 Vitest。版本使用精确锁定，避免依赖在未来安装时自动漂移。随后增加：

```json
{
  "scripts": {
    "test": "node scripts/assert-dev-workspace-user.mjs && vitest run",
    "test:watch": "node scripts/assert-dev-workspace-user.mjs && vitest"
  }
}
```

`pnpm test` 运行一次，适合 CI；`pnpm test:watch` 监视改动，适合本地。两条命令都保留 workspace 用户守卫。不要在 Windows 全局安装 Vitest，也不要以 root 绕过守卫。

最初安装到的 Vitest 4.1.10 会引入 Vite 8，并与当前 Payload/Drizzle 依赖树解析出的 esbuild 产生 peer warning。PR 1 因此核对包元数据后改为精确锁定 Vitest 4.0.18；它使用 Vite 6/7 兼容范围，最终安装没有该 peer warning。没有运行 `pnpm approve-builds`，因为本 PR 不需要扩大依赖安装脚本的授权范围。

实际 `vitest.config.ts`：

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
```

## 七、第一版 GitHub Actions

已创建 `.github/workflows/ci.yml`。以下 action 主版本在 2026-07-12 实施时从官方仓库再次核对。

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      CI: "true"
      SKIP_ENV_VALIDATION: "true"
      ENABLE_DEV_SEED: "false"
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000"
    steps:
      - name: Checkout repository
        uses: actions/checkout@v7
        with:
          persist-credentials: false
      - name: Install pnpm from packageManager
        uses: pnpm/action-setup@v6
      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

说明：

- 当前 Docker build 本来就使用 `SKIP_ENV_VALIDATION=true`；CI build 可以沿用，因为它不启动生产服务。
- workflow 不放 `DATABASE_URI`、`PAYLOAD_SECRET` 或 R2 凭据。任何测试只使用一次性值，绝不能复制 Coolify production secret。
- 环境变量 schema 应另写测试，避免 build-time skip 掩盖配置错误。
- `--frozen-lockfile` 保证严格按已提交 lockfile 安装。
- `permissions: contents: read` 表示 CI 只读，不提交、不发版、不部署。

## 八、GitHub 页面上实际怎么用

```text
从 main 建功能分支
  → 本地 pnpm test / pnpm check / pnpm build
  → push 分支并创建 Pull Request
  → GitHub Actions 自动运行
  → 全绿后合并 main
  → Coolify 部署 main
```

失败时在 Pull Request 的 checks 或仓库 Actions 页点击红色 job，展开第一个失败 step，根据文件名、行号和断言修复，再 push；Actions 会自动重跑。

Kita 当前由 Coolify 监听 main。如果直接 push main，CI 和生产部署可能同时开始，CI 不会天然叫停 Coolify。因此应先让 Pull Request 变绿，再合并 main。

基础 workflow 稳定后保护 `main`：必须通过 Pull Request、`quality` 必须成功、检查未完成时禁止合并。到这一步 CI 才是真正的 build gate。

## 九、临时 PostgreSQL 16

migration、匿名 published 权限和 collection/migration 一致性需要真实但一次性的数据库。GitHub Actions 可启动 `postgres:16` service，使用下面的一次性值：

```yaml
NODE_ENV: test
DATABASE_URI: postgres://postgres:postgres@127.0.0.1:5432/kita_ci
PAYLOAD_SECRET: ci-only-payload-secret-at-least-32-characters
NEXT_PUBLIC_SITE_URL: http://localhost:3000
ENABLE_DEV_SEED: "false"
```

执行 `pnpm payload:migrate`，再验证四个 migration 记录、关键表和匿名 published 查询。job 结束后临时容器与数据自动销毁；不使用或删除本地 Volume，也不接触生产库。

## 十、Playwright smoke

后续安装 `@playwright/test`，CI 用 `pnpm exec playwright install --with-deps chromium` 安装浏览器。先只使用 Chromium 和 1 个 worker；失败时上传 `playwright-report/` 以查看截图和 trace。测试只访问 CI 临时应用，不登录 production admin。

## 十一、备份失败不能误报成功

已在 `docker/postgres-backup/tests/backup.test.sh` 使用假的外部命令实现独立 shell 集成测试：

- fake `pg_dump` 失败：必须出现 `pg_dump failed`，不能出现 `Backup completed`；
- fake `pg_restore --list` 失败：必须判定 archive 无效，且不能调用 `rclone`；
- fake `rclone copyto` 失败：必须出现 `Upload to R2 failed`，不能出现成功日志；
- fake `rclone` 成功：才允许打印 `Backup completed`；
- 所有分支都检查临时 dump 已清理；
- 成功日志不得包含测试密码或测试密钥。

它直接执行真实 `backup.sh`，但不需要真实 PostgreSQL、R2 或 production 凭据。详细设计和实际结果见第十七节。

## 十二、暂时不要做

- 不追求 100% coverage，不设覆盖率门槛；
- 不给 Tailwind class、动画像素或生成文件做大面积 snapshot；
- 不让 CI 连接 production PostgreSQL、Coolify 或 R2；
- 不把 production secret 复制进 GitHub；
- 不在测试中删除本地 Docker Volume；
- 不把 unit、migration、Playwright、backup 全塞进一个超大 PR。

## 十三、实施顺序与验收

### PR 1：Vitest 与高价值单元测试 — 已完成（2026-07-12）

三个 mapper、getter 分支和 Games seed upsert 已完成；测试不连接数据库。`pnpm test`、`pnpm check`、`pnpm build` 均已通过。详细文件和验证结果见第十五节。

### PR 2：基础 GitHub Actions — 代码已完成（2026-07-12）

已增加 `ci.yml`，自动执行 install、format、lint、typecheck、test、build；只读权限；无 production secret。本地等价命令已全部通过，详细记录见第十六节。尚需在 GitHub 完成首次绿色运行，再把 `quality` 设置为 main 的必需检查。

### PR 3：临时数据库与 smoke

增加 PostgreSQL 16 service、空库 migration、published 权限和 Playwright smoke。验收：不用生产 secret；job 后无数据库残留；回归会让 CI 失败。

### 计划 PR 4：backup 失败分支 — 已完成代码实施（2026-07-12）

已用 fake `pg_dump`、`pg_restore`、`rclone` 验证失败不误报成功、进入 retry 并清理临时文件。由于此前文档 PR 已占用 GitHub 编号，实际 Pull Request 编号以 GitHub 创建结果为准；计划标签不等于 GitHub PR 编号。

## 十四、P1-3 第一阶段完成确认（2026-07-12）

P1-3 第一阶段现已完成。PR 1 提供业务规则测试，PR 2 提供自动 CI，main Ruleset 把绿色 `quality` 变成合并条件；三者缺一都不能形成闭环。

```text
[x] 三个 mapper 有测试
[x] getter 的开发/生产关键分支有测试
[x] Games seed upsert 有“不删除其他记录”测试
[x] Pull Request 自动执行 format/lint/typecheck/test/build
[x] main 必须在 CI 绿色后合并
```

以上五项已经全部满足。

migration、published 权限和 Playwright 仍可后续增强；backup 失败测试已经实现。不能把“人工验证过一次”当作永久保障。

## 十五、PR 1 实际执行记录

> 执行日期：2026-07-12
>
> 分支：`codex/test-ci-pr1-vitest`
>
> 范围：只实施 Vitest、高价值单元测试和 Games seed 的可测试性重构；没有创建 GitHub Actions、Playwright 或临时数据库。

### 15.1 如何安装，为什么没有污染本机

所有依赖命令都在 Dev Container 的 `node` 用户中执行：

```bash
docker exec -u node -w /workspaces/Kita <dev-container> pnpm add -D -E vitest@4.0.18
```

实际影响仅限项目工作区：

- `package.json` 增加精确版本的 `vitest: 4.0.18`；
- `pnpm-lock.yaml` 记录可重复安装的依赖解析；
- Dev Container 工作区的 `node_modules` 增加测试依赖；
- Windows 没有全局安装 Node、pnpm 或 Vitest；
- 没有使用 root，也没有生成 root 拥有的 `.next` 文件。

### 15.2 实际新增和调整的文件

```text
vitest.config.ts
src/testing/fixtures/payload-documents.ts

src/features/tools/utils/__tests__/
  map-tool-document-to-toolkit-item.test.ts
src/features/reviews/utils/__tests__/
  map-review-document-to-review-preview.test.ts
src/features/games/utils/__tests__/
  map-game-document-to-game-detail.test.ts

src/server/tools/__tests__/
  get-tools.test.ts
src/server/reviews/__tests__/
  get-reviews.test.ts
src/server/games/__tests__/
  get-games.test.ts
  seed-games.test.ts

src/server/games/seed-games.ts
src/app/api/dev/seed-games/route.ts
```

测试严格使用第五节确定的 bulletproof-react `__tests__` 目录模式。`src/testing/fixtures` 只保存多个测试共享的 Payload document factory，没有把业务测试集中到 `src/testing`。

Games seed route 原本同时负责 HTTP、环境保护和 upsert 循环。PR 1 把 `find → update/create` 提取为 `upsertGameSeeds`：

```text
route.ts
  → 检查 production / ENABLE_DEV_SEED
  → 取得真实 Payload client
  → 调用 upsertGameSeeds

seed-games.ts
  → 按 slug 查找
  → 已存在则 update
  → 不存在则 create
  → 返回保存结果
```

route 的外部行为没有改变，但核心 upsert 现在可以用不含 `delete` 的最小 fake client 测试。

### 15.3 30 个测试覆盖了什么

| 区域           | 测试数 | 主要规则                                                            |
| -------------- | -----: | ------------------------------------------------------------------- |
| 三个 mapper    |      6 | 正常映射；nullable tags/links；空 metadata 安全默认值               |
| Tools getter   |      5 | 正常、开发空数据、生产空数据、开发异常 fallback、生产异常抛出       |
| Reviews getter |      8 | list 正常/空/异常环境分支；slug 正常、开发 fallback、生产 undefined |
| Games getter   |      8 | list 正常/空/异常环境分支；slug 正常、开发 fallback、生产 undefined |
| Games seed     |      3 | 已存在 update、不存在 create、多条 upsert 且 client 无 delete 能力  |
| **合计**       | **30** | **7 个测试文件**                                                    |

getter 测试通过 `vi.hoisted` 和 `vi.mock` 替换 `env` 与 `getPayloadClient`。每个测试可以明确控制 development/production 和 Payload 返回值，因此：

- 不启动 Next.js；
- 不连接本地或生产 PostgreSQL；
- 不读取真实 secret；
- 不写入 Payload；
- 可以稳定复现空数据和异常分支。

mapper 测试使用 `src/testing/fixtures/payload-documents.ts` 创建最小合法输入，避免每个文件重复一大段 Payload document。

### 15.4 实际执行命令和结果

所有命令均在 Dev Container 的 `node` 用户中运行：

| 命令             | 结果                                                       |
| ---------------- | ---------------------------------------------------------- |
| `pnpm test`      | exit 0；7 个 test files、30 个 tests 全部通过              |
| `pnpm typecheck` | exit 0                                                     |
| `pnpm check`     | exit 0；Prettier、ESLint、TypeScript 全部通过              |
| `pnpm build`     | exit 0；Next.js 16 production build 和全部 routes 正常生成 |

第一次完整 `pnpm test` 在 Windows bind mount 环境耗时约 138 秒，其中测试断言本身不足 1 秒，主要时间花在模块 transform/import 和机械盘 I/O。这是性能现象，不是测试失败。

### 15.5 初学者以后如何增加测试

增加一个 feature 工具函数测试时：

1. 在实现文件相邻目录建立或复用 `__tests__`；
2. 文件命名为 `<implementation>.test.ts`；
3. 正常输入至少写一个用例；
4. nullable、空值或异常等高风险边界至少写一个用例；
5. 外部数据库/API 使用 fake 或 mock，不连接 production；
6. 先运行单个文件，再运行完整门禁：

```bash
pnpm exec vitest run path/to/file.test.ts
pnpm test
pnpm check
pnpm build
```

测试失败时先看第一个失败断言，不要为了变绿而删除业务断言、放宽 production 规则或使用 `as any` 掩盖类型问题。

### 15.6 本 PR 明确没有做什么

- 没有创建 `.github/workflows/ci.yml`；这是 PR 2。
- 没有安装 Playwright 或浏览器；这是 PR 3。
- 没有启动临时 PostgreSQL，也没有连接现有数据库。
- 没有增加覆盖率工具或覆盖率门槛。
- 没有修改生产环境、Coolify、R2 或任何 secret。

这是 PR 1 完成时点的历史结论；PR 2 随后已合并并完成远端 CI 与 main Ruleset，因此 P1-3 第一阶段现已闭环。

## 十六、PR 2 实际执行记录

> 执行日期：2026-07-12
>
> 分支：`codex/ci-pr2-github-actions`
>
> 范围：只增加基础 CI workflow 和本节教学记录；不连接数据库，不读取 production secret，不部署，也不修改 Coolify。

### 16.1 为什么 PR 2 曾暂时叠在 PR 1 上

PR 2 创建时，PR 1 尚未合并。为了让 PR 2 使用 PR 1 新增的 `pnpm test` 和 30 个测试，PR 2 分支从 PR 1 的提交继续创建。GitHub 最终按预期完成了下面的合并顺序：

```text
[x] PR #1 合并到 main（main merge commit: 9bf5caa）
[x] PR #2 的 Files changed 收敛为 ci.yml 和本教学记录
[x] PR #2 的 CI / quality 真实运行通过
[x] PR #2 合并到 main（main merge commit: faf8cea）
```

这叫 stacked PR（堆叠 PR）。它没有把同一份代码复制两次；GitHub 会根据共同提交自动缩小差异。

### 16.2 新增的 workflow 做什么

`.github/workflows/ci.yml` 在指向 `main` 的 Pull Request 和 push 到 `main` 时运行一个名为 `quality` 的 job：

```text
checkout
  → 安装 package.json 中声明的 pnpm
  → Node.js 22 + pnpm cache
  → pnpm install --frozen-lockfile
  → pnpm format:check
  → pnpm lint
  → pnpm typecheck
  → pnpm test
  → pnpm build
```

它还包含两项并发保护：同一分支有新提交时取消旧运行；单次 job 最长 20 分钟。这样不会让过时提交继续占用 runner。

### 16.3 安全边界

- workflow 顶层只有 `permissions: contents: read`；
- checkout 使用 `persist-credentials: false`，job 不保留 GitHub 写凭据；
- 没有 deploy、Coolify、SSH、Docker registry 或发布步骤；
- 没有 `DATABASE_URI`、`PAYLOAD_SECRET`、R2 access key 等 production secret；
- `NEXT_PUBLIC_SITE_URL` 是 CI 专用公开占位值；
- `SKIP_ENV_VALIDATION=true` 只让无 secret 的 build 阶段完成编译，不启动生产服务；
- `ENABLE_DEV_SEED=false` 明确禁止 CI 运行开发 seed。

因此这台 GitHub 临时 runner 只检查代码，不能修改生产环境。

### 16.4 本地等价门禁和结果

先在 Dev Container 中使用 `node` 用户、与 workflow 相同的非 secret 环境变量执行完整顺序：

| 门禁                             | 结果                                          |
| -------------------------------- | --------------------------------------------- |
| `pnpm install --frozen-lockfile` | exit 0                                        |
| `pnpm format:check`              | exit 0                                        |
| `pnpm lint`                      | exit 0                                        |
| `pnpm typecheck`                 | exit 0                                        |
| `pnpm test`                      | exit 0；7 个 test files、30 个 tests 全部通过 |
| `pnpm build`                     | 完成；Next.js 生成有效 `BUILD_ID`             |

这次 `pnpm build` 在 Windows bind mount 上耗时较长。检查时主进程和 worker 持续有 CPU/I/O 活动，最终正常生成 `BUILD_ID`；没有重复启动 build，没有删除 `.next`，也没有改变其用户边界。

本地通过只能证明 workflow 中的项目命令可执行，不能替代 GitHub runner。随后 PR #2 的 `CI / quality (pull_request)` 在 GitHub 托管 runner 上约 1 分钟完成并显示绿色，因此远端 CI 已有真实通过证据。

### 16.5 GitHub 收尾操作（已完成）

1. [x] PR #1 已合并。
2. [x] PR #2 已创建并以 `main` 为目标分支。
3. [x] PR #2 的 **Checks** 显示 `CI / quality` 成功。
4. [x] 已进入 **Settings → Rules → Rulesets** 创建 main branch ruleset。
5. [x] Ruleset 要求通过 Pull Request 和 GitHub Actions 的 `quality`，required approvals 为 0。
6. [x] 同一 Ruleset 还限制删除 main、阻止 force push，并处于启用状态。

`quality` 通常要先实际运行一次才会出现在可选检查列表里，所以保护规则应在第一次 CI 运行后设置。仓库内的 YAML 不能代替这个 GitHub 网页设置。

### 16.6 怎样安全验证“错误会变红”

不需要污染 main，也不要删除测试。可以在一个临时验证分支故意制造一种小错误，例如把代码格式打乱或写一个错误类型，然后 push：

```text
格式错误 → Check formatting 变红
ESLint 错误 → Lint 变红
类型错误 → Typecheck 变红
错误断言 → Unit tests 变红
编译错误 → Production build 变红
```

看到预期的红色 step 后，立即修复或撤销那一个临时提交并再次 push。最终 PR 必须恢复全绿。只有 `quality` 已设为必需检查时，“变红”才会同时真正阻止合并。

### 16.7 PR 2 与 P1-3 第一阶段完成确认

仓库侧和 GitHub 侧均已完成：

- workflow 使用只读权限、无 production secret，并执行完整质量门禁；
- PR #2 的 `CI / quality` 首次真实运行全绿；
- main Ruleset 已要求 Pull Request 和 GitHub Actions `quality`，并阻止删除与 force push；
- PR #2 已在满足门禁后合并，远端 `main` 为合并提交 `faf8cea`，且包含 PR 2 提交与 `.github/workflows/ci.yml`。

因此 PR 2 和 P1-3 第一阶段在 2026-07-12 正式闭环。没有为了演示而向远端推送故意失败的提交；失败或运行中的 `quality` 会被已启用的 GitHub required status check 规则阻止合并。

## 十七、backup shell 测试实际执行记录

> 执行日期：2026-07-12
>
> 分支：`codex/test-backup-shell`
>
> 范围：只增加 fake-command shell 测试、测试脚本入口、CI 接入和文档；生产 `backup.sh` 未修改。

### 17.1 为什么不用真实 PostgreSQL 和 R2

本测试的目标是验证 `backup.sh` 的控制流，而不是再次验证生产基础设施。测试把临时目录放到 `PATH` 最前面，用同名 fake 程序替代：

- `pg_isready`：固定报告数据库 ready；
- `pg_dump`：按场景失败，或写入一个非空假 archive；
- `pg_restore`：按场景拒绝假 archive；
- `rclone`：记录上传参数并按场景失败；
- `sleep`：在第一次 interval/retry 时请求脚本正常停止，避免测试进入永久循环。

测试仍然直接执行真实的 `docker/postgres-backup/backup.sh`，所以日志、cleanup、retry/interval 分支和命令调用顺序都来自生产脚本本身。

### 17.2 四个场景验证什么

| 场景                     | 必须出现                                           | 明确禁止/额外断言                                          |
| ------------------------ | -------------------------------------------------- | ---------------------------------------------------------- |
| `pg_dump` 失败           | `ERROR: pg_dump failed`、retry                     | 不得出现 `Backup completed`；临时 dump 删除                |
| `pg_restore --list` 失败 | archive 无法读取错误                               | 不得调用 `rclone`；不得报成功；临时 dump 删除              |
| `rclone copyto` 失败     | `Upload to R2 failed`、retry                       | 不得报成功；临时 dump 删除                                 |
| 完整成功                 | archive validated、backup completed、next interval | R2 object 前缀正确；临时 dump 删除；日志不含测试密码或密钥 |

测试使用 TAP 风格输出，成功结果为：

```text
ok 1 - pg_dump failure is reported and cleaned up
ok 2 - invalid archive stops before upload and is cleaned up
ok 3 - R2 upload failure is reported and cleaned up
ok 4 - successful backup uploads once, reports success, and cleans up
1..4
```

### 17.3 命令和 CI 如何接入

`package.json` 现在把测试拆成：

```text
pnpm test
  → pnpm test:unit
  → pnpm test:backup
```

- `test:unit`：原有 7 个 Vitest 文件、30 个测试；
- `test:backup`：4 个 shell 场景；
- `test`：按顺序运行两者，任何一个失败都会返回非零状态。

GitHub Actions 仍执行 `pnpm test`，因此不需要另建一个绕过现有门禁的 job；CI step 名称由 `Unit tests` 改为更准确的 `Tests`。

### 17.4 安全边界

- 不连接本地或生产 PostgreSQL；
- 不访问 Cloudflare R2；
- 不读取任何 production secret；
- 不修改 Coolify；
- 不创建或删除 Docker Volume；
- 所有测试凭据都是固定假值；
- 所有 fake 命令、状态记录和 dump 都位于测试临时目录或 `/tmp`，退出时清理；
- 没有为了测试而改变生产 `backup.sh`。

这组测试关闭的是“失败分支可能误报成功且无人自动发现”的回归缺口，不等于完成恢复演练、last-success healthcheck、告警或 R2 权限增强。

### 17.5 实际门禁结果

所有命令均在 Dev Container 中以 `node` 用户运行：

| 命令                                                | 结果                                                |
| --------------------------------------------------- | --------------------------------------------------- |
| `sh -n docker/postgres-backup/backup.sh`            | exit 0                                              |
| `sh -n docker/postgres-backup/tests/backup.test.sh` | exit 0                                              |
| `pnpm test:backup`                                  | exit 0；4 个场景通过                                |
| `pnpm test`                                         | exit 0；30 个 Vitest + 4 个 shell 场景通过          |
| `pnpm check`                                        | exit 0；Prettier、ESLint、TypeScript 通过           |
| `pnpm build`                                        | exit 0；Next.js production build 和 routes 正常生成 |

## 十八、官方资料

- [Bulletproof React：Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [Bulletproof React：Testing](https://github.com/alan2207/bulletproof-react/blob/master/docs/testing.md)
- [GitHub：构建和测试 Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
- [GitHub：actions/checkout](https://github.com/actions/checkout)
- [GitHub：actions/setup-node](https://github.com/actions/setup-node)
- [pnpm：pnpm/action-setup](https://github.com/pnpm/action-setup)
- [GitHub：管理分支 ruleset](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository)
- [GitHub：PostgreSQL service container](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers)
- [Vitest 入门](https://vitest.dev/guide/)
- [Vitest Mocking](https://vitest.dev/guide/mocking.html)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
