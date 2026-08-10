import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSession {
  @ApiProperty()
  clientSecret!: string;
}
