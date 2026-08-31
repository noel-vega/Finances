import 'dotenv/config';
import { z } from 'zod';

// re-export so every service pins the same zod through this package
export { z };

/**
 * Parse `process.env` against `schema` at boot. On failure, print the offending
 * vars and exit non-zero — before the caller binds a port or opens a pool.
 *
 * `dotenv/config` is loaded on import (reads `<cwd>/.env`; under npm / nx the
 * cwd is the service's own directory).
 */
export function parseEnv<T extends z.ZodType>(service: string, schema: T): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const lines = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    console.error(`\n[${service}] invalid environment:\n${lines}\n`);
    process.exit(1);
  }
  return result.data;
}
