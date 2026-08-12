import { Redis } from "ioredis";
import type { JobsOptions } from "bullmq";

export const QUEUE_NAMES = {
  EMAIL: "email",
} as const;

// URLs are built by the producer (it already knows which frontend's env var
// applies) and carried fully-formed in the payload — the worker never needs
// to know about SHOP_ADMIN_WEB_URL/STOREFRONT_WEB_URL itself
export type EmailJobData =
  | { type: "staff-invite"; to: string; firstName: string; inviteUrl: string }
  | {
      type: "customer-thank-you";
      to: string;
      firstName: string;
      accountName: string;
      storefrontUrl: string;
    };

// centralized retry policy so it isn't copy-pasted per producer — 5
// attempts, exponential backoff starting at 5s (5s, 10s, 20s, 40s).
// removeOnComplete/removeOnFail cap retention (BullMQ's default is
// unlimited) — completed jobs are low-value once sent, failed jobs (all
// retries exhausted) are worth keeping longer for debugging.
export const EMAIL_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
  removeOnFail: { age: 7 * 24 * 60 * 60, count: 5000 },
};

// hands BullMQ an already-constructed ioredis client rather than plain
// connection options — under this monorepo's ESM setup, BullMQ's internal
// *dynamic* `require('ioredis')` can't reliably resolve the package across
// workspace symlinks, so we do the (static, ESM-safe) import here instead
// and pass the instance directly. One call per app, at its single
// BullModule.forRoot(...) site.
export function createRedisConnection(): Redis {
  return new Redis({
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    // required by BullMQ whenever it's handed a client instance directly
    maxRetriesPerRequest: null,
  });
}
