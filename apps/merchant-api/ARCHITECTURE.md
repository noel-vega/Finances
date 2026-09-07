# merchant-api architecture

merchant-api is a **modular monolith**: one deployable NestJS app, internally
split into **bounded contexts** with enforced boundaries. See Linear milestone
*M8 — Modular monolith* for the why (we deliberately did **not** split it into
services — one shared Postgres, `dashboard` cross-joins domains, pre-launch).

## Contexts

`src/` is 6 domain contexts + a shared kernel. Every folder directly under
`src/` is a context (or `shared/`); root files (`src/*.ts`) are the composition
root.

<!-- table lists are the primary tables per context; OS-344 makes ownership
     precise via per-domain `db/<domain>` entrypoints -->

| Context | `src/` folder | Modules | Owns (schema tables) |
|---|---|---|---|
| **identity** | `identity/` | auth, users, roles, permissions, api-keys, account | `accounts`, `users`, `user_invites`, `account_api_keys`, `roles`, `permissions`, `role_permissions`, `user_roles` |
| **catalog** | `catalog/` | products, brands, categories | `products`, `brands`, `categories`, `product_options`, `product_option_values`, `product_variants`, `variant_option_values`, `product_categories`, `product_images`, `product_barcodes` |
| **stock** | `stock/` | inventory, locations | `locations`, `inventory`, `inventory_movements` |
| **sales** | `sales/` | orders, fulfillments, carts, customers | `orders`, `order_shipping`, `order_payments`, `order_items`, `fulfillments`, `fulfillment_items`, `carts`, `cart_items`, `customers` |
| **payments** | `payments/` (flat) | stripe-connect | `stripe_accounts` |
| **platform** | `platform/` | dashboard, health, pos-devices | `pos_devices` |

**Shared kernel** — `src/shared/`. Pure cross-cutting infra, importable from
anywhere, **no domain logic**:
`common/` (utils), `database/` (the `DRIZZLE` provider, `@Global`),
`storage/` (S3/MinIO, `@Global`), `email/` (BullMQ enqueue, `@Global`),
`events/` (in-process domain-event bus + the event registry, `@Global` — see
*Cross-context communication*),
`auth/decorators.ts` (`@CurrentUser` / `@Public` / `@RequirePermissions` + the
request-context types — the guards themselves live in `identity/auth` and run
globally via `APP_GUARD`), `env.ts`.

## Rules (enforced by `eslint-plugin-boundaries` — see `eslint.config.mjs`)

1. A context imports **its own files** freely, plus the **shared kernel**.
2. A context reaches **another context only through that context's `index.ts`
   barrel** — never a deep path. The barrel is the context's public surface;
   everything else is internal.
3. Allowed cross-context edges:

   | From | May depend on |
   |---|---|
   | `identity` | — (shared only) |
   | `catalog` | `identity` |
   | `stock` | `identity` |
   | `payments` | `identity` |
   | `sales` | `identity`, `catalog`, `stock` |
   | `platform` | `identity`, `sales` — **`platform/dashboard` is the one cross-context read-model**, allowed to query other contexts' data for summary views |

4. The shared kernel is a **leaf** — it may not import a context.

Adding a new cross-context edge = update the table above **and** the
`boundaries/dependencies` policies in `eslint.config.mjs` (they must agree).

## Cross-context communication

- **Adapter behind a local port** — the pattern for calling another context's
  services. The consumer defines a port interface; an adapter class in the
  consumer's `ports/` folder implements it by delegating to the producer's
  barrel-exported services. The consumer's domain code depends only on the port.
  Extraction = swap the adapter for an HTTP client, nothing else changes.

  Today's one live edge: **`platform/dashboard → sales`**. `dashboard.service`
  depends on `SalesPort` (`platform/dashboard/ports/sales.port.ts`);
  `SalesAdapter` (`…/ports/sales.adapter.ts`) is the *only* file in `platform/`
  that imports `sales`' services — enforced by `no-restricted-imports` in
  `eslint.config.mjs`. `dashboard.service`'s `getOrderTotals` /
  `getOutOfStockCount` stay as direct SQL (deliberate read-model projections —
  platform is exempt from the read-graph).
- **Domain events** — for a genuine reactive side-effect in another context,
  not a synchronous read (use a port for that). In-process, via
  `@nestjs/event-emitter`, wired by the `shared/events` kernel module.

  The registry lives in `src/shared/events/events.ts`: a `DOMAIN_EVENTS` name
  constant + a `DomainEventMap` entry (payload type) per event. Payload types
  live in the shared kernel because producer and consumer both depend on them
  and neither context owns them. Producer: inject `DomainEventBus` and call
  `emit(DOMAIN_EVENTS.X, payload)` (name + payload are type-checked). Consumer:
  a provider method decorated `@OnDomainEvent(DOMAIN_EVENTS.X)` with its
  parameter typed `DomainEventMap['x']`.

  Delivery is **synchronous and in-process on the emitting call stack, and not
  durable** — a crash mid-handler loses the event. So a handler that must do
  durable work does it within the emitting request's lifetime and tolerates a
  retry (e.g. enqueues a BullMQ job whose consumer is idempotent), and catches
  its own errors — a rejected async listener is an unhandledRejection the
  emitter never sees. An event does not cross the boundary lint (`payments`
  never imports `sales`); only `shared/events` is shared.

  Live events: **`checkout.session.paid`** — owner `payments` (the checkout
  webhook), consumed by `sales` to create the order. See M9.
