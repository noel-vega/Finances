import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { productVariantsTable } from "./products.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

// Scannable codes (UPC/EAN/etc.) that resolve to a single sellable variant.
// A variant can have several (e.g. a repackaged SKU). `code` is globally
// unique, mirroring product_variants.sku — a scan has to land on exactly one
// variant.
export const productBarcodesTable = pgTable("product_barcodes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  variantId: integer()
    .notNull()
    .references(() => productVariantsTable.id, { onDelete: "cascade" }),
  code: varchar({ length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const SelectProductBarcodeSchema = createSelectSchema(productBarcodesTable);
export type SelectProductBarcode = z.infer<typeof SelectProductBarcodeSchema>;
export const InsertProductBarcodeSchema = createInsertSchema(productBarcodesTable);
export type InsertProductBarcode = z.infer<typeof InsertProductBarcodeSchema>;
