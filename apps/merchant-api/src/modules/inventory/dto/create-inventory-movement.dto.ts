import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, NotEquals } from 'class-validator';
import { inventoryMovementReasonEnum } from 'db/schema';

export class CreateInventoryMovementDto {
  @ApiProperty({ type: Number })
  @IsInt()
  variantId!: number;

  @ApiProperty({ type: Number })
  @IsInt()
  locationId!: number;

  // positive = stock in, negative = stock out
  @ApiProperty({ type: Number })
  @IsInt()
  @NotEquals(0)
  delta!: number;

  @ApiProperty({ enum: inventoryMovementReasonEnum.enumValues })
  @IsIn(inventoryMovementReasonEnum.enumValues)
  reason!: (typeof inventoryMovementReasonEnum.enumValues)[number];

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  note?: string | null;
}
