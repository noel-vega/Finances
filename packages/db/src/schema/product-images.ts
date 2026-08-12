import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { productsTable, productVariantsTable } from "./products.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

// null variantId = a product-level image (the default gallery); set =
// belongs to that one variant only. position orders images within their own
// group — all variantId-null rows order together, each variant's rows order
// separately among themselves. No accountId: ownership is always reached
// through productId, same as productOptionsTable/productVariantsTable.
export const productImagesTable = pgTable("product_images", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer()
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  variantId: integer().references(() => productVariantsTable.id, {
    onDelete: "cascade",
  }),
  // the object key in storage — kept alongside the public url so a delete
  // doesn't have to parse the key back out of a URL (which would break the
  // moment a CDN sits in front of the bucket)
  key: text().notNull(),
  url: text().notNull(),
  position: integer().notNull().default(0),
  createdAt: timestampAt("created_at"),
});

export const SelectProductImageSchema = createSelectSchema(productImagesTable);
export type SelectProductImage = z.infer<typeof SelectProductImageSchema>;
export const InsertProductImageSchema = createInsertSchema(productImagesTable);
export type InsertProductImage = z.infer<typeof InsertProductImageSchema>;
