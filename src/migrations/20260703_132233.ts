import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "games" ADD COLUMN "cover_src" varchar;
    ALTER TABLE "games" ADD COLUMN "cover_alt" varchar;
    ALTER TABLE "games" ADD COLUMN "cover_width" numeric;
    ALTER TABLE "games" ADD COLUMN "cover_height" numeric;

    UPDATE "games"
    SET
      "cover_src" = CASE "cover_key"
        WHEN 'sea-side-fragment' THEN '/home-sea-girl.jpg'
        WHEN 'night-archive' THEN '/home-night-sky.jpg'
        WHEN 'after-rain' THEN '/home-rain-harbor.jpg'
        WHEN 'sunset-field' THEN '/home-sunset-field.jpg'
        WHEN 'crimson-room' THEN '/about-bg.jpg'
        WHEN 'harbor-loop' THEN '/home-rain-harbor.jpg'
      END,
      "cover_alt" = CASE "cover_key"
        WHEN 'sea-side-fragment' THEN 'A girl standing near the blue sea'
        WHEN 'night-archive' THEN 'A deep night sky over a quiet landscape'
        WHEN 'after-rain' THEN 'Rain and harbor lights seen through a window'
        WHEN 'sunset-field' THEN 'A sunset field under warm orange light'
        WHEN 'crimson-room' THEN 'A crimson interior used as a visual novel placeholder'
        WHEN 'harbor-loop' THEN 'A rainy harbor used for a looping route placeholder'
      END,
      "cover_width" = 720,
      "cover_height" = CASE "cover_key"
        WHEN 'sea-side-fragment' THEN 960
        WHEN 'night-archive' THEN 540
        WHEN 'after-rain' THEN 1080
        WHEN 'sunset-field' THEN 900
        WHEN 'crimson-room' THEN 520
        WHEN 'harbor-loop' THEN 780
      END;

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
        RAISE EXCEPTION 'Cannot migrate Games image fields: an unknown cover_key exists';
      END IF;
    END
    $$;

    ALTER TABLE "games" ALTER COLUMN "cover_src" SET NOT NULL;
    ALTER TABLE "games" ALTER COLUMN "cover_alt" SET NOT NULL;
    ALTER TABLE "games" ALTER COLUMN "cover_width" SET NOT NULL;
    ALTER TABLE "games" ALTER COLUMN "cover_height" SET NOT NULL;
    ALTER TABLE "games" DROP COLUMN "cover_key";
    DROP TYPE "public"."enum_games_cover_key";
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_games_cover_key" AS ENUM(
      'sea-side-fragment',
      'night-archive',
      'after-rain',
      'sunset-field',
      'crimson-room',
      'harbor-loop'
    );
    ALTER TABLE "games" ADD COLUMN "cover_key" "enum_games_cover_key";

    UPDATE "games"
    SET "cover_key" = CASE
      WHEN "cover_src" = '/home-sea-girl.jpg'
        THEN 'sea-side-fragment'::"enum_games_cover_key"
      WHEN "cover_src" = '/home-night-sky.jpg'
        THEN 'night-archive'::"enum_games_cover_key"
      WHEN "cover_src" = '/home-rain-harbor.jpg' AND "cover_height" = 1080
        THEN 'after-rain'::"enum_games_cover_key"
      WHEN "cover_src" = '/home-sunset-field.jpg'
        THEN 'sunset-field'::"enum_games_cover_key"
      WHEN "cover_src" = '/about-bg.jpg'
        THEN 'crimson-room'::"enum_games_cover_key"
      WHEN "cover_src" = '/home-rain-harbor.jpg' AND "cover_height" = 780
        THEN 'harbor-loop'::"enum_games_cover_key"
    END;

    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM "games" WHERE "cover_key" IS NULL) THEN
        RAISE EXCEPTION 'Cannot roll back Games image fields after cover data changed';
      END IF;
    END
    $$;

    ALTER TABLE "games" ALTER COLUMN "cover_key" SET NOT NULL;
    ALTER TABLE "games" DROP COLUMN "cover_src";
    ALTER TABLE "games" DROP COLUMN "cover_alt";
    ALTER TABLE "games" DROP COLUMN "cover_width";
    ALTER TABLE "games" DROP COLUMN "cover_height";
  `);
}
