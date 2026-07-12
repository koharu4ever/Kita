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

import { toolkitItems } from "@/features/tools/data/toolkit-items";
import { getTools } from "@/server/tools/get-tools";
import { createPayloadToolDocument } from "@/testing/fixtures/payload-documents";

function arrangeFind(docs: unknown[]) {
  const find = vi.fn().mockResolvedValue({ docs });
  getPayloadClientMock.mockResolvedValue({ find });
  return find;
}

describe("getTools", () => {
  beforeEach(() => {
    getPayloadClientMock.mockReset();
    mockEnv.NODE_ENV = "development";
  });

  it("returns mapped Payload documents and preserves the public access query", async () => {
    const find = arrangeFind([
      createPayloadToolDocument({ id: 7, title: "Payload Tool" }),
    ]);

    const result = await getTools();

    expect(result[0]).toMatchObject({ id: "7", title: "Payload Tool" });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "tools",
        overrideAccess: false,
      }),
    );
  });

  it("uses local fallback when development data is empty", async () => {
    arrangeFind([]);

    await expect(getTools()).resolves.toBe(toolkitItems);
  });

  it("returns a real empty result when production data is empty", async () => {
    mockEnv.NODE_ENV = "production";
    arrangeFind([]);

    await expect(getTools()).resolves.toEqual([]);
  });

  it("uses local fallback when development Payload throws", async () => {
    const error = new Error("Payload unavailable");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getTools()).resolves.toBe(toolkitItems);
    expect(warning).toHaveBeenCalledWith(
      "Failed to load tools from Payload. Using local fallback.",
      error,
    );
  });

  it("rethrows production Payload errors instead of hiding them", async () => {
    const error = new Error("Payload unavailable");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEnv.NODE_ENV = "production";
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getTools()).rejects.toBe(error);
    expect(log).toHaveBeenCalledWith(
      "Failed to load tools from Payload.",
      error,
    );
  });
});
