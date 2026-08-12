import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { CustomerAuthGuard } from '../auth/auth.guard';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, CustomerAuthGuard],
  exports: [CustomerService],
})
export class CustomerModule {}
