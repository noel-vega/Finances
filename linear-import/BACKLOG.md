# OrderSail — Linear setup + outcome-project backlog (production-ready)

## Context

OrderSail is a multi-tenant, self-serve e-commerce platform: a web storefront + in-person POS on a
unified orders model, Stripe Connect for merchant funds, real per-location inventory with a movement
ledger, Shippo labels, an OpenAPI-documented developer API. Solo dev, north-star = **public
self-serve launch**.

The user set up a Linear team (`OS`) with six **area** projects (POS, Storefront, Admin, Website,
Infrastructure, Observability). Area projects never "complete", so their progress bars / target
dates / the roadmap view mean nothing, and the cross-cutting launch work (onboarding, payments,
revenue-path testing) has no natural home.

**Decision:** restructure to **seven outcome projects** that each have a real launch finish line, with
the areas demoted to labels. One "Public self-serve launch" initiative over all seven. A dedicated
**Payments & billing** project because it's the highest-risk area, it's the only place the business
model lives (the platform application fee is *not implemented*), and it spans all three apps. Stripe
Terminal work is **split**: server-side (PaymentIntents, connection tokens, capture, webhooks,
refunds) in Payments & billing; the POS app UX (reader pairing, collect-payment screen, retry) in POS.

**Goal of this plan:** stand up the Linear structure and seed each project with a granular,
one-per-PR backlog covering everything needed to reach public launch.

### Key codebase facts that shape the backlog

- Last commit `36d5bb4 rename admin apps` renamed `apps/shop-admin-{api,web}` → `apps/admin-{api,web}`
  but did **not** update Dockerfiles, both GitHub workflows, all `infra/terraform/**`, or
  `packages/admin-sdk`'s codegen path. **CI is red right now.**
- `infra/terraform/envs/production/terraform.tfvars` has `github_repo = "noel-vega/shop"` (real repo
  `noel-vega/ordersail`) → OIDC `sub` mismatch → every deploy role unusable.
- Web checkout path after the unified-orders refactor is **typecheck-only, never run** (`review.md`);
  the POS app "has never been seen running."
- **Zero tests** on the revenue path. ~11 shallow specs, only in admin-api / storefront-api.
- Only the marketing site deploys (`deploy-website.yml`); `cd.yml` is dormant; `pos-api`/`pos` are in
  neither CI nor CD and `pos-api` has no Terraform.
- **No observability** beyond correlated JSON logs + `/health`: no error tracking, alerting, uptime
  monitoring, metrics, or tracing.
- **Platform application fee not implemented** — `application_fee_amount` is never set on Checkout
  sessions; there is no POS card processing at all (card path is a record-only stub).
- RBAC fully scaffolded (`packages/db/src/permissions-catalog.ts`) but enforced on only 2 of ~18
  admin-api modules.
- No order lifecycle: an order row existing == "paid". No status, refunds, cancellations.
- `taxCents` hardcoded `0`; no discounts/promos schema.
- Admin list "Search…" boxes are decoration; many admin-api list endpoints are unbounded.
- Storefront is a client-only SPA (bad for SEO); `/products` returns everything in one call; no
  customer order history.
