import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { PosDevicesModule } from './pos-devices/pos-devices.module';

// Platform: the cross-context dashboard read-model, the health probe, and POS
// device pairing. `dashboard` is the one place allowed to read across contexts.
@Module({
  imports: [DashboardModule, HealthModule, PosDevicesModule],
})
export class PlatformModule {}
