import { beforeEach, describe, expect, it, vi } from "vitest";

import sitemap, { dynamic } from "@/app/sitemap";
import { getSitemapDetails } from "@/server/seo/get-sitemap-details";

const { find } = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock("@/server/payload/get-payload", () => ({
  getPayloadClient: async () => ({ find }),
}));

const doc = (slug: string) => ({ slug, updatedAt: "2026-10-01T00:00:00Z" });
const page = (slugs: string[], nextPage: number | null = null) => ({
  docs: slugs.map(doc),
  hasNextPage: nextPage !== null,
  nextPage,
});

beforeEach(() => {
  find.mockReset();
});

describe("public sitemap", () => {
  it("paginates both collections, enforces public access, and excludes invalid routes", async () => {
    find
      .mockResolvedValueOnce(page(["first", "preview", "../admin"], 2))
      .mockResolvedValueOnce(page(["first", "last"]))
      .mockResolvedValueOnce(page(["P3F", "random", "preview"], 2))
      .mockResolvedValueOnce(page(["final-review"]));
    const result = await getSitemapDetails();
    expect(result.map((entry) => entry.url)).toEqual([
      "https://kita.kral-koharu.com/games/first",
      "https://kita.kral-koharu.com/games/last",
      "https://kita.kral-koharu.com/reviews/P3F",
      "https://kita.kral-koharu.com/reviews/final-review",
    ]);
    expect(result[0].lastModified).toEqual(new Date(doc("first").updatedAt));
    for (const [index, [query]] of find.mock.calls.entries()) {
      expect(query).toMatchObject({
        overrideAccess: false,
        depth: 0,
        limit: 100,
        sort: "id",
        page: index % 2 === 0 ? 1 : 2,
        where:
          index < 2
            ? { publicationStatus: { equals: "published" } }
            : { status: { equals: "published" } },
      });
    }
  });

  it("keeps the five static URLs and rereads publication state on each request", async () => {
    expect(dynamic).toBe("force-dynamic");
    find
      .mockResolvedValueOnce(page(["published"]))
      .mockResolvedValueOnce(page([]));
    expect(await sitemap()).toHaveLength(6);
    find.mockResolvedValue(page([]));
    const result = await sitemap();
    expect(result).toHaveLength(5);
    expect(result.some((entry) => entry.url.endsWith("/published"))).toBe(
      false,
    );
  });

  it("fails instead of publishing an incomplete sitemap on a database error", async () => {
    find.mockRejectedValue(new Error("database unavailable"));
    await expect(sitemap()).rejects.toThrow("database unavailable");
  });

  it("rejects non-advancing pagination", async () => {
    find.mockResolvedValue(page(["first"], 1));
    await expect(getSitemapDetails()).rejects.toThrow(
      "Invalid sitemap pagination",
    );
  });
});
