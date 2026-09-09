import { ApiProperty } from '@nestjs/swagger';

export class OrderCancellation {
  @ApiProperty({ type: Number })
  orderId!: number;

  @ApiProperty({ enum: ['canceled'] })
  status!: 'canceled';

  // true when the cancel issued a Stripe refund (a paid web order). POS
  // card/cash refunds are handled out of band (M3) — refundIssued is false.
  @ApiProperty()
  refundIssued!: boolean;

  @ApiProperty({ type: Number })
  refundAmountCents!: number;
}
