import { ApiProperty } from '@nestjs/swagger';
import { FailedOrder } from './failed-order.entity';

export class FailedOrdersList {
  @ApiProperty({ type: () => [FailedOrder] })
  items!: FailedOrder[];

  // unresolved rows only — what an ops/health surface counts
  @ApiProperty({ type: Number })
  unresolvedCount!: number;
}
