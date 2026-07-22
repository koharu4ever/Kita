import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { z } from "zod";

import {
  buildMediaPublicURL,
  resolveMediaStorageConfig,
} from "./src/config/media-storage.ts";
import { migrations } from "./src/migrations/index.ts";
import * as gamesCollection from "./src/payload/collections/games.ts";
import * as mediaCollection from "./src/payload/collections/media.ts";
import * as reviewsCollection from "./src/payload/collections/reviews.ts";
import * as toolsCollection from "./src/payload/collections/tools.ts";
import * as usersCollection from "./src/payload/collections/users.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const { Games } = gamesCollection;
const { Media } = mediaCollection;
const { Reviews } = reviewsCollection;
const { Tools } = toolsCollection;
const { Users } = usersCollection;
const skipEnvValidation = process.env.SKIP_ENV_VALIDATION === "true";
const mediaStorage = resolveMediaStorageConfig(process.env);

const payloadEnv = z
  .object({
    DATABASE_URI: z.string().url(),
    PAYLOAD_SECRET: z.string().min(32),
  })
  .parse(
    skipEnvValidation
      ? {
          DATABASE_URI: "postgres://postgres:postgres@postgres:5432/kita",
          PAYLOAD_SECRET: "build-time-only-payload-secret-at-least-32-chars",
        }
      : {
          DATABASE_URI: process.env.DATABASE_URI,
          PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
        },
  );

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: path.resolve(
        dirname,
        "src",
        "app",
        "(payload)",
        "admin",
        "importMap.ts",
      ),
    },
  },
  collections: [Users, Media, Tools, Reviews, Games],
  db: postgresAdapter({
    pool: {
      connectionString: payloadEnv.DATABASE_URI,
    },
    prodMigrations: migrations,
  }),
  secret: payloadEnv.PAYLOAD_SECRET,
  sharp,
  upload: {
    abortOnLimit: true,
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
    },
  },
  plugins: [
    s3Storage({
      alwaysInsertFields: true,
      bucket:
        mediaStorage.mode === "r2"
          ? mediaStorage.bucket
          : "local-media-storage-disabled",
      collections: {
        media: {
          disablePayloadAccessControl: true,
          generateFileURL: ({
            filename,
            prefix,
          }: {
            filename: string;
            prefix?: string;
          }) => {
            if (mediaStorage.mode !== "r2") {
              throw new Error(
                "R2 media URL generation was called while R2 storage is disabled.",
              );
            }

            return buildMediaPublicURL(
              mediaStorage.publicURL,
              filename,
              prefix,
            );
          },
          prefix: "media",
        },
      },
      config:
        mediaStorage.mode === "r2"
          ? {
              credentials: {
                accessKeyId: mediaStorage.accessKeyId,
                secretAccessKey: mediaStorage.secretAccessKey,
              },
              endpoint: mediaStorage.endpoint,
              forcePathStyle: true,
              region: "auto",
            }
          : {
              region: "auto",
            },
      enabled: mediaStorage.mode === "r2",
    }),
  ],
  typescript: {
    outputFile: path.resolve(
      process.cwd(),
      "src",
      "payload",
      "payload-types.ts",
    ),
  },
});
