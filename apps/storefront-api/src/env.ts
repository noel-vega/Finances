import { parseEnv, z } from 'config';

// Parsed once, on import. `main.ts` imports this module first so a bad env
// fails before Nest wires anything up. Schema mirrors the old `?? default`
// fallbacks and `!` assertions 1:1 — no behaviour change for a valid env.
export const env = parseEnv(
  'storefront-api',
  z.object({
    DATABASE_URL: z.url(),
    PORT: z.coerce.number().default(3001),
    CUSTOMER_JWT_SECRET: z.string().min(1),
    STOREFRONT_WEB_URL: z.url().default('http://localhost:3002'),

    // one platform-owned Stripe/Shippo account, shared with merchant-api
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    STRIPE_CHECKOUT_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    SHIPPO_API_KEY: z.string().min(1),

    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),

    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  }),
);
