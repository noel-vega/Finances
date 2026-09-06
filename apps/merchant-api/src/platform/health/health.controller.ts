import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { HealthService } from './health.service';
import { Public } from 'src/shared/auth/decorators';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthService: HealthService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      this.healthService.checkDatabase,
      this.healthService.checkRedis,
    ]);
  }
}
