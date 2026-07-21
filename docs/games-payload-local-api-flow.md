# Games Payload Local API Data Flow

> **历史记录（非当前事实源）**：本文主要保留 Games 从 mock 数据迁移到 Payload Local API 的设计过程。文中的“当前 mock”“这一阶段”等表述只代表当时状态；当前实现与操作边界以 [CODEX_HANDOFF.md](./CODEX_HANDOFF.md) 和 [current-project-status.md](./current-project-status.md) 为准。

> 注意：本文记录最初的 `coverKey + image registry` 方案。图片部分已由 [Games 图片资源解耦方案](./games-image-asset-decoupling-plan.md) 取代；getter、mapper 和 DTO 分层原则仍然有效。

## 1. 文档目标

本文评估 `/games` 和 `/games/[slug]` 如何从当前 mock 数据迁移到 Payload Local API，同时继续使用 `public` 目录中的图片。

这一阶段只确认数据结构和职责边界：

```text
Payload Game document
-> Local API server getter
-> mapper + public image registry
-> GameDetail
-> Games gallery / lightbox / detail page
```

当前先不做：

- 不创建 Games Collection。
- 不生成 Payload types。
- 不生成 migration。
- 不接生产数据库。
- 不创建 Payload Media Collection。
- 不允许 UI 组件直接读取 Payload document。

## 2. 当前已经存在的前端契约

`/games/[slug]` 当前只接收 `GameDetail`：

```ts
export type GameStatus = "finished" | "playing" | "planned";

export type GameDetail = {
  slug: string;
  title: string;
  originalTitle?: string;
  developer: string;
  releaseDate: string;
  status: GameStatus;
  summary: string;
  body: DefaultTypedEditorState;
  cover: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  tags: string[];
  links: Array<{
    href: string;
    label: string;
  }>;
};
```

文件位置：

```text
src/features/games/types/game-detail.ts
```

这是前端 view model，也就是页面的数据合同。Gallery、lightbox 和 detail page 只认识 `GameDetail`，不应该知道数据来自 mock、Payload Local API 还是 REST API。

## 3. 当前 mock 数据链路

当前实现还没有后端参与：

```text
src/features/games/data/game-items.ts
-> gameItems: GameDetail[]
-> getGameBySlug(slug)
-> src/app/(site)/games/[slug]/page.tsx
-> <GameDetailPage game={game} />
```

这个阶段的优点是页面和数据格式已经可以先独立完成。以后连接 Payload 时，不需要重写 `GameDetailPage` 的布局。

## 4. 第一版图片策略

第一版不让 Payload 管理图片文件，而是继续使用：

```text
public/*.jpg
public/*.png
```

Payload Game document 只保存一个稳定的 `coverKey`：

```ts
{
  slug: "night-archive",
  title: "Night Archive",
  coverKey: "night-sky"
}
```

前端维护图片资源注册表：

```ts
export const gameCoverAssets = {
  "night-sky": {
    src: "/home-night-sky.jpg",
    alt: "A deep night sky over a quiet landscape",
    width: 720,
    height: 540,
  },
  "rain-harbor": {
    src: "/home-rain-harbor.jpg",
    alt: "Rain and harbor lights seen through a window",
    width: 720,
    height: 1080,
  },
} as const;
```

建议文件位置：

```text
src/features/games/data/game-cover-assets.ts
```

同一张图片可以被多个 Game document 引用。`coverKey` 表示图片资源，不必和 game slug 相同。

## 5. 为什么不直接把图片路径全部存进 Payload

可以在 Payload 里存：

```text
/home-night-sky.jpg
```

但 Games 的图片不仅是一个背景地址。当前照片墙、缩略图、全屏查看器和详情页还需要：

- `src`
- `alt`
- `width`
- `height`

如果把这些全部交给编辑者填写，会出现路径拼错、宽高填错、同一张图描述不一致等问题。

`coverKey + image registry` 把职责分开：

```text
Payload：决定这个游戏使用哪张图片
registry：保存 public 图片的技术信息
mapper：把两部分组合成 GameDetail.cover
```

## 6. 为什么第一版不使用 Payload Media Collection

Media Collection 可以让管理员在 Payload Admin 上传和更换图片，但它同时引入：

