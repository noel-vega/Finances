export type DoRequest<T> = () => Promise<{
  data?: T;
  error?: unknown;
  response: Response;
}>;

// shape of AdminClient's private 401-retry wrapper — resource factories take
// this in instead of importing AdminClient itself, which would be circular
export type DoFn = <T>(
  request: DoRequest<T>,
) => Promise<{ data?: T; error?: unknown; response: Response }>;
