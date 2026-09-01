import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function stubValidRuntimeEnv() {
  vi.stubEnv(
    "DATABASE_URI",
    "postgres://postgres:postgres@localhost:5432/kita",
  );
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("PAYLOAD_MIGRATING", "false");
  vi.stubEnv("PAYLOAD_SECRET", "test-payload-secret-at-least-32-characters");
}

async function loadEnv(skipValidation: string | undefined) {
  vi.stubEnv("SKIP_ENV_VALIDATION", skipValidation);
  vi.resetModules();

  return import("../env");
}

describe("environment validation switch", () => {
  beforeEach(() => {
    stubValidRuntimeEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("validates and transforms values when the switch is unset", async () => {
    const { env } = await loadEnv(undefined);

    expect(env.PAYLOAD_MIGRATING).toBe(false);
  });

  it("validates and transforms values when the switch is false", async () => {
    const { env } = await loadEnv("false");

    expect(env.PAYLOAD_MIGRATING).toBe(false);
  });

  it("skips validation only when the switch is exactly true", async () => {
    const { env } = await loadEnv("true");

    expect(env.PAYLOAD_MIGRATING as unknown).toBe("false");
  });
});