- 上传字段和 Media Collection。
- 图片存储位置。
- Coolify 持久化 Volume 或对象存储。
- 重新部署时文件不能丢失的问题。
- 图片尺寸、格式和访问 URL 的处理。
- 新的数据库关系与 migration。

对于当前作品集第一版，这些成本大于收益。当前图片数量少，而且本来就在 Git 仓库的 `public` 目录中，因此使用 `coverKey` 更合适。

代价是新增图片必须经过：

```text
把图片放进 public
-> 注册 coverKey
-> Git commit
-> 重新部署
```

这个限制对第一版可以接受。

## 7. 建议的 Payload Games Collection

第一版 Collection 可以保持简单：

```ts
import type { CollectionConfig } from "payload";

export const Games: CollectionConfig = {
  slug: "games",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "developer", "playStatus", "updatedAt"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "originalTitle",
      type: "text",
    },
    {
      name: "developer",
      type: "text",
      required: true,
    },
    {
      name: "releaseDate",
      type: "text",
      required: true,
    },
    {
      name: "playStatus",
      type: "select",
      required: true,
      options: ["finished", "playing", "planned"],
    },
    {
      name: "publicationStatus",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: ["draft", "published"],
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
    },
    {
      name: "body",
      type: "richText",
      editor: lexicalEditor({
        features: () => [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
          BoldFeature(),
          ItalicFeature(),
          UnorderedListFeature(),
          OrderedListFeature(),
          BlockquoteFeature(),
          LinkFeature(),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      required: true,
    },
    {
      name: "coverKey",
      type: "select",
      required: true,
      options: [
        "sea-girl",
        "night-sky",
        "rain-harbor",
        "sunset-field",
        "crimson-room",
      ],
    },
    {
      name: "tags",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "links",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "href",
          type: "text",
          required: true,
        },
      ],
    },
  ],
};
```

这里故意区分了两个状态：

```text
playStatus        游戏阅读状态：finished / playing / planned
publicationStatus 网站发布状态：draft / published
```

这样不会让一个 `status` 字段同时承担两种含义。

## 8. mapper 的职责

建议新增：

```text
src/features/games/utils/map-game-document-to-game-detail.ts
```

它只负责把 Payload document 转成稳定的 `GameDetail`：

```ts
export function mapGameDocumentToGameDetail(
  game: PayloadGameDocument,
): GameDetail {
  return {
    slug: game.slug,
    title: game.title,
    originalTitle: game.originalTitle ?? undefined,
    developer: game.developer,
    releaseDate: game.releaseDate,
    status: game.playStatus,
    summary: game.summary,
    body: game.body as DefaultTypedEditorState,
    cover: resolveGameCover(game.coverKey),
    tags: compactStrings(game.tags?.map((tag) => tag.label) ?? []),
    links: compactLinks(game.links),
  };
}
```

最关键的一行是：

```ts
cover: resolveGameCover(game.coverKey);
```

Payload 不需要保存 Next.js 图片宽高；UI 也不需要认识 `coverKey`。mapper 在边界处把二者连接起来。

如果 `coverKey` 不存在，建议在服务端明确抛错，而不是悄悄换成错误图片。这样开发阶段可以尽快发现 Admin 数据和资源注册表不一致。

## 9. Local API server getter 的职责

建议新增：

```text
src/server/games/get-games.ts
```

它与 Reviews 的 getter 承担相同职责：

```ts
export async function getGames(): Promise<GameDetail[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "games",
    limit: 100,
    overrideAccess: false,
    where: {
      publicationStatus: {
        equals: "published",
      },
    },
  });

  return result.docs.map(mapGameDocumentToGameDetail);
}
```

详情查询：

```ts
export async function getGameBySlug(
  slug: string,
): Promise<GameDetail | undefined> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "games",
    limit: 1,
    overrideAccess: false,
    where: {
      and: [
        { slug: { equals: slug } },
        { publicationStatus: { equals: "published" } },
      ],
    },
  });

  const game = result.docs[0];
  return game ? mapGameDocumentToGameDetail(game) : undefined;
}
```

getter 负责：

- Payload Local API 查询。
- 只读取 published games。
- 调用 mapper。
- 处理开发环境 mock fallback。
- 让 Payload config、数据库和错误处理留在 server 层。

