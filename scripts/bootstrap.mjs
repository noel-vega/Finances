// Get a just-started stack to a usable state: wait for Postgres to answer
// queries, push the schema (drizzle-kit), seed the demo catalog. Idempotent —
// safe to re-run. Run via `npm run bootstrap` (and by `npm run reset`).
import pg from 'pg';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const WAIT_TIMEOUT_MS = 45_000;
const WAIT_INTERVAL_MS = 1_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// `npm run push -w db` runs drizzle-kit with cwd=packages/db, which loads
// packages/db/.env — so that's the URL to probe.
function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  let contents;
  try {
    contents = readFileSync('packages/db/.env', 'utf8');
  } catch {
    throw new Error(
      'DATABASE_URL is not set and packages/db/.env is missing — run `npm run setup` first',
    );
  }
  const line = contents
    .split('\n')
    .find((l) => l.trimStart().startsWith('DATABASE_URL='));
  const value = line?.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  if (!value) {
    throw new Error('DATABASE_URL not found in packages/db/.env — run `npm run setup`');
  }
  return value;
}

function redact(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return url;
  }
}

async function waitForPostgres(url) {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  let lastErr;
  while (Date.now() < deadline) {
    const client = new pg.Client({
      connectionString: url,
      connectionTimeoutMillis: 3_000,
    });
    try {
      await client.connect();
      await client.query('select 1');
      await client.end();
      return;
    } catch (err) {
      lastErr = err;
      await client.end().catch(() => {});
      await sleep(WAIT_INTERVAL_MS);
    }
  }
  throw new Error(
    `Postgres not reachable at ${redact(url)} after ${WAIT_TIMEOUT_MS / 1000}s ` +
      `(${lastErr?.code ?? lastErr?.message}). Is \`npm run up\` running?`,
  );
}

function run(label, command) {
  console.log(`\n▸ ${label}`);
  execSync(command, { stdio: 'inherit' });
}

async function main() {
  const url = resolveDatabaseUrl();

  console.log(`▸ Waiting for Postgres at ${redact(url)} …`);
  await waitForPostgres(url);
  console.log('  ready');

  run('Pushing schema (drizzle-kit) …', 'npm run push -w db');
  run('Seeding demo data …', 'npm run seed -w seed');

  console.log('\n✓ Bootstrap complete');
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
});
