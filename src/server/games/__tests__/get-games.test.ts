import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPayloadClientMock, mockEnv } = vi.hoisted(() => ({
  getPayloadClientMock: vi.fn(),
  mockEnv: {
    NODE_ENV: "development" as "development" | "production" | "test",
  },
}));

vi.mock("@/config/env", () => ({ env: mockEnv }));
vi.mock("@/server/payload/get-payload", () => ({
  getPayloadClient: getPayloadClientMock,
}));

import {
  gameItems,
  getGameBySlug as getFallbackGameBySlug,
} from "@/features/games/data/game-items";
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
    mockEnv.NODE_ENV = "development";
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

  it("uses local fallback when development data is empty", async () => {
    arrangeFind([]);

    await expect(getGames()).resolves.toBe(gameItems);
  });

  it("returns a real empty result when production data is empty", async () => {
    mockEnv.NODE_ENV = "production";
    arrangeFind([]);

    await expect(getGames()).resolves.toEqual([]);
  });

  it("uses local fallback when development Payload throws", async () => {
    const error = new Error("Payload unavailable");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getGames()).resolves.toBe(gameItems);
  });

  it("rethrows production Payload errors", async () => {
    const error = new Error("Payload unavailable");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockEnv.NODE_ENV = "production";
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getGames()).rejects.toBe(error);
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

  it("uses the matching development fallback when a slug is missing", async () => {
    arrangeFind([]);

    await expect(getGameBySlug("white-album-2")).resolves.toBe(
      getFallbackGameBySlug("white-album-2"),
    );
  });

  it("returns undefined for a missing production slug", async () => {
    mockEnv.NODE_ENV = "production";
    arrangeFind([]);

    await expect(getGameBySlug("missing-game")).resolves.toBeUndefined();
  });
});
