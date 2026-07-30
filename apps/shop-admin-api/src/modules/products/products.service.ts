import { Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DRIZZLE } from 'src/database/database.constants';
import {
  eq,
  inventoryTable,
  productCategoriesTable,
  productsTable,
  productVariantsTable,
  type db as Db,
} from 'db';
import { ProductVariant } from './entities/product-variant.entity';

@Injectable()
export class ProductsService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}
  async create(createProductDto: CreateProductDto) {
    const product = await this.db.transaction(async (tx) => {
      const [product] = await tx
        .insert(productsTable)
        .values({
          name: createProductDto.name,
          description: createProductDto.description,
          status: createProductDto.status,
          brandId: createProductDto.brandId,
        })
        .returning();

      const [variant] = await tx.insert(productVariantsTable).values({
        priceCents: createProductDto.priceCents,
        productId: product.id,
        sku: createProductDto.sku,
      }).returning();

      await tx.insert(inventoryTable).values({
        variantId: variant.id,
        stock: createProductDto.stock,
      })

      if (createProductDto.categoryIds.length > 0) {
        await tx.insert(productCategoriesTable).values(
          createProductDto.categoryIds.map((categoryId) => ({
            productId: product.id,
            categoryId,
          })),
        );
      }

      return product
    });
    return product;
  }

  async findAll() {
    return await this.db.select().from(productsTable);
  }

  async findOne(id: number) {
    const [product] =  await this.db.select().from(productsTable).where(eq(productsTable.id, id));
    return product
  }


  async findVariants(productId: number): Promise<ProductVariant[]> {
    return await this.db
      .select({
        id: productVariantsTable.id,
        productId: productVariantsTable.productId,
        priceCents: productVariantsTable.priceCents,
        sku: productVariantsTable.sku,
        createdAt: productVariantsTable.createdAt,
        updatedAt: productVariantsTable.updatedAt,
        stock: inventoryTable.stock,
      })
      .from(productVariantsTable)
      .innerJoin(
        inventoryTable,
        eq(inventoryTable.variantId, productVariantsTable.id),
      )
      .where(eq(productVariantsTable.productId, productId));
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(id: number) {
    const [product] = await this.db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning();
    return product;
  }
}
