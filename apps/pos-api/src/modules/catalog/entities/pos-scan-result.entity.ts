import { ApiProperty } from '@nestjs/swagger';
import { PosCatalogProduct } from './pos-catalog-product.entity';

export class PosScanResult {
  @ApiProperty({ type: () => PosCatalogProduct })
  product!: PosCatalogProduct;

  // the variant the scanned code resolved to — the app preselects it
  @ApiProperty({ type: Number })
  variantId!: number;
}
