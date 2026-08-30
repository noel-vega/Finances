// no db/email/storage import runs early enough elsewhere in this app to
// load env vars as a side effect (unlike admin-api/storefront-api,
// which pick it up transitively via `db`) — loaded explicitly here instead
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { CorrelatedLogger } from 'logging';
import { AppModule } from './app.module';

// still no user-facing HTTP API — this only keeps @Processor classes alive
// to consume jobs — but it does now listen, solely for GET /health (see
// modules/health), so an orchestrator/liveness probe can tell this process
// apart from one that's silently wedged (e.g. after a Redis outage)
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CorrelatedLogger(undefined, { json: process.env.NODE_ENV === 'production' }),
  });
  await app.listen(process.env.PORT ?? 3003);
}
bootstrap();
