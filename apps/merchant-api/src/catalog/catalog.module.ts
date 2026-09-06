import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';

// Catalog: products, their variants/options/images, and the brand/category
// taxonomy. Owns the product_* tables.
@Module({
  imports: [ProductsModule, BrandsModule, CategoriesModule],
})
export class CatalogModule {}
