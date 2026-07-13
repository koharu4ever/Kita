import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function stubValidRuntimeEnv() {
  vi.stubEnv(
    "DATABASE_URI",
    "postgres://postgres:postgres@localhost:5432/kita",
  );
  vi.stubEnv("ENABLE_DEV_SEED", "false");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  vi.stubEnv("NODE_ENV", "test");
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

    expect(env.ENABLE_DEV_SEED).toBe(false);
  });

  it("validates and transforms values when the switch is false", async () => {
    const { env } = await loadEnv("false");

    expect(env.ENABLE_DEV_SEED).toBe(false);
  });

  it("skips validation only when the switch is exactly true", async () => {
    const { env } = await loadEnv("true");

    expect(env.ENABLE_DEV_SEED as unknown).toBe("false");
  });
});
