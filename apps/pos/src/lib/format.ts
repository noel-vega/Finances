export function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatPriceRange(minCents: number, maxCents: number): string {
  return minCents === maxCents
    ? formatPriceCents(minCents)
    : `${formatPriceCents(minCents)} – ${formatPriceCents(maxCents)}`;
}
