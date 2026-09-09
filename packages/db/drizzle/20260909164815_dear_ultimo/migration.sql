CREATE TABLE "order_refund_lines" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_refund_lines_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"refundPaymentId" integer NOT NULL,
	"orderItemId" integer NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "order_refund_lines_refundPaymentId_index" ON "order_refund_lines" ("refundPaymentId");--> statement-breakpoint
ALTER TABLE "order_refund_lines" ADD CONSTRAINT "order_refund_lines_refundPaymentId_order_payments_id_fkey" FOREIGN KEY ("refundPaymentId") REFERENCES "order_payments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_refund_lines" ADD CONSTRAINT "order_refund_lines_orderItemId_order_items_id_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE;