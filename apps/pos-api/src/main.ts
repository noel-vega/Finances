import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { CorrelatedLogger, runWithCorrelationId } from 'logging';
import { AppModule } from './app.module';
import { createSwaggerConfig } from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CorrelatedLogger(undefined, {
      json: process.env.NODE_ENV === 'production',
    }),
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  app.use((req, res, next) => {
    const header = req.headers['x-request-id'];
    const correlationId =
      (Array.isArray(header) ? header[0] : header) || randomUUID();
    res.setHeader('x-request-id', correlationId);
    runWithCorrelationId(correlationId, next);
  });

  // the POS client is a native app, not a browser — CORS is only relevant
  // for the Swagger UI and any web-based tooling
  app.enableCors({
    origin: process.env.POS_WEB_URL ?? true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['content-type', 'x-pos-device-token', 'x-request-id'],
  });

  const document = SwaggerModule.createDocument(app, createSwaggerConfig());
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'swagger/json',
  });

  await app.listen(process.env.PORT ?? 3004);
}
bootstrap();
