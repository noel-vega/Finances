import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);

export { eq, and, inArray, notInArray, sql } from 'drizzle-orm';

export * from './schema/index.js';

