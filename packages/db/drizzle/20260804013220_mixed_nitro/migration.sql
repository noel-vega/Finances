CREATE TYPE "inventory_movement_reason" AS ENUM('received', 'sold', 'return', 'damaged', 'adjustment');--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inventory_movements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"variantId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"delta" integer NOT NULL,
	"reason" "inventory_movement_reason" NOT NULL,
	"note" varchar(500),
	"createdByUserId" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_createdByUserId_users_id_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL;