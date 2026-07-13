import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URI: z.string().url(),
    ENABLE_DEV_SEED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
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
    NODE_ENV: process.env.NODE_ENV,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  emptyStringAsUndefined: true,
});
