import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.constants';
import {
  and,
  cartsTable,
  desc,
  eq,
  inventoryMovementsTable,
  inventoryTable,
  orderItemsTable,
  ordersTable,
  sql,
  stripeAccountsTable,
  type db as Db,
} from 'db';
import { CartService } from '../cart/cart.service';
import { Cart } from '../cart/entities/cart.entity';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CheckoutConfig } from './entities/checkout-config.entity';
import { CheckoutSessionStatus } from './entities/checkout-session-status.entity';
import { stripe } from './stripe.client';

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
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : null,
        })
        .returning();

      for (const item of cart.items) {
        await tx.insert(orderItemsTable).values({
          orderId: order.id,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          optionsLabel: optionsLabel(item) || null,
          priceCents: item.priceCents,
          quantity: item.quantity,
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
