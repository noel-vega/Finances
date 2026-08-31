import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  accountsTable,
  and,
  asc,
  brandsTable,
  categoriesTable,
  eq,
  gt,
  ilike,
  inArray,
  inventoryTable,
  isNull,
  locationsTable,
  or,
  posDevicesTable,
  productBarcodesTable,
  productCategoriesTable,
  productImagesTable,
  productOptionsTable,
  productOptionValuesTable,
  productVariantsTable,
  productsTable,
  sql,
  variantOptionValuesTable,
  type db as Db,
  type SQL,
} from "db";
import { DRIZZLE } from "../../database/database.constants";
import type { PosDeviceContext } from "../pos-auth/pos-auth.decorators";
import { ListCatalogQueryDto } from "./dto/list-catalog-query.dto";
import {
  PosCatalogImage,
  PosCatalogProduct,
  PosCatalogVariant,
} from "./entities/pos-catalog-product.entity";
import { PosCatalogPage } from "./entities/pos-catalog-page.entity";
import { PosScanResult } from "./entities/pos-scan-result.entity";
import { PosSession } from "./entities/pos-session.entity";

@Injectable()
export class CatalogService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async list(
    query: ListCatalogQueryDto,
    device: PosDeviceContext,
  ): Promise<PosCatalogPage> {
    const filters: (SQL | undefined)[] = [
      eq(productsTable.accountId, device.accountId),
      // the POS only sells live products, same rule as the storefront
      eq(productsTable.status, "active"),
    ];

    if (query.cursor !== undefined) {
      filters.push(gt(productsTable.id, query.cursor));
    }

    const search = query.search?.trim();
    if (search) {
      const term = `%${search}%`;
      const variantMatchProductIds = this.db
        .select({ productId: productVariantsTable.productId })
        .from(productVariantsTable)
        .leftJoin(
          productBarcodesTable,
          eq(productBarcodesTable.variantId, productVariantsTable.id),
        )
        .where(
          or(
            ilike(productVariantsTable.sku, term),
            ilike(productBarcodesTable.code, term),
          ),
        );
      filters.push(
        or(
          ilike(productsTable.name, term),
          inArray(productsTable.id, variantMatchProductIds),
        ),
      );
    }

    // fetch one extra row to know whether another page exists
    const rows = await this.db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        brandId: productsTable.brandId,
      })
      .from(productsTable)
      .where(and(...filters))
      .orderBy(asc(productsTable.id))
      .limit(query.limit + 1);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    const items = await this.assembleProducts(pageRows, device.locationId);

    return {
      items,
      nextCursor: hasMore ? String(pageRows[pageRows.length - 1].id) : null,
      syncedAt: new Date().toISOString(),
    };
  }

  async findOne(
    id: number,
    device: PosDeviceContext,
  ): Promise<PosCatalogProduct> {
    const [baseRow] = await this.db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        brandId: productsTable.brandId,
      })
      .from(productsTable)
      .where(
        and(
          eq(productsTable.id, id),
          eq(productsTable.accountId, device.accountId),
          eq(productsTable.status, "active"),
        ),
      );

    if (!baseRow) {
      throw new NotFoundException();
    }

    const [product] = await this.assembleProducts([baseRow], device.locationId);
    return product;
  }

  async scan(code: string, device: PosDeviceContext): Promise<PosScanResult> {
    const trimmed = code.trim();

    // barcode first, then fall back to SKU — both scoped to the device's
    // account so a code that exists under another tenant reads as not-found
    const [match] = await this.db
      .select({
        variantId: productVariantsTable.id,
        productId: productVariantsTable.productId,
      })
      .from(productVariantsTable)
      .innerJoin(
        productsTable,
        eq(productsTable.id, productVariantsTable.productId),
      )
      .leftJoin(
        productBarcodesTable,
        eq(productBarcodesTable.variantId, productVariantsTable.id),
      )
      .where(
        and(
          eq(productsTable.accountId, device.accountId),
          eq(productsTable.status, "active"),
          or(
            eq(productBarcodesTable.code, trimmed),
            eq(productVariantsTable.sku, trimmed),
          ),
        ),
      )
      .limit(1);

    if (!match) {
      throw new NotFoundException("No product matches that code");
    }

    const [baseRow] = await this.db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        brandId: productsTable.brandId,
      })
      .from(productsTable)
      .where(eq(productsTable.id, match.productId));

    const [product] = await this.assembleProducts([baseRow], device.locationId);
    return { product, variantId: match.variantId };
  }

  async session(device: PosDeviceContext): Promise<PosSession> {
    const [row] = await this.db
      .select({
        accountId: posDevicesTable.accountId,
        accountName: accountsTable.name,
        locationId: posDevicesTable.locationId,
        locationName: locationsTable.name,
        deviceName: posDevicesTable.name,
      })
      .from(posDevicesTable)
      .innerJoin(accountsTable, eq(accountsTable.id, posDevicesTable.accountId))
      .innerJoin(
        locationsTable,
        eq(locationsTable.id, posDevicesTable.locationId),
      )
      .where(eq(posDevicesTable.id, device.deviceId));

    return row;
  }

  private async assembleProducts(
    baseRows: {
      id: number;
      name: string;
      description: string | null;
      brandId: number | null;
    }[],
    locationId: number,
  ): Promise<PosCatalogProduct[]> {
    if (baseRows.length === 0) return [];

    const productIds = baseRows.map((r) => r.id);
    const brandIds = [
      ...new Set(
        baseRows
          .map((r) => r.brandId)
          .filter((id): id is number => id !== null),
      ),
    ];

    const [
      brandsById,
      categoriesByProduct,
      imagesByProduct,
      variantsByProduct,
    ] = await Promise.all([
      this.selectBrands(brandIds),
      this.selectCategories(productIds),
      this.selectProductImages(productIds),
      this.selectVariants(productIds, locationId),
    ]);

    return baseRows.map((row) => {
      const images = imagesByProduct.get(row.id) ?? [];
      const fallbackImageUrl = images[0]?.url ?? null;
      const variants = (variantsByProduct.get(row.id) ?? []).map((v) => ({
        ...v,
        imageUrl: v.imageUrl ?? fallbackImageUrl,
      }));

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        brand:
          row.brandId !== null ? (brandsById.get(row.brandId) ?? null) : null,
        categories: categoriesByProduct.get(row.id) ?? [],
        images,
        variants,
      };
    });
  }

  private async selectBrands(
    brandIds: number[],
  ): Promise<Map<number, { id: number; name: string }>> {
    const map = new Map<number, { id: number; name: string }>();
    if (brandIds.length === 0) return map;
    const rows = await this.db
      .select({ id: brandsTable.id, name: brandsTable.name })
      .from(brandsTable)
      .where(inArray(brandsTable.id, brandIds));
    for (const row of rows) map.set(row.id, row);
    return map;
  }

  private async selectCategories(
    productIds: number[],
  ): Promise<Map<number, { id: number; name: string }[]>> {
    const map = new Map<number, { id: number; name: string }[]>();
    const rows = await this.db
      .select({
        productId: productCategoriesTable.productId,
        id: categoriesTable.id,
        name: categoriesTable.name,
      })
      .from(productCategoriesTable)
      .innerJoin(
        categoriesTable,
        eq(categoriesTable.id, productCategoriesTable.categoryId),
      )
      .where(inArray(productCategoriesTable.productId, productIds));
    for (const row of rows) {
      const list = map.get(row.productId) ?? [];
      list.push({ id: row.id, name: row.name });
      map.set(row.productId, list);
    }
    return map;
  }

  // product-level gallery only (variantId IS NULL)
  private async selectProductImages(
    productIds: number[],
  ): Promise<Map<number, PosCatalogImage[]>> {
    const map = new Map<number, PosCatalogImage[]>();
    const rows = await this.db
      .select({
        productId: productImagesTable.productId,
        id: productImagesTable.id,
        url: productImagesTable.url,
        position: productImagesTable.position,
      })
      .from(productImagesTable)
      .where(
        and(
          inArray(productImagesTable.productId, productIds),
          isNull(productImagesTable.variantId),
        ),
      )
      .orderBy(asc(productImagesTable.position));
    for (const row of rows) {
      const list = map.get(row.productId) ?? [];
      list.push({ id: row.id, url: row.url, position: row.position });
      map.set(row.productId, list);
    }
    return map;
  }

  private async selectVariants(
    productIds: number[],
    locationId: number,
  ): Promise<Map<number, (PosCatalogVariant & { productId: number })[]>> {
    const variantRows = await this.db
      .select({
        id: productVariantsTable.id,
        productId: productVariantsTable.productId,
        sku: productVariantsTable.sku,
        priceCents: productVariantsTable.priceCents,
        // stock at this one location — (variantId, locationId) is unique so
        // the left join is at most one row
        stock: sql<number>`coalesce(${inventoryTable.stock}, 0)::int`,
      })
      .from(productVariantsTable)
      .leftJoin(
        inventoryTable,
        and(
          eq(inventoryTable.variantId, productVariantsTable.id),
          eq(inventoryTable.locationId, locationId),
        ),
      )
      .where(inArray(productVariantsTable.productId, productIds))
      .orderBy(asc(productVariantsTable.id));

    const variantIds = variantRows.map((v) => v.id);
    const [optionValuesByVariant, barcodesByVariant, imageUrlByVariant] =
      await Promise.all([
        this.selectVariantOptionValues(variantIds),
        this.selectVariantBarcodes(variantIds),
        this.selectVariantImageUrls(variantIds),
      ]);

    const map = new Map<
      number,
      (PosCatalogVariant & { productId: number })[]
    >();
    for (const row of variantRows) {
      const list = map.get(row.productId) ?? [];
      list.push({
        id: row.id,
        productId: row.productId,
        sku: row.sku,
        priceCents: row.priceCents,
        stock: row.stock,
        barcodes: barcodesByVariant.get(row.id) ?? [],
        optionValues: optionValuesByVariant.get(row.id) ?? [],
        imageUrl: imageUrlByVariant.get(row.id) ?? null,
      });
      map.set(row.productId, list);
    }
    return map;
  }

  private async selectVariantOptionValues(
    variantIds: number[],
  ): Promise<Map<number, { optionName: string; value: string }[]>> {
    const map = new Map<number, { optionName: string; value: string }[]>();
    if (variantIds.length === 0) return map;
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
      .where(inArray(variantOptionValuesTable.variantId, variantIds));
    for (const row of rows) {
      const list = map.get(row.variantId) ?? [];
      list.push({ optionName: row.optionName, value: row.value });
      map.set(row.variantId, list);
    }
    return map;
  }

  private async selectVariantBarcodes(
    variantIds: number[],
  ): Promise<Map<number, string[]>> {
    const map = new Map<number, string[]>();
    if (variantIds.length === 0) return map;
    const rows = await this.db
      .select({
        variantId: productBarcodesTable.variantId,
        code: productBarcodesTable.code,
      })
      .from(productBarcodesTable)
      .where(inArray(productBarcodesTable.variantId, variantIds))
      .orderBy(asc(productBarcodesTable.id));
    for (const row of rows) {
      const list = map.get(row.variantId) ?? [];
      list.push(row.code);
      map.set(row.variantId, list);
    }
    return map;
  }

  private async selectVariantImageUrls(
    variantIds: number[],
  ): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    if (variantIds.length === 0) return map;
    const rows = await this.db
      .select({
        variantId: productImagesTable.variantId,
        url: productImagesTable.url,
      })
      .from(productImagesTable)
      .where(inArray(productImagesTable.variantId, variantIds))
      .orderBy(asc(productImagesTable.position));
    for (const row of rows) {
      if (row.variantId === null || map.has(row.variantId)) continue;
      map.set(row.variantId, row.url);
    }
    return map;
  }
}
