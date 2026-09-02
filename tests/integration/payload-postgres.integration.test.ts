import { buildEditorState } from "@payloadcms/richtext-lexical";
import type { Payload, TypedUser } from "payload";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { env } from "@/config/env";
import { migrations } from "@/migrations";
import { GET as getHealth } from "@/app/api/health/route";

const expectedDatabaseName = "kita_integration";
const allowedDatabaseHosts = new Set(["127.0.0.1", "localhost", "::1"]);

let payload: Payload;
let authenticatedUser: TypedUser;
let mediaDirectory: string | undefined;

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

  const resolvedConfig = await config;
  const mediaConfig = resolvedConfig.collections.find(
    ({ slug }) => slug === "media",
  );
  if (!mediaConfig?.upload) throw new Error("Media upload config is missing");
  mediaDirectory = await mkdtemp(path.join(tmpdir(), "kita-authoring-test-"));
  mediaConfig.upload.staticDir = mediaDirectory;
  payload = await getPayload({ config: resolvedConfig });

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
  if (
    mediaDirectory &&
    path.dirname(mediaDirectory) === tmpdir() &&
    path.basename(mediaDirectory).startsWith("kita-authoring-test-")
  ) {
    await rm(mediaDirectory, { recursive: true, force: true });
  }
});

describe("rich text authoring against PostgreSQL", () => {
  it("round-trips uploaded Media and per-use captions in Review and Game bodies", async () => {
    const image = await sharp(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="40"><rect width="64" height="40" fill="#4488bb"/></svg>',
      ),
    )
      .png()
      .toBuffer();
    const media = await payload.create({
      collection: "media",
      data: { alt: "Integration illustration" },
      file: {
        data: image,
        mimetype: "image/png",
        name: "authoring.png",
        size: image.length,
      },
      overrideAccess: false,
      user: authenticatedUser,
    });
    const body = buildEditorState({ text: "Article with an illustration." });
    body.root.children.push({
      type: "upload",
      version: 3,
      relationTo: "media",
      value: media.id,
      fields: { caption: "Saved caption" },
    } as unknown as (typeof body.root.children)[number]);
    const review = await payload.create({
      collection: "reviews",
      data: { ...createReviewData("rich-text-authoring", "published"), body },
      overrideAccess: false,
      user: authenticatedUser,
    });
    const game = await payload.create({
      collection: "games",
      data: {
        title: "Authoring game",
        slug: "authoring-game",
        developer: "Test studio",
        releaseDate: "2026",
        summary: "Test game summary",
        publicationStatus: "published",
        playStatus: "planned",
        cover: media.id,
        body,
      },
      overrideAccess: false,
      user: authenticatedUser,
    });

    for (const [collection, id] of [
      ["reviews", review.id],
      ["games", game.id],
    ] as const) {
      const saved = await payload.findByID({
        collection,
        id,
        depth: 1,
        overrideAccess: false,
      });
      expect(saved.body.root.children).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "upload",
            fields: { caption: "Saved caption" },
            value: expect.objectContaining({
              id: media.id,
              alt: "Integration illustration",
              mimeType: "image/png",
            }),
          }),
        ]),
      );
    }

    const updatedBody = buildEditorState({ text: "Revised article." });
    updatedBody.root.children.push({
      type: "paragraph",
      version: 1,
      format: "",
      indent: 0,
      direction: "ltr",
      children: [
        {
          type: "link",
          version: 3,
          format: "",
          indent: 0,
          direction: "ltr",
          fields: {
            linkType: "internal",
            doc: { relationTo: "games", value: game.id },
          },
          children: [
            {
              type: "text",
              version: 1,
              text: "Related game",
              format: 0,
              detail: 0,
              mode: "normal",
              style: "",
            },
          ],
        },
      ],
    } as unknown as (typeof updatedBody.root.children)[number]);
    updatedBody.root.children.push({
      type: "upload",
      version: 3,
      relationTo: "media",
      value: media.id,
      fields: { caption: "Revised caption" },
    } as unknown as (typeof updatedBody.root.children)[number]);
    await payload.update({
      collection: "reviews",
      id: review.id,
      data: { body: updatedBody },
      overrideAccess: false,
      user: authenticatedUser,
    });
    const reloaded = await payload.findByID({
      collection: "reviews",
      id: review.id,
      depth: 1,
      overrideAccess: false,
    });
    expect(reloaded.body.root.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fields: { caption: "Revised caption" } }),
        expect.objectContaining({
          children: [
            expect.objectContaining({
              type: "link",
              fields: expect.objectContaining({
                doc: {
                  relationTo: "games",
                  value: expect.objectContaining({
                    id: game.id,
                    slug: game.slug,
                    publicationStatus: "published",
                  }),
                },
              }),
            }),
          ],
        }),
      ]),
    );
  });

  it("round-trips Tools directory fields without turning descriptions into rich text", async () => {
    const tool = await payload.create({
      collection: "tools",
      data: {
        title: "Integration tool",
        description: "A plain-text tool summary.",
        url: "https://example.com/tool",
        category: "capture",
        sortOrder: 20,
      },
      overrideAccess: false,
      user: authenticatedUser,
    });
    const saved = await payload.findByID({
      collection: "tools",
      id: tool.id,
      overrideAccess: false,
    });
    expect(saved).toMatchObject({
      description: "A plain-text tool summary.",
      category: "capture",
      sortOrder: 20,
    });
  });
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

describe("application readiness against PostgreSQL", () => {
  it("reports ready through the public health route", async () => {
    const response = await getHealth();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "ready",
      database: "reachable",
    });
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
