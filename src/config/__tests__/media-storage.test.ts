import { describe, expect, it } from "vitest";

import {
  buildMediaPublicURL,
  resolveMediaStorageConfig,
} from "@/config/media-storage";

describe("resolveMediaStorageConfig", () => {
  it("uses local storage by default outside production", () => {
    expect(resolveMediaStorageConfig({ NODE_ENV: "development" })).toEqual({
      mode: "local",
    });
  });

  it("uses a safe local placeholder during build-time validation skips", () => {
    expect(
      resolveMediaStorageConfig({
        NODE_ENV: "production",
        SKIP_ENV_VALIDATION: "true",
      }),
    ).toEqual({ mode: "local" });
  });

  it("refuses local media storage in production", () => {
    expect(() =>
      resolveMediaStorageConfig({
        MEDIA_STORAGE_MODE: "local",
        NODE_ENV: "production",
      }),
    ).toThrow(/must be r2 in production/);
  });

  it("requires every R2 setting when R2 storage is selected", () => {
    expect(() =>
      resolveMediaStorageConfig({
        MEDIA_STORAGE_MODE: "r2",
        NODE_ENV: "production",
      }),
    ).toThrow();
  });

  it("normalizes a complete R2 configuration", () => {
    expect(
      resolveMediaStorageConfig({
        MEDIA_R2_ACCESS_KEY_ID: "test-access-key",
        MEDIA_R2_BUCKET: "kita-media",
        MEDIA_R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
        MEDIA_R2_PUBLIC_URL: "https://media.example.com/",
        MEDIA_R2_SECRET_ACCESS_KEY: "test-secret-key",
        MEDIA_STORAGE_MODE: "r2",
        NODE_ENV: "production",
      }),
    ).toEqual({
      accessKeyId: "test-access-key",
      bucket: "kita-media",
      endpoint: "https://account.r2.cloudflarestorage.com",
      mode: "r2",
      publicURL: "https://media.example.com",
      secretAccessKey: "test-secret-key",
    });
  });
});

describe("buildMediaPublicURL", () => {
  it("joins the public domain, optional prefix, and filename", () => {
    expect(
      buildMediaPublicURL("https://media.example.com", "cover.webp", "media"),
    ).toBe("https://media.example.com/media/cover.webp");
  });
});
