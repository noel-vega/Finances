import type {} from '@fastify/cookie';
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from 'src/app.module';
import { createSwaggerConfig } from 'src/swagger.config';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const document = SwaggerModule.createDocument(app, createSwaggerConfig());
  writeFileSync('./openapi.json', JSON.stringify(document, null, 2));

  await app.close();
}
generate();
