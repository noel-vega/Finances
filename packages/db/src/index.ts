import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);

export { eq } from 'drizzle-orm';

export * from './schema/index.js';

