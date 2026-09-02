import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPayloadClientMock } = vi.hoisted(() => ({
  getPayloadClientMock: vi.fn(),
}));
vi.mock("@/server/payload/get-payload", () => ({
  getPayloadClient: getPayloadClientMock,
}));

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
        pagination: false,
        sort: "sortOrder",
      }),
    );
  });

  it("returns an empty collection when Payload has no tools", async () => {
    arrangeFind([]);

    await expect(getTools()).resolves.toEqual([]);
  });

  it("rethrows Payload errors so the route error boundary can respond", async () => {
    const error = new Error("Payload unavailable");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getTools()).rejects.toBe(error);
    expect(log).toHaveBeenCalledWith(
      "Failed to load tools from Payload.",
      error,
    );
  });
});
