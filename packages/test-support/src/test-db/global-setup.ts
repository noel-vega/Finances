import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';

// Ryuk (the testcontainers resource reaper) adds a second container and a
// privileged socket mount that some CI sandboxes reject. Our globalTeardown
// stops the DB container explicitly and CI runners are ephemeral, so the
// reaper buys us nothing here.
process.env.TESTCONTAINERS_RYUK_DISABLED ??= 'true';

// matches the tag pinned in docker-compose.yml / infra so the image is
// already on disk locally and cached in CI
const POSTGRES_IMAGE = 'postgres:17-alpine';

interface ProjectConfig {
  rootDir: string;
}

// Jest calls this once, in its own process, before any worker is forked — so
// setting process.env.DATABASE_URL here propagates to every worker. Boots one
// throwaway Postgres, applies the real drizzle migration SQL, and hands the
// connection string down. Paired with global-teardown.ts.
export default async function globalSetup(
  _globalConfig: unknown,
  projectConfig: ProjectConfig,
): Promise<void> {
  // projectConfig.rootDir is "<repo>/apps/<app>/src" (each app's jest
  // `rootDir` is "src") → up three to the monorepo root
  const repoRoot = path.resolve(projectConfig.rootDir, '../../..');
  const migrationsDir = path.join(repoRoot, 'packages/db/drizzle');

  const container = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase('ordersail_test')
    .start();
  const uri = container.getConnectionUri();

  const client = new Client({ connectionString: uri });
  await client.connect();
  try {
    // drizzle-kit's rc layout: drizzle/<timestamp>_<name>/migration.sql, one
    // dir per migration. Lexical sort on the timestamp prefix = apply order.
    // Each file is plain DDL with no params, so one query() call per file is
    // fine; `--> statement-breakpoint` lines are SQL comments.
    const dirs = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    if (dirs.length === 0) {
      throw new Error(`no migrations found in ${migrationsDir}`);
    }
    for (const dir of dirs) {
      const sql = readFileSync(
        path.join(migrationsDir, dir, 'migration.sql'),
        'utf8',
      );
      await client.query(sql);
    }
  } finally {
    await client.end();
  }

  process.env.DATABASE_URL = uri;
  (globalThis as Record<string, unknown>).__ORDERSAIL_TEST_PG__ = container;
}
