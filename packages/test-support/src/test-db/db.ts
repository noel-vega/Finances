import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

export type TestDb = ReturnType<typeof drizzle>;

// A drizzle handle on the Testcontainers Postgres that global-setup.ts booted.
// Safe to call at spec collection time — DATABASE_URL is already set by then.
export function makeTestDb(): TestDb {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'makeTestDb: DATABASE_URL is not set. Wire packages/test-support/src/test-db ' +
        'global-setup + global-teardown into the app jest config.',
    );
  }
  return drizzle(url);
}

// TRUNCATE every table (RESTART IDENTITY so each test starts from id 1,
// CASCADE so FK order doesn't matter). Cheaper than dropping the schema and
// lets the code under test run its own real transactions first.
export async function resetDb(db: TestDb): Promise<void> {
  const { rows } = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  if (rows.length === 0) return;
  const tables = rows.map((r) => `"${r.tablename}"`).join(', ');
  await db.execute(sql.raw(`truncate table ${tables} restart identity cascade`));
}

// Call once at the top level of a spec file (outside describe). Gives every
// test a clean database and closes the pool when the file finishes.
export function useTestDb(): TestDb {
  const db = makeTestDb();
  afterEach(async () => {
    await resetDb(db);
  });
  afterAll(async () => {
    await db.$client.end();
  });
  return db;
}
