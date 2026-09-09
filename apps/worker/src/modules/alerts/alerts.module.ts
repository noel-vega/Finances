import { Global, Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';

// @Global so any processor can inject AlertsService without re-importing —
// there's exactly one alert sink and it's a cross-cutting concern
@Global()
@Module({
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
