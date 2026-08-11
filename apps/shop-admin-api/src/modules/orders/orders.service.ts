import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.constants';
import {
  accountsTable,
  and,
  desc,
  eq,
  locationsTable,
  orderItemsTable,
  ordersTable,
  sql,
  type db as Db,
} from 'db';
import { PaginatedOrders } from './entities/paginated-orders.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { ShippingRate } from './entities/shipping-rate.entity';
import { BuyShippingLabelDto } from './dto/buy-shipping-label.dto';
import { shippo } from './shippo.client';

const MAX_LIMIT = 100;
// same defaults used by storefront-api's checkout-time quoting — see that
// module's comment for why box dimensions aren't modeled per-product
const DEFAULT_ITEM_WEIGHT_OZ = 16;
const DEFAULT_PARCEL_DIMENSIONS_IN = { length: '12', width: '9', height: '6' };

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async findAll(
    limit: number,
    offset: number,
    accountId: number,
  ): Promise<PaginatedOrders> {
    const clampedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
    const clampedOffset = Math.max(offset, 0);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: ordersTable.id,
          customerName: ordersTable.customerName,
          customerEmail: ordersTable.customerEmail,
          amountTotalCents: ordersTable.amountTotalCents,
          createdAt: ordersTable.createdAt,
          itemCount: sql<number>`coalesce(sum(${orderItemsTable.quantity}), 0)::int`,
        })
        .from(ordersTable)
        .leftJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
        .where(eq(ordersTable.accountId, accountId))
        .groupBy(ordersTable.id)
        .orderBy(desc(ordersTable.createdAt))
        .limit(clampedLimit)
        .offset(clampedOffset),
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(ordersTable)
        .where(eq(ordersTable.accountId, accountId)),
    ]);

    return { items, total, limit: clampedLimit, offset: clampedOffset };
  }

  async findOne(id: number, accountId: number): Promise<OrderDetail | undefined> {
    const [order] = await this.db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, id), eq(ordersTable.accountId, accountId)));
    if (!order) return undefined;

    const items = await this.db
      .select({
        id: orderItemsTable.id,
        variantId: orderItemsTable.variantId,
        productName: orderItemsTable.productName,
        sku: orderItemsTable.sku,
        optionsLabel: orderItemsTable.optionsLabel,
        priceCents: orderItemsTable.priceCents,
        quantity: orderItemsTable.quantity,
      })
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    return {
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingLine1: order.shippingLine1,
      shippingLine2: order.shippingLine2,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPostalCode: order.shippingPostalCode,
      shippingCountry: order.shippingCountry,
      subtotalCents: order.subtotalCents,
      amountTotalCents: order.amountTotalCents,
      shippingCents: order.shippingCents,
      shippingLocationId: order.shippingLocationId,
      shippingCarrier: order.shippingCarrier,
      shippingServiceLevel: order.shippingServiceLevel,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      labelUrl: order.labelUrl,
      createdAt: order.createdAt,
      items,
    };
  }

  // re-queries Shippo fresh rather than reusing the checkout-time quote,
  // which may have since expired — this can happen well after checkout,
  // whenever the merchant is ready to fulfill
  async getShippingRates(id: number, accountId: number): Promise<ShippingRate[]> {
    const [order] = await this.db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, id), eq(ordersTable.accountId, accountId)));
    if (!order) throw new NotFoundException();
    if (!order.shippingLocationId) {
      throw new BadRequestException('No ship-from location recorded for this order');
    }

    const [location] = await this.db
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.id, order.shippingLocationId));
    if (!location?.addressLine1) {
      throw new BadRequestException("This order's ship-from location has no address");
    }

    const [account] = await this.db
      .select({ phone: accountsTable.phone, email: accountsTable.email })
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId));

    const items = await this.db
      .select({ quantity: orderItemsTable.quantity, weightOz: orderItemsTable.weightOz })
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));
    const totalWeightOz = items.reduce(
      (sum, item) => sum + (item.weightOz ?? DEFAULT_ITEM_WEIGHT_OZ) * item.quantity,
      0,
    );

    const shipment = await shippo.shipments
      .create({
        addressFrom: {
          name: location.name,
          street1: location.addressLine1,
          street2: location.addressLine2 ?? undefined,
          city: location.addressCity ?? undefined,
          state: location.addressState ?? undefined,
          zip: location.addressPostalCode ?? undefined,
          country: location.addressCountry ?? 'US',
          phone: account?.phone,
          email: account?.email,
        },
        addressTo: {
          name: order.customerName,
          street1: order.shippingLine1,
          street2: order.shippingLine2 ?? undefined,
          city: order.shippingCity,
          state: order.shippingState ?? undefined,
          zip: order.shippingPostalCode,
          country: order.shippingCountry,
        },
        parcels: [
          {
            massUnit: 'oz',
            weight: String(totalWeightOz || DEFAULT_ITEM_WEIGHT_OZ),
            distanceUnit: 'in',
            ...DEFAULT_PARCEL_DIMENSIONS_IN,
          },
        ],
        async: false,
      })
      .catch((err) => {
        this.logger.error(`Shippo shipment creation failed for order ${id}`, err);
        return null;
      });

    if (!shipment || shipment.rates.length === 0) {
      throw new BadRequestException("Couldn't get shipping rates for this order");
    }

    return [...shipment.rates]
      .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
      .map((rate) => ({
        objectId: rate.objectId,
        provider: rate.provider,
        servicelevel: rate.servicelevel.name ?? '',
        amountCents: Math.round(parseFloat(rate.amount) * 100),
        estimatedDays: rate.estimatedDays ?? null,
      }));
  }

  async buyShippingLabel(
    id: number,
    accountId: number,
    dto: BuyShippingLabelDto,
  ): Promise<OrderDetail> {
    const [order] = await this.db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(and(eq(ordersTable.id, id), eq(ordersTable.accountId, accountId)));
    if (!order) throw new NotFoundException();

    const transaction = await shippo.transactions
      .create({ rate: dto.rateObjectId, labelFileType: 'PDF', async: false })
      .catch((err) => {
        this.logger.error(`Shippo transaction creation failed for order ${id}`, err);
        return null;
      });

    if (!transaction || transaction.status !== 'SUCCESS') {
      const reason = transaction?.messages?.map((m) => m.text).filter(Boolean).join('; ');
      this.logger.error(
        `Shippo transaction for order ${id} did not succeed: status=${transaction?.status ?? 'none'} ${reason ?? ''}`,
      );
      throw new BadRequestException(
        reason ? `Couldn't purchase a label for that rate: ${reason}` : "Couldn't purchase a label for that rate",
      );
    }

    await this.db
      .update(ordersTable)
      .set({
        shippoTransactionId: transaction.objectId ?? null,
        trackingNumber: transaction.trackingNumber ?? null,
        trackingUrl: transaction.trackingUrlProvider ?? null,
        labelUrl: transaction.labelUrl ?? null,
        shippingCarrier: dto.provider,
        shippingServiceLevel: dto.servicelevel,
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, id));

    return (await this.findOne(id, accountId))!;
  }
}
