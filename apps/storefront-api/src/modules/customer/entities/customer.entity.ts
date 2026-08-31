import { ApiProperty } from '@nestjs/swagger';

// deliberately not `implements SelectCustomer` — customersTable's JS
// properties are firstname/lastname (see CustomerService.toCustomer, same
// reasoning as merchant-api's User entity), and password is never
// included here
export class Customer {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  accountId!: number;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
