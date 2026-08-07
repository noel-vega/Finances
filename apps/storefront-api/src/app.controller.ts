import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './modules/app-key/app-key.decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