- Website is one 552-line `index.astro` with a broken primary CTA (`/signup` doesn't exist there).

---

## Part 1 — Linear setup

### 1.1 Migrate the projects
Rename the six existing projects and add one:

| Existing | Becomes |
|---|---|
| Infrastructure | **Production readiness** |
| Observability | **Observability & alerting** |
| Admin | **Merchant dashboard & onboarding** |
| Storefront | **Storefront customer experience** |
| POS | **POS in-store operations** |
| Website | **Marketing site** |
| *(new)* | **Payments & billing** |

### 1.2 Priorities
Built-in priority for planning; **reserve Urgent for real production incidents.**
P0 → High (blocks launch / CI or prod broken) · P1 → Medium (needed for launch) · P2 → Low (post-launch).

### 1.3 Labels (Settings → Team → Labels)
**Group `type`** ("New group", mutually exclusive): `bug`, `feature`, `chore`, `tech-debt`, `test`
**Area labels** (ungrouped, multi): `pos`, `storefront`, `admin`, `website`, `api`, `db`, `sdk`,
`infra`, `ci-cd`, `observability`, `payments`, `auth`, `rbac`, `seo`
"Show me everything POS" = a saved view filtered by the `pos` label across projects.

### 1.4 Initiative
**"Public self-serve launch"** (sidebar → Initiatives → New) — link all seven projects, set a target
date. Put P0/P1 issues in it. Later waves → a "Post-launch" initiative.

### 1.5 Per-project setup
Each project: set yourself as Lead, paste the **Goal** (Part 2) into the description, create its
**Milestones** (the `### Mx` headers in Part 2), set a target date, then load its issues.

### 1.6 Issue templates (Settings → Team → Templates)
**Bug:** What happens / What should happen / Repro / Environment (app·URL·commit) / Notes.
**Feature:** Problem / Proposed change / Scope In·Out / Acceptance criteria / Affected areas
(backend·frontend·DB migration·SDK regen).

### 1.7 Cycles
2-week cycles, auto-add unfinished to next, auto-archive completed. 5–8 issues per cycle.

### 1.8 GitHub
Settings → Integrations → GitHub → connect `noel-vega/ordersail`. Per issue: copy Linear's branch
name; `Fixes OS-123` in the PR body.

### 1.9 Loading the ~305 issues
Don't hand-type. Either:
- **Linear MCP** (like the "Connect Cursor / Connect Codex" entries) — connect it, a follow-up
  session creates every issue from Part 2 with milestones attached; **or**
- **CSV import** (sidebar → Import issues → CSV) — regenerate one CSV per project from this file with
  the scratchpad script `gen_linear_csv.py` (update its `PROJECTS` set to the seven new names first;
  it parses `## <Project>` + `### Mx` headers + `N. [Px] title · labels` lines). Import each into its
  project; if the Milestone column doesn't auto-map, bulk-assign after by filtering on the `Mx` in the
  description. **The stale `linear-import/` folder in the repo from the previous structure should be
  deleted / regenerated.**

---

## Part 2 — Per-project backlogs

Priority: **[P0]** High · **[P1]** Medium · **[P2]** Low. Labels after `·`. Grouped by milestone.

---

## Production readiness

**Goal:** A one-command local stack and a push-to-deploy pipeline for **every** app, on a
cost-controlled AWS footprint a solo dev can operate, with staging and a rollback path.

### M1 — Unbreak CI (post-rename)
1. [P0] Fix `docker/shop-admin-api.Dockerfile` name + `COPY` paths (and any other renamed Dockerfile) · bug, infra, ci-cd
2. [P0] Fix `.github/workflows/ci.yml` — workspace names, test matrix, smoke-build matrix · bug, infra, ci-cd
3. [P0] Fix `.github/workflows/cd.yml` app-name references (even while dormant) · bug, infra, ci-cd
4. [P0] Fix `packages/admin-sdk` `generate` path → `apps/admin-api/openapi.json` · bug, infra, sdk
5. [P0] Sweep `infra/terraform/**` for `shop-admin-*` → `admin-*` (modules, resources, tags, SSM keys) · bug, infra
6. [P0] Fix `terraform.tfvars` `github_repo` → `noel-vega/ordersail`; `terraform plan` clean · bug, infra
7. [P0] Update `README.md` + `ARCHITECTURE.md` app names + ports · chore, infra
8. [P0] Add `pos-api` to `ci.yml` (build, lint, test, smoke-build) · feature, infra, ci-cd
9. [P0] Add `pos` (Expo) to `ci.yml` (lint, typecheck, `expo-doctor`) · feature, infra, ci-cd
10. [P0] Standalone `typecheck` job across all workspaces · feature, infra, ci-cd
11. [P0] Verify a green CI run on a PR to `main` · test, infra, ci-cd

### M2 — Local dev experience
12. [P0] `.env.example` for `admin-api` · chore, infra
13. [P0] `.env.example` for `storefront-api` · chore, infra
14. [P0] `.env.example` for `worker` · chore, infra
15. [P0] `.env.example` for `admin-web` + `storefront-web` · chore, infra
16. [P0] Root `docker-compose.yml` — postgres + redis + minio + mailpit together · feature, infra
17. [P0] Root task runner (`Taskfile`/`Makefile`/npm scripts) — `up`, `down`, `reset`, `seed`, `dev` · feature, infra
18. [P0] Rewrite README "Getting started" for the one-command flow · chore, infra
19. [P1] `.env` schema validation at boot (zod) in each API — fail fast · feature, infra, api
20. [P1] Dev bootstrap script — wait-for-postgres, migrate, seed · feature, infra

### M3 — Deploy pipeline for all services
21. [P1] Create the `production` GitHub Environment + required reviewer; set `AWS_*` repo vars · chore, infra, ci-cd
22. [P1] `cd.yml` `build-and-push` live for `admin-api` · feature, infra, ci-cd
23. [P1] `cd.yml` live for `storefront-api` · feature, infra, ci-cd
24. [P1] `cd.yml` live for `worker` · feature, infra, ci-cd
25. [P1] Migrator job — wire + test the `aws ecs run-task` migration gate · feature, infra, ci-cd
26. [P1] `deploy-services` job for the three APIs (task-def patch + wait-stable) · feature, infra, ci-cd
27. [P1] `deploy-frontends` — add `admin-web` · feature, infra, ci-cd
28. [P1] `deploy-frontends` — add `storefront-web` + its SSR/prerender output (with Storefront M1) · feature, infra, ci-cd
29. [P1] Terraform: ECR repo + ECS service + target group for `pos-api` · feature, infra
30. [P1] Terraform: ALB routing / subdomain for `pos-api` · feature, infra
31. [P1] Add `pos-api` to `cd.yml` · feature, infra, ci-cd
32. [P1] Pin image tags to git SHA (drop `:latest` reliance); ECR immutability · feature, infra, ci-cd
33. [P1] Post-deploy smoke-test job (`/health` + one real endpoint per service) · feature, infra, ci-cd

### M4 — Staging & rollback
34. [P1] Terraform: parametrize env; stand up a `staging` environment · feature, infra
35. [P1] CD to staging on merge to `main`; prod on tag / manual approval · feature, infra, ci-cd
36. [P1] Rollback workflow — redeploy the previous ECS task-def revision by service · feature, infra, ci-cd
37. [P1] DB migration rollback runbook (no Drizzle down migrations) + PITR-restore steps · chore, infra
38. [P1] CI service containers (postgres + redis) + a `test:integration` job · feature, infra, ci-cd

### M5 — Data resilience
39. [P1] RDS Multi-AZ (or a documented RTO/RPO decision) · feature, infra
40. [P1] RDS: automated-backup restore drill + off-region snapshot copy · chore, infra
41. [P1] RDS Proxy (or PgBouncer) + `pg` pool tuning in `packages/db` · feature, infra, db
42. [P1] ElastiCache: enable snapshots · feature, infra
43. [P1] ElastiCache: auth token + transit/at-rest encryption · feature, infra
44. [P1] Migration job: advisory-lock / lock-timeout guard for concurrent runs · feature, infra, db

### M6 — Security & secrets
45. [P0] Remove `infra/terraform/bootstrap/terraform.tfstate` (+ backup) from git; fix `.gitignore` · bug, infra
46. [P1] Rotate anything exposed by the committed state / tfvars; review `backend.tf` account-id exposure · chore, infra
47. [P1] Enable Dependabot (or Renovate) · feature, infra, ci-cd
48. [P1] gitleaks (or trufflehog) in CI + pre-commit · feature, infra, ci-cd
49. [P1] `npm audit` gate in CI · feature, infra, ci-cd
50. [P2] Trivy / Grype container scan on built images · feature, infra, ci-cd
51. [P1] `helmet` on `admin-api` · feature, infra, api
52. [P1] `helmet` on `storefront-api` + `pos-api` · feature, infra, api
53. [P1] CloudFront response-headers policy (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) on all distributions · feature, infra
54. [P1] `@nestjs/throttler` on auth endpoints (all three APIs) · feature, infra, api
55. [P1] Rate limits on webhook + app-key + pairing endpoints · feature, infra, api
56. [P2] AWS WAF on the ALBs / CloudFront (managed rules + rate rule) · feature, infra
57. [P1] SES production-access request (currently sandbox); move SMTP creds to Secrets Manager · chore, infra

### M7 — Cost & tooling
58. [P1] AWS Budgets + Cost Anomaly Detection + billing alarm → SNS · feature, infra
59. [P2] Review always-on footprint (2 ALBs → 1 shared? NAT strategy) for cost · chore, infra
60. [P2] Shared config packages — `tsconfig`, `eslint`, `prettier` · tech-debt, infra
61. [P2] Converge on one linter + align TypeScript versions across workspaces · tech-debt, infra
62. [P2] Configure Nx — target defaults, caching, `affected` in CI · feature, infra, ci-cd

---

## Observability & alerting

**Goal:** When something breaks in production — a checkout fails, an order job dies, the site goes
down — you find out within minutes and can diagnose it fast.

### M1 — Know when it breaks
1. [P0] Sentry project + SDK in `admin-api` · feature, observability
2. [P0] Sentry in `storefront-api` + `pos-api` · feature, observability
3. [P0] Sentry in `worker` (+ BullMQ job-failure capture) · feature, observability
4. [P0] Sentry in `admin-web` + `storefront-web` (upload source maps in CI) · feature, observability
5. [P0] Sentry in the POS app (Expo) — release + dist tagging · feature, observability, pos
6. [P0] Thread the existing correlation ID into Sentry scope/tags everywhere · feature, observability
7. [P0] Dead-letter alert — an order job that exhausts its 8 retries → Sentry + SNS/email + a persisted `failed_orders` record · feature, observability, api
8. [P0] Uptime monitor — `/health` on all four services (external, paging) · feature, observability
9. [P0] Uptime monitor — storefront + admin root URLs + both Stripe webhook endpoints · feature, observability
10. [P0] CloudWatch alarm — ECS task crash-loop / service unhealthy → SNS · feature, observability, infra
11. [P0] CloudWatch alarm — ALB 5xx rate + latency → SNS · feature, observability, infra
12. [P0] CloudWatch alarm — RDS CPU / free storage / connections → SNS · feature, observability, infra
13. [P0] CloudWatch alarm — ElastiCache evictions / memory / CPU → SNS · feature, observability, infra
14. [P0] SNS → SMS + email subscriptions; document the alert channels · chore, observability

### M2 — See the revenue path
15. [P1] Logging: PII / secret redaction in `packages/logging` · feature, observability
16. [P1] Logging: configurable level + consistent request/response middleware across APIs · feature, observability, api
17. [P1] Metrics transport decision (CloudWatch EMF vs Prometheus + agent) — spike + base impl · chore, observability
18. [P1] Metric: orders created (web + POS) by channel · feature, observability, api
19. [P1] Metric: checkout sessions created / completed / abandoned · feature, observability, api
20. [P1] Metric: Stripe webhook received / processed / failed by event type · feature, observability, api
21. [P1] Metric: email jobs sent/failed; order jobs processed/retried/dead-lettered · feature, observability
22. [P1] Metric: BullMQ queue depth + job latency (both queues) · feature, observability
23. [P1] Metric: per-service HTTP p50/p95/p99 + error rate · feature, observability, api
24. [P1] Dashboard: revenue-path board (orders, GMV, queue depth, webhook failures, email failures) · feature, observability
25. [P1] Dashboard: service-health board (latency, error rate, CPU/mem, DB connections) · feature, observability
26. [P1] Alert: checkout success-rate drop + webhook-failure spike + queue backlog · feature, observability
27. [P1] Stripe webhook (storefront + admin): structured log + metric + alert on signature failure / unhandled event type · feature, observability, payments

### M3 — Diagnose fast
28. [P1] OpenTelemetry SDK + auto-instrumentation in all four NestJS services · feature, observability, api
29. [P1] Propagate trace context through BullMQ jobs (producer → worker) · feature, observability, api
30. [P1] Span the Stripe + Shippo client calls · feature, observability, api
31. [P1] Trace exporter → X-Ray (or hosted) + sampling policy · feature, observability, infra
32. [P1] Log aggregation: CloudWatch Logs Insights saved queries (errors by service, by correlation ID, failed orders) · feature, observability
33. [P1] Alert on error-level log volume per service · feature, observability
34. [P1] Health-check depth — confirm `pos-api` `/health` includes Redis; add a storefront app-key-path check · bug, observability, api
35. [P2] `/health` vs `/ready` split (liveness vs readiness) for ECS + ALB · feature, observability, api

### M4 — SLOs, business view, hygiene
36. [P2] Define SLOs (checkout success rate, order-job processing time, API availability) + error-budget alerts · chore, observability
37. [P2] Synthetic transaction — scheduled end-to-end test checkout in prod, alert on failure · feature, observability
38. [P2] Business digest email — daily orders, GMV, refunds, new merchants, failed payments · feature, observability
39. [P2] Frontend RUM / Core Web Vitals on the storefront · feature, observability, storefront
40. [P2] Public status page fed by the uptime monitor · feature, observability
41. [P2] Incident runbook — "checkout down", "orders not processing", "site down"; escalation contacts · chore, observability
42. [P2] Auth/security event stream (logins, failures, permission denials, API-key usage) + anomaly alert · feature, observability, auth
43. [P2] Cost observability — spend per service via tags + Cost Explorer · feature, observability, infra
44. [P2] Retention + sampling policy — per-stream CloudWatch retention, trace sampling, bounded cost · chore, observability

---

## Payments & billing

**Goal:** Merchants onboard to Stripe, get paid, and the platform takes its cut; refunds and disputes
are handled; POS takes real cards; discounts and tax are computed by one shared engine.

### M1 — Web checkout: verified & tested
1. [P0] Run a real Stripe test checkout end-to-end (connected account, embedded checkout, Shippo rates); document it; fix what breaks · test, payments, storefront
2. [P0] Integration test: `checkout-completed` worker — order + shipping + payment + items + inventory decrement + cart delete + idempotency · test, payments, api
3. [P0] Integration test: checkout session creation — server-authoritative line items from cart, connected account, shipping options · test, payments, api
4. [P0] Integration test: `checkout.session.completed` webhook — signature, `payment_status` guard, idempotency on `stripeCheckoutSessionId`, enqueue · test, payments, api
5. [P1] Handle `checkout.session` expired + async payment failed (webhook branch + storefront return-page states) · feature, payments, storefront
6. [P1] Reconcile "payment succeeded but order write failed" — recovery path + `failed_orders` surfacing (with Observability 7) · feature, payments, api
7. [P1] Idempotency key on checkout session creation (no duplicate sessions per cart) · feature, payments, api

### M2 — Order lifecycle: status, cancel, refund
8. [P0] Schema: `order_status` enum + column + backfill (`paid`) + `order_events` table · feature, payments, api, db
9. [P0] admin-api: order status-transition endpoint + allowed-transition rules · feature, payments, api
10. [P0] admin-web: order status badge + event timeline on the order detail page · feature, payments, admin
11. [P0] admin-api: full refund via the Stripe connected account · feature, payments, api
12. [P0] admin-api: partial / line-item refund · feature, payments, api
13. [P0] Refund writes negative `order_payments` + `inventory_movements` `return` + status update · feature, payments, api
14. [P0] admin-web: refund UI on order detail (amount, reason, restock toggle) · feature, payments, admin
15. [P0] admin-api: cancel order (pre-fulfillment) — restock + refund + status · feature, payments, api
16. [P1] admin-web: cancel-order UI + confirmation · feature, payments, admin
17. [P1] Stripe `charge.refunded` / `charge.dispute.*` webhook events → update order + payment records · feature, payments, api
18. [P1] Integration tests: refund (full + partial) + cancel + status transitions · test, payments, api

### M3 — POS card payments (Stripe Terminal, server-side)
19. [P1] Spike: choose reader path (Tap to Pay on iPhone/Android vs BBPOS/WisePOS); hardware + cost + fee decision doc · chore, payments, pos
20. [P1] pos-api: Terminal connection-token endpoint, scoped to the tenant's connected account · feature, payments, api, pos
21. [P1] pos-api: create PaymentIntent for a POS sale (manual capture, connected account, application fee) · feature, payments, api, pos
22. [P1] pos-api: capture PaymentIntent + write `order_payments` (`card`) row transactionally with the order · feature, payments, api, pos
23. [P1] pos-api: PaymentIntent webhook handler (async capture / failure reconciliation) · feature, payments, api, pos
24. [P1] pos-api: Terminal card-refund endpoint (for POS returns) · feature, payments, api, pos
25. [P1] pos-api: Terminal payment-flow tests — happy path, decline, cancel, partial capture, refund · test, payments, api, pos

### M4 — Platform economics
26. [P0] Decide the platform fee model (flat % / % + fixed / tiered) and document it · chore, payments
27. [P0] Implement `application_fee_amount` on web Checkout sessions · feature, payments, api
28. [P0] Implement application fee on POS PaymentIntents · feature, payments, api, pos
29. [P1] Fee handling on refunds — reverse the application fee proportionally (full + partial) · feature, payments, api
30. [P1] Merchant payout / balance visibility — wire the Stripe embedded balances + payouts components in admin Payments · feature, payments, admin
31. [P1] Dispute / chargeback handling — webhook, order status, merchant notification, evidence-submission link · feature, payments, api
32. [P1] Internal platform-revenue report (fees collected, by merchant, by period) · feature, payments
33. [P2] Connect account health in admin — `charges_enabled` / `payouts_enabled` / requirements due · feature, payments, admin
34. [P2] Handle Connect `account.updated` requirements changes (only chargesEnabled/detailsSubmitted synced today) · feature, payments, api

### M5 — Discounts & tax engine
35. [P1] Schema: `discounts` + `discount_redemptions` · feature, payments, api, db
36. [P1] admin-api: discount CRUD + rules (percent/amount, min spend, usage caps, date window, product/category scope) · feature, payments, api
37. [P1] admin-web: discount management UI · feature, payments, admin
38. [P1] Shared order-pricing service — applies discounts; used by web checkout + POS + order totals · feature, payments, api
39. [P1] Storefront: discount-code entry at checkout (apply / remove / validation errors) · feature, payments, storefront
40. [P1] POS: apply a discount code or manual line-item discount in the cart (permission-gated) · feature, payments, pos, rbac
41. [P1] Schema + settings: tax config per account / location (flat rate table vs provider — spike first) · feature, payments, api, db
42. [P1] Shared tax-calc service — wire into web checkout, POS, order totals; stop hardcoding `taxCents = 0` · feature, payments, api

---

## Merchant dashboard & onboarding

**Goal:** A new signup reaches a live storefront unaided; a merchant can run catalog / inventory /
customers / staff from the dashboard, with permissions enforced.

### M1 — Fix what's half-built
1. [P0] Regenerate `routeTree.gen.ts`; delete stale `src/routes/index.tsx` + `src/routes/inventory.tsx` + top-level dupes · bug, admin, tech-debt
2. [P0] Fix `vite.config.ts` port (says 3001, actually 5000) · chore, admin
3. [P0] Remove the commented-out pre-SDK block in `lib/admin-api-client.ts` + `console.log`s in `__root.tsx` · tech-debt, admin
4. [P0] Router-level `pendingComponent` (skeletons) on route groups · feature, admin
5. [P0] Router-level `errorComponent` + shared error boundary · feature, admin
6. [P0] One mutation-error surfacing pattern (toast + inline) applied across feature hooks · feature, admin
7. [P0] admin-api: paginate + search `GET /customers` · feature, admin, api
8. [P0] admin-api: paginate + search + status filter `GET /products` · feature, admin, api
9. [P0] admin-api: paginate + search `GET /users` · feature, admin, api
10. [P0] admin-api: paginate + filter `GET /inventory` + `GET /inventory/movements` · feature, admin, api
11. [P0] admin-api: paginate `GET /locations`, `/brands`, `/categories`, `/roles`, `/permissions` · feature, admin, api
12. [P0] admin-web: wire search + pagination on customers, products, users lists · feature, admin
13. [P0] admin-web: wire search + pagination on inventory, locations, brands, categories, roles · feature, admin

### M2 — Self-serve onboarding
14. [P0] admin-api: `GET /onboarding/status` computing checklist state · feature, admin, api
15. [P0] Dashboard onboarding-checklist component (Stripe / location / product / app key) · feature, admin
16. [P0] "Connect Stripe" step deep-links into the existing Payments onboarding + reflects completion · feature, admin
17. [P0] "Add your first product" guided empty-state CTA on Products · feature, admin
18. [P0] admin-api: API-key create endpoint (`account_api_keys`) · feature, admin, api
19. [P0] admin-api: API-key revoke endpoint · feature, admin, api
20. [P0] admin-web: API-key create/revoke UI on Developers · feature, admin
21. [P0] Surface the storefront app key + storefront URL prominently during onboarding · feature, admin
22. [P1] Signup first-run — confirm auto-seeded "Default" location + Owner role; handle every empty state · feature, admin

### M3 — Staff & permissions (RBAC enforcement)
23. [P0] Apply `@RequirePermissions` to `products` + add missing permission keys · feature, admin, api, rbac
24. [P0] Apply to `orders` + `fulfillments` · feature, admin, api, rbac
25. [P0] Apply to `inventory` + `locations` · feature, admin, api, rbac
26. [P0] Apply to `customers` + `carts` · feature, admin, api, rbac
27. [P0] Apply to `api-keys` + `account` + `pos-devices` + `stripe-connect` · feature, admin, api, rbac
28. [P0] Frontend permission context — decode effective permissions, `<Can>` gate component · feature, admin, rbac
29. [P0] Hide/disable nav items + action buttons by permission across feature pages · feature, admin, rbac
30. [P1] RBAC integration tests — owner vs limited role per module · test, admin, api, rbac
31. [P1] "Access denied" UX + a 403 route · feature, admin, rbac
32. [P1] users: `GET /users/:id` + profile edit + deactivate/remove · feature, admin, api
33. [P1] user invites: resend + revoke pending invite · feature, admin, api

### M4 — Catalog / inventory / customer management
34. [P1] brands: update + delete endpoints + UI · feature, admin, api
35. [P1] categories: update + delete endpoints + UI · feature, admin, api
36. [P1] locations: delete endpoint (guard if in use) + UI · feature, admin, api
37. [P1] Customer detail view — profile + order history + lifetime value · feature, admin, api
38. [P2] Bulk actions (archive, category assign) for products · feature, admin
39. [P2] CSV import / export for products + inventory · feature, admin
40. [P2] Saved views / filters on list pages · feature, admin

### M5 — Dashboard & insights
41. [P1] Dashboard v2 — date-range selector · feature, admin
42. [P1] Dashboard v2 — revenue + orders trend charts (add a chart lib) · feature, admin
43. [P1] Dashboard v2 — top products + low-stock list; move `getOutOfStockCount` to SQL · feature, admin, api

### M6 — Fulfillment & shipping
44. [P1] Integration tests: fulfillment rate quote + label purchase; mixed POS/web order read models · test, admin, api
45. [P1] Idempotency key on `POST /fulfillments` (double-label-buy guard) · feature, admin, api
46. [P2] Shippo webhook — update `fulfillments` tracking status after purchase · feature, admin, api
47. [P2] Partial-fulfillment UI polish (multi-location, multi-shipment) · feature, admin

### M7 — Audit log
48. [P2] Audit log — generalize `order_events` to entity history; write on product/price/role/inventory changes · feature, admin, api, db
49. [P2] Per-entity history panel (product, order, role) · feature, admin

---

## Storefront customer experience

**Goal:** A fast, SEO-friendly, themeable public shop where guests and account-holders find products,
check out, and track their orders.

### M1 — Rendering & SEO
1. [P0] Spike/decide: React Router 7 framework mode (SSR) vs Vite SSG prerender for catalog pages · chore, storefront, seo
2. [P0] Migrate the app shell to the chosen SSR/prerender setup (routing, data loading) · feature, storefront, seo
3. [P0] Per-product `<title>` + meta description + OG/Twitter tags · feature, storefront, seo
4. [P0] JSON-LD `Product` + `Offer` structured data on product pages · feature, storefront, seo
5. [P0] `sitemap.xml` (products/categories/brands) + `robots.txt` + canonical URLs · feature, storefront, seo
6. [P1] Category / brand page meta + OG · feature, storefront, seo

### M2 — Discovery
7. [P0] storefront-api: `GET /products` — pagination (cursor or limit/offset + total) · feature, storefront, api
8. [P0] storefront-api: `GET /products` — text search (name/description/SKU/barcode) · feature, storefront, api
9. [P0] storefront-api: `GET /products` — filter by category, brand, price range, in-stock · feature, storefront, api
10. [P0] storefront-api: `GET /products` — sort (price, newest, name) · feature, storefront, api
11. [P0] storefront-web: listing UI — search box wired, results + pagination · feature, storefront
12. [P0] storefront-web: filter controls + sort dropdown, URL-param driven · feature, storefront
13. [P0] storefront-api: category list + `GET /categories/:id` (with products) · feature, storefront, api
14. [P0] storefront-api: brand list + `GET /brands/:id` (with products) · feature, storefront, api
15. [P0] storefront-web: `/categories/:id` + `/brands/:id` pages; make card badges links · feature, storefront
16. [P1] storefront-web: skeleton / empty / error states for listing + detail · feature, storefront
17. [P1] storefront-web: catch-all `*` 404 route · feature, storefront

### M3 — Customer accounts & order tracking
18. [P0] storefront-api: `GET /customer/orders` (customer + tenant scoped, paginated) · feature, storefront, api
19. [P0] storefront-api: `GET /customer/orders/:id` (items, payments, fulfillments) · feature, storefront, api
20. [P0] storefront-web: order-history list on `/account` · feature, storefront
21. [P0] storefront-web: order-detail page (items, totals, status, tracking) · feature, storefront
22. [P1] Order tracking — surface `fulfillments` carrier / tracking number / URL to the customer · feature, storefront
23. [P1] Forgot-password: request endpoint + email token (via `email` queue) · feature, storefront, api, auth
24. [P1] Forgot-password: reset endpoint + reset page · feature, storefront, api, auth
25. [P1] Email verification on signup — token, verify + resend endpoints, gated UI hints · feature, storefront, api, auth
26. [P1] Address book — schema + storefront-api CRUD · feature, storefront, api, db
27. [P1] Address book — pick/prefill a saved address at checkout · feature, storefront
28. [P1] Guest order lookup by email + order number (no account) · feature, storefront, api

### M4 — Checkout UX & resilience
29. [P1] Revalidate stock + price before add-to-cart; clear "changed" messaging · feature, storefront, api
30. [P1] Revalidate cart at checkout start; block with a clear diff view · feature, storefront, api
31. [P1] Idempotency key on cart mutations · feature, storefront, api
32. [P1] Checkout return-page: robust loading / open / complete / error states + retry · feature, storefront

### M5 — Brand & theming
33. [P1] Real home/landing page at `/` (replace redirect to `/products`) · feature, storefront
34. [P1] Tenant-aware branding — name/logo from account settings, drop hardcoded "Shop" · feature, storefront, api
35. [P2] Storefront theming — account-configurable colors/fonts/hero; admin UI + storefront consumption · feature, storefront, admin

### M6 — Post-launch growth
36. [P2] Analytics events (pageview, product view, add-to-cart, checkout steps) + consent banner · feature, storefront
37. [P2] Product reviews & ratings — schema, verified-purchase submit, display · feature, storefront, api, db
38. [P2] Related products / recently viewed · feature, storefront
39. [P2] Wishlist / save for later · feature, storefront, api, db
40. [P2] Multi-currency + international countries (remove hardcoded USD / `['US']`) · feature, storefront, api

---

## POS in-store operations

**Goal:** A cashier can run a full shift — build a cart, take cash and real cards (via the Terminal
UX), print/email receipts, reconcile the drawer — resilient to flaky in-store wifi.

### M1 — Runs end-to-end (verified)
1. [P0] Run the POS app on a real device end-to-end; log every bug found · test, pos
2. [P0] Triage & fix the bugs from the first device run · bug, pos
3. [P0] Set up the EAS dev-build + install loop; document it (README is Expo boilerplate) · chore, pos
4. [P0] pos-api: unit tests for order creation — pricing, cash change, inventory movement, payment row, tx rollback · test, pos, api
5. [P0] pos-api: tests for catalog — search, cursor pagination, scan-by-barcode, variant stock · test, pos, api
6. [P0] pos-api: tests for pairing — code redemption, expiry, single-use, revoked-device rejection · test, pos, api
7. [P0] Show the paired session (account / location / device) in a header or status bar · feature, pos
8. [P0] Settings screen scaffold, navigable from the home screen · feature, pos
9. [P0] "Unpair this device" action in Settings — wire `unpair()` / `refreshSession()` · feature, pos
10. [P0] Error boundary + consistent loading / error / empty states across screens · feature, pos

### M2 — Card payments (app-side Terminal UX)
11. [P1] Add the Stripe Terminal RN SDK + native config for dev and prod builds · feature, pos, payments
12. [P1] Reader discovery & connection screen · feature, pos, payments
13. [P1] Persist the selected reader per device (secure-store) · feature, pos, payments
14. [P1] Reader connection-status indicator in the header · feature, pos, payments
15. [P1] Collect-payment flow in checkout — call the pos-api PaymentIntent endpoints; replace the "take payment on the terminal" stub · feature, pos, payments
16. [P1] Decline / cancel / network-drop / retry handling with clear UI · feature, pos, payments
17. [P1] On success, route to the receipt screen with the captured payment · feature, pos, payments
18. [P1] End-to-end test: set up a test reader + run a test card sale + a test card refund · test, pos, payments

### M3 — Sale reliability & offline
19. [P1] Client-generated idempotency key on `POST /pos/orders`; server-side dedupe · feature, pos, api
20. [P1] Offline sale queue — persist completed-but-unsent sales to AsyncStorage · feature, pos
21. [P1] Offline sale queue — background retry + duplicate handling on reconnect · feature, pos
22. [P1] Offline sale queue — UI: pending-sales indicator + "retry now" · feature, pos
23. [P1] Insufficient-stock check at checkout — warn (or block, per decision); today it silently oversells · feature, pos, api

### M4 — Receipts & customer capture
24. [P1] pos-api: compute a receipt payload server-side (lines, tax, tender, change, store info) · feature, pos, api
25. [P1] On-screen receipt after a sale — replace the bare "Sale complete" screen · feature, pos
26. [P1] Email receipt — capture email at checkout, enqueue an `email` job · feature, pos
27. [P1] Receipt email template (react-email in `packages/email-templates`) · feature, pos
28. [P1] Attach a customer to a POS sale — search existing customers · feature, pos, api
29. [P1] Attach a customer to a POS sale — inline quick-create · feature, pos, api
30. [P2] Bluetooth/USB receipt-printer support (spike + basic ESC/POS) · feature, pos
31. [P2] POS "recent sales" list + sale detail (device/location scoped) · feature, pos, api
32. [P2] Reprint / re-send receipt for a past sale · feature, pos

### M5 — Cash management & shift reporting
33. [P2] Schema: `pos_shifts` + `cash_movements` · feature, pos, db
34. [P2] Open/close drawer flow — starting float, blind close count, variance · feature, pos
35. [P2] Cash in / cash out (paid-in, paid-out, drops) with reason · feature, pos
36. [P2] X-report (mid-shift) + Z-report (close-out) by tender · feature, pos

### M6 — Returns, voids, discounts
37. [P2] Return / refund at POS — cash path · feature, pos, api
38. [P2] Return / refund at POS — card path (calls the Payments Terminal-refund endpoint) · feature, pos, payments
39. [P2] Return/refund writes `inventory_movements` `return` + updates order status · feature, pos, api
40. [P2] Void an in-progress or just-completed sale · feature, pos, api
41. [P2] Split tender — multiple `order_payments` rows in one sale · feature, pos
42. [P2] Barcode-scan cleanup — one shared wedge hook, drop dead `use-order-scanner` states, delete Expo-template leftovers · tech-debt, pos

---

## Marketing site

**Goal:** A marketing site that converts visitors into merchant signups — clear value prop, pricing,
docs entry point, legal pages, real SEO — deployed independently (it already is).

### M1 — Fix the funnel
1. [P0] Fix the broken primary CTA — point `/signup` links at the admin signup URL · bug, website
2. [P0] Build-time env config for the app URLs in Astro · chore, website
3. [P0] Meta description + OG/Twitter tags + canonical on the landing page · feature, website, seo
4. [P0] `@astrojs/sitemap` + `robots.txt` · feature, website, seo
5. [P0] Favicon / app-icon set + web manifest · chore, website
6. [P0] Privacy-friendly analytics + signup-CTA click tracking · feature, website

### M2 — Structure & core pages
7. [P1] Extract a base layout + `<head>` component from `index.astro` · tech-debt, website
8. [P1] Break `index.astro` sections into components · tech-debt, website
9. [P1] Adopt a styling system (tokens or Tailwind) — replace scattered inline `<style>` · tech-debt, website
10. [P1] Pricing page (mirrors the platform fee model — with Payments M4) · feature, website
11. [P1] Features detail page(s) with screenshots · feature, website
12. [P1] "How it works" / merchant onboarding walkthrough page · feature, website
13. [P1] Docs entry point — link to Swagger UIs + a getting-started guide · feature, website
14. [P1] Contact / support page · feature, website
15. [P1] Real footer with working links + nav cleanup · feature, website

### M3 — Legal & trust
16. [P0] Terms of Service page · feature, website
17. [P0] Privacy Policy page · feature, website
18. [P1] Cookie policy + consent copy consistent with analytics · feature, website
19. [P1] Acceptable-use / merchant agreement (or link from signup) · feature, website
20. [P2] Changelog / public roadmap page · feature, website
21. [P2] Social-proof / testimonials section structure · feature, website

### M4 — Content & polish
22. [P2] Blog scaffold (Astro content collections) · feature, website, seo
23. [P2] 404 + error pages · feature, website
24. [P2] Accessibility + Lighthouse pass (95+ all categories) · chore, website
25. [P2] Remove the unused `cookie` dependency · tech-debt, website
26. [P2] Per-page OG image generation · feature, website, seo

---

## Part 3 — Suggested first three cycles

**Cycle 1 — stop the bleeding** (Production readiness)
M1 items 1–7 + 11 (post-rename, verify green CI); M2 items 12–18 (`.env.example` + one-command
stack); M6 item 45 (bootstrap tfstate out of git).

**Cycle 2 — see production**
Observability & alerting M1 items 1–14 (Sentry everywhere, failed-order-job alert, uptime, CloudWatch
alarms + SNS); POS in-store operations M1 items 1–3 (get the app running on a device).

**Cycle 3 — confidence + the half-built stuff**
Payments & billing M1 items 1–4 (web checkout tests + a real test run); POS in-store operations M1
items 4–6 (pos-api tests); Merchant dashboard & onboarding M1 items 1–13 (route tree, loading/error
UI, search + pagination).

---

## Verification

Project-management setup, not a code change. "Done" means:

1. **Projects** — the six existing projects renamed per §1.1; "Payments & billing" created; each has a
   Lead, the Goal in its description, its milestones, and a target date.
2. **Labels** — the `type` group + area labels from §1.3 exist.
3. **Initiative** — "Public self-serve launch" links all seven projects with a target date.
4. **Issues** — every issue from Part 2 exists in its project with priority + labels + milestone;
   P0/P1 in the initiative. (Via Linear MCP, or seven regenerated CSV imports.)
5. **Cycles** — 2-week cycles with auto-rollover; Cycle 1 loaded (Part 3).
6. **GitHub** — `noel-vega/ordersail` connected; a branch from an issue links back and a `Fixes OS-x`
   PR moves it to Done.
7. **Cleanup** — the stale `linear-import/` folder in the repo is removed or regenerated for the seven
   projects.

Then the first real work item closes the loop: after Production readiness M1, a PR to `main` shows CI
green (`build-lint-test` + `docker-smoke-build` passing).
