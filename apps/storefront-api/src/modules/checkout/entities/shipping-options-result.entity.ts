import { ApiProperty } from '@nestjs/swagger';

export class ShippingOptionsResult {
  @ApiProperty()
  ok!: boolean;

  @ApiProperty({ type: 'string', required: false })
  errorMessage?: string;
}
