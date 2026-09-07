import { Shippo } from 'shippo';
import { env } from 'src/shared/env';

// same account as storefront-api's checkout-time rate quoting — platform-owned.
// timeoutMs bounds a hung Shippo call so it can't hold a request open (label
// purchase is the slow op — 20s headroom).
export const shippo = new Shippo({
  apiKeyHeader: env.SHIPPO_API_KEY,
  timeoutMs: 20_000,
});
