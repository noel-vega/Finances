import { DocumentBuilder } from '@nestjs/swagger';

export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Storefront')
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-app-key', in: 'header' },
      'AppKey-auth',
    )
    .build();
}
