import { ApiProperty } from "@nestjs/swagger";
import { PosCatalogProduct } from "./pos-catalog-product.entity";

export class PosCatalogPage {
  @ApiProperty({ type: () => [PosCatalogProduct] })
  items!: PosCatalogProduct[];

  // pass back as `cursor` to fetch the next page; null when there are no more
  @ApiProperty({ type: "string", nullable: true })
  nextCursor!: string | null;

  // server time the page was produced — the client can hold this for a
  // future incremental `updatedSince` sync
  @ApiProperty()
  syncedAt!: string;
}
