# Backend Data Flow Notes

## 这份文档解决什么问题

这份文档用 `/reviews` 作为例子，整理我们关于后端数据链路的讨论。

核心问题是：

```txt
前端页面需要数据
-> 后端如何描述这些数据
-> 数据库如何保存这些数据
-> API 如何把数据交给前端
-> Payload 到底帮我们省掉了什么
```

## 前端真正需要什么

`/reviews` 页面和详情页不应该直接关心数据库字段，也不应该直接关心 Payload document 的原始结构。

前端模板真正需要的是一个稳定的数据 contract，例如：

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
  body: RichTextContent;
};
```

当前 Kita 中的 `RichTextContent` 实际使用 Payload Lexical 的 `DefaultTypedEditorState`。它仍然是前端 contract 的一部分，但不再把正文压缩成只能显示普通段落的 `string[]`。

`ReviewsPage`、`ReviewCard`、`ReviewDetailPage` 只吃这个类型。

这样做的好处是：后端字段以后变了，UI 不一定要变。中间只要调整 mapper。

## 传统前后端分离的 REST API 是什么

传统前后端分离时，前端不能直接连接数据库。

原因：

- 浏览器代码是公开的，不能放数据库密码。
- 数据库不能直接暴露到公网。
- 用户权限必须在服务端判断。
- 后端需要统一处理错误、分页、排序、筛选。
- 后端需要把数据库原始数据整理成前端可用的 JSON。

所以传统链路通常是：

```txt
React 前端
-> fetch("/api/reviews")
-> 后端 REST API route
-> ORM / SQL 查询数据库
-> 后端整理 JSON
-> 前端渲染
```

例如前端请求：

```txt
GET /api/reviews?limit=20&sort=-publishedAt
```

后端需要自己写：

```ts
app.get("/api/reviews", async (req, res) => {
  const limit = Number(req.query.limit ?? 20);

  const reviews = await db.review.findMany({
    take: limit,
    orderBy: {
      publishedAt: "desc",
    },
  });

  res.json({
    docs: reviews,
    totalDocs: reviews.length,
  });
});
```

这里：

- `req` 是请求，里面有 query、params、body。
- `res` 是响应，用来返回 JSON、状态码、错误。
- `db.review.findMany` 是查询数据库。

详情页通常是：

```txt
GET /api/reviews/quiet-after-rain
```

后端需要写：

```ts
app.get("/api/reviews/:slug", async (req, res) => {
  const slug = req.params.slug;

  const review = await db.review.findUnique({
    where: {
      slug,
    },
  });

  if (!review) {
    return res.status(404).json({
      message: "Review not found",
    });
  }

  res.json(review);
});
```

如果要新增、修改、删除，还要继续写：

```txt
POST   /api/reviews
PATCH  /api/reviews/:id
DELETE /api/reviews/:id
```

这就是传统 REST API 的繁琐来源。

## 传统项目如何设计类似 collection 的结构

Payload 里写 collection：

```ts
export const Reviews = {
  slug: "reviews",
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    { name: "rating", type: "number" },
  ],
};
```

如果不用 Payload，通常要拆成很多层：

```txt
数据库表 schema
ORM model
输入校验 schema
API routes
返回数据类型
后台管理界面
```

例如用 Drizzle，大概会写：

```ts
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  gameTitle: varchar("game_title", { length: 256 }).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  excerpt: text("excerpt").notNull(),
  coverImage: text("cover_image").notNull(),
  rating: numeric("rating").notNull(),
  readingTime: varchar("reading_time", { length: 64 }).notNull(),
});
```

如果 `tags` 和 `body` 简单，可以用 JSON 字段。

如果要更关系型，可以拆表：

```txt
reviews
review_tags
review_body_blocks
```

这就是传统项目里手动设计数据结构的方式。

## Drizzle / Prisma 解决什么

Drizzle、Prisma 主要解决数据库层问题：

```txt
如何定义数据库表
如何生成 migration
如何类型安全地查询数据库
如何减少手写 SQL
```

它们不会自动帮你生成完整 CMS 后台，也不会自动帮你设计所有前端页面需要的 mapper。

不用 ORM 时可能写：

```ts
await pool.query(
  `
  SELECT *
  FROM reviews
  ORDER BY published_at DESC
  LIMIT $1
`,
  [20],
);
```

用 ORM 后可以写得更类型安全：

```ts
const rows = await db
  .select()
  .from(reviews)
  .orderBy(desc(reviews.publishedAt))
  .limit(20);
