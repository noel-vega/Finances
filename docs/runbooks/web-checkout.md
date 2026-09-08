# Runbook: web checkout, end to end (local, Stripe test mode)

How to run one real storefront purchase locally and verify every downstream write.
Verified working 2026-09-02 (OS-111); **path changed by M9** (checkout webhook +
order resolution moved storefront-api → merchant-api) — re-verify after M9 deploys.

```
storefront-web /checkout                         [storefront-api :3001]
  → GET  /checkout/config              gate on stripe_accounts.charges_enabled
  → POST /checkout/session             stripe.checkout.sessions.create({ ui_mode: 'embedded_page' }, { stripeAccount })
  → POST /checkout/shipping-options    (per address change) Shippo rates → sessions.update
  → pay (embedded Stripe form)

  → checkout.session.completed         [merchant-api :3000]
      POST /checkout/webhook           payments: verify sig → emit checkout.session.paid (awaited)
      → sales CheckoutOrderHandler     resolve cart by token → enqueue 'checkout-completed' on ORDERS
                                       (skips if an order_payments row already exists for the session)

  → worker OrdersProcessor             [worker :3003]
                                       orders + order_shipping + order_payments + order_items,
                                       inventory decrement + inventory_movements, delete carts row,
                                       enqueue order-confirmation email

  → GET /checkout/session/:id          [storefront-api] return page shows "Thanks for your order!"
```

## Prerequisites (one time)

| Need | Where |
|---|---|
| Stripe account, **test mode**, **Connect enabled** | dashboard → get `sk_test_…` + `pk_test_…` |
| Shippo account | `shippo_test_…` API token |
| Stripe CLI | `brew install stripe/stripe-cli/stripe` then `stripe login` |

Fill these in `.env` (already done if `apps/storefront-api/.env` etc. exist — `npm run setup` only copies, never overwrites):

- `apps/storefront-api/.env`: `STRIPE_SECRET_KEY`, `SHIPPO_API_KEY`
- `apps/merchant-api/.env`: `STRIPE_SECRET_KEY` (same), `STRIPE_ACCOUNT_WEBHOOK_SECRET`, `STRIPE_CHECKOUT_WEBHOOK_SECRET`, `SHIPPO_API_KEY`
- `apps/storefront-web/.env`: `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_STOREFRONT_APP_KEY` (the `sfk_…` from `npm run bootstrap`)
- `apps/merchant-web/.env`: `VITE_STRIPE_PUBLISHABLE_KEY`

> `stripe listen` prints one stable per-CLI signing secret (`whsec_…`) at startup, the
> same for every invocation — so `STRIPE_ACCOUNT_WEBHOOK_SECRET` and
> `STRIPE_CHECKOUT_WEBHOOK_SECRET` are the **same string** locally (both `stripe listen`
> processes below share it). In production they are two separate Stripe Dashboard
> destinations with their own secrets.

## Stand it up

```bash
npm run up          # postgres + redis + minio + mailpit
npm run bootstrap   # drizzle push + seed — copy "Created storefront API key: sfk_…" into apps/storefront-web/.env
npm run dev         # merchant-api :3000, storefront-api :3001, storefront-web :3002, worker :3003, merchant-web :5000

# in two more terminals — leave running (both forward to merchant-api now):
npm run stripe:listen -w merchant-api            # account.updated                → :3000/stripe-connect/webhook
npm run stripe:listen:checkout -w merchant-api   # checkout.session.completed/... → :3000/checkout/webhook
```

The seed's "Default" location ships from a real address and every variant has a weight,
so Shippo can quote right away — no manual Locations step.

## Connect a Stripe account to the store

merchant-web (`http://localhost:5000`, login `owner@sneakerdepot.test` / `password123`)
→ **Payments** → **Connect with Stripe** → complete the Stripe Express onboarding
(test mode: SSN `000-00-0000`, routing `110000000`, account `000123456789`, any test
phone/DOB). When done, `charges_enabled` flips to true via the `account.updated` webhook
(or revisit Payments to force a `?refresh=true` status pull).

Shortcut for a checkout-only test: if you already have a `charges_enabled` test connected
account (`stripe accounts list`), insert the row directly:

