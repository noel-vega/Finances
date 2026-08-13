export function groupBy<TRow, TKey, TValue>(
  rows: TRow[],
  getKey: (row: TRow) => TKey,
  getValue: (row: TRow) => TValue,
): Map<TKey, TValue[]> {
  const grouped = new Map<TKey, TValue[]>();
  for (const row of rows) {
    const key = getKey(row);
    const list = grouped.get(key) ?? [];
    list.push(getValue(row));
    grouped.set(key, list);
  }
  return grouped;
}
