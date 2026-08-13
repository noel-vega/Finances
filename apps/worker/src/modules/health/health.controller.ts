import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { HealthService } from './health.service';

// no @Public()/guard here — unlike the two APIs, this app has no global
// auth guard at all (it's never called by end users, only by whatever
// probes this HTTP listener for liveness)
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      this.healthService.checkDatabase,
      this.healthService.checkRedis,
      this.healthService.checkOrdersQueue,
      this.healthService.checkEmailQueue,
    ]);
  }
}
