import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);

export { eq, and, inArray, notInArray, isNull, sql, desc } from 'drizzle-orm';
export type { SQL } from 'drizzle-orm';

export * from './schema/index.js';

