# Reviews Payload Data Shape Plan

## 目标

`/reviews` 和 `/reviews/[slug]` 现在先保持前端模板状态。当前阶段只确认一件事：

```txt
后端内容长什么样
-> 如何转换
-> 前端模板最终吃什么数据
```

现在不做这些事：

- 不生成 migration。
- 不把这个数据库结构推到生产。
- 不默认新增 `src/server/reviews/get-reviews.ts`。
- 不让 UI 组件直接认识 Payload collection 的原始字段。

当前最小理解链路可以是：

```txt
Payload-like raw review data
-> mapper in review-items.ts
-> ReviewPreview
-> ReviewsPage / ReviewCard / ReviewDetailPage
```

也就是说，先用 `src/features/reviews/data/review-items.ts` 把事情讲清楚。

## 前端模板需要的数据类型

当前 `/reviews` 页面和详情页真正需要的是这个类型：

```ts
export type ReviewPreview = {
  slug: string;
  title: string;
  gameTitle: string;
  date: string;
  excerpt: string;
  coverImage: string;
  rating: number;
  readingTime: string;
  tags: string[];
  body: string[];
};
```

这个类型是前端模板 contract。

`ReviewCard`、`ReviewsPage`、`ReviewDetailPage` 应该只吃这个类型。它们不应该关心数据来自 mock、Payload、REST API，还是别的地方。

## Payload Collection 可以怎么写

如果以后要在 Payload 里建 `reviews` collection，字段可以尽量贴近 `ReviewPreview`，但不需要强行完全一样。

草案：

```ts
import type { CollectionConfig } from "payload";

export const Reviews: CollectionConfig = {
  slug: "reviews",
  admin: {
    defaultColumns: [
      "title",
      "gameTitle",
      "publishedAt",
      "rating",
      "updatedAt",
    ],
    useAsTitle: "title",
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
      name: "gameTitle",
      type: "text",
      required: true,
    },
    {
      name: "publishedAt",
      type: "date",
      required: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
    },
    {
      name: "coverImage",
      type: "text",
      required: true,
    },
    {
      name: "rating",
      type: "number",
      min: 0,
      max: 10,
      required: true,
    },
    {
      name: "readingTime",
      type: "text",
      required: true,
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
      name: "body",
      type: "array",
      fields: [
        {
          name: "paragraph",
          type: "textarea",
          required: true,
        },
      ],
    },
  ],
};
```

这里有三个刻意保守的选择：

- `coverImage` 先用 text，存 `/home-night-sky.jpg` 这种 public path。以后确认需要媒体库时，再改成 Payload upload/media。
- `body` 先用 paragraph array。当前详情页很克制，不需要一开始就上 Rich Text。
- `publishedAt` 在 Payload 里叫发布时间，前端展示时再映射成 `date`。

## mapper 可以先写在 review-items.ts

可以。当前阶段把 mapper 写在 `src/features/reviews/data/review-items.ts` 里反而更容易理解。

原因是现在还没有真正连接数据库，`review-items.ts` 本来就是 `/reviews` 的静态数据入口。把 raw data、mapper、最终 `reviewItems` 放在一个文件里，能很直观看到：

```txt
Payload-like raw shape -> ReviewPreview
```

可以先这样写：

```ts
export type ReviewPreview = {
  slug: string;
  title: string;
  gameTitle: string;
  date: string;
  excerpt: string;
  coverImage: string;
  rating: number;
  readingTime: string;
  tags: string[];
  body: string[];
};

type PayloadReviewLike = {
  slug: string;
  title: string;
  gameTitle: string;
  publishedAt: string;
  excerpt: string;
  coverImage: string;
  rating: number;
  readingTime: string;
  tags?: Array<{
    label?: string | null;
  }> | null;
  body?: Array<{
    paragraph?: string | null;
  }> | null;
};

function compactStrings(values: Array<string | null | undefined> = []) {
  return values.filter((value): value is string => Boolean(value));
}

export function mapPayloadReviewToReviewPreview(
  review: PayloadReviewLike,
): ReviewPreview {
  return {
    slug: review.slug,
    title: review.title,
    gameTitle: review.gameTitle,
    date: review.publishedAt,
    excerpt: review.excerpt,
    coverImage: review.coverImage,
    rating: review.rating,
    readingTime: review.readingTime,
    tags: compactStrings(review.tags?.map((tag) => tag.label) ?? []),
    body: compactStrings(review.body?.map((block) => block.paragraph) ?? []),
  };
}
```

然后可以把当前 mock data 改成更像 Payload 的形状：

```ts
const payloadReviewItems: PayloadReviewLike[] = [
  {
    slug: "quiet-after-rain",
    title: "雨后仍然停在屏幕上的故事",
    gameTitle: "Placeholder Visual Novel",
    publishedAt: "2026-06-09",
    excerpt: "一篇关于氛围、记忆和结尾余韵的短评。",
    coverImage: "/home-rain-harbor.jpg",
    rating: 8.5,
    readingTime: "6 min read",
    tags: [{ label: "Atmosphere" }, { label: "Memory" }, { label: "VN" }],
    body: [
      {
        paragraph:
          "这段演示文本负责撑起详情页的节奏。真正的数据源以后可以替换成 Payload。",
      },
    ],
  },
];

export const reviewItems = payloadReviewItems.map(
  mapPayloadReviewToReviewPreview,
);
```

这样前端页面仍然只使用：

```ts
reviewItems: ReviewPreview[]
```

UI 不知道 `tags` 原来是 `{ label }[]`，也不知道 `body` 原来是 `{ paragraph }[]`。这就是 mapper 的意义。

