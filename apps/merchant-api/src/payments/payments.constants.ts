// DI token for the platform's Stripe client, so tests swap it with `useValue`
// (same pattern as DRIZZLE, and as storefront-api's checkout STRIPE token). The
// real client is built in payments.module.ts. Exported from the context barrel
// so `sales` can inject it for refunds (M2).
export const STRIPE = Symbol('STRIPE');
