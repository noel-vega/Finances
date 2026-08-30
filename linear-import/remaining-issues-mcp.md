# Remaining Linear issues to create (blocked on free-plan cap)

**Status as of 2026-08-30:** 271 of 305 backlog issues loaded into Linear (OS-5 → OS-275), plus all
39 milestones. The remaining **34 issues** below could not be created — the OrderSail Linear
workspace hit the **free-plan issue cap (~250)**.

## How to finish

1. Upgrade the OrderSail workspace (Settings → Plans → Standard, or start the free trial).
2. In a Claude Code session with the Linear MCP connected, say **"finish the backlog from
   linear-import/remaining-issues-mcp.md"**.
3. Each row below maps directly to one `mcp__linear__save_issue` call. Constants:
   - `team`: `b7f4162a-9c03-4867-903b-83e0cc3d4e12` (OrderSail)
   - `priority`: P0 → `2`, P1 → `3`, P2 → `4`
   - Do each **once** — re-running duplicates.
4. After creating them, the milestone rollups will be complete. Nothing already in Linear needs
   redoing.

---

## POS in-store operations
`project: 496f1fc7-37ec-427d-b60a-e51084691f2a`

### M5 — Cash management & shift reporting
`milestone: 7eccd72e-d883-47ae-8e2a-95bff992f62e`

| # | Priority | Title | Labels |
|---|---|---|---|
| 1 | P2 | Cash in / cash out (paid-in, paid-out, drops) with reason | feature, pos |
| 2 | P2 | X-report (mid-shift) + Z-report (close-out) by tender | feature, pos |

### M6 — Returns, voids, discounts
`milestone: 0b449116-e55e-4f59-a730-069bab0b53bd`

| # | Priority | Title | Labels |
|---|---|---|---|
| 3 | P2 | Return / refund at POS — cash path | feature, pos, api |
| 4 | P2 | Return / refund at POS — card path (calls the Payments Terminal-refund endpoint) | feature, pos, payments |
| 5 | P2 | Return/refund writes inventory_movements return + updates order status | feature, pos, api |
| 6 | P2 | Void an in-progress or just-completed sale | feature, pos, api |
| 7 | P2 | Split tender — multiple order_payments rows in one sale | feature, pos |
| 8 | P2 | Barcode-scan cleanup — one shared wedge hook, drop dead use-order-scanner states, delete Expo-template leftovers | tech-debt, pos |

---

## Marketing site
`project: e6006ddf-b37a-4c54-be18-3bf059bd9ec5`

### M1 — Fix the funnel
`milestone: 3fd54d1a-a807-41ad-84cf-eaf8f01c0719`

| # | Priority | Title | Labels |
|---|---|---|---|
| 9 | P0 | Fix the broken primary CTA — point /signup links at the admin signup URL | bug, website |
| 10 | P0 | Build-time env config for the app URLs in Astro | chore, website |
| 11 | P0 | Meta description + OG/Twitter tags + canonical on the landing page | feature, website, seo |
| 12 | P0 | @astrojs/sitemap + robots.txt | feature, website, seo |
| 13 | P0 | Favicon / app-icon set + web manifest | chore, website |
| 14 | P0 | Privacy-friendly analytics + signup-CTA click tracking | feature, website |

### M2 — Structure & core pages
`milestone: 0e008446-2e34-4f1e-9c00-969b7db0ad55`

| # | Priority | Title | Labels |
|---|---|---|---|
| 15 | P1 | Extract a base layout + <head> component from index.astro | tech-debt, website |
| 16 | P1 | Break index.astro sections into components | tech-debt, website |
| 17 | P1 | Adopt a styling system (tokens or Tailwind) — replace scattered inline <style> | tech-debt, website |
| 18 | P1 | Pricing page (mirrors the platform fee model — with Payments M4) | feature, website |
| 19 | P1 | Features detail page(s) with screenshots | feature, website |
| 20 | P1 | "How it works" / merchant onboarding walkthrough page | feature, website |
| 21 | P1 | Docs entry point — link to Swagger UIs + a getting-started guide | feature, website |
| 22 | P1 | Contact / support page | feature, website |
| 23 | P1 | Real footer with working links + nav cleanup | feature, website |

### M3 — Legal & trust
`milestone: 46f69e0f-ec8d-4a15-ae6e-eee05e39beae`

| # | Priority | Title | Labels |
|---|---|---|---|
| 24 | P0 | Terms of Service page | feature, website |
| 25 | P0 | Privacy Policy page | feature, website |
| 26 | P1 | Cookie policy + consent copy consistent with analytics | feature, website |
| 27 | P1 | Acceptable-use / merchant agreement (or link from signup) | feature, website |
| 28 | P2 | Changelog / public roadmap page | feature, website |
| 29 | P2 | Social-proof / testimonials section structure | feature, website |

### M4 — Content & polish
`milestone: efe97f6a-8c79-4ed8-ba76-c5e00fd2034c`

