# Ordersail

**A multi-tenant e-commerce platform: back-office admin, storefront, and payments, in one place.**

> "Everything your store needs — products, orders, inventory, and payouts, in one place."

Ordersail is a self-serve platform that lets any retailer spin up an account, catalog their products, connect a Stripe account, and start selling — with a public storefront API/app for customers and an admin dashboard for the merchant. Every account is an isolated tenant with its own catalog, inventory, orders, and Stripe Connect account; the platform itself never touches merchant funds.

Started 2026-07-07. In active early development.

---

## Goals

- **Multi-tenant from day one** — every resource (products, orders, inventory, users) is scoped to an `account`, so the same codebase serves every merchant.
- **Merchants own their money** — payments run through [Stripe Connect](https://stripe.com/connect) (Express accounts); Ordersail never holds merchant funds, only facilitates checkout and takes its cut at the payment layer.
- **Real inventory, not a single stock number** — products support options/variants (size, color, etc.), and stock is tracked per location with an auditable movement log rather than being clobbered in place.
- **A real developer API** — the storefront isn't just Ordersail's own React app; it's backed by a versioned, OpenAPI-documented API with account-scoped API keys, so a merchant (or Ordersail itself) can build any storefront against it.
- **Shipping that's actually usable** — orders carry real shipping addresses, and labels are purchased through Shippo directly from the order, with tracking numbers and URLs stored back on the order.
- **Small, sharp surface area** — guest checkout only (no customer accounts yet), one payment status per order (Stripe webhook confirms payment, so if the row exists, it was paid) — deliberately deferring complexity until it's needed.

## What's built so far

**Accounts, auth & team access**
- Multi-tenant account model — signup creates an account plus its first user
- JWT-based sign in / sign up / logout / token refresh
- Account profile management (name, shipping contact phone/email — required up front since some carriers reject label purchases without it)
- User management (list, view, update, delete) within an account
- Role scaffolding for staff access (roles UI in progress)
- Account-scoped developer API keys, issued and viewable from the admin dashboard

**Catalog**
- Products with options and option values (e.g. Size, Color) and generated variants
- Full CRUD on products, variants, options, and option values
- Categories and brands, with products assignable to both
- Barcode scanner support in the admin UI for fast lookups

**Inventory**
- Multi-location support (a merchant can run one store or several)
- Per-location, per-variant stock levels
- Inventory movement ledger (append-only history of stock changes, not just a mutated counter)

**Cart & checkout**
- Storefront cart API (add/update/remove items, guest cart by token)
- Stripe Checkout Session creation with live shipping-rate options at checkout
- Checkout webhook creates the order — guest checkout, no separate customer table
- Order line items are snapshotted at purchase time (name, SKU, price, weight) so they stay accurate even if the product is later edited or deleted

**Orders & fulfillment**
- Order list/detail views scoped per account
- Shipping-rate quoting and label purchase via Shippo, directly from an order
- Tracking number, tracking URL, and label URL stored back on the order once purchased

**Payments**
- Stripe Connect (Express) onboarding per account, via embedded Stripe Connect components
- Connect status polling (charges enabled / details submitted)
- Stripe webhook handling for both the platform (account onboarding) and per-account checkout events

**Apps**
- `merchant-web` — merchant-facing dashboard (products, inventory, orders, carts, locations, customers, payments, roles, settings, developer API keys)
- `storefront-web` — customer-facing storefront (browse products, cart, Stripe-hosted checkout, order return page)
- `website` — public marketing site introducing Ordersail to prospective merchants

**Developer experience**
- OpenAPI specs generated from both APIs, with typed SDKs (`merchant-sdk`, `storefront-sdk`) generated from them and consumed directly by the React apps
- Shared `ui` component package and Drizzle-based `db` schema package used across every app

## Architecture

An Nx-managed npm workspace monorepo.

| Path | What it is | Stack |
|---|---|---|
| `apps/merchant-api` | Merchant-facing REST API — auth, accounts, products, inventory, orders, Stripe Connect, API keys | NestJS (Fastify), Drizzle, JWT |
| `apps/merchant-web` | Merchant dashboard | React 19, TanStack Router/Query/Table, Tailwind |
| `apps/storefront-api` | Public REST API consumed by storefronts — products, cart, checkout | NestJS (Express), Drizzle, Stripe, Shippo |
| `apps/storefront-web` | Customer-facing storefront app | React 19, React Router, Stripe Elements, Tailwind |
| `apps/website` | Marketing site | Astro |
| `packages/db` | Shared Postgres schema & migrations (single source of truth for both APIs) | Drizzle ORM, Postgres 17 |
| `packages/merchant-sdk` | Typed client generated from the merchant API's OpenAPI spec | openapi-typescript |
| `packages/storefront-sdk` | Typed client generated from the storefront API's OpenAPI spec | openapi-typescript |
| `packages/ui` | Shared component library used by both React apps | React, Tailwind |

**Data model highlights** (`packages/db/src/schema`): `accounts` and `users` anchor multi-tenancy; `products` → `product_options`/`product_option_values` → `product_variants` model catalog variation; `categories` and `brands` classify products; `locations` + `inventory` + `inventory_movements` track stock with history; `carts`/`cart_items` are ephemeral pre-purchase state while `orders`/`order_items` are permanent, snapshotted records; `stripe_accounts` links an account to its Stripe Connect account (a missing row simply means "not connected yet"); `account_api_keys` scopes storefront API access per account.

## Getting started

All commands run from the repo root.

```bash
npm ci
npm run setup       # create .env files from .env.example, then fill in secrets
npm run up          # local infra — Postgres, Redis, MinIO, Mailpit
npm run bootstrap   # push the schema + seed demo data (prints a storefront API key)
npm run dev         # every app's dev server, in parallel
```

| App | URL |
| --- | --- |
| merchant-api | http://localhost:3000 |
| storefront-api | http://localhost:3001 |
| storefront-web | http://localhost:3002 |
| worker (health only) | http://localhost:3003 |
| pos-api | http://localhost:3004 |
| merchant-web | http://localhost:5000 |

`npm run dev` covers the six coupled apps. The marketing site
(`npm run dev:website`, :4321 — runs as its own persistent Astro server, stop with
`cd apps/website && npx astro dev stop`) and the Expo POS app (`npm run dev:pos`)
start on their own.

Other root tasks: `npm run down` / `npm run reset` (wipe volumes + re-seed),
`npm run logs`, `npm run build`, `npm run typecheck`, `npm run push` / `npm run migrate`.

Each NestJS API exposes Swagger/OpenAPI at runtime and has a `generate:openapi` script that regenerates `openapi.json`, which in turn feeds the corresponding SDK package.

## Roadmap

- Customer accounts for the storefront (currently guest-checkout only)
- Role-based permissions for staff users (UI scaffolded, not yet enforced)
- Order statuses beyond "paid" (e.g. fulfilled, refunded, canceled)
- Tax and shipping cost handling beyond what Stripe Checkout quotes directly
- Storefront themes/customization for merchants building on top of the public API
