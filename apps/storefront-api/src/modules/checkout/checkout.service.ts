import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.constants';
import {
  and,
  cartItemsTable,
  cartsTable,
  desc,
  eq,
  inventoryMovementsTable,
  inventoryTable,
  isNotNull,
  locationsTable,
  orderItemsTable,
  ordersTable,
  productVariantsTable,
  sql,
  stripeAccountsTable,
  type db as Db,
} from 'db';
import { CartService } from '../cart/cart.service';
import { Cart } from '../cart/entities/cart.entity';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { GetShippingOptionsDto } from './dto/shipping-options.dto';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CheckoutConfig } from './entities/checkout-config.entity';
import { CheckoutSessionStatus } from './entities/checkout-session-status.entity';
import { ShippingOptionsResult } from './entities/shipping-options-result.entity';
import { stripe } from './stripe.client';
import { shippo } from './shippo.client';

// used when a variant has no weight set — a real value, not a hard block
const DEFAULT_ITEM_WEIGHT_OZ = 16;
// box dimensions aren't modeled per-product (real bin-packing is out of
// scope) — every quote uses this fixed default, only weight is real
const DEFAULT_PARCEL_DIMENSIONS_IN = { length: '12', width: '9', height: '6' };

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(DRIZZLE) private readonly db: typeof Db,
    private readonly cartService: CartService,
  ) {}

  async getConfig(accountId: number): Promise<CheckoutConfig> {
    const [stripeAccount] = await this.db
      .select()
      .from(stripeAccountsTable)
      .where(eq(stripeAccountsTable.accountId, accountId));

    return {
      ready: stripeAccount?.chargesEnabled ?? false,
      stripeAccountId: stripeAccount?.stripeAccountId ?? null,
    };
  }

  async createSession(
    cartToken: string | undefined,
    accountId: number,
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSession> {
    const [stripeAccount] = await this.db
      .select()
      .from(stripeAccountsTable)
      .where(eq(stripeAccountsTable.accountId, accountId));

    if (!stripeAccount || !stripeAccount.chargesEnabled) {
      throw new BadRequestException("This store isn't ready to accept payments yet");
    }

    const cart = await this.cartService.getCart(cartToken, accountId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    for (const item of cart.items) {
      if (item.quantity > item.stock) {
        throw new BadRequestException(`Not enough stock for ${item.productName}`);
      }
    }

    // embedded, not hosted — the customer never leaves the storefront's
    // own page; Stripe just mounts the payment form in an iframe there
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        ui_mode: 'embedded_page',
        line_items: cart.items.map((item) => ({
          price_data: {
            currency: 'usd',
            unit_amount: item.priceCents,
            product_data: { name: lineItemName(item) },
          },
          quantity: item.quantity,
        })),
        shipping_address_collection: { allowed_countries: ['US'] },
        // required scaffolding for dynamically updating shipping_options
        // later, from POST /checkout/shipping-options — see getShippingOptions
        permissions: { update_shipping_details: 'server_only' },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 0, currency: 'usd' },
              display_name: 'Calculating…',
            },
          },
        ],
        return_url: `${dto.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
        metadata: { accountId: String(accountId), cartToken: cart.token },
      },
      { stripeAccount: stripeAccount.stripeAccountId },
    );

    if (!session.client_secret) {
      throw new BadRequestException('Failed to create checkout session');
    }
    return { clientSecret: session.client_secret };
  }

  // called by the storefront's onShippingDetailsChange callback the moment
  // the customer finishes entering their shipping address — before they
  // can pay — so real carrier rates can be shown for the rest of checkout
  async getShippingOptions(
    accountId: number,
    dto: GetShippingOptionsDto,
  ): Promise<ShippingOptionsResult> {
    const [stripeAccount] = await this.db
      .select()
      .from(stripeAccountsTable)
      .where(eq(stripeAccountsTable.accountId, accountId));
    if (!stripeAccount) {
      return { ok: false, errorMessage: "This store isn't ready to accept payments yet" };
    }

    const session = await stripe.checkout.sessions
      .retrieve(dto.checkoutSessionId, undefined, {
        stripeAccount: stripeAccount.stripeAccountId,
      })
      .catch(() => null);
    const cartToken = session?.metadata?.cartToken;
    if (!session || !cartToken) {
      return { ok: false, errorMessage: 'Unable to find your cart' };
    }

    // the account's first location with a complete address — checkout-time
    // quoting always assumes a single ship-from origin, real multi-location
    // splitting is handled later at fulfillment time, not here
    const [location] = await this.db
      .select()
      .from(locationsTable)
      .where(and(eq(locationsTable.accountId, accountId), isNotNull(locationsTable.addressLine1)))
      .orderBy(locationsTable.id)
      .limit(1);
    if (!location) {
      return { ok: false, errorMessage: "This store hasn't set up a shipping origin yet" };
    }

    const totalWeightOz = await this.totalCartWeightOz(cartToken, accountId);

    const shipment = await shippo.shipments
      .create({
        addressFrom: {
          name: location.name,
          street1: location.addressLine1!,
          street2: location.addressLine2 ?? undefined,
          city: location.addressCity ?? undefined,
          state: location.addressState ?? undefined,
          zip: location.addressPostalCode ?? undefined,
          country: location.addressCountry ?? 'US',
        },
        addressTo: {
          name: dto.shippingDetails.name,
          street1: dto.shippingDetails.address.line1,
          street2: dto.shippingDetails.address.line2,
          city: dto.shippingDetails.address.city,
          state: dto.shippingDetails.address.state,
          zip: dto.shippingDetails.address.postal_code,
          country: dto.shippingDetails.address.country,
        },
        parcels: [
          {
            massUnit: 'oz',
            weight: String(totalWeightOz),
            distanceUnit: 'in',
            ...DEFAULT_PARCEL_DIMENSIONS_IN,
          },
        ],
        async: false,
      })
      .catch(() => null);

    if (!shipment || shipment.rates.length === 0) {
      return { ok: false, errorMessage: "We can't calculate shipping to that address" };
    }

    const cheapestRates = [...shipment.rates]
      .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
      .slice(0, 3);

    await stripe.checkout.sessions.update(
      dto.checkoutSessionId,
      {
        collected_information: {
          shipping_details: {
            name: dto.shippingDetails.name,
            address: {
              line1: dto.shippingDetails.address.line1 ?? '',
              line2: dto.shippingDetails.address.line2,
              city: dto.shippingDetails.address.city,
              state: dto.shippingDetails.address.state,
              postal_code: dto.shippingDetails.address.postal_code,
              country: dto.shippingDetails.address.country,
            },
          },
        },
        shipping_options: cheapestRates.map((rate) => ({
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: Math.round(parseFloat(rate.amount) * 100),
              currency: 'usd',
            },
            display_name: `${rate.provider} ${rate.servicelevel.name ?? ''}`.trim(),
          },
        })),
        metadata: { ...session.metadata, shippingLocationId: String(location.id) },
      },
      { stripeAccount: stripeAccount.stripeAccountId },
    );

    return { ok: true };
  }

  private async totalCartWeightOz(cartToken: string, accountId: number): Promise<number> {
    // a separate query rather than extending CartService.getCart on purpose
    // — weight is an internal shipping concern, not part of the public Cart
    // API surface shown to the customer
    const rows = await this.db
      .select({
        quantity: cartItemsTable.quantity,
        weightOz: productVariantsTable.weightOz,
      })
      .from(cartItemsTable)
      .innerJoin(cartsTable, eq(cartsTable.id, cartItemsTable.cartId))
      .innerJoin(
        productVariantsTable,
        eq(productVariantsTable.id, cartItemsTable.variantId),
      )
      .where(and(eq(cartsTable.token, cartToken), eq(cartsTable.accountId, accountId)));

    return rows.reduce(
      (sum, row) => sum + (row.weightOz ?? DEFAULT_ITEM_WEIGHT_OZ) * row.quantity,
      0,
    );
  }

  async getSessionStatus(
    accountId: number,
    sessionId: string,
  ): Promise<CheckoutSessionStatus> {
    const [stripeAccount] = await this.db
      .select()
      .from(stripeAccountsTable)
      .where(eq(stripeAccountsTable.accountId, accountId));
    if (!stripeAccount) throw new NotFoundException();

    // scoping the retrieve to this account's connected Stripe account is
    // what prevents one tenant from looking up another tenant's session id
    const session = await stripe.checkout.sessions
      .retrieve(sessionId, undefined, { stripeAccount: stripeAccount.stripeAccountId })
      .catch(() => null);
    if (!session) throw new NotFoundException();

    return {
      status: session.status ?? 'open',
      customerEmail: session.customer_details?.email ?? null,
    };
  }

  // triggered by Stripe, not the browser — the redirect back from Checkout
  // isn't reliable (the tab can close), this webhook is the source of truth
  async handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET!,
    );

    if (event.type !== 'checkout.session.completed') return;

    const session = event.data.object;
    if (session.payment_status !== 'paid') return;

    const accountId = Number(session.metadata?.accountId);
    const cartToken = session.metadata?.cartToken;
    if (!accountId || !cartToken) return;

    // idempotency — Stripe retries webhooks on non-2xx/timeouts
    const [existing] = await this.db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(eq(ordersTable.stripeCheckoutSessionId, session.id));
    if (existing) return;

    // the cart, not Stripe's line items, is the source of truth for what
    // was ordered — avoids round-tripping product data through metadata
    const cart = await this.cartService.getCart(cartToken, accountId);
    if (!cart || cart.items.length === 0) return;

    const shipping = session.collected_information?.shipping_details;
    const customer = session.customer_details;

    await this.db.transaction(async (tx) => {
      const recordSoldMovement = async (
        variantId: number,
        locationId: number,
        quantity: number,
      ) => {
        const delta = -quantity;
        await tx
          .insert(inventoryMovementsTable)
          .values({ variantId, locationId, delta, reason: 'sold' });
        await tx
          .insert(inventoryTable)
          .values({ variantId, locationId, stock: delta })
          .onConflictDoUpdate({
            target: [inventoryTable.variantId, inventoryTable.locationId],
            set: {
              stock: sql`${inventoryTable.stock} + ${delta}`,
              updatedAt: new Date(),
            },
          });
      };

      const [order] = await tx
        .insert(ordersTable)
        .values({
          accountId,
          customerEmail: customer?.email ?? '',
          customerName: customer?.name ?? shipping?.name ?? '',
          shippingLine1: shipping?.address.line1 ?? '',
          shippingLine2: shipping?.address.line2 ?? null,
          shippingCity: shipping?.address.city ?? '',
          shippingState: shipping?.address.state ?? null,
          shippingPostalCode: shipping?.address.postal_code ?? '',
          shippingCountry: shipping?.address.country ?? '',
          subtotalCents: cart.subtotalCents,
          amountTotalCents: session.amount_total ?? cart.subtotalCents,
          shippingCents: session.shipping_cost?.amount_total ?? 0,
          shippingLocationId: Number(session.metadata?.shippingLocationId) || null,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : null,
        })
        .returning();

      for (const item of cart.items) {
        // snapshotted so a later label purchase doesn't depend on the
        // variant still existing, same reasoning as productName/sku above
        const [variant] = await tx
          .select({ weightOz: productVariantsTable.weightOz })
          .from(productVariantsTable)
          .where(eq(productVariantsTable.id, item.variantId));

        await tx.insert(orderItemsTable).values({
          orderId: order.id,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          optionsLabel: optionsLabel(item) || null,
          priceCents: item.priceCents,
          quantity: item.quantity,
          weightOz: variant?.weightOz ?? null,
        });

        // greedy across locations, highest stock first — if stock runs out
        // entirely the sale is still recorded against the last location and
        // allowed to go negative; the payment already succeeded and can't
        // be silently undone
        const inventoryRows = await tx
          .select({ locationId: inventoryTable.locationId, stock: inventoryTable.stock })
          .from(inventoryTable)
          .where(eq(inventoryTable.variantId, item.variantId))
          .orderBy(desc(inventoryTable.stock));

        let remaining = item.quantity;
        for (const row of inventoryRows) {
          if (remaining <= 0) break;
          const take = Math.min(Math.max(row.stock, 0), remaining);
          if (take <= 0) continue;
          await recordSoldMovement(item.variantId, row.locationId, take);
          remaining -= take;
        }
        if (remaining > 0 && inventoryRows.length > 0) {
          await recordSoldMovement(item.variantId, inventoryRows[0].locationId, remaining);
        }
      }

      await tx
        .delete(cartsTable)
        .where(and(eq(cartsTable.token, cartToken), eq(cartsTable.accountId, accountId)));
    });
  }
}

function lineItemName(item: Cart['items'][number]): string {
  const options = optionsLabel(item);
  return options ? `${item.productName} (${options})` : item.productName;
}

function optionsLabel(item: Cart['items'][number]): string {
  return item.optionValues.map((ov) => `${ov.optionName}: ${ov.value}`).join(', ');
}
