CREATE TABLE "failed_orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "failed_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"stripeCheckoutSessionId" text NOT NULL UNIQUE,
	"stripePaymentIntentId" text,
	"accountId" integer NOT NULL,
	"jobId" text,
	"payload" jsonb NOT NULL,
	"errorMessage" text NOT NULL,
	"attempts" integer NOT NULL,
	"resolved_at" timestamp,
	"resolvedBy" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "failed_orders" ADD CONSTRAINT "failed_orders_accountId_accounts_id_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE;