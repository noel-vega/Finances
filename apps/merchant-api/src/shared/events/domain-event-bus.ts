import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import type { DomainEventMap } from './events';

type EventName = keyof DomainEventMap;

// A thin typed wrapper over EventEmitter2 — `emit` only accepts a registered
// event name and its matching payload (see events.ts). Injectable and exported
// by EventsModule (@Global), so any context can depend on it.
@Injectable()
export class DomainEventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  emit<K extends EventName>(event: K, payload: DomainEventMap[K]): void {
    this.emitter.emit(event, payload);
  }
}

// `@OnDomainEvent(DOMAIN_EVENTS.X)` on a provider method — same as `@OnEvent`
// but the event name is checked against the registry. Type the handler's
// parameter as `DomainEventMap['x']` (a decorator can't type it for you).
export const OnDomainEvent = <K extends EventName>(event: K): MethodDecorator =>
  OnEvent(event);