```

ORM 解决数据库访问，但不自动解决所有 REST API、后台管理、权限、上传文件。

## 传统 TypeScript 全栈项目一般还会用什么

如果不用 Payload，一个比较常见的技术组合是：

```txt
ORM: Drizzle / Prisma
Validation: Zod / Valibot
API: Next Route Handlers / Hono / Express / Fastify
Auth: Auth.js / Clerk / custom session
API contract: OpenAPI / ts-rest / tRPC
Admin UI: React Admin / Refine / custom admin
```

这些工具分别减少不同部分的重复：

- ORM 减少数据库查询和类型维护成本。
- Zod 负责校验前端传来的 JSON。
- API framework 让 route、middleware、错误处理更规整。
- OpenAPI / ts-rest / tRPC 让前后端 API 类型更稳定。
- Admin UI 工具减少后台管理页面开发成本。

但这些组合起来，仍然需要你自己设计很多东西。

## Payload 帮我们省掉什么

Payload 的 collection 不是单纯的数据库表定义。

它更像是这些东西的组合：

```txt
数据库内容模型
后台管理表单
字段校验
REST API
GraphQL API
Local API
权限入口
TypeScript 类型生成
上传文件能力
```

所以用 Payload 时，我们写：

```ts
export const Reviews = {
  slug: "reviews",
  fields: [...],
};
```

Payload 会基于这个 collection 自动提供：

```txt
GET    /api/reviews
GET    /api/reviews/:id
POST   /api/reviews
PATCH  /api/reviews/:id
DELETE /api/reviews/:id
```

还会提供后台管理页面和 Local API。

这就是 Payload 的价值：它把很多内容型项目里重复的 CRUD、后台、校验、API 工作统一生成了。

## REST API 和 Local API 的区别

REST API 是给外部通过 HTTP 调用的门。

```txt
浏览器 / 手机 App / 第三方系统
-> HTTP
-> /api/reviews
-> Payload REST API
-> 数据库
```

Local API 是给同一个 Node 服务端项目内部直接调用的通道。

```txt
Next Server Component / Route
-> getPayload({ config })
-> payload.find({ collection: "reviews" })
-> 数据库
```

对于 Kita：

```txt
Kita 自己的 /reviews 页面
-> 更适合 Local API

