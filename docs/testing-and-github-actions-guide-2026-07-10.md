# Kita 测试与 GitHub Actions 入门及实施建议

> 初稿日期：2026-07-10
>
> PR 1 执行日期：2026-07-12
>
> 状态：PR 1 已完成实施和本地验证；GitHub Actions workflow 仍属于 PR 2
>
> 技术栈：Next.js 16、Payload 3、PostgreSQL 16、Node.js 22、pnpm 10、Vitest 4.0.18

## 一、结论

Kita 目前不是“代码不能用”，而是许多关键规则只能靠人工记住和验证。后续改动即使页面看似正常，也可能破坏 production fallback、published 权限、seed upsert、nullable 字段、migration 或备份失败判断。

建议按四个小 PR 推进：

1. [x] Vitest 单元测试：三个 mapper、getter 分支、Games seed upsert。
2. [ ] 基础 GitHub Actions：自动执行 install、format、lint、typecheck、test、build。
3. [ ] 临时 PostgreSQL 16 与 Playwright：migration、published 权限、页面 smoke。
4. [ ] backup shell 失败分支：确认失败绝不误报成功。

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

## 三、当前仓库状态

截至 2026-07-10，只读检查确认：

- `package.json` 没有测试脚本和测试依赖；
- 没有 `.github/workflows`；
- Node 基线为 22，包管理器为 `pnpm@10.28.2`；
- 已有 `format:check`、`lint`、`typecheck`、`build` 和 workspace 用户守卫；
- 三个 mapper、server getters、Games seed route 适合成为第一批测试目标；
- production 由 Coolify 管理，CI 不应获得生产数据库或 R2 凭据。

所以 P1-3 的判断成立：检查命令虽然存在，但还没有“自动执行并阻止回归”的闭环。

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

计划创建 `.github/workflows/ci.yml`。以下 action 主版本已于 2026-07-10 从官方仓库核对；真正实施时仍应再确认一次。

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
      - uses: actions/checkout@v7
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
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

`docker/postgres-backup/backup.sh` 应使用假的外部命令做独立 shell 集成测试：

- fake `pg_dump` 失败：必须出现 `pg_dump failed`，不能出现 `Backup completed`；
- fake `pg_restore --list` 失败：必须判定 archive 无效；
- fake `rclone copyto` 失败：必须出现 `Upload to R2 failed`，不能出现成功日志；
- fake `rclone` 成功：才允许打印 `Backup completed`；
- 所有分支都检查临时 dump 已清理。

它不属于 mapper/getter 的 Vitest 第一批，也不需要真实 R2 或生产凭据。

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

### PR 2：基础 GitHub Actions

增加 `ci.yml`，自动执行 install、format、lint、typecheck、test、build；只读权限；无 production secret；保护 main。验收：正常 PR 全绿；故意制造错误时相应 step 变红且不能合并。

### PR 3：临时数据库与 smoke

增加 PostgreSQL 16 service、空库 migration、published 权限和 Playwright smoke。验收：不用生产 secret；job 后无数据库残留；回归会让 CI 失败。

### PR 4：backup 失败分支

用 fake `pg_dump`、`pg_restore`、`rclone` 验证失败不误报成功、进入 retry 并清理临时文件。

## 十四、P1-3 完成标准

P1-3 应继续保留为未完成，直到至少完成 PR 1 和 PR 2。仅有测试但 CI 不运行，或仅有 CI 而没有业务规则测试，都不算闭环。

```text
三个 mapper 有测试
getter 的开发/生产关键分支有测试
Games seed upsert 有“不删除其他记录”测试
Pull Request 自动执行 format/lint/typecheck/test/build
main 必须在 CI 绿色后合并
```

migration、published 权限、Playwright 和 backup 失败测试可后续增强，但不能把“人工验证过一次”当作永久保障。

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

因此 PR 1 完成后，P1-3 仍需等待 PR 2 的自动 CI 才能最终闭环。

## 十六、官方资料

- [Bulletproof React：Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [Bulletproof React：Testing](https://github.com/alan2207/bulletproof-react/blob/master/docs/testing.md)
- [GitHub：构建和测试 Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
- [GitHub：actions/checkout](https://github.com/actions/checkout)
- [GitHub：actions/setup-node](https://github.com/actions/setup-node)
- [pnpm：pnpm/action-setup](https://github.com/pnpm/action-setup)
- [GitHub：PostgreSQL service container](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers)
- [Vitest 入门](https://vitest.dev/guide/)
- [Vitest Mocking](https://vitest.dev/guide/mocking.html)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