```sql
insert into stripe_accounts ("accountId", stripe_account_id, charges_enabled, details_submitted)
values (1, 'acct_XXXX', true, true);
```

`curl -s localhost:3001/checkout/config -H "x-app-key: sfk_…"` should now return
`{"ready":true,"stripeAccountId":"acct_…"}`.

## Run the purchase

storefront-web `http://localhost:3002` → a product → **Add to cart** → **Cart** →
**Checkout** → in the embedded Stripe form:

- Email: anything
- Shipping address: any real US address (click "Enter address manually" if the
  autocomplete is fiddly) — this fires `POST /checkout/shipping-options`; you should see
  3 real carrier rates appear
- Card **`4242 4242 4242 4242`**, exp `12/34`, CVC `123`, ZIP matching the address
- **Pay** → redirect to `/checkout/return` → "Thanks for your order!"

## Verify

```bash
docker exec -e PGPASSWORD=postgres ordersail-db psql -U postgres -d ordersail -c '
  select * from orders;
  select * from order_payments;
  select * from order_shipping;
  select * from order_items;
  select "variantId", stock from inventory where stock < 999;      -- decremented
  select * from inventory_movements;                                -- reason = sold, negative delta
  select count(*) from carts;                                       -- the bought cart is gone
'
```

Expect: `orders.channel = 'web'`, `subtotalCents` + `shippingCents` + `taxCents(0)` =
`amountTotalCents`, `order_payments.method = 'stripe'` with both `stripeCheckoutSessionId`
and `stripePaymentIntentId`, `order_shipping.locationId` = the quoted ship-from, one
`inventory_movements` row per item, the cart deleted.

- Confirmation email: Mailpit `http://localhost:8025` — "Your order from Sneaker Depot is confirmed (#N)"
- merchant-web → **Orders** — the order, channel "Online", "Unfulfilled"
- `stripe:listen:checkout` (merchant-api) log: `--> checkout.session.completed` then `<-- [201]`
- `merchant-api` log: `[CheckoutOrderService] checkout cs_test_…: order job enqueued`
- `worker` log: `created order for session cs_test_…`

## Idempotency

`sales.CheckoutOrderService.enqueue` and the worker both `select … from order_payments
where stripeCheckoutSessionId = …` before doing anything, and the column is `UNIQUE`.
Stripe retries a webhook only on a non-2xx response; a duplicate delivery is a no-op (the
worker re-queues just the confirmation email if it wasn't sent). A bad signature returns
**400** (so Stripe stops retrying), not 500. The `payments` webhook `await`s the `sales`
handler (`emitAsync`), so a failed enqueue returns non-2xx and Stripe redelivers — a paid
order is never silently lost.

## Production (Stripe Dashboard)

Two **event destinations**, both "Events from: Connected accounts", each with its own
signing secret:

| Destination | URL | Events | App secret key |
|---|---|---|---|
| account | `https://<merchant-api>/api/stripe-connect/webhook` | `account.updated` | `ordersail/production/merchant-api` → `STRIPE_ACCOUNT_WEBHOOK_SECRET` |
| checkout | `https://<merchant-api>/api/checkout/webhook` | `checkout.session.completed`, `checkout.session.async_payment_succeeded` (later: `expired`, `async_payment_failed` — OS-115) | `ordersail/production/merchant-api` → `STRIPE_CHECKOUT_WEBHOOK_SECRET` |

Create the checkout destination at Stripe API version **`2026-08-26.dahlia`** to match
the SDK pin in `packages/payments` (the older account destination is on `2024-12-18.acacia`
— harmless for `account.updated`, but new destinations should track the pin).

## Not covered by this flow (later milestones)

- Tax — `orders.taxCents` is always 0 (Payments M5)
- Platform fee — no `application_fee_amount` on the session (Payments M4)
- Order status / refund / cancel — no `status` column yet (Payments M2)
- `checkout.session.expired` / `async_payment_failed`, "paid but order-write failed"
  recovery, a session-creation idempotency key (Payments M1: OS-115/116/117)
- Real parcel dimensions, persisting the chosen carrier/service level
