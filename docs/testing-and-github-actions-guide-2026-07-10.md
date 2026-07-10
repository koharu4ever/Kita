# Kita 测试与 GitHub Actions 入门及实施建议

> 日期：2026-07-10
>
> 状态：评估方案；尚未安装测试依赖，也尚未创建 workflow
>
> 技术栈：Next.js 16、Payload 3、PostgreSQL 16、Node.js 22、pnpm 10

## 一、结论

Kita 目前不是“代码不能用”，而是许多关键规则只能靠人工记住和验证。后续改动即使页面看似正常，也可能破坏 production fallback、published 权限、seed upsert、nullable 字段、migration 或备份失败判断。

建议按四个小 PR 推进：

1. Vitest 单元测试：三个 mapper、getter 分支、Games seed upsert。
2. 基础 GitHub Actions：自动执行 install、format、lint、typecheck、test、build。
3. 临时 PostgreSQL 16 与 Playwright：migration、published 权限、页面 smoke。
4. backup shell 失败分支：确认失败绝不误报成功。

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

计划在 Dev Container 的 `node` 用户下安装 `pnpm add -D vitest`，增加：

```json
{
  "scripts": {
    "test": "node scripts/assert-dev-workspace-user.mjs && vitest run",
    "test:watch": "node scripts/assert-dev-workspace-user.mjs && vitest"
  }
}
```

`pnpm test` 运行一次，适合 CI；`pnpm test:watch` 监视改动，适合本地。保留 workspace 用户守卫。不要在 Windows 全局安装 Vitest，也不要以 root 绕过守卫。

最小 `vitest.config.ts`：

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
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

### PR 1：Vitest 与高价值单元测试

三个 mapper、getter 分支和 Games seed upsert；不连接数据库。验收：`pnpm test`、`pnpm check`、`pnpm build` 全通过，临时改坏逻辑时测试确实变红。

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

## 十五、官方资料

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
