import { describe, expect, it, vi } from "vitest";

import {
  upsertGameSeeds,
  type GameSeedClient,
  type SeedGame,
} from "@/server/games/seed-games";
import { createPayloadGameDocument } from "@/testing/fixtures/payload-documents";

function createSeedGame(overrides: Partial<SeedGame> = {}): SeedGame {
  return {
    ...createPayloadGameDocument(),
    publicationStatus: "published",
    ...overrides,
  };
}

function createClient() {
  return {
    create: vi.fn(),
    find: vi.fn(),
    update: vi.fn(),
  };
}

describe("upsertGameSeeds", () => {
  it("updates an existing game with the same slug", async () => {
    const client = createClient();
    const game = createSeedGame({ slug: "existing-game" });
    const savedGame = {
      id: 7,
      slug: "existing-game",
      title: "Updated Game",
    };
    client.find.mockResolvedValue({ docs: [{ id: 7 }] });
    client.update.mockResolvedValue(savedGame);

    const result = await upsertGameSeeds(client as unknown as GameSeedClient, [
      game,
    ]);

    expect(client.update).toHaveBeenCalledWith({
      collection: "games",
      data: game,
      id: 7,
    });
    expect(client.create).not.toHaveBeenCalled();
    expect(result).toEqual([savedGame]);
  });

  it("creates a game when its slug does not exist", async () => {
    const client = createClient();
    const game = createSeedGame({ slug: "new-game" });
    const savedGame = { id: 8, slug: "new-game", title: "New Game" };
    client.find.mockResolvedValue({ docs: [] });
    client.create.mockResolvedValue(savedGame);

    const result = await upsertGameSeeds(client as unknown as GameSeedClient, [
      game,
    ]);

    expect(client.create).toHaveBeenCalledWith({
      collection: "games",
      data: game,
    });
    expect(client.update).not.toHaveBeenCalled();
    expect(result).toEqual([savedGame]);
  });

  it("only upserts supplied games and has no delete capability", async () => {
    const client = createClient();
    const existingGame = createSeedGame({ slug: "existing-game" });
    const newGame = createSeedGame({ slug: "new-game", title: "New Game" });

    client.find
      .mockResolvedValueOnce({ docs: [{ id: 7 }] })
      .mockResolvedValueOnce({ docs: [] });
    client.update.mockResolvedValue({
      id: 7,
      slug: "existing-game",
      title: "Test Game",
    });
    client.create.mockResolvedValue({
      id: 8,
      slug: "new-game",
      title: "New Game",
    });

    const result = await upsertGameSeeds(client as unknown as GameSeedClient, [
      existingGame,
      newGame,
    ]);

    expect(client.find).toHaveBeenCalledTimes(2);
    expect(client.update).toHaveBeenCalledTimes(1);
    expect(client.create).toHaveBeenCalledTimes(1);
    expect(Object.hasOwn(client, "delete")).toBe(false);
    expect(result.map((game) => game.slug)).toEqual([
      "existing-game",
      "new-game",
    ]);
  });
});
