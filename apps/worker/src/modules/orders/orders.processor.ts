import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { QUEUE_NAMES, type EmailJobData, type OrderJobData } from 'queue';
import {
  accountsTable,
  and,
  cartsTable,
  desc,
  eq,
  inventoryMovementsTable,
  inventoryTable,
  orderItemsTable,
  ordersTable,
  productVariantsTable,
  sql,
  type db as Db,
} from 'db';
import { DRIZZLE } from '../../database/database.constants';

// order creation, relocated verbatim from storefront-api's CheckoutService
// (which used to run this inline inside the Stripe webhook request) — see
// checkout.service.ts's handleWebhookEvent for the producer side
@Processor(QUEUE_NAMES.ORDERS)
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: typeof Db,
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue<EmailJobData>,
  ) {
    super();
  }

  async process(job: Job<OrderJobData>): Promise<void> {
    const data = job.data;

    switch (data.type) {
      case 'checkout-completed':
        await this.processCheckoutCompleted(data);
        return;

      default: {
        // OrderJobData has only one variant today, so TypeScript can't
        // narrow this branch to `never` (a single-member discriminated
        // union doesn't narrow the same way EmailJobData's two members
        // do) — this becomes a real compile-time exhaustiveness check the
        // moment a second variant is added, same pattern as
        // EmailProcessor. Until then it's a runtime guard against a
        // malformed job (Redis doesn't enforce this type).
        const unexpected = data as OrderJobData;
        throw new Error(`Unrecognized order job type: ${unexpected.type}`);
      }
    }
  }

  private async processCheckoutCompleted(
    data: Extract<OrderJobData, { type: 'checkout-completed' }>,
  ): Promise<void> {
    // re-check idempotency here too — the webhook handler already checked
    // before enqueueing, but this guards against BullMQ retries or a
    // duplicate Stripe delivery racing a job that's still in flight
    const [existing] = await this.db
      .select({ id: ordersTable.id, confirmationEmailQueuedAt: ordersTable.confirmationEmailQueuedAt })
      .from(ordersTable)
      .where(eq(ordersTable.stripeCheckoutSessionId, data.stripeCheckoutSessionId));
    if (existing) {
      // the order itself is done, but if the worker died between the
      // transaction below committing and the email enqueueing (BullMQ
      // redelivers on a stalled job the same way it does on failure), this
      // redelivery is the only remaining chance to send it
      if (!existing.confirmationEmailQueuedAt) {
        await this.enqueueOrderConfirmationEmail(existing.id, data);
      }
      return;
    }

    let orderId!: number;

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
          accountId: data.accountId,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          shippingLine1: data.shippingLine1,
          shippingLine2: data.shippingLine2,
          shippingCity: data.shippingCity,
          shippingState: data.shippingState,
          shippingPostalCode: data.shippingPostalCode,
          shippingCountry: data.shippingCountry,
          subtotalCents: data.subtotalCents,
          amountTotalCents: data.amountTotalCents,
          shippingCents: data.shippingCents,
          shippingLocationId: data.shippingLocationId,
          stripeCheckoutSessionId: data.stripeCheckoutSessionId,
          stripePaymentIntentId: data.stripePaymentIntentId,
        })
        .returning();
      orderId = order.id;

      for (const item of data.items) {
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
          optionsLabel: item.optionsLabel,
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
        .where(and(eq(cartsTable.token, data.cartToken), eq(cartsTable.accountId, data.accountId)));
    });

    await this.enqueueOrderConfirmationEmail(orderId, data);
  }

  // deliberately caught, not thrown — the order is already committed at
  // this point, and throwing would just make BullMQ retry the whole job.
  // confirmationEmailQueuedAt staying null on failure is what actually makes
  // that retry (or a stalled-job redelivery) useful: the top-of-function
  // idempotency check re-attempts this specific call instead of returning
  // immediately. A logged failure here is recoverable via redelivery; a lost
  // order is not.
  private async enqueueOrderConfirmationEmail(
    orderId: number,
    data: Extract<OrderJobData, { type: 'checkout-completed' }>,
  ): Promise<void> {
    try {
      const [account] = await this.db
        .select({ name: accountsTable.name })
        .from(accountsTable)
        .where(eq(accountsTable.id, data.accountId));

      await this.emailQueue.add('order-confirmation', {
        type: 'order-confirmation',
        to: data.customerEmail,
        customerName: data.customerName,
        accountName: account?.name ?? '',
        orderId,
        items: data.items,
        subtotalCents: data.subtotalCents,
        shippingCents: data.shippingCents,
        amountTotalCents: data.amountTotalCents,
        shippingLine1: data.shippingLine1,
        shippingLine2: data.shippingLine2,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPostalCode: data.shippingPostalCode,
        shippingCountry: data.shippingCountry,
        storefrontUrl: data.storefrontUrl,
      });

      // if this update fails/crashes right after the add() above succeeds,
      // the next redelivery enqueues a duplicate email rather than none —
      // same "duplicate over lost" trade-off ORDER_JOB_OPTIONS already makes
      await this.db
        .update(ordersTable)
        .set({ confirmationEmailQueuedAt: new Date() })
        .where(eq(ordersTable.id, orderId));
    } catch (err) {
      this.logger.error(
        `Order ${orderId} was created but failed to enqueue its confirmation email: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<OrderJobData>, err: Error) {
    const attempts = job.opts.attempts ?? 1;
    const exhausted = job.attemptsMade >= attempts;

    if (exhausted) {
      // all retries used up — this represents a paid customer with no
      // order created, and (per ORDER_JOB_OPTIONS) this job is NOT
      // auto-removed from Redis, so it stays visible until someone acts on it
      this.logger.error(
        `Job ${job.id} (${job.name}) failed permanently after ${job.attemptsMade} attempts — needs manual review: ${err.message}`,
      );
      return;
    }

    this.logger.warn(
      `Job ${job.id} (${job.name}) failed on attempt ${job.attemptsMade}/${attempts}: ${err.message}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<OrderJobData>) {
    const sessionId = job.data.type === 'checkout-completed' ? job.data.stripeCheckoutSessionId : '';
    this.logger.log(`Job ${job.id} (${job.name}) created order for session ${sessionId}`);
  }
}
