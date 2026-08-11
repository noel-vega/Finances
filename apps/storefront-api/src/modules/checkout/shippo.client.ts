import { Shippo } from 'shippo';

// platform-owned account — one API key for every merchant, unlike Stripe
// where each merchant connects their own account
export const shippo = new Shippo({ apiKeyHeader: process.env.SHIPPO_API_KEY! });
