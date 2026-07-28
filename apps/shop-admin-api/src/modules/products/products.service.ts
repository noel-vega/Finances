import { Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DRIZZLE } from 'src/database/database.constants';
import { eq, inventoryTable, productsTable, productVariantsTable, type db as Db } from 'db';

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
        })
        .returning();

      const [variant] = await tx.insert(productVariantsTable).values({
        priceCents: createProductDto.priceCents,
        productId: product.id,
        sku: '',
      }).returning();

      await tx.insert(inventoryTable).values({
        variantId: variant.id,
        quantity: createProductDto.stock,
      })
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

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
