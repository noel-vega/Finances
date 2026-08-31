import { Shippo } from 'shippo';
import { env } from '../../env';

// platform-owned account — one API key for every merchant, unlike Stripe
// where each merchant connects their own account
export const shippo = new Shippo({ apiKeyHeader: env.SHIPPO_API_KEY });
