import { postgresAdapter } from "@payloadcms/db-postgres";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import { z } from "zod";

import { migrations } from "./src/migrations/index.ts";
import * as gamesCollection from "./src/payload/collections/games.ts";
import * as reviewsCollection from "./src/payload/collections/reviews.ts";
import * as toolsCollection from "./src/payload/collections/tools.ts";
import * as usersCollection from "./src/payload/collections/users.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const { Games } = gamesCollection;
const { Reviews } = reviewsCollection;
const { Tools } = toolsCollection;
const { Users } = usersCollection;
const skipEnvValidation = process.env.SKIP_ENV_VALIDATION === "true";

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
  collections: [Users, Tools, Reviews, Games],
  db: postgresAdapter({
    pool: {
      connectionString: payloadEnv.DATABASE_URI,
    },
    prodMigrations: migrations,
  }),
  secret: payloadEnv.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, "src/payload/payload-types.ts"),
  },
});