| # | Priority | Title | Labels |
|---|---|---|---|
| 30 | P2 | Blog scaffold (Astro content collections) | feature, website, seo |
| 31 | P2 | 404 + error pages | feature, website |
| 32 | P2 | Accessibility + Lighthouse pass (95+ all categories) | chore, website |
| 33 | P2 | Remove the unused cookie dependency | tech-debt, website |
| 34 | P2 | Per-page OG image generation | feature, website, seo |

---

## Milestone ID reference (all projects, for completeness)

**Production readiness** `27f8ac8a-6046-4676-ba8b-e2af9aef31e7`
- M1 Unbreak CI (post-rename) `9107268a-4438-45ab-b829-41cdae4dc635`
- M2 Local dev experience `e65c1d38-bf86-4a34-99a8-d6eee88c6d2d`
- M3 Deploy pipeline for all services `59106c46-3391-4647-9f7f-1fbd4042e566`
- M4 Staging & rollback `066dfea9-f838-4d20-ade2-b1fccadf482b`
- M5 Data resilience `e9ceaf79-5537-44d8-b521-3ad57b9234f5`
- M6 Security & secrets `a47825db-efef-42c0-a6e9-7f3ec56b32f2`
- M7 Cost & tooling `98f9609e-187b-4759-85dd-60d1164d5d25`

**Observability & alerting** `bd8d3685-7470-48fa-9b3f-847ee98afa6f`
- M1 Know when it breaks `88036d4c-888a-4293-b34f-8a906f3e2c3f`
- M2 See the revenue path `9c0784f9-d00f-4af5-9e3a-7b1d98b0937b`
- M3 Diagnose fast `edf7ce9a-f6fc-4e19-9e7a-85f6afec24b6`
- M4 SLOs, business view, hygiene `cf085d54-1405-47ec-8e9c-148e1c90bdcb`

**Payments and billing** `5bcbc265-448d-417f-9081-84d8d408be68`
- M1 Web checkout: verified & tested `8ca9d815-f4d8-4b11-bd2e-9d8f6adf3921`
- M2 Order lifecycle: status, cancel, refund `56bbb0ed-faa8-4bb5-9998-201ab26a6b23`
- M3 POS card payments (Stripe Terminal, server-side) `c2ccacc3-9b98-4c84-a788-0715bb73c1c2`
- M4 Platform economics `a324fe4f-3cf0-4502-9cd9-54e65a0aa171`
- M5 Discounts & tax engine `0ca51eba-d81f-4930-aa8c-c893d706e1a6`

**Merchant dashboard & onboarding** `8d16205a-93b4-4f14-942f-101b05987784`
- M1 Fix what's half-built `2354a72e-87f8-4e05-9bbb-1625145e7fae`
- M2 Self-serve onboarding `484ff0b3-becb-433c-af97-defab0dc4ff3`
- M3 Staff & permissions (RBAC enforcement) `24cb427d-0e92-4d28-b09a-3bf31774c3bb`
- M4 Catalog / inventory / customer management `505cdade-9a48-4aad-9de7-bf1824d6010b`
- M5 Dashboard & insights `c0de3696-0837-45a2-8bf9-51821a92065d`
- M6 Fulfillment & shipping `66057263-7036-4eb9-9c5c-e6b841a1c861`
- M7 Audit log `0b5c9e28-8199-46e0-8938-86f55d1a32dc`

**Storefront customer experience** `be761d11-770e-47c8-8182-31064817ddec`
- M1 Rendering & SEO `da220573-6f0a-4d9a-b255-cd5b5f1edc87`
- M2 Discovery `8dd958f2-ef0f-4ba1-802b-e14b2e90d853`
- M3 Customer accounts & order tracking `4a525aa7-29e9-4eed-a095-0b32d544e555`
- M4 Checkout UX & resilience `5ac7e3a0-573c-4b86-b8f3-705baeed9872`
- M5 Brand & theming `f6396c61-a1c1-4604-a5db-1cadaede413a`
- M6 Post-launch growth `108a078a-aa23-434e-a5e7-68232d0f6a34`

**POS in-store operations** `496f1fc7-37ec-427d-b60a-e51084691f2a`
- M1 Runs end-to-end (verified) `59d9e703-4ce9-4f2f-a561-3bd70d57a783`
- M2 Card payments (app-side Terminal UX) `8a16ea48-79bf-47fd-a969-d5d03aefd3d6`
- M3 Sale reliability & offline `20943fab-d4ce-4a34-95c1-f82903b6c85a`
- M4 Receipts & customer capture `470719a6-6a60-4965-980c-ea9f0a7d1c31`
- M5 Cash management & shift reporting `7eccd72e-d883-47ae-8e2a-95bff992f62e`
- M6 Returns, voids, discounts `0b449116-e55e-4f59-a730-069bab0b53bd`

**Marketing site** `e6006ddf-b37a-4c54-be18-3bf059bd9ec5`
- M1 Fix the funnel `3fd54d1a-a807-41ad-84cf-eaf8f01c0719`
- M2 Structure & core pages `0e008446-2e34-4f1e-9c00-969b7db0ad55`
- M3 Legal & trust `46f69e0f-ec8d-4a15-ae6e-eee05e39beae`
- M4 Content & polish `efe97f6a-8c79-4ed8-ba76-c5e00fd2034c`
