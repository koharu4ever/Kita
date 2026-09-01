import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPayloadClientMock, queryMock } = vi.hoisted(() => ({
  getPayloadClientMock: vi.fn(),
  queryMock: vi.fn(),
}));

vi.mock("@/server/payload/get-payload", () => ({
  getPayloadClient: getPayloadClientMock,
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    getPayloadClientMock.mockResolvedValue({
      db: { pool: { query: queryMock } },
    });
    queryMock.mockResolvedValue({ rows: [{ result: 1 }] });
  });

  it("reports ready only after PostgreSQL answers", async () => {
    const response = await GET();

    expect(queryMock).toHaveBeenCalledWith("SELECT 1");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "ready",
      database: "reachable",
    });
  });

  it("returns a safe unavailable response when initialization fails", async () => {
    getPayloadClientMock.mockRejectedValue(
      new Error("postgres://user:secret@example.invalid/kita"),
    );

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(JSON.parse(body)).toEqual({
      status: "unavailable",
      database: "unreachable",
    });
    expect(body).not.toContain("secret");
  });

  it("returns unavailable when the database probe fails", async () => {
    queryMock.mockRejectedValue(new Error("connection refused"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "unavailable",
      database: "unreachable",
    });
  });
});
