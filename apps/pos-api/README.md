# pos-api

Device-facing REST API for the POS Android app (`apps/POS`). Runs on `:3004`.

One API per client audience, same as `storefront-api` — its own Drizzle-backed
read models against `packages/db`, no backend-to-backend HTTP.

## Auth

Every route except `POST /pos/pair` and `GET /health` requires an
`x-pos-device-token` header (global `PosDeviceGuard`). A device is minted and
given a pairing code from the admin dashboard (`admin-api`
`POST /pos-devices`); the device redeems that code once via `POST /pos/pair`
for its long-lived token. The token resolves to an account **and** a location —
catalog stock is reported for that location only.

## Routes

| Route | Auth | Purpose |
|---|---|---|
| `POST /pos/pair` | none | redeem a pairing code → `{ token, account, location, deviceName }` |
| `GET /pos/catalog?search=&limit=&cursor=` | device | keyset-paginated active products with variants, price, per-location stock, images, SKU, barcodes |
| `GET /pos/catalog/scan?code=` | device | resolve a barcode or SKU → `{ product, variantId }` (404 if none) |
| `GET /pos/session` | device | which account / location / device this token is bound to |
| `GET /health` | none | DB liveness (`@nestjs/terminus`) |

## Dev

```bash
npm run start:dev        # :3004
npm run generate:openapi # regenerate openapi.json → feeds packages/pos-sdk
```

Needs `DATABASE_URL` (see `packages/db`).
