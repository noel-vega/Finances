import { ApiProperty } from '@nestjs/swagger';
import { ORDER_STATUSES, type OrderStatus } from '../order-status';

export class OrderRefund {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  orderId!: number;

  // the refunded amount, positive (the order_payments row is stored negative)
  @ApiProperty({ type: Number })
  amountCents!: number;

  @ApiProperty()
  stripeRefundId!: string;

  // the order's status after the refund
  @ApiProperty({ enum: ORDER_STATUSES })
  status!: OrderStatus;
}