UI 组件不能直接调用 Payload Local API。

## 10. Route 层如何使用 getter

列表页最终应变成：

```text
src/app/(site)/games/page.tsx
-> await getGames()
-> <GamesPage games={games} />
-> <GamesGallery games={games} />
```

详情页最终应变成：

```text
src/app/(site)/games/[slug]/page.tsx
-> await getGameBySlug(slug)
-> notFound() when undefined
-> <GameDetailPage game={game} />
```

连接 Payload 后，route 不再直接 import `gameItems`。mock fallback 应只存在于 server getter 中。

## 11. 开发环境与生产环境的 fallback

可以沿用 Reviews 已经采用的策略：

```text
开发环境：
Payload 查询失败或暂时没有数据
-> 使用 gameItems mock

生产环境：
Payload 查询失败
-> 记录错误并抛出

生产环境：
没有 published game
-> 返回 [] 或 undefined
```

生产环境不能用假数据掩盖数据库故障，否则页面看似正常，实际上真实内容没有被读取。

## 12. 建议文件结构

```text
src/features/games/
  components/
    game-detail-page.tsx
    game-gallery-card.tsx
    game-lightbox.tsx
    game-shared-modal.tsx
    games-gallery.tsx
    games-page.tsx
  data/
    game-cover-assets.ts
    game-items.ts
  types/
    game-detail.ts
  utils/
    map-game-document-to-game-detail.ts

src/payload/collections/
  games.ts

src/server/games/
  get-games.ts

src/app/(site)/games/
  page.tsx
  [slug]/page.tsx
```

各层职责：

```text
collection  定义后端可编辑的数据结构
getter      调用 Payload Local API
mapper      转换后端 document
registry    解析 public 图片资源
type        定义前端稳定合同
route       获取数据并处理 notFound / metadata
component   只负责渲染
```

## 13. 与 Reviews 数据流的对照

Reviews 当前链路：

```text
Payload Reviews Collection
-> Payload Local API
-> src/server/reviews/get-reviews.ts
-> mapReviewDocumentToReviewPreview
-> ReviewPreview
-> ReviewsPage / ReviewDetailPage
```

Games 计划链路：

```text
Payload Games Collection
-> Payload Local API
-> src/server/games/get-games.ts
-> mapGameDocumentToGameDetail
   -> resolveGameCover(coverKey)
-> GameDetail
-> GamesGallery / GameLightbox / GameDetailPage
```

两条链路的结构完全一致。Games 只多了一个 public 图片资源解析步骤。

## 14. 以后升级 Media Collection 时会改哪里

未来如果需要在 Payload Admin 上传封面：

```text
coverKey
-> Payload upload relationship: cover
```

然后修改 mapper：

```text
Payload Media document
-> GameDetail.cover
```

以下部分不需要改：

- `GameDetail` 的主要页面合同。
- `GamesGallery`。
- `GameLightbox`。
- `GameDetailPage`。
- `/games/[slug]` 的视觉结构。

这说明当前 `coverKey` 方案不是一次性写法，而是一个可以平稳升级的第一版边界。

## 15. 推荐实施顺序

在确认本文方案后，建议按以下顺序做本地最小实现：

1. 新增 `game-cover-assets.ts`，把当前 public 图片注册进去。
2. 让 mock 数据通过 `coverKey` 解析成 `GameDetail`，先验证 registry 和 mapper 思路。
3. 新增 Payload Games Collection，但不生成 migration。
4. 运行 `payload generate:types`。
5. 新增正式 mapper。
6. 新增 `src/server/games/get-games.ts`。
7. 让 `/games` 与 `/games/[slug]` 通过 getter 获取数据。
8. 在本地 Payload Admin 录入一条 Game。
9. 验证列表、lightbox、详情页和 metadata。
10. schema 最终确认后，再决定是否生成生产 migration。

## 16. 评估结论

这个方案适合 Kita 第一版：

- 前后端边界清晰。
- 与 Reviews 已完成的数据流一致。
- 不引入图片上传和持久化存储。
- 保留 Payload Admin 管理游戏文字内容的能力。
- 同一份 `GameDetail` 同时服务照片墙、查看器和详情页。
- 后续升级 Media Collection 时不需要重写 UI。

