import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CurrentUser } from 'src/shared/auth/decorators';
import type { AuthenticatedUser } from 'src/shared/auth/decorators';
import { ApiKeyDto } from './dto/api-key.dto';

@ApiBearerAuth('JWT-auth')
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOkResponse({ type: ApiKeyDto, isArray: true })
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.apiKeysService.listForAccount(user.accountId);
  }
}
