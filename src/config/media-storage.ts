import { z } from "zod";

export type LocalMediaStorageConfig = {
  mode: "local";
};

export type R2MediaStorageConfig = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  mode: "r2";
  publicURL: string;
  secretAccessKey: string;
};

export type MediaStorageConfig = LocalMediaStorageConfig | R2MediaStorageConfig;

const httpsURL = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === "https:", {
    message: "Must use HTTPS.",
  });

const r2MediaStorageSchema = z.object({
  accessKeyId: z.string().min(1),
  bucket: z.string().min(1),
  endpoint: httpsURL,
  mode: z.literal("r2"),
  publicURL: httpsURL.transform((value) => value.replace(/\/+$/, "")),
  secretAccessKey: z.string().min(1),
});

export function resolveMediaStorageConfig(
  runtimeEnv: NodeJS.ProcessEnv,
): MediaStorageConfig {
  if (runtimeEnv.SKIP_ENV_VALIDATION === "true") {
    return { mode: "local" };
  }

  const mode = runtimeEnv.MEDIA_STORAGE_MODE ?? "local";

  if (mode === "local") {
    if (runtimeEnv.NODE_ENV === "production") {
      throw new Error(
        "MEDIA_STORAGE_MODE must be r2 in production; refusing ephemeral local media storage.",
      );
    }

    return { mode: "local" };
  }

  if (mode !== "r2") {
    throw new Error('MEDIA_STORAGE_MODE must be either "local" or "r2".');
  }

  return r2MediaStorageSchema.parse({
    accessKeyId: runtimeEnv.MEDIA_R2_ACCESS_KEY_ID,
    bucket: runtimeEnv.MEDIA_R2_BUCKET,
    endpoint: runtimeEnv.MEDIA_R2_ENDPOINT,
    mode,
    publicURL: runtimeEnv.MEDIA_R2_PUBLIC_URL,
    secretAccessKey: runtimeEnv.MEDIA_R2_SECRET_ACCESS_KEY,
  });
}

export function buildMediaPublicURL(
  publicURL: string,
  filename: string,
  prefix?: string,
) {
  const key = prefix ? `${prefix}/${filename}` : filename;
  return `${publicURL}/${key}`;
}
