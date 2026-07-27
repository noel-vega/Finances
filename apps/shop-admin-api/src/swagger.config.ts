import { DocumentBuilder } from "@nestjs/swagger";

export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Shop')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();
}