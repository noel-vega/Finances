// DI tokens for the third-party clients the checkout module talks to, so tests
// can swap them with `useValue` (same pattern as DRIZZLE). The real clients are
// built in checkout.module.ts.
export const STRIPE = Symbol('STRIPE');
export const SHIPPO = Symbol('SHIPPO');
