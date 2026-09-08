import { ApiProperty } from '@nestjs/swagger';

// One paid checkout whose order the worker could not write. `payload` (the
// full order job) is not exposed — the summary fields below are pulled from it
// so the merchant sees what the order was without the raw blob.
export class FailedOrder {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  stripeCheckoutSessionId!: string;

  @ApiProperty({ type: 'string', nullable: true })
  stripePaymentIntentId!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  customerEmail!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  customerName!: string | null;

  @ApiProperty({ type: Number })
  itemCount!: number;

  @ApiProperty({ type: Number, nullable: true })
  amountTotalCents!: number | null;

  @ApiProperty()
  errorMessage!: string;

  @ApiProperty({ type: Number })
  attempts!: number;

  // null while the order still doesn't exist; set once a replay (or any later
  // job) writes it
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  resolvedAt!: Date | null;

  // 'worker' (a later job succeeded on its own) or `staff:<userId>` (a manual
  // replay where the order already existed)
  @ApiProperty({ type: 'string', nullable: true })
  resolvedBy!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
