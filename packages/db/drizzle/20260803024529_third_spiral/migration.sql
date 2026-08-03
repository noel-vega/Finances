CREATE TABLE "locations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "locations" ("name") VALUES ('Default');
--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "locationId" integer;--> statement-breakpoint
UPDATE "inventory" SET "locationId" = (SELECT "id" FROM "locations" WHERE "name" = 'Default');--> statement-breakpoint
ALTER TABLE "inventory" ALTER COLUMN "locationId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" RENAME CONSTRAINT "inventory_variantId_key" TO "inventory_variantId_locationId_unique";--> statement-breakpoint
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_variantId_locationId_unique";--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variantId_locationId_unique" UNIQUE("variantId","locationId");--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE;