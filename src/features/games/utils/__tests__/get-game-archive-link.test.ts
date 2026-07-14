import { describe, expect, it } from "vitest";

import {
  GAME_ARCHIVE_LINK_LABEL,
  getGameArchiveLink,
} from "@/features/games/utils/get-game-archive-link";

describe("getGameArchiveLink", () => {
  it("selects the archive link without depending on array order", () => {
    const archiveLink = {
      href: "https://archive.kral-koharu.com/White%20Album%202.zip",
      label: GAME_ARCHIVE_LINK_LABEL,
    };

    expect(
      getGameArchiveLink([
        { href: "https://vndb.org/v7771", label: "VNDB" },
        archiveLink,
      ]),
    ).toEqual(archiveLink);
  });

  it("matches the archive label case-insensitively and ignores whitespace", () => {
    const archiveLink = {
      href: "https://archive.kral-koharu.com/White%20Album%202.zip",
      label: "  GAME ARCHIVE  ",
    };

    expect(getGameArchiveLink([archiveLink])).toEqual(archiveLink);
  });

  it("returns undefined when a game has no archive link", () => {
    expect(
      getGameArchiveLink([{ href: "https://vndb.org/v7771", label: "VNDB" }]),
    ).toBeUndefined();
  });
});
