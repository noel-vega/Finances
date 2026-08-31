// Runs before any module loads (jest `setupFiles`). Supplies a complete, valid
// dummy environment so a spec that transitively imports a service's `src/env.ts`
// (or `packages/db`) doesn't hit `process.exit(1)`. Values are obviously fake —
// specs mock every client that would actually use them.
Object.assign(process.env, {
  NODE_ENV: 'test',

  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/test',

  // merchant-api
  STAFF_JWT_SECRET: 'test-staff-secret',
  MERCHANT_WEB_URL: 'http://localhost:5000',
  STRIPE_SECRET_KEY: 'sk_test_x',
  STRIPE_ACCOUNT_WEBHOOK_SECRET: 'whsec_x',
  SHIPPO_API_KEY: 'shippo_test_x',
  MINIO_ENDPOINT: 'http://localhost:9000',
  MINIO_BUCKET: 'ordersail-product-images',
  MINIO_PUBLIC_BASE_URL: 'http://localhost:9000/ordersail-product-images',

  // storefront-api
  CUSTOMER_JWT_SECRET: 'test-customer-secret',
  STOREFRONT_WEB_URL: 'http://localhost:3002',
  STRIPE_CHECKOUT_WEBHOOK_SECRET: 'whsec_x',

  // worker
  SMTP_HOST: 'localhost',
  SMTP_FROM: 'Ordersail <no-reply@ordersail.local>',
});
