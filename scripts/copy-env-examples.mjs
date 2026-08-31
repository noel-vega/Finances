// Copy every `<dir>/.env.example` to `<dir>/.env` when the `.env` doesn't exist
// yet. Idempotent — never overwrites. Run via `npm run setup`.
import { readdirSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dirs = ['.'];
for (const parent of ['apps', 'packages']) {
  for (const name of readdirSync(parent)) {
    const p = join(parent, name);
    if (statSync(p).isDirectory()) dirs.push(p);
  }
}

let copied = 0;
for (const dir of dirs) {
  const example = join(dir, '.env.example');
  const target = join(dir, '.env');
  if (existsSync(example) && !existsSync(target)) {
    copyFileSync(example, target);
    console.log(`  created ${target}`);
    copied++;
  }
}

console.log(
  copied
    ? `\n${copied} .env file(s) created from templates — fill in real secrets (Stripe, Shippo) where noted.`
    : 'All .env files already present — nothing to do.',
);
