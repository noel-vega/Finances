import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import type { DomainEventMap } from './events';

type EventName = keyof DomainEventMap;

// A thin typed wrapper over EventEmitter2 — the event name and payload are
// checked against the registry (see events.ts). Injectable and exported by
// EventsModule (@Global), so any context can depend on it.
@Injectable()
export class DomainEventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  // fire-and-forget — listeners run synchronously on this call stack; an async
  // listener's rejection is unobserved. Use for non-critical reactions.
  emit<K extends EventName>(event: K, payload: DomainEventMap[K]): void {
    this.emitter.emit(event, payload);
  }

  // awaits every listener (async ones included) and rejects if any of them
  // rejects. Use when the emitter must not report success until the reaction
  // has durably happened — e.g. a webhook that should return non-2xx (and let
  // the caller retry) if the order it triggers couldn't be enqueued.
  async emitAsync<K extends EventName>(
    event: K,
    payload: DomainEventMap[K],
  ): Promise<void> {
    await this.emitter.emitAsync(event, payload);
  }
}

// `@OnDomainEvent(DOMAIN_EVENTS.X)` on a provider method — `@OnEvent` with the
// event name checked against the registry. Type the handler's parameter as
// `DomainEventMap['x']` (a decorator can't type it for you).
//
// `suppressErrors: false` (the package default is true) lets a handler's error
// surface: through `emitAsync` it rejects the caller (a webhook can then 500
// and let Stripe retry); through fire-and-forget `emit` it becomes an
// unhandledRejection — so a handler driven only by `emit` must catch its own
// errors.
export const OnDomainEvent = <K extends EventName>(event: K): MethodDecorator =>
  OnEvent(event, { suppressErrors: false });
