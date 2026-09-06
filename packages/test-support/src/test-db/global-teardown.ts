interface Stoppable {
  stop: () => Promise<unknown>;
}

// Runs once, in the same Jest process as global-setup.ts, after every suite —
// so the container it stashed on globalThis is still reachable here.
export default async function globalTeardown(): Promise<void> {
  const container = (globalThis as Record<string, unknown>)
    .__ORDERSAIL_TEST_PG__ as Stoppable | undefined;
  await container?.stop();
}
