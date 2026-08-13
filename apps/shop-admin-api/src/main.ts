import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createSwaggerConfig } from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { rawBody: true },
  );
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const document = SwaggerModule.createDocument(app, createSwaggerConfig());
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'swagger/json',
  });

  app.enableCors({
    origin: process.env.SHOP_ADMIN_WEB_URL ?? 'http://localhost:5000',
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"]
  });
  await app.register(fastifyCookie);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
