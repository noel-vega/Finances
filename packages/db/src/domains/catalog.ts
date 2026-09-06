// db/catalog — the catalog context's slice of the schema (products, brands,
// categories, options/variants, images, barcodes). See ARCHITECTURE.md.
export * from '../schema/products.js';
export * from '../schema/product-images.js';
export * from '../schema/product-barcodes.js';
export {
  eq,
  ne,
  and,
  or,
  gt,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  ilike,
  sql,
  asc,
  desc,
} from 'drizzle-orm';
export type { SQL } from 'drizzle-orm';
export { db } from '../index.js';
export * from '../postgres-errors.js';
