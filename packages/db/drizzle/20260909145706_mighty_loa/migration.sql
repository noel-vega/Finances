CREATE TYPE "order_actor_type" AS ENUM('staff', 'system', 'customer');--> statement-breakpoint
CREATE TYPE "order_event_type" AS ENUM('status_changed', 'refund', 'cancellation', 'payment', 'fulfillment', 'note');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('pending', 'paid', 'partially_refunded', 'refunded', 'canceled', 'payment_failed');--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"orderId" integer NOT NULL,
	"type" "order_event_type" NOT NULL,
	"data" jsonb,
	"message" text NOT NULL,
	"actorType" "order_actor_type" NOT NULL,
	"actorUserId" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
--> every order that exists today was written only after payment settled, so
--> backfill them all to 'paid'; the transient DEFAULT does the backfill, then
--> it's dropped to match the schema (writers set status explicitly on insert).
ALTER TABLE "orders" ADD COLUMN "status" "order_status" DEFAULT 'paid' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "order_events_orderId_created_at_index" ON "order_events" ("orderId","created_at");--> statement-breakpoint
CREATE INDEX "orders_accountId_status_index" ON "orders" ("accountId","status");--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_orderId_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_actorUserId_users_id_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL;