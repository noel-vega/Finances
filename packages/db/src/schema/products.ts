import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { accountsTable } from "./accounts.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "archived",
]);

export const brandsTable = pgTable(
  "brands",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    accountId: integer()
      .notNull()
      .references(() => accountsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestampAt("created_at"),
    updatedAt: timestampAt("updated_at"),
  },
  (t) => [unique().on(t.accountId, t.name)],
);

export const SelectBrandSchema = createSelectSchema(brandsTable)
export type SelectBrand = z.infer<typeof SelectBrandSchema>
export const InsertBrandSchema = createInsertSchema(brandsTable)
export type InsertBrand = z.infer<typeof InsertBrandSchema>

export const productsTable = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  name: varchar({ length: 255 }).notNull(),
  // slug: varchar({ length: 255 }).notNull().unique(),
  description: varchar({ length: 2000 }),
  status: productStatusEnum().notNull().default("draft"),
  brandId: integer().references(() => brandsTable.id),
  createdAt: timestampAt("created_at"),
  updatedAt: timestampAt("updated_at"),
});

export const SelectProductSchema = createSelectSchema(productsTable)
export type SelectProduct = z.infer<typeof SelectProductSchema>
export const InsertProductSchema = createInsertSchema(productsTable)
export type InsertProduct = z.infer<typeof InsertProductSchema>

// e.g. "Color", "Size" — scoped to one product
export const productOptionsTable = pgTable(
  "product_options",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    productId: integer()
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 100 }).notNull(),
  },
  (t) => [unique().on(t.productId, t.name)],
);
export const SelectProductOptionSchema = createSelectSchema(productOptionsTable)
export type SelectProductOption = z.infer<typeof SelectProductOptionSchema>
export const InsertProductOptionSchema = createInsertSchema(productOptionsTable)
export type InsertProductOption = z.infer<typeof InsertProductOptionSchema>

// e.g. "Red", "Large" — belongs to one option
export const productOptionValuesTable = pgTable(
  "product_option_values",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    optionId: integer()
      .notNull()
      .references(() => productOptionsTable.id, { onDelete: "cascade" }),
    value: varchar({ length: 100 }).notNull(),
  },
  (t) => [unique().on(t.optionId, t.value)],
);
export const SelectProductOptionValueSchema = createSelectSchema(productOptionValuesTable)
export type SelectProductOptionValue = z.infer<typeof SelectProductOptionValueSchema>
export const InsertProductOptionValueSchema = createInsertSchema(productOptionsTable)
export type InsertProductOptionValue = z.infer<typeof InsertProductOptionValueSchema>

// a single sellable unit, e.g. "Blue / Large"
export const productVariantsTable = pgTable("product_variants", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer()
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  sku: varchar({ length: 100 }).unique(),
  priceCents: integer().notNull(),
  createdAt: timestampAt("created_at"),
  updatedAt: timestampAt("updated_at"),
});

export const SelectProductVariantSchema = createSelectSchema(productVariantsTable)
export type SelectProductVariant = z.infer<typeof SelectProductVariantSchema>
export const InsertProductVariantSchema = createInsertSchema(productVariantsTable)
export type InsertProductVariant = z.infer<typeof InsertProductVariantSchema>


// join table: which option values make up a given variant
export const variantOptionValuesTable = pgTable(
  "variant_option_values",
  {
    variantId: integer()
      .notNull()
      .references(() => productVariantsTable.id, { onDelete: "cascade" }),
    optionValueId: integer()
      .notNull()
      .references(() => productOptionValuesTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.variantId, t.optionValueId] })],
);

export const categoriesTable = pgTable(
  "categories",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    accountId: integer()
      .notNull()
      .references(() => accountsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestampAt("created_at"),
    updatedAt: timestampAt("updated_at"),
  },
  (t) => [unique().on(t.accountId, t.name)],
);

export const SelectCategorySchema = createSelectSchema(categoriesTable)
export type SelectCategory = z.infer<typeof SelectCategorySchema>
export const InsertCategorySchema = createInsertSchema(categoriesTable)
export type InsertCategory = z.infer<typeof InsertCategorySchema>

// join table: which categories a given product belongs to (many-to-many)
export const productCategoriesTable = pgTable(
  "product_categories",
  {
    productId: integer()
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    categoryId: integer()
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
);
