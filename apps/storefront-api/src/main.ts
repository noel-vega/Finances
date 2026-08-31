import { env } from './env'; // validates process.env before anything else loads
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { CorrelatedLogger, runWithCorrelationId } from 'logging';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module';
import { createSwaggerConfig } from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: new CorrelatedLogger(undefined, {
      json: env.NODE_ENV === 'production',
    }),
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // reuses an inbound x-request-id if the caller already set one (useful
  // once there's a frontend/proxy assigning them), otherwise mints a fresh
  // one — either way it's echoed back and threaded through every log line
  // this request produces, including ones emitted from BullMQ jobs it enqueues
  app.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const header = req.headers['x-request-id'];
    const correlationId =
      (Array.isArray(header) ? header[0] : header) || randomUUID();
    res.setHeader('x-request-id', correlationId);
    runWithCorrelationId(correlationId, next);
  });

  app.use(cookieParser());

  // customer signin now sets an httpOnly refresh cookie, so this can no
  // longer be a wildcard origin like it used to be
  app.enableCors({
    origin: env.STOREFRONT_WEB_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'content-type',
      'x-app-key',
      'x-cart-token',
      'authorization',
    ],
  });

  const document = SwaggerModule.createDocument(app, createSwaggerConfig());
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'swagger/json',
  });

  await app.listen(env.PORT);
}
bootstrap();
