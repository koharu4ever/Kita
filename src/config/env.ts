import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URI: z.string().url(),
    ENABLE_DEV_SEED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    MEDIA_R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    MEDIA_R2_BUCKET: z.string().min(1).optional(),
    MEDIA_R2_ENDPOINT: z.string().url().optional(),
    MEDIA_R2_PUBLIC_URL: z.string().url().optional(),
    MEDIA_R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    MEDIA_STORAGE_MODE: z.enum(["local", "r2"]).default("local"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PAYLOAD_SECRET: z.string().min(32),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URI: process.env.DATABASE_URI,
    ENABLE_DEV_SEED: process.env.ENABLE_DEV_SEED,
    MEDIA_R2_ACCESS_KEY_ID: process.env.MEDIA_R2_ACCESS_KEY_ID,
    MEDIA_R2_BUCKET: process.env.MEDIA_R2_BUCKET,
    MEDIA_R2_ENDPOINT: process.env.MEDIA_R2_ENDPOINT,
    MEDIA_R2_PUBLIC_URL: process.env.MEDIA_R2_PUBLIC_URL,
    MEDIA_R2_SECRET_ACCESS_KEY: process.env.MEDIA_R2_SECRET_ACCESS_KEY,
    MEDIA_STORAGE_MODE: process.env.MEDIA_STORAGE_MODE,
    NODE_ENV: process.env.NODE_ENV,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  emptyStringAsUndefined: true,
});
