import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reviews_status" AS ENUM('draft', 'published');
  CREATE TABLE "reviews_tags" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL
  );

  CREATE TABLE "reviews" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "status" "enum_reviews_status" DEFAULT 'draft' NOT NULL,
    "game_title" varchar NOT NULL,
    "published_at" timestamp(3) with time zone NOT NULL,
    "excerpt" varchar NOT NULL,
    "cover_image" varchar NOT NULL,
    "rating" numeric NOT NULL,
    "reading_time" varchar NOT NULL,
    "body" jsonb NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "reviews_tags" ADD CONSTRAINT "reviews_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reviews_tags_order_idx" ON "reviews_tags" USING btree ("_order");
  CREATE INDEX "reviews_tags_parent_id_idx" ON "reviews_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "reviews_slug_idx" ON "reviews" USING btree ("slug");
  CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reviews_fk";
  DROP INDEX "payload_locked_documents_rels_reviews_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reviews_id";
  ALTER TABLE "reviews_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "reviews_tags" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TYPE "public"."enum_reviews_status";`);
}
