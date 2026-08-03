import { Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantsDto } from './dto/create-variant.dto';
import { UpdateProductOptionDto } from './dto/update-product-option.dto';
import { DRIZZLE } from 'src/database/database.constants';
import {
  and,
  eq,
  inArray,
  inventoryTable,
  notInArray,
  productCategoriesTable,
  productOptionsTable,
  productOptionValuesTable,
  productsTable,
  productVariantsTable,
  variantOptionValuesTable,
  type db as Db,
} from 'db';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductOption } from './entities/product-option.entity';

// every combination of one value per option, e.g. [[1,2],[3,4]] -> [[1,3],[1,4],[2,3],[2,4]]
function cartesianProduct<T>(groups: T[][]): T[][] {
  return groups.reduce<T[][]>(
    (acc, group) => acc.flatMap((combo) => group.map((value) => [...combo, value])),
    [[]],
  );
}

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
    const variants = await this.db
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

    return await this.attachOptionValues(variants);
  }

  // fills in each variant's option-value combination (e.g. "Size: 9"), which
  // requires a separate query since it's a many-to-many join
  private async attachOptionValues<
    T extends { id: number },
  >(variants: T[]): Promise<(T & { optionValues: { optionName: string; value: string }[] })[]> {
    if (variants.length === 0) return [];

    const rows = await this.db
      .select({
        variantId: variantOptionValuesTable.variantId,
        optionName: productOptionsTable.name,
        value: productOptionValuesTable.value,
      })
      .from(variantOptionValuesTable)
      .innerJoin(
        productOptionValuesTable,
        eq(productOptionValuesTable.id, variantOptionValuesTable.optionValueId),
      )
      .innerJoin(
        productOptionsTable,
        eq(productOptionsTable.id, productOptionValuesTable.optionId),
      )
      .where(
        inArray(
          variantOptionValuesTable.variantId,
          variants.map((v) => v.id),
        ),
      );

    const optionValuesByVariant = new Map<
      number,
      { optionName: string; value: string }[]
    >();
    for (const row of rows) {
      const values = optionValuesByVariant.get(row.variantId) ?? [];
      values.push({ optionName: row.optionName, value: row.value });
      optionValuesByVariant.set(row.variantId, values);
    }

    return variants.map((variant) => ({
      ...variant,
      optionValues: optionValuesByVariant.get(variant.id) ?? [],
    }));
  }

  async findOptions(productId: number): Promise<ProductOption[]> {
    const rows = await this.db
      .select({
        optionId: productOptionsTable.id,
        optionName: productOptionsTable.name,
        valueId: productOptionValuesTable.id,
        value: productOptionValuesTable.value,
      })
      .from(productOptionsTable)
      .leftJoin(
        productOptionValuesTable,
        eq(productOptionValuesTable.optionId, productOptionsTable.id),
      )
      .where(eq(productOptionsTable.productId, productId));

    const options = new Map<number, ProductOption>();
    for (const row of rows) {
      let option = options.get(row.optionId);
      if (!option) {
        option = { id: row.optionId, productId, name: row.optionName, values: [] };
        options.set(row.optionId, option);
      }
      if (row.valueId !== null) {
        option.values.push({ id: row.valueId, value: row.value! });
      }
    }

    return Array.from(options.values());
  }

  async updateOption(
    productId: number,
    optionId: number,
    updateProductOptionDto: UpdateProductOptionDto,
  ): Promise<ProductOption | undefined> {
    await this.db
      .update(productOptionsTable)
      .set({ name: updateProductOptionDto.name })
      .where(
        and(
          eq(productOptionsTable.id, optionId),
          eq(productOptionsTable.productId, productId),
        ),
      );

    const options = await this.findOptions(productId);
    return options.find((o) => o.id === optionId);
  }

  async removeOptionValue(
    productId: number,
    optionId: number,
    valueId: number,
  ): Promise<ProductOption | undefined> {
    const [option] = await this.db
      .select()
      .from(productOptionsTable)
      .where(
        and(
          eq(productOptionsTable.id, optionId),
          eq(productOptionsTable.productId, productId),
        ),
      );
    if (!option) return undefined;

    // cascades to variant_option_values — variants that used this value are
    // kept, they just lose that dimension
    await this.db
      .delete(productOptionValuesTable)
      .where(
        and(
          eq(productOptionValuesTable.id, valueId),
          eq(productOptionValuesTable.optionId, optionId),
        ),
      );

    const options = await this.findOptions(productId);
    return options.find((o) => o.id === optionId);
  }

  async removeOption(productId: number, optionId: number): Promise<ProductOption | undefined> {
    const options = await this.findOptions(productId);
    const option = options.find((o) => o.id === optionId);

    await this.db
      .delete(productOptionsTable)
      .where(
        and(
          eq(productOptionsTable.id, optionId),
          eq(productOptionsTable.productId, productId),
        ),
      );

    return option;
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


  async createVariants(
    productId: number,
    createVariantsDto: CreateVariantsDto,
  ): Promise<ProductVariant[]> {
    const variantIds = await this.db.transaction(async (tx) => {
      const optionValueGroups: number[][] = [];

      for (const option of createVariantsDto.options) {
        let [productOption] = await tx
          .select()
          .from(productOptionsTable)
          .where(
            and(
              eq(productOptionsTable.productId, productId),
              eq(productOptionsTable.name, option.name),
            ),
          );

        if (!productOption) {
          [productOption] = await tx
            .insert(productOptionsTable)
            .values({ productId, name: option.name })
            .returning();
        }

        const optionValueIds: number[] = [];
        for (const value of option.values) {
          let [optionValue] = await tx
            .select()
            .from(productOptionValuesTable)
            .where(
              and(
                eq(productOptionValuesTable.optionId, productOption.id),
                eq(productOptionValuesTable.value, value),
              ),
            );

          if (!optionValue) {
            [optionValue] = await tx
              .insert(productOptionValuesTable)
              .values({ optionId: productOption.id, value })
              .returning();
          }

          optionValueIds.push(optionValue.id);
        }

        optionValueGroups.push(optionValueIds);
      }

      const combinations = cartesianProduct(optionValueGroups);

      // a combination that already has a variant should be reused, not duplicated
      const existingLinks = await tx
        .select({
          variantId: variantOptionValuesTable.variantId,
          optionValueId: variantOptionValuesTable.optionValueId,
        })
        .from(variantOptionValuesTable)
        .innerJoin(
          productVariantsTable,
          eq(productVariantsTable.id, variantOptionValuesTable.variantId),
        )
        .where(eq(productVariantsTable.productId, productId));

      const optionValueIdsByVariant = new Map<number, number[]>();
      for (const link of existingLinks) {
        const ids = optionValueIdsByVariant.get(link.variantId) ?? [];
        ids.push(link.optionValueId);
        optionValueIdsByVariant.set(link.variantId, ids);
      }

      const comboKey = (optionValueIds: number[]) =>
        [...optionValueIds].sort((a, b) => a - b).join(',');

      const existingVariantIdByCombo = new Map<string, number>();
      for (const [variantId, optionValueIds] of optionValueIdsByVariant) {
        existingVariantIdByCombo.set(comboKey(optionValueIds), variantId);
      }

      const variantIds: number[] = [];

      for (const combination of combinations) {
        const existingVariantId = existingVariantIdByCombo.get(
          comboKey(combination),
        );
        if (existingVariantId !== undefined) {
          variantIds.push(existingVariantId);
          continue;
        }

        const [variant] = await tx
          .insert(productVariantsTable)
          .values({ productId, priceCents: createVariantsDto.priceCents })
          .returning();

        await tx.insert(inventoryTable).values({
          variantId: variant.id,
          stock: createVariantsDto.stock,
        });

        await tx.insert(variantOptionValuesTable).values(
          combination.map((optionValueId) => ({
            variantId: variant.id,
            optionValueId,
          })),
        );

        variantIds.push(variant.id);
      }

      // a variant only makes sense if it has a value for every current
      // option — drop anything left over from before an option was added,
      // or from a value that was since removed
      if (variantIds.length > 0) {
        await tx
          .delete(productVariantsTable)
          .where(
            and(
              eq(productVariantsTable.productId, productId),
              notInArray(productVariantsTable.id, variantIds),
            ),
          );
      }

      return variantIds;
    });

    const variants = await this.db
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
      .where(inArray(productVariantsTable.id, variantIds));

    return await this.attachOptionValues(variants);
  }
}
