import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);

export { eq, ne, and, or, gt, inArray, notInArray, isNull, isNotNull, ilike, sql, asc, desc } from 'drizzle-orm';
export type { SQL } from 'drizzle-orm';

export * from './schema/index.js';
export * from './permissions-catalog.js';
export * from './postgres-errors.js';

