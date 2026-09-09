ALTER TABLE "order_payments" ADD COLUMN "stripeRefundId" text;--> statement-breakpoint
ALTER TABLE "order_payments" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "order_payments" ADD COLUMN "parentPaymentId" integer;--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_stripeRefundId_key" UNIQUE("stripeRefundId");--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_parentPaymentId_order_payments_id_fkey" FOREIGN KEY ("parentPaymentId") REFERENCES "order_payments"("id") ON DELETE SET NULL;