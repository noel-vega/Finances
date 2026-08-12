export type DoRequest<T> = () => Promise<{
  data?: T;
  error?: unknown;
  response: Response;
}>;

// shape of StorefrontClient's private 401-retry wrapper — resource factories
// take this in instead of importing StorefrontClient itself, which would be
// circular
export type DoFn = <T>(
  request: DoRequest<T>,
) => Promise<{ data?: T; error?: unknown; response: Response }>;
