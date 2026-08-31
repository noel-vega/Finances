const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCents(cents: number) {
  return currencyFormatter.format(cents / 100);
}

// for binding a cents value to a dollar-denominated number input
export function centsToDollars(cents: number) {
  return cents / 100;
}

// avoids float drift (e.g. 19.99 * 100 === 1998.9999999999998)
export function dollarsToCents(dollars: number) {
  return Math.round(dollars * 100);
}
