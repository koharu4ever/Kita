import { buildEditorState } from "@payloadcms/richtext-lexical";
import type { Payload, TypedUser } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { env } from "@/config/env";
import { migrations } from "@/migrations";

const expectedDatabaseName = "kita_integration";
const allowedDatabaseHosts = new Set(["127.0.0.1", "localhost", "::1"]);

let payload: Payload;
let authenticatedUser: TypedUser;

function assertDisposableDatabase() {
  const parsedURI = new URL(env.DATABASE_URI);

  if (
    !allowedDatabaseHosts.has(parsedURI.hostname) ||
    parsedURI.pathname !== `/${expectedDatabaseName}`
  ) {
    throw new Error(
      "Integration tests only run against the disposable local kita_integration database.",
    );
  }

  if (
    env.NODE_ENV !== "test" ||
    env.MEDIA_STORAGE_MODE !== "local" ||
    !env.PAYLOAD_MIGRATING ||
    env.SKIP_ENV_VALIDATION
  ) {
    throw new Error(
      "Integration tests require migration mode, local media, and full environment validation.",
    );
  }
}

function createReviewData(slug: string, status: "draft" | "published") {
  return {
    body: buildEditorState({ text: `Integration body for ${slug}.` }),
    coverImage: "https://example.com/integration-cover.jpg",
    excerpt: `Integration excerpt for ${slug}.`,
    gameTitle: "Integration Game",
    publishedAt: "2026-09-01T00:00:00.000Z",
    rating: 8,
    readingTime: "5 min read",
    slug,
    status,
    tags: [{ label: "Integration" }],
    title: `Integration ${status} review`,
  };
}

beforeAll(async () => {
  assertDisposableDatabase();

  const [{ getPayload }, { default: config }] = await Promise.all([
    import("payload"),
    import("../../payload.config"),
  ]);

  payload = await getPayload({ config });

  await payload.create({
    collection: "users",
    data: {
      email: "integration@example.com",
      password: "integration-test-password-1234",
    },
    overrideAccess: true,
  });

  const login = await payload.login({
    collection: "users",
    data: {
      email: "integration@example.com",
      password: "integration-test-password-1234",
    },
  });

  if (!login.user) {
    throw new Error("Integration editor login did not return a user.");
  }

  authenticatedUser = login.user;
});

afterAll(async () => {
  await payload?.destroy();
});

describe("fresh PostgreSQL migrations", () => {
  it("records every registered migration exactly once", async () => {
    const result = await payload.db.pool.query<{ name: string }>(
      'SELECT "name" FROM "payload_migrations" ORDER BY "id"',
    );

    expect(result.rows.map(({ name }) => name)).toEqual(
      migrations.map(({ name }) => name),
    );
  });

  it("creates the current Media-only content schema", async () => {
    const tables = await payload.db.pool.query<{ table_name: string }>(
      `SELECT "table_name"
       FROM "information_schema"."tables"
       WHERE "table_schema" = 'public'`,
    );
    const tableNames = new Set(tables.rows.map(({ table_name }) => table_name));

    expect([...tableNames]).toEqual(
      expect.arrayContaining(["users", "media", "tools", "reviews", "games"]),
    );

    const coverColumn = await payload.db.pool.query<{ is_nullable: string }>(
      `SELECT "is_nullable"
       FROM "information_schema"."columns"
       WHERE "table_schema" = 'public'
         AND "table_name" = 'games'
         AND "column_name" = 'cover_id'`,
    );

    expect(coverColumn.rows).toEqual([{ is_nullable: "NO" }]);

    const legacyColumns = await payload.db.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS "count"
       FROM "information_schema"."columns"
       WHERE "table_schema" = 'public'
         AND "table_name" = 'games'
         AND "column_name" IN ('cover_src', 'cover_alt', 'cover_width', 'cover_height')`,
    );

    expect(legacyColumns.rows).toEqual([{ count: "0" }]);
  });
});

describe("Payload access against PostgreSQL", () => {
  it("hides drafts from anonymous readers and exposes them to the editor", async () => {
    await payload.create({
      collection: "reviews",
      data: createReviewData("integration-published", "published"),
      overrideAccess: false,
      user: authenticatedUser,
    });
    await payload.create({
      collection: "reviews",
      data: createReviewData("integration-draft", "draft"),
      overrideAccess: false,
      user: authenticatedUser,
    });

    const anonymousReviews = await payload.find({
      collection: "reviews",
      limit: 10,
      overrideAccess: false,
      where: {
        slug: {
          in: ["integration-published", "integration-draft"],
        },
      },
    });
    const editorReviews = await payload.find({
      collection: "reviews",
      limit: 10,
      overrideAccess: false,
      user: authenticatedUser,
      where: {
        slug: {
          in: ["integration-published", "integration-draft"],
        },
      },
    });

    expect(anonymousReviews.docs.map(({ slug }) => slug)).toEqual([
      "integration-published",
    ]);
    expect(editorReviews.docs.map(({ slug }) => slug).sort()).toEqual([
      "integration-draft",
      "integration-published",
    ]);
  });

  it("rejects anonymous writes and allows authenticated create, update, and delete", async () => {
    await expect(
      payload.create({
        collection: "reviews",
        data: createReviewData("anonymous-create", "published"),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 });

    const review = await payload.create({
      collection: "reviews",
      data: createReviewData("authenticated-write", "draft"),
      overrideAccess: false,
      user: authenticatedUser,
    });

    await expect(
      payload.update({
        collection: "reviews",
        data: { title: "Anonymous update" },
        id: review.id,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 });

    const updatedReview = await payload.update({
      collection: "reviews",
      data: { title: "Authenticated update" },
      id: review.id,
      overrideAccess: false,
      user: authenticatedUser,
    });

    expect(updatedReview.title).toBe("Authenticated update");

    await expect(
      payload.delete({
        collection: "reviews",
        id: review.id,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 });

    const deletedReview = await payload.delete({
      collection: "reviews",
      id: review.id,
      overrideAccess: false,
      user: authenticatedUser,
    });

    expect(deletedReview.id).toBe(review.id);
  });
});
