const POSTGRES_UNIQUE_VIOLATION = '23505';
const POSTGRES_FOREIGN_KEY_VIOLATION = '23503';

// node-postgres errors carry `.code`, but drizzle-orm wraps them in a
// DrizzleQueryError, so the pg error ends up at `.cause` instead
function pgErrorCode(err: unknown): string | undefined {
  const pgError =
    typeof err === 'object' && err !== null && 'cause' in err ? err.cause : err;
  return typeof pgError === 'object' && pgError !== null && 'code' in pgError
    ? String(pgError.code)
    : undefined;
}

export function isUniqueViolation(err: unknown): boolean {
  return pgErrorCode(err) === POSTGRES_UNIQUE_VIOLATION;
}

export function isForeignKeyViolation(err: unknown): boolean {
  return pgErrorCode(err) === POSTGRES_FOREIGN_KEY_VIOLATION;
}
