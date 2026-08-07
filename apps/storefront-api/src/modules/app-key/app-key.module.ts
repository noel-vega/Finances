import { Module } from '@nestjs/common';
import { APP_KEY_APP_GUARD } from './app-key.guard';

@Module({
  providers: [APP_KEY_APP_GUARD],
})
export class AppKeyModule {}