外部网站或移动端要读 Kita 数据
-> 更适合 REST API
```

Local API 少走一层 HTTP，所以在同项目服务端里更简单。

## Kita 的 reviews 推荐链路

当前我们要保持一个清楚边界：

```txt
Payload collection 管后台内容结构
server getter 管服务端数据获取
mapper 管数据形状转换
components 管显示
```

文件对应关系：

```txt
src/payload/collections/reviews.ts
```

定义 Payload 后台字段。

```txt
src/server/reviews/get-reviews.ts
```

调用 Payload Local API，拿 reviews 数据。

```txt
src/features/reviews/utils/map-review-document-to-review-preview.ts
```

把 Payload document 转成前端模板需要的 `ReviewPreview`。

```txt
src/features/reviews/components/*.tsx
```

只负责渲染，不知道 Payload 原始字段。

完整链路：

```txt
Payload reviews collection
-> Payload Local API
-> getReviews()
-> mapReviewDocumentToReviewPreview()
-> ReviewPreview[]
-> ReviewsPage / ReviewCard / ReviewDetailPage
```

## 为什么 mapper 很重要

Payload 里可能是：

```ts
{
  publishedAt: "2026-06-09",
  tags: [{ label: "VN" }],
  body: [{ paragraph: "正文第一段" }]
}
```

前端想要：

```ts
{
  date: "2026-06-09",
  tags: ["VN"],
  body: ["正文第一段"]
}
```

mapper 负责这层翻译。

这样 UI 不会写：

```ts
review.tags?.map((tag) => tag.label);
```

UI 只写：

```ts
review.tags.map(...)
```

这能避免后端字段调整时牵连整个页面。

## 关于 migration 的判断

开发阶段不一定马上生成 migration。

migration 的意义是：

```txt
我确认这个数据库结构要同步到生产环境
```

所以在 schema 还没稳定时，可以先：

```txt
写 collection 草案
生成 types
用本地数据库试效果
保留 mock fallback
不生成 migration
```

等字段稳定后，再生成 migration，把数据库结构正式同步到生产。

## 最终理解

不用 Payload 时，一个 reviews 功能可能需要：

```txt
数据库 schema
migration
ORM query
Zod validation
GET list API
GET detail API
POST API
PATCH API
DELETE API
权限判断
后台管理页面
前端 fetch
mapper
```

用 Payload 后，很多内容管理和 CRUD 层会由 collection 自动生成。

Kita 需要我们重点维护的是：

```txt
collection 是否合理
mapper 是否稳定
前端 ReviewPreview contract 是否清楚
页面是否好看且克制
什么时候生成 migration
```

## 完整对照：传统 REST、Drizzle、Prisma 与 Payload

这一节继续用 `/reviews` 做一次完整的纵向拆解。为了让重点更清楚，代码只选取列表页需要的几个字段。

先区分两个容易混淆的地址：

```txt
GET /reviews
```

通常返回 HTML 页面。

```txt
GET /api/reviews?limit=10&sort=desc
```

通常是 REST API，返回 JSON。传统前后端分离主要讨论第二种。

一次请求的完整链路是：

```txt
Route / Handler
-> Service
-> Repository interface
-> Drizzle、Prisma 或 Payload Repository
-> PostgreSQL
-> DTO / Mapper
-> JSON Response
-> 前端渲染
```

其中只有数据库建模和 Repository 实现会因为 Drizzle、Prisma、Payload 而明显变化。Handler、Service、DTO 和前端组件可以保持不变。

### 1. 前端 DTO

```ts
export type ReviewPreview = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
};
```

逐项理解：

- `ReviewPreview` 是前端数据 contract，不是数据库表。
- `slug` 用来生成 `/reviews/[slug]` 链接。
- `publishedAt` 使用字符串，方便通过 JSON 传输和直接渲染。
- 数据库即使还有 `id`、`status`、`createdAt`、内部备注，前端也不必知道。

### 2. Repository 使用的后端记录

```ts
export type ReviewRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  publishedAt: Date | null;
};

export type FindReviewsInput = {
  status: "draft" | "published";
  limit: number;
  sort: "asc" | "desc";
};

export interface ReviewRepository {
  findReviews(input: FindReviewsInput): Promise<ReviewRecord[]>;
}
```

这里最重要的是 `ReviewRepository` 接口。

Service 只知道“可以通过 `findReviews` 查询评论”，不知道背后使用的是 Drizzle、Prisma、Payload，还是测试用的静态数组。

真正的解耦条件是：

```txt
Service 依赖 ReviewRepository 接口
Service 不导入 Drizzle table
Service 不导入 Prisma 生成的 Model 类型
前端不接触 Payload document
```

### 3. Mapper

```ts
export function mapReviewToPreview(review: ReviewRecord): ReviewPreview {
  return {
    slug: review.slug,
    title: review.title,
    excerpt: review.excerpt,
    publishedAt: review.publishedAt?.toISOString() ?? "",
  };
}
```

逐步看：

```ts
review: ReviewRecord;
```

输入是后端内部记录，里面可以包含数据库和业务需要的字段。

```ts
): ReviewPreview
```

输出必须满足前端 contract。

```ts
review.publishedAt?.toISOString() ?? "";
```

把数据库中的 `Date | null` 转成能够 JSON 序列化的字符串。

### 4. Service

```ts
type ListReviewsInput = {
  limit: number;
  sort: "asc" | "desc";
};

export async function listPublishedReviews(
  repository: ReviewRepository,
  input: ListReviewsInput,
): Promise<ReviewPreview[]> {
  const safeLimit = Math.min(Math.max(input.limit, 1), 50);

  const records = await repository.findReviews({
    status: "published",
    limit: safeLimit,
    sort: input.sort,
  });

  return records.map(mapReviewToPreview);
}
```

Service 负责业务规则：

- 最少返回 1 条，最多返回 50 条。
- 面向普通读者时只查询 `published` 内容。
- 把后端记录转换成前端 DTO。

Service 不关心 HTTP，也不关心 SQL。

### 5. REST Handler

下面用 Next Route Handler 表示一个普通 REST endpoint：

```ts
export async function GET(request: Request) {
  const url = new URL(request.url);

  const parsedLimit = Number(url.searchParams.get("limit") ?? "10");

  const limit = Number.isFinite(parsedLimit) ? parsedLimit : 10;

  const sort = url.searchParams.get("sort") === "asc" ? "asc" : "desc";

  const reviews = await listPublishedReviews(reviewRepository, { limit, sort });

  return Response.json({ data: reviews });
}
```

逐段理解：

```ts
export async function GET(request: Request);
```

接住 `GET /api/reviews` 请求。

```ts
url.searchParams.get("limit");
```

读取 `?limit=10`。Handler 负责理解 HTTP query 参数。

```ts
listPublishedReviews(...)
```

把业务工作交给 Service。

```ts
Response.json({ data: reviews });
```

把 `ReviewPreview[]` 序列化成 JSON。Handler 不应该在这里直接写 Drizzle 或 Prisma 查询。

### 6. 使用 Drizzle 实现 Repository

Drizzle 通常使用 TypeScript 定义 PostgreSQL 表：

```ts
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  excerpt: text("excerpt").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  publishedAt: timestamp("published_at"),
});
```

对应关系：

- `pgTable("reviews")` 对应 PostgreSQL 的 `reviews` 表。
- `publishedAt` 是 TypeScript 属性名。
- `published_at` 是数据库列名。
- `notNull()`、`unique()` 描述数据库约束。

Repository 实现：

```ts
export class DrizzleReviewRepository implements ReviewRepository {
  async findReviews(input: FindReviewsInput) {
    const order =
      input.sort === "asc"
        ? asc(reviews.publishedAt)
        : desc(reviews.publishedAt);

    return db
      .select({
        id: reviews.id,
        slug: reviews.slug,
        title: reviews.title,
        excerpt: reviews.excerpt,
        status: reviews.status,
        publishedAt: reviews.publishedAt,
      })
      .from(reviews)
      .where(eq(reviews.status, input.status))
      .orderBy(order)
      .limit(input.limit);
  }
}
```

这段查询近似表达下面的参数化 SQL：

```sql
SELECT id, slug, title, excerpt, status, published_at
FROM reviews
WHERE status = $1
ORDER BY published_at DESC
LIMIT $2;
```

Drizzle 各调用的含义：

- `select()`：选择返回字段。
- `from(reviews)`：指定查询表。
- `where(...)`：添加筛选条件。
- `orderBy(...)`：指定排序。
- `limit(...)`：限制返回数量。

Drizzle 的写法接近 SQL，开发者能更直接地看见查询结构。

### 7. 使用 Prisma 实现 Repository

Prisma 通常在 `schema.prisma` 中定义模型：

```prisma
model Review {
  id          String    @id @db.Uuid
  slug        String    @unique @db.VarChar(160)
  title       String    @db.VarChar(200)
  excerpt     String
  status      String    @db.VarChar(20)
  publishedAt DateTime? @map("published_at")

  @@map("reviews")
}
```

对应关系：

- `model Review` 是 Prisma 模型。
- `@@map("reviews")` 表示它对应 PostgreSQL 的 `reviews` 表。
- `@map("published_at")` 把 Prisma 的 `publishedAt` 映射到数据库列 `published_at`。

Repository 实现：

```ts
export class PrismaReviewRepository implements ReviewRepository {
  async findReviews(input: FindReviewsInput) {
    return prisma.review.findMany({
      where: {
        status: input.status,
      },
      orderBy: {
        publishedAt: input.sort,
      },
      take: input.limit,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        status: true,
        publishedAt: true,
      },
    });
  }
}
```

Prisma 各配置的含义：

- `findMany()`：查询多条记录。
- `where`：筛选条件。
- `orderBy`：排序方式。
- `take`：限制返回数量，相当于 SQL `LIMIT`。
- `select`：指定返回字段。

Prisma 使用更高层的对象 API，但最终同样会生成查询并交给 PostgreSQL 执行。

### 8. Drizzle 和 Prisma 到底哪里不同

| 部分              | Drizzle                   | Prisma                     |
| ----------------- | ------------------------- | -------------------------- |
| 模型定义          | TypeScript schema         | `schema.prisma`            |
| 查询风格          | 接近 SQL 的 query builder | 高层对象 API               |
| 列表查询          | `db.select().from()`      | `prisma.review.findMany()` |
| 限制数量          | `.limit(10)`              | `take: 10`                 |
| 类型来源          | 从 TS schema 推导         | 生成 Prisma Client 类型    |
| migration 工具    | Drizzle Kit               | Prisma Migrate             |
| 对 SQL 的直接感受 | 更强                      | 更抽象                     |

但 PostgreSQL 实际经历的核心步骤没有变化：

```txt
ORM 使用数据库连接
-> 根据调用生成参数化查询
-> PostgreSQL 执行查询
-> PostgreSQL 返回 rows
-> ORM 转成 JavaScript 对象
-> Repository 返回 ReviewRecord[]
```

所以 Drizzle 和 Prisma 的差异应当被限制在基础设施层。

依赖组装时选择具体实现：

```ts
export const reviewRepository = new DrizzleReviewRepository();
```

或者：

```ts
export const reviewRepository = new PrismaReviewRepository();
```

只要两个实现都遵守 `ReviewRepository` 接口，Handler、Service、Mapper 和前端不需要修改。

### 9. 换成 Payload 后发生什么

Payload 的 collection 同时描述内容字段、管理后台表单、校验、访问控制以及 API 能力：

```ts
export const Reviews: CollectionConfig = {
  slug: "reviews",
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "title", type: "text", required: true },
    { name: "excerpt", type: "textarea", required: true },
    {
      name: "status",
      type: "select",
      options: ["draft", "published"],
      required: true,
    },
    { name: "publishedAt", type: "date" },
  ],
};
```

使用 Payload 后，我们通常不再为基础 CRUD 手写以下内容：

```txt
Drizzle/Prisma reviews schema
基础的 GET /api/reviews
基础的 GET /api/reviews/:id
基础的 POST/PATCH/DELETE routes
基础字段校验
基础管理后台表单
```

Payload 会根据 collection 提供这些能力。

在 Kita 的 Next 服务端内部，可以用 Local API 查询：

```ts
const result = await payload.find({
  collection: "reviews",
  where: {
    status: {
      equals: "published",
    },
  },
  sort: "-publishedAt",
  limit: 10,
});
```

对应关系：

- `collection: "reviews"`：查询 reviews collection。
- `where`：只读取 published 内容。
- `sort: "-publishedAt"`：按发布时间倒序。
- `limit: 10`：最多返回 10 条。
- `result.docs`：Payload 返回的 document 数组。

然后仍然需要 mapper：

```ts
return result.docs.map(mapReviewDocumentToReviewPreview);
```

Payload 可以替代大量 CRUD 和数据访问样板代码，但不会替我们决定前端最终需要什么数据。因此 `ReviewPreview` 和 mapper 仍然有价值。

### 10. 三种方式放在一起比较

传统 Drizzle REST：

```txt
GET /api/reviews
-> Next Route Handler
-> listPublishedReviews service
-> DrizzleReviewRepository
-> Drizzle query
-> PostgreSQL
-> ReviewRecord[]
-> mapper
-> ReviewPreview[] JSON
```

传统 Prisma REST：

```txt
GET /api/reviews
-> Next Route Handler
-> listPublishedReviews service
-> PrismaReviewRepository
-> prisma.review.findMany()
-> PostgreSQL
-> ReviewRecord[]
-> mapper
-> ReviewPreview[] JSON
```

Payload REST API：

```txt
GET /api/reviews
-> Payload 自动生成的 REST Handler
-> Payload collection / access / validation
-> Payload database adapter
-> PostgreSQL
-> Payload JSON response
```

Kita 使用 Payload Local API：

```txt
Next Server Component
-> getReviews()
-> payload.find({ collection: "reviews" })
-> PostgreSQL
-> Payload documents
-> mapReviewDocumentToReviewPreview()
-> ReviewPreview[]
-> ReviewsPage
```

最后一种没有经过浏览器到 `/api/reviews` 的 HTTP 往返。页面和 Payload 在同一个 Node 服务端进程中，因此可以直接调用 Local API。

### 11. 最终应该记住的边界

```txt
Route / Handler
负责 HTTP：参数、状态码、JSON response

Service
负责业务规则：只显示 published、限制数量、权限语义

Repository
负责数据访问：Drizzle、Prisma、Payload Local API

Database
负责持久化：PostgreSQL 表、索引、约束

DTO / Mapper
负责把后端数据翻译成稳定的前端 contract

Frontend
只负责使用 ReviewPreview 渲染页面
```

Repository 与其他层可以解耦，但不是自动解耦。只有遵守下面的规则，替换 ORM 才会轻松：

```txt
Service 只依赖 Repository interface
ORM 类型不泄漏到 Service 和 UI
Payload document 不直接传遍所有组件
Mapper 位于后端数据与前端 contract 的边界
```

Payload 并没有改变后端的基本结构。它只是把传统项目中需要手写的数据库适配、CRUD API、校验、权限入口和管理后台整合成了一个更高层的内容平台。我们仍然需要维护业务规则、稳定 DTO 和 mapper，这正是 Kita 当前 reviews 数据链路的核心。
