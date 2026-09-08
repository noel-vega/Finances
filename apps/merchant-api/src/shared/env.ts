import { parseEnv, z } from 'config';

// Parsed once, on import. `main.ts` imports this module first so a bad env
// fails before Nest wires anything up. Schema mirrors the old `?? default`
// fallbacks and `!` assertions 1:1 — no behaviour change for a valid env.
export const env = parseEnv(
  'merchant-api',
  z.object({
    DATABASE_URL: z.url(),
    STAFF_JWT_SECRET: z.string().min(1),
    MERCHANT_WEB_URL: z.url().default('http://localhost:5000'),
    // the storefront a web order was placed on — carried into the order job
    // so apps/worker can build the confirmation-email link (M9: order
    // creation moved here from storefront-api)
    STOREFRONT_WEB_URL: z.url().default('http://localhost:3002'),

    // one platform-owned Stripe/Shippo account, shared with storefront-api
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    // Connect `account.updated` → POST /stripe-connect/webhook
    STRIPE_ACCOUNT_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    // Checkout `checkout.session.*` → POST /checkout/webhook (its own Stripe
    // Dashboard endpoint + secret; M9 moved this here from storefront-api)
    STRIPE_CHECKOUT_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    SHIPPO_API_KEY: z.string().min(1),

    // MinIO locally; real S3 in prod, where creds come from the ECS task role
    // (so keys stay optional) and the endpoint is the AWS default
    MINIO_ENDPOINT: z.url().default('http://localhost:9000'),
    MINIO_ACCESS_KEY: z.string().optional(),
    MINIO_SECRET_KEY: z.string().optional(),
    MINIO_BUCKET: z.string().default('ordersail-product-images'),
    MINIO_PUBLIC_BASE_URL: z
      .url()
      .default('http://localhost:9000/ordersail-product-images'),
    // tri-state: unset -> SDK default, 'true'/'false' -> explicit (coerced in storage.service)
    MINIO_FORCE_PATH_STYLE: z.string().optional(),

    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),

    PORT: z.coerce.number().default(3000),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  }),
);
