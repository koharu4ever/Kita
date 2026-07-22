import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM "games"
        WHERE "cover_id" IS NULL
      ) THEN
        RAISE EXCEPTION 'Cannot remove legacy game cover fields: at least one game has no Media cover.';
      END IF;
    END
    $$;

    ALTER TABLE "games" ALTER COLUMN "cover_id" SET NOT NULL;
    ALTER TABLE "games" DROP COLUMN "cover_src";
    ALTER TABLE "games" DROP COLUMN "cover_alt";
    ALTER TABLE "games" DROP COLUMN "cover_width";
    ALTER TABLE "games" DROP COLUMN "cover_height";
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "games" ADD COLUMN "cover_src" varchar;
    ALTER TABLE "games" ADD COLUMN "cover_alt" varchar;
    ALTER TABLE "games" ADD COLUMN "cover_width" numeric;
    ALTER TABLE "games" ADD COLUMN "cover_height" numeric;

    UPDATE "games"
    SET
      "cover_src" = COALESCE("media"."sizes_display_url", "media"."url"),
      "cover_alt" = "media"."alt",
      "cover_width" = COALESCE("media"."sizes_display_width", "media"."width"),
      "cover_height" = COALESCE("media"."sizes_display_height", "media"."height")
    FROM "media"
    WHERE "games"."cover_id" = "media"."id";

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM "games"
        WHERE "cover_src" IS NULL
          OR "cover_alt" IS NULL
          OR "cover_width" IS NULL
          OR "cover_height" IS NULL
      ) THEN
        RAISE EXCEPTION 'Cannot restore legacy game cover fields from Media metadata.';
      END IF;
    END
    $$;

    ALTER TABLE "games" ALTER COLUMN "cover_src" SET NOT NULL;
    ALTER TABLE "games" ALTER COLUMN "cover_alt" SET NOT NULL;
    ALTER TABLE "games" ALTER COLUMN "cover_width" SET NOT NULL;
    ALTER TABLE "games" ALTER COLUMN "cover_height" SET NOT NULL;
    ALTER TABLE "games" ALTER COLUMN "cover_id" DROP NOT NULL;
  `);
}
