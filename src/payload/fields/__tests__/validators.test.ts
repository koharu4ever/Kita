import { describe, expect, it } from "vitest";

import {
  validateHttpUrl,
  validateRequiredText,
  validateRequiredTextarea,
  validateSlug,
} from "../validators";

const validationOptions = {
  req: {
    payload: { config: {} },
    t: (key: string) => key,
  },
  required: true,
} as unknown as Parameters<typeof validateSlug>[1];
const textareaValidationOptions = validationOptions as unknown as Parameters<
  typeof validateRequiredTextarea
>[1];

describe("validateSlug", () => {
  it.each(["game", "game-2", "2026", "a1-b2-c3"])(
    "accepts %s",
    async (value) => {
      await expect(validateSlug(value, validationOptions)).resolves.toBe(true);
    },
  );

  it.each([
    "Game",
    "game_name",
    "game name",
    "game--name",
    "-game",
    "game-",
    "游戏",
  ])("rejects %s", async (value) => {
    await expect(validateSlug(value, validationOptions)).resolves.toBeTypeOf(
      "string",
    );
  });

  it.each([undefined, "", " ", "\t\n"])(
    "rejects missing or whitespace-only values",
    async (value) => {
      await expect(validateSlug(value, validationOptions)).resolves.toBeTypeOf(
        "string",
      );
    },
  );
});

describe("validateRequiredText", () => {
  it.each(["Game", "  Game  ", "游戏"])("accepts %s", async (value) => {
    await expect(validateRequiredText(value, validationOptions)).resolves.toBe(
      true,
    );
  });

  it.each([undefined, null, "", " ", "\t\n"])(
    "rejects missing or whitespace-only values",
    async (value) => {
      await expect(
        validateRequiredText(value, validationOptions),
      ).resolves.toBeTypeOf("string");
    },
  );

  it("preserves Payload length validation", async () => {
    const boundedOptions = {
      ...validationOptions,
      maxLength: 5,
      minLength: 3,
    } as Parameters<typeof validateRequiredText>[1];

    await expect(
      validateRequiredText("ab", boundedOptions),
    ).resolves.toBeTypeOf("string");
    await expect(
      validateRequiredText("abcdef", boundedOptions),
    ).resolves.toBeTypeOf("string");
    await expect(validateRequiredText("game", boundedOptions)).resolves.toBe(
      true,
    );
  });
});

describe("validateRequiredTextarea", () => {
  it("accepts content and rejects whitespace-only content", async () => {
    await expect(
      validateRequiredTextarea("A useful summary", textareaValidationOptions),
    ).resolves.toBe(true);
    await expect(
      validateRequiredTextarea("  ", textareaValidationOptions),
    ).resolves.toBeTypeOf("string");
  });
});

describe("validateHttpUrl", () => {
  it.each([
    "https://example.com",
    "http://localhost:3000/path?query=value",
    "https://例子.测试/path",
  ])("accepts %s", async (value) => {
    await expect(validateHttpUrl(value, validationOptions)).resolves.toBe(true);
  });

  it.each([
    "/relative/path",
    "example.com",
    "ftp://example.com/file",
    "mailto:test@example.com",
    "not a url",
    " https://example.com ",
  ])("rejects %s", async (value) => {
    await expect(validateHttpUrl(value, validationOptions)).resolves.toBeTypeOf(
      "string",
    );
  });

  it.each([undefined, "", " ", "\t\n"])(
    "rejects missing or whitespace-only values",
    async (value) => {
      await expect(
        validateHttpUrl(value, validationOptions),
      ).resolves.toBeTypeOf("string");
    },
  );
});
