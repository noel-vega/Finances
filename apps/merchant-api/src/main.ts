import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { SwaggerModule } from '@nestjs/swagger';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { CorrelatedLogger, runWithCorrelationId } from 'logging';
import { createSwaggerConfig } from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      rawBody: true,
      logger: new CorrelatedLogger(undefined, {
        json: process.env.NODE_ENV === 'production',
      }),
    },
  );
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // reuses an inbound x-request-id if the caller already set one, otherwise
  // mints a fresh one — either way it's echoed back and threaded through
  // every log line this request produces, including ones emitted from
  // BullMQ jobs it enqueues. FastifyAdapter's use() runs this as connect-style
  // middleware (raw Node req/res), same as storefront-api's Express version.
  app.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const header = req.headers['x-request-id'];
    const correlationId =
      (Array.isArray(header) ? header[0] : header) || randomUUID();
    res.setHeader('x-request-id', correlationId);
    runWithCorrelationId(correlationId, next);
  });

  const document = SwaggerModule.createDocument(app, createSwaggerConfig());
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'swagger/json',
  });

  app.enableCors({
    origin: process.env.SHOP_ADMIN_WEB_URL ?? 'http://localhost:5000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });
  await app.register(fastifyCookie);
  // Fastify defaults to binding 'localhost' (loopback only) when no host is given — fine for
  // local dev (same machine), but unreachable from the ALB in ECS, which connects to the
  // task's real VPC IP, not loopback.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
