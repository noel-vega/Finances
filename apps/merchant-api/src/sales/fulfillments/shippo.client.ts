import { Shippo } from 'shippo';
import { env } from '../../env';

// same account as storefront-api's checkout-time rate quoting — platform-owned
export const shippo = new Shippo({ apiKeyHeader: env.SHIPPO_API_KEY });
