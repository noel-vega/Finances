import { BadRequestException } from '@nestjs/common';

// Dedupes `keys`, fetches the matching rows via `fetchRows`, and throws if
// any key didn't resolve (e.g. belongs to another account, or doesn't
// exist). Returns the matched rows — never the raw, possibly-duplicated
// input — so callers can't accidentally build inserts off unvalidated data.
export async function resolveOwned<TKey extends string | number, TRow>(
  keys: TKey[],
  fetchRows: (uniqueKeys: TKey[]) => Promise<TRow[]>,
  errorMessage: string,
): Promise<TRow[]> {
  const uniqueKeys = [...new Set(keys)];
  if (uniqueKeys.length === 0) return [];

  const rows = await fetchRows(uniqueKeys);
  if (rows.length !== uniqueKeys.length) {
    throw new BadRequestException(errorMessage);
  }
  return rows;
}
