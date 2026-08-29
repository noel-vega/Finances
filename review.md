# Review — Unified orders + POS order/checkout flow

Working notes for finishing and committing this branch. Nothing here is committed yet.

## What this change does

1. **Unifies web + in-person sales into one `orders` model** with a `channel`
   enum (`'web' | 'pos'`), decomposed into child tables:
   - `orders` — core: `channel`, `locationId` (POS sale location), `posDeviceId`,
     nullable `customerEmail/Name`, `subtotalCents`, `taxCents` (always 0 today),
     `shippingCents`, `amountTotalCents`.
   - `order_shipping` — 1:1, web only. Ship-to address + ship-from `locationId`.
     POS orders have no row → the fulfillment endpoints 400 on them.
   - `order_payments` — 1:many (future split tender). `method`
     (`stripe|cash|card`), `amountCents`, `amountTenderedCents` (cash, for change),
     `stripeCheckoutSessionId` (nullable, still the webhook idempotency key),
     `stripePaymentIntentId`.
   - `order_items` unchanged — POS writes real rows, so the
     `inventory_movements.orderItemId` ledger link works for POS for free.
2. **`POST /pos/orders`** (new `apps/pos-api/src/modules/orders/`) — prices from the
   DB (never the client), account-scoped, transactional: inserts order + items +
   `inventory_movements` (`reason: 'sold'`, at the device's location) + one
   `order_payments` row. Cash requires `amountTenderedCents >= total`, returns
   `changeCents`.
3. **POS app (`apps/pos`)** — the paired home screen (`app/index.tsx`) is a
   split POS layout: left = searchable product grid (tap to add; multi-variant
   opens `/product/[id]`), right = the current order ticket + **Charge** →
   `app/checkout.tsx` modal (Cash/Card; cash = numpad + change due). A hidden
   `BarcodeWedge` turns a USB/Bluetooth scanner gun into add-to-order with no
   camera. `app/scan.tsx` (camera) is the fallback. Order persists to
   AsyncStorage and clears on unpair.
4. **Admin** — `OrderDetail` gains `channel`, nested `shipping` (null for POS),
   `payments[]`; order list gets a Channel column; POS orders hide the
   shipping/fulfillment UI. Also the **barcode editor** on the Edit Variant sheet
   (`edit-variant-sheet.tsx`) — from an earlier task, still uncommitted here.

## Commit-readiness

### Green
- All 9 packages/apps typecheck + build clean. No debug code, no TODOs.
- No tests reference orders → no test breakage. (pos-api/orders has no tests at all.)
- `POST /pos/orders` tested end-to-end via curl — cash / card / cash-under-total /
  bad-variant. DB rows verified: `orders` (channel=pos, location_id, pos_device_id),
  `order_payments` (method=cash, amount_tendered_cents), `inventory` decrement +
  matching `inventory_movements` row.
- Migration regenerated cleanly (`packages/db/drizzle/20260829031212_yellow_iceman/`),
  applied to the dev DB via `drizzle-kit push --force --hints` (order-family tables
  were empty), verified with an information_schema query.
- `openapi.json` (pos-api + shop-admin-api) and both SDKs regenerated + committed.

### NOT verified — the risks
1. **Web checkout path is typecheck-only.** `apps/worker/src/modules/orders/orders.processor.ts`
   and `apps/storefront-api/src/modules/checkout/checkout.service.ts` were changed to
   write/read the split tables (order → order + order_shipping + order_payments;
   idempotency check moved to `order_payments.stripeCheckoutSessionId`). storefront-api
   + worker + Redis were NOT running this session, so this never actually ran. It is
   a mechanical field-move, but it is the revenue path. **Run one Stripe test
   checkout** and confirm: one `orders` row (channel='web'), one `order_shipping`,
   one `order_payments` (method='stripe', session id set), items + inventory
   movements, cart deleted, confirmation email enqueued, and re-delivering the
   webhook is idempotent.
2. **The POS app has never been seen running.** Metro (`expo start`) was not up at
   the end. `tsc` passes but the split layout, the wedge focus behavior, the
   checkout numpad, and the tab removal are all unproven on device. Restart Metro
   and click through: scan-gun add, tap-to-add, multi-variant, qty steppers,
   Cash checkout with change, Card checkout, kill+relaunch (order restored),
   unpair (order cleared).
3. **Admin order detail / list** with a real POS order + a real web order — not
   opened in the browser this session (shop-admin-api + web were running and
   recompiled clean, but the views weren't exercised).

### Dev-DB cleanup
- 3 test POS orders (ids ~1-3) + their inventory decrements are sitting in the dev
  DB from the curl testing. Delete if you want a clean slate:
  `delete from orders where channel = 'pos';` (cascades to order_items /
  order_payments / inventory_movements) — then fix up `inventory.stock` for the
  affected variants, or just re-run the seed (`packages/seed`).

## Suggested commit split

This is one huge diff (schema + 4 backends + SDK regen + new POS feature + redesign +
leftover barcode work). Split it:

1. **Barcode editor** — `apps/shop-admin-web/.../edit-variant-sheet.tsx` and the USB
   wedge bits of `apps/pos/src/app/scan.tsx`. The original small task.
2. **Unified orders schema + backends + SDKs** — `packages/db/src/schema/orders.ts`,
   the regenerated migration, `worker`, `storefront-api`, `shop-admin-api` (service +
   entities), `admin-sdk`, `pos-sdk`, `pos-api` orders module, both `openapi.json`.
3. **POS order/checkout feature + split-screen redesign** — everything else under
   `apps/pos/src/` (`app/index.tsx`, `app/checkout.tsx`, `app/_layout.tsx`,
   `app/product/[id].tsx`, `components/`, `features/order/`, `lib/variant.ts`).

Note: `apps/pos/src/app/(tabs)/` was created then removed — make sure the final
tree has `app/index.tsx` (the split screen) and no `(tabs)` dir.

## Code-review findings

### Fixed
- **Focus fight** — the hidden `BarcodeWedge` refocused itself on blur, so tapping
  the search box bounced focus straight back. Added an `enabled` prop; the screen
  passes `enabled={!searchFocused}`.
- **Ticket footer clipping** — the right-pane `FlatList` had no `flex: 1`; a long
  order pushed the totals / Charge off-screen. Added `flex: 1` to both lists.
- **Grid broke at ≠3 columns** — cards had `maxWidth: '32%'` hardcoded while
  `numColumns` is computed from width. Removed the cap.
- **Wedge idle fallback** — raised 120ms → 250ms so a laggy emulator can't split
  one scan into partial lookups. Primary path is still Enter (`onSubmitEditing`).
- **Order not cleared on unpair** — added an effect in `OrderProvider` that clears
  lines + storage when `status === 'unpaired'`.
- **`<Link asChild>` + array style crash** — flattened the empty-state button
  style (Expo Router Slot shim throws on array styles; prior art: commit 3786840).

### Noted — not changed
- Last grid row with fewer items than columns: `flex: 1` cards stretch to fill it
  (cosmetic; standard FlatList grid quirk). Could add a spacer or fixed widths.
- Multi-variant tap opens the full `/product/[id]` stack screen (slides over
  everything) rather than an inline bottom sheet. Works, less slick.
- `useOrderScanner` still exposes `looking-up` / `added` states that nothing
  renders now (only `miss`). Dead surface — trim or use.
- Line items store a **price snapshot** at add time; `pos-api` re-prices from the
  DB on submit. Server is authoritative (correct), but the displayed total could
  momentarily differ from the charged total if a catalog price changes mid-sale.
- `scan.tsx` (camera modal) has its own inline copy of the wedge logic and still
  shows "Added · name" in its overlay — could share `BarcodeWedge`, and the
  "Added" text is arguably inconsistent with the "no popup" preference (though the
  camera screen genuinely needs some scan feedback).
- **POS oversell**: `pos-api` decrements `device.locationId` unconditionally and
  allows negative stock (same as the web path). No "insufficient stock" guard. This
  was the agreed behavior, but flag it if a hard stop is wanted later.
- `order_payments` is modelled 1:many for split tender but the code always writes
  exactly one row. Fine for now.
- `taxCents` column exists at 0 everywhere — tax is deliberately unimplemented.

## Key files

- Schema: `packages/db/src/schema/orders.ts`, migration
  `packages/db/drizzle/20260829031212_yellow_iceman/`
- Web write: `apps/worker/src/modules/orders/orders.processor.ts`,
  `apps/storefront-api/src/modules/checkout/checkout.service.ts`
- Admin read: `apps/shop-admin-api/src/modules/orders/orders.service.ts` + `entities/`,
  `apps/shop-admin-api/src/modules/fulfillments/fulfillments.service.ts`,
  `apps/shop-admin-web/src/features/orders/views/*.tsx`
- pos-api: `apps/pos-api/src/modules/orders/*`
- pos-sdk: `packages/pos-sdk/src/index.ts` (`orders.create`)
- pos app: `apps/pos/src/app/index.tsx` (split screen), `app/checkout.tsx`,
  `components/barcode-wedge.tsx`, `components/numpad.tsx`,
  `features/order/{order-store,order.queries,use-order-scanner}.tsx`,
  `lib/variant.ts`

## Regen commands (if entities/DTOs change again)

- pos-api: `cd apps/pos-api && DATABASE_URL=... npm run generate:openapi`
  then `cd packages/pos-sdk && npm run generate && npm run build`
- shop-admin-api: `cd apps/shop-admin-api && DATABASE_URL=... npm run generate:openapi`
  (⚠ hangs on teardown — kill it once `openapi.json` is written)
  then `cd packages/admin-sdk && npm run generate && npm run build`
- After any `packages/db/src/schema` change: `cd packages/db && npm run build`
  (consumers import the built `dist`).
