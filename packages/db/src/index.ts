import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);

export { eq, ne, and, inArray, notInArray, isNull, isNotNull, sql, desc } from 'drizzle-orm';
export type { SQL } from 'drizzle-orm';

export * from './schema/index.js';
export * from './permissions-catalog.js';
export * from './postgres-errors.js';