当前最大限制是新增图片必须提交代码并部署，但在图片数量少、以作品集交付为优先的阶段，这是合理而且可控的取舍。

## 17. 当前实际实现（2026-06-29）

本文方案已经在开发环境完成最小实现。

新增或调整的主要文件：

```text
src/features/games/data/game-cover-assets.ts
src/features/games/types/game-detail.ts
src/features/games/utils/map-game-document-to-game-detail.ts
src/payload/collections/games.ts
src/server/games/get-games.ts
payload.config.ts
src/app/(site)/games/page.tsx
src/app/(site)/games/[slug]/page.tsx
src/features/games/components/games-page.tsx
src/features/games/components/games-gallery.tsx
```

当前真实链路：

```text
/games route
-> getGames()
-> Payload Local API: payload.find({ collection: "games" })
-> mapGameDocumentToGameDetail()
-> resolveGameCover(coverKey)
-> GameDetail[]
-> GamesPage
-> GamesGallery / GameLightbox
```

详情页链路：

```text
/games/[slug]
-> getGameBySlug(slug)
-> Payload Local API
-> mapGameDocumentToGameDetail()
-> GameDetail
-> GameDetailPage
```

当前本地 Games Collection 已注册，但还没有 Game document。开发环境因此执行：

```text
Payload 查询成功
-> docs.length === 0
-> 使用 gameItems mock fallback
```

这意味着当前页面仍然能展示原来的 mock 图片和文字，但 UI 已经不再直接 import mock 数据。mock 只存在于 server getter 的开发环境 fallback 中。

本地 Admin 地址：

```text
http://localhost:3000/admin/collections/games
```

录入一条 Game 时需要注意：

- `publicationStatus` 必须选择 `published`，公开页面才会读取。
- `playStatus` 表示 finished、playing 或 planned。
- `coverKey` 必须从已有 public 图片选项中选择。
- slug 对应 `/games/[slug]` 的 URL。

本次运行了：

```text
pnpm payload:types
pnpm typecheck
pnpm build
```

验证结果：

- Payload `/api/games` 已注册并返回标准 collection response。
- `/games` 返回 200。
- `/games/sea-side-fragment` 返回 200。
- Next.js 生产构建通过。
- `/games` 与 `/games/[slug]` 均为动态服务端路由。

本次没有运行：

```text
pnpm payload:migrate:create
pnpm payload:migrate
```

也没有新增 migration 文件。当前数据库结构变化只存在于本地开发数据库；等 Games schema 和实际内容确认稳定后，再决定是否生成生产 migration。

## 18. Rich Text 详情正文试验（2026-07-02）

Games 详情内容尚未定型，因此本地 schema 已将固定的 `note: textarea` 替换为基础 Lexical `body: richText`。

支持范围与 Reviews 保持一致：

- 标题 h2 / h3 / h4。
- 段落。
- 粗体和斜体。
- 有序与无序列表。
- 引用。
- 链接。
- 不包含正文图片与自定义 Blocks。

新的数据边界：

```text
Payload Game.body JSONB
-> mapGameDocumentToGameDetail
-> GameDetail.body: DefaultTypedEditorState
-> Payload RichText renderer
-> GameDetailPage
```

开发环境新增：

```text
POST /api/dev/seed-games
pnpm seed:games
```

该 seed 仅在 `NODE_ENV !== production` 且 `ENABLE_DEV_SEED=true` 时可用。它会清理本地 Games 测试记录，然后写入三条 published 样本：

```text
short-signal             短标题、短正文
long-title-night         长标题、中等正文
long-body-rain-archive   普通标题、长正文
```

本地验证结果：

- Payload Admin Games 页面返回 200。
- `/games` 返回 200，并显示三条数据库记录。
- 三个详情 slug 均返回 200。
- 长标题可以在固定阅读列内自然换行。
- 长正文没有桌面横向溢出。
- TypeScript 检查通过。

本次只修改了本地开发数据库结构，没有生成或执行 Games migration。正式录入六条 Game 和同步生产数据库之前，仍可以继续调整详情页视觉与 Rich Text 内容结构。
