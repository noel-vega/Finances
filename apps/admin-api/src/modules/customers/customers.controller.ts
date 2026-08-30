import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { CurrentUser, type AuthenticatedUser } from '../auth/auth.decorators';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: [Customer] })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.findAll(user.accountId);
  }
}
