// no db/email/storage import runs early enough elsewhere in this app to
// load env vars as a side effect (unlike shop-admin-api/storefront-api,
// which pick it up transitively via `db`) — loaded explicitly here instead
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// this app has no HTTP surface — it only keeps @Processor classes alive to
// consume jobs, so an application context is all it needs, no listener/port
async function bootstrap() {
  await NestFactory.createApplicationContext(AppModule);
}
bootstrap();