## 为什么以后可能要拆出 mapper

先放在 `review-items.ts` 没问题。

以后如果真的接 Payload，再考虑拆成：

```txt
src/features/reviews/utils/map-review-document-to-review-preview.ts
```

拆出去的原因不是为了复杂，而是为了边界更清楚：

- `review-items.ts` 只放静态 fallback / demo seed。
- mapper 专门负责 Payload document -> front-end view type。
- 数据获取函数专门负责调用 Payload。
- UI 组件永远只接收 `ReviewPreview`。

但这一步可以等你真的准备接 Payload 时再做。

## 为什么现在不急着用 Local API server getter

你现在的疑问很合理：如果只是理解数据链路，马上新增 `src/server/reviews/get-reviews.ts` 会显得抽象。

当前阶段可以先不用。因为我们只是确认：

```txt
Payload 数据形状能不能转换成前端模板数据形状
```

这件事在 `review-items.ts` 里就能讲清楚。

以后如果真的接 Payload，Local API server getter 会更合适，原因是：

- Payload Local API 只能在服务端安全使用，不应该被 client component 或浏览器 bundle 碰到。
- 数据库连接、Payload config、secret、权限逻辑都应该留在 server 层。
- route 可以通过 server getter 拿到 `ReviewPreview[]`，再传给前端组件。
- 出错 fallback、空数据 fallback、排序、分页这些逻辑集中在一个地方。

以后正式接入时，链路会变成：

```txt
src/server/reviews/get-reviews.ts
-> Payload Local API
-> mapReviewDocumentToReviewPreview
-> ReviewPreview[]
-> ReviewsPage props
```

但现在先不用这个层。先把 `review-items.ts` 的 mapper 版本做清楚。

## 关于 migration

现在不要生成 migration。

原因：

- migration 表示你准备把数据库结构变更同步到生产环境。
- 现在只是试 `/reviews` 的数据模型和页面效果，还没确认 schema 最终形态。
- 过早生成 migration 会让数据库结构变成“已经定稿”的感觉，后面反而不好改。

当前阶段只建议：

1. 保持 `/reviews` 使用静态 `reviewItems`。
2. 可选：把 `reviewItems` 改成由 `PayloadReviewLike[]` 通过 mapper 生成。
3. 可选：保留 Payload collection 草案在文档里，不急着落到代码。
4. 等字段稳定后，再新增 collection、生成 types、考虑 migration。

## 推荐下一步

最小下一步不是接数据库，而是改 `review-items.ts` 的数据组织方式：

```txt
ReviewPreview type
PayloadReviewLike type
mapPayloadReviewToReviewPreview()
payloadReviewItems mock data
export const reviewItems = payloadReviewItems.map(...)
```

这样你可以先看懂整个转换过程，也能继续保持 `/reviews` 页面完全静态、可控、不会影响生产数据库。

## 当前最小实现：Local API 链路

现在已经按更清晰的后端边界做了最小实现，但仍然没有生成 migration。

实际文件分工是：

```txt
src/payload/collections/reviews.ts
```

定义 Payload 后台内容模型。这里描述 `reviews` collection 有哪些字段，例如 `title`、`slug`、`gameTitle`、`publishedAt`、`excerpt`、`coverImage`、`rating`、`readingTime`、`tags`、`body`。

```txt
src/features/reviews/utils/map-review-document-to-review-preview.ts
```

负责转换数据形状。Payload document 可以有自己的后台结构，例如：

```txt
publishedAt
tags: [{ label }]
body: [{ paragraph }]
```

前端模板只需要：

```txt
date
tags: string[]
body: string[]
```

这个文件就负责把 Payload document 转成 `ReviewPreview`。

```txt
src/server/reviews/get-reviews.ts
```

负责服务端数据获取。它调用 Payload Local API：

```ts
payload.find({
  collection: "reviews",
  limit: 20,
  sort: "-publishedAt",
});
```

然后把查到的 Payload documents 交给 mapper，最终返回 `ReviewPreview[]`。

如果当前本地数据库里还没有 `reviews` 表，或者里面暂时没有数据，它会回退到 `reviewItems`。这样 `/reviews` 页面不会因为数据库结构还在试验阶段就直接坏掉。

```txt
src/app/(site)/reviews/page.tsx
```

作为 route 层中间人：

```txt
await getReviews()
-> <ReviewsPage reviews={reviews} />
```

```txt
src/app/(site)/reviews/[slug]/page.tsx
```

详情页同理：

```txt
await getReviewBySlug(slug)
-> <ReviewDetailPage review={review} />
```

前端组件仍然不碰 Payload：

```txt
src/features/reviews/components/reviews-page.tsx
src/features/reviews/components/review-card.tsx
src/features/reviews/components/review-detail-page.tsx
```

这些组件只认识 `ReviewPreview`，不认识 Payload document。

完整链路是：

```txt
Payload reviews collection
-> Payload Local API
-> src/server/reviews/get-reviews.ts
-> src/features/reviews/utils/map-review-document-to-review-preview.ts
-> ReviewPreview[]
-> ReviewsPage / ReviewCard / ReviewDetailPage
```

这次只运行了：

```txt
pnpm payload:types
pnpm typecheck
pnpm build
```

没有运行：

```txt
pnpm payload:migrate:create
```

也没有新增 migration 文件。

当前状态可以理解为：代码已经知道 `reviews` collection 应该长什么样，前端也已经能通过服务端 getter 接收 `ReviewPreview`，但数据库结构还没有被正式固化成生产 migration。等你确认这个 schema 稳定后，再生成 migration，把它同步到生产数据库。
