import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DomainEventBus } from './domain-event-bus';

// In-process domain events for cross-context reactions (payments → sales, …).
// @Global so a context can inject DomainEventBus / use @OnDomainEvent without
// importing this module. See apps/merchant-api/ARCHITECTURE.md § Cross-context
// communication.
@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [DomainEventBus],
  exports: [DomainEventBus],
})
export class EventsModule {}
