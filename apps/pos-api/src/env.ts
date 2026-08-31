import { parseEnv, z } from "config";

// Parsed once, on import. `main.ts` imports this module first so a bad env
// fails before Nest wires anything up.
export const env = parseEnv(
  "pos-api",
  z.object({
    DATABASE_URL: z.url(),
    PORT: z.coerce.number().default(3004),
    // origin of any browser tooling that calls this API; the POS itself is native
    POS_WEB_URL: z.url().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  }),
);
