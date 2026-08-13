import { AsyncLocalStorage } from 'node:async_hooks';
import { ConsoleLogger, type ConsoleLoggerOptions, type LogLevel } from '@nestjs/common';

type CorrelationStore = { correlationId: string };

const als = new AsyncLocalStorage<CorrelationStore>();

// wraps the rest of an HTTP request (APIs) or a single job's processing
// (worker) so every log line emitted anywhere in that call stack — including
// inside services several layers deep — picks up the same correlation ID
// without it having to be threaded through every function signature
export function runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
  return als.run({ correlationId }, fn);
}

export function getCorrelationId(): string | undefined {
  return als.getStore()?.correlationId;
}

// drop-in replacement for @nestjs/common's Logger/ConsoleLogger — same
// constructor shape, same log/error/warn/debug/verbose method signatures —
// that stamps the ambient correlation ID (if any) onto every log line, both
// in JSON mode (getJsonLogObject) and in the human-readable dev mode
// (formatContext)
export class CorrelatedLogger extends ConsoleLogger {
  constructor(context?: string, options?: ConsoleLoggerOptions) {
    if (context !== undefined && options !== undefined) super(context, options);
    else if (context !== undefined) super(context);
    else if (options !== undefined) super(options);
    else super();
  }

  protected override formatContext(context: string): string {
    const base = super.formatContext(context);
    const correlationId = getCorrelationId();
    return correlationId ? `${base}[corr:${correlationId}] ` : base;
  }

  protected override getJsonLogObject(
    message: unknown,
    options: {
      context: string;
      logLevel: LogLevel;
      writeStreamType?: 'stdout' | 'stderr';
      errorStack?: unknown;
    },
  ) {
    const logObject = super.getJsonLogObject(message, options);
    const correlationId = getCorrelationId();
    return correlationId ? { ...logObject, correlationId } : logObject;
  }
}

// re-exported under Nest's own name so existing `new Logger(X.name)` call
// sites only need their import path changed (from '@nestjs/common' to
// 'logging') — everything else about the call stays identical
export { CorrelatedLogger as Logger };
