import { beforeEach, describe, expect, it, vi } from "vitest";

const environment = vi.hoisted(() => ({ NODE_ENV: "development" }));

vi.mock("@/config/env", () => ({ env: environment }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import GamesWindowPreviewPage, {
  metadata,
} from "@/app/(site)/games/preview/page";

describe("Games window development preview", () => {
  beforeEach(() => {
    environment.NODE_ENV = "development";
  });

  it("is available in development and is not indexable", () => {
    expect(GamesWindowPreviewPage()).toBeTruthy();
    expect(metadata.robots).toEqual({ follow: false, index: false });
  });

  it.each(["production", "test"])("returns not found in %s", (mode) => {
    environment.NODE_ENV = mode;
    expect(() => GamesWindowPreviewPage()).toThrow("NEXT_NOT_FOUND");
  });
});
