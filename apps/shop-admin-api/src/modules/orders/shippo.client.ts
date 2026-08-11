import { Shippo } from 'shippo';

// same account as storefront-api's checkout-time rate quoting — platform-owned
export const shippo = new Shippo({ apiKeyHeader: process.env.SHIPPO_API_KEY! });
