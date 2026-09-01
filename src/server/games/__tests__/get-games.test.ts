import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPayloadClientMock } = vi.hoisted(() => ({
  getPayloadClientMock: vi.fn(),
}));
vi.mock("@/server/payload/get-payload", () => ({
  getPayloadClient: getPayloadClientMock,
}));

import { getGameBySlug, getGames } from "@/server/games/get-games";
import { createPayloadGameDocument } from "@/testing/fixtures/payload-documents";

function arrangeFind(docs: unknown[]) {
  const find = vi.fn().mockResolvedValue({ docs });
  getPayloadClientMock.mockResolvedValue({ find });
  return find;
}

describe("getGames", () => {
  beforeEach(() => {
    getPayloadClientMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mapped published games", async () => {
    const find = arrangeFind([
      createPayloadGameDocument({ title: "Payload Game" }),
    ]);

    const result = await getGames();

    expect(result[0]).toMatchObject({
      slug: "test-game",
      title: "Payload Game",
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "games",
        depth: 1,
        overrideAccess: false,
        where: { publicationStatus: { equals: "published" } },
      }),
    );
  });

  it("returns an empty collection when Payload has no published games", async () => {
    arrangeFind([]);

    await expect(getGames()).resolves.toEqual([]);
  });

  it("rethrows Payload errors so the route error boundary can respond", async () => {
    const error = new Error("Payload unavailable");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getGames()).rejects.toBe(error);
    expect(log).toHaveBeenCalledWith(
      "Failed to load games from Payload.",
      error,
    );
  });

  it("returns a mapped game by slug", async () => {
    const find = arrangeFind([
      createPayloadGameDocument({ slug: "payload-game" }),
    ]);

    const result = await getGameBySlug("payload-game");

    expect(result?.slug).toBe("payload-game");
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 1,
        overrideAccess: false,
        where: {
          and: [
            { slug: { equals: "payload-game" } },
            { publicationStatus: { equals: "published" } },
          ],
        },
      }),
    );
  });

  it("returns undefined for a missing slug", async () => {
    arrangeFind([]);

    await expect(getGameBySlug("missing-game")).resolves.toBeUndefined();
  });

  it("rethrows detail query errors so the route error boundary can respond", async () => {
    const error = new Error("Payload unavailable");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getGameBySlug("test-game")).rejects.toBe(error);
    expect(log).toHaveBeenCalledWith(
      'Failed to load game "test-game" from Payload.',
      error,
    );
  });
});