- The shared kernel — for pure infra only.

## Data access (read-graph)

One Postgres, one Drizzle schema (`packages/db`), **cross-domain FKs kept** (real
integrity; `dashboard` needs the joins).

`packages/db` exposes a **per-domain entrypoint** per context —
`db/identity`, `db/catalog`, `db/stock`, `db/sales`, `db/payments` — each
re-exporting that domain's schema tables + the drizzle query helpers. Root `db`
stays the full export (for `platform/dashboard`, `drizzle-kit`, and the other
apps).

A context imports **its own `db/<domain>`** plus the entrypoints on its
**read-graph**. Root `db` and `db/schema` are blocked in every context.
Enforced by `no-restricted-imports` in `eslint.config.mjs` (the `denied` map
there must agree with this table).

| Context | may import `db/…` |
|---|---|
| `identity` | `identity`, `stock`¹ |
| `catalog` | `catalog`, `stock`² |
| `stock` | `stock`, `catalog`², `identity` |
| `sales` | `sales`, `catalog`, `stock`, `identity` |
| `payments` | `payments`, `identity` |
| `platform` | root `db` — exempt (`dashboard` read-model) |
| `shared` | root `db` only (the `DRIZZLE` provider); no schema |

**Known coupling — revisit later:**

- **² `catalog ↔ stock` cycle** — `catalog` reads stock levels for product
  listings; `stock` reads product identity for inventory views. They change
  together. If it bites: merge the two contexts, or break the reads through
  service ports (OS-345 pattern).
- **¹ `identity → stock`** — signup (`auth.service`) seeds the new tenant's
  default `locations` row in the same transaction as the account. A provisioning
  *write*, not a read. Revisit via an `account.created` domain event so `stock`
  owns it.

Reads still cross **only** these edges; a genuine service call between contexts
goes through the barrel (see *Cross-context communication*), not raw table
access.

## Extraction seams (if we ever split a context into its own service)

Ordered by how clean the cut is:

1. **`payments`** — 1 module (`stripe-connect`), owns only `stripe_accounts`,
   depends on `identity` alone. The Stripe surface is also duplicated in
   storefront-api / worker → `packages/payments` (OS-347) is the shared core.
   Cut: `stripe_accounts.accountId → accounts.id` FK becomes a soft reference.
2. **`sales` + fulfillment** — larger, but a natural service boundary (order
   lifecycle). Cuts: `order_items.variantId → product_variants.id`,
   `inventory_movements.orderItemId → order_items.id`,
   `order_shipping.locationId → locations.id` become soft references; the
   `dashboard` read-model moves to a query API or a projection.

At each seam: the in-process adapter (OS-345 pattern) becomes an HTTP client, and
the FKs listed above are dropped in favor of application-level references.

## Resilience / blast radius

merchant-api is one process — a fault in one context can take **all** contexts
down. What keeps that bounded (OS-346 audit):

- **Every external SDK client sets a timeout.** Redis: `commandTimeout: 5_000`
  (`app.module.ts` via `createRedisConnection`). Stripe:
  `timeout: 20_000, maxNetworkRetries: 1` (`payments/stripe.client.ts` — the SDK
  default is 80 s). Shippo: `timeoutMs: 20_000`
  (`sales/fulfillments/shippo.client.ts`). S3: `requestTimeout: 10_000`
  (`packages/storage`). **Add a timeout to any new client.**
- **Webhooks fail as 4xx, not 5xx, on bad input** —
  `stripe-connect.controller.ts` catches `constructEvent` → `BadRequestException`
  so Stripe stops retrying (same as storefront-api's checkout webhook).
- **No unbounded in-process work** — no module-level mutable caches,
  `setInterval`, `while(true)`, or unbounded recursion. `onModuleInit` hooks
  either fail-fast (`permissions` — don't serve without the catalog) or are
  wrapped (`storage`).
- **List endpoints must paginate.** `sales/orders` is the reference
  (`PaginatedOrders` + `@Query('limit', DefaultValuePipe, ParseIntPipe)`).
  Still unbounded, tracked: `GET /inventory/movements` (OS-349, append-only
  ledger) and `GET /products` `/inventory` `/customers` (OS-350).

Not here: expand/contract migrations (deploy ≠ migration coupling) and canary
deploys — those live in *Production readiness*.

## Not here

- **Nx libraries** (contexts as `packages/merchant-<context>/` +
  `@nx/enforce-module-boundaries`) — the known next step, tracked as OS-348. Do
  it when `nx affected` would save real CI time or a second person owns a
  context.
