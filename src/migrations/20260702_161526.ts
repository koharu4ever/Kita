import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_games_play_status" AS ENUM('finished', 'playing', 'planned');
  CREATE TYPE "public"."enum_games_publication_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_games_cover_key" AS ENUM('sea-side-fragment', 'night-archive', 'after-rain', 'sunset-field', 'crimson-room', 'harbor-loop');
  CREATE TABLE "games_tags" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL
  );

  CREATE TABLE "games_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "href" varchar NOT NULL
  );

  CREATE TABLE "games" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "original_title" varchar,
    "developer" varchar NOT NULL,
    "release_date" varchar NOT NULL,
    "play_status" "enum_games_play_status" DEFAULT 'planned' NOT NULL,
    "publication_status" "enum_games_publication_status" DEFAULT 'draft' NOT NULL,
    "summary" varchar NOT NULL,
    "body" jsonb NOT NULL,
    "cover_key" "enum_games_cover_key" NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "games_id" integer;
  ALTER TABLE "games_tags" ADD CONSTRAINT "games_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "games_links" ADD CONSTRAINT "games_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "games_tags_order_idx" ON "games_tags" USING btree ("_order");
  CREATE INDEX "games_tags_parent_id_idx" ON "games_tags" USING btree ("_parent_id");
  CREATE INDEX "games_links_order_idx" ON "games_links" USING btree ("_order");
  CREATE INDEX "games_links_parent_id_idx" ON "games_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "games_slug_idx" ON "games" USING btree ("slug");
  CREATE INDEX "games_publication_status_idx" ON "games" USING btree ("publication_status");
  CREATE INDEX "games_updated_at_idx" ON "games" USING btree ("updated_at");
  CREATE INDEX "games_created_at_idx" ON "games" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_games_fk" FOREIGN KEY ("games_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_games_id_idx" ON "payload_locked_documents_rels" USING btree ("games_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_games_fk";
  DROP INDEX "payload_locked_documents_rels_games_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "games_id";
  ALTER TABLE "games_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "games_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "games" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "games_tags" CASCADE;
  DROP TABLE "games_links" CASCADE;
  DROP TABLE "games" CASCADE;
  DROP TYPE "public"."enum_games_play_status";
  DROP TYPE "public"."enum_games_publication_status";
  DROP TYPE "public"."enum_games_cover_key";`);
}
