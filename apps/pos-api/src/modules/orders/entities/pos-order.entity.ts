import { ApiProperty } from "@nestjs/swagger";

export class PosOrderItem {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number, nullable: true })
  variantId!: number | null;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ type: "string", nullable: true })
  sku!: string | null;

  @ApiProperty({ type: "string", nullable: true })
  optionsLabel!: string | null;

  @ApiProperty({ type: Number })
  priceCents!: number;

  @ApiProperty({ type: Number })
  quantity!: number;

  @ApiProperty({ type: Number })
  lineCents!: number;
}

export class PosOrder {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ enum: ["pos"] })
  channel!: "pos";

  @ApiProperty({ type: Number })
  subtotalCents!: number;

  @ApiProperty({ type: Number })
  taxCents!: number;

  @ApiProperty({ type: Number })
  totalCents!: number;

  @ApiProperty({ enum: ["cash", "card"] })
  paymentMethod!: "cash" | "card";

  // cash sales only
  @ApiProperty({ type: Number, nullable: true })
  amountTenderedCents!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  changeCents!: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ type: () => [PosOrderItem] })
  items!: PosOrderItem[];
}
