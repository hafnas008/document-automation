# Deployment Guide — Documentation AI v1

This guide walks through getting the v1 Costing Sheet generator live. All code is done; this is the manual ops checklist.

**Build status (2026-05-22):** 44 commits on `main`, all tests pass, build clean. Code-complete through Phase 11. Phase 12 = this document.

---

## Pre-flight — one-time manual setup

### A. Add named ranges to the Aspect costing template

`apps/web/templates/common-costing.xlsx` was copied verbatim from your reference. To make `xlsx-fill.ts` actually populate cells, you need to add named ranges in Excel or LibreOffice Calc.

1. Open `apps/web/templates/common-costing.xlsx`.
2. For each named range below, click the target cell and use Formulas → Define Name (or LibreOffice: Sheet → Named Ranges and Expressions → Define).

| Name | Goes in cell that holds | Example cell (adjust to your layout) |
|---|---|---|
| `COMPANY_NAME` | tenant company name | header area |
| `TRN` | TRN number | header area |
| `ADDRESS` | tenant address | header area |
| `FOOTER` | footer text (phone/email) | bottom |
| `SHEET_NUMBER` | sheet number (e.g. CS-001) | top-right |
| `TITLE` | sheet title | title row |
| `DATE` | today's date | top-right |
| `CLIENT_NAME` | client name | client section |
| `ITEMS_START` | first row of items block, leftmost column (Section) | first item row, column A or whichever |
| `OVERHEAD_PCT` | overhead % | totals area |
| `PROFIT_PCT` | profit % | totals area |
| `CONTINGENCY_PCT` | contingency % | totals area |
| `VAT_PCT` | VAT % | totals area |
| `SUBTOTAL` | subtotal | totals area |
| `GRAND_TOTAL` | grand total | totals area |

3. Save the file.
4. Commit:
   ```bash
   git add apps/web/templates/common-costing.xlsx
   git commit -m "chore(web): add named ranges to Aspect costing template"
   ```

The xlsx items-block writes 6 columns starting at `ITEMS_START`: Section, Description, Qty, Unit, Rate, Total. Position `ITEMS_START` at whichever column holds Section (or repurpose by shifting items in `xlsx-fill.ts`).

### B. Fill the Aspect seed placeholders

`supabase/seed.sql` has four `<FILL IN>` markers. Replace each with the real value before running the seed.

```sql
INSERT INTO tenants (id, company_name, trn_number, address, footer_text, accent_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Aspect Interior LLC',
  '<FILL IN: Aspect TRN>',
  '<FILL IN: Aspect address>',
  '<FILL IN: Aspect footer text>',
  '#1a1a1a'
);
```

Commit after filling in.

---

## 1. Supabase project setup

### Create project
- Region: **EU-West** (closest to Hostinger Frankfurt)
- Save the project URL, anon key, service role key

### Apply migrations
In the Supabase SQL editor, paste and run each file in order:
1. `supabase/migrations/20260520000000_init.sql`
2. `supabase/migrations/20260520000001_rate_history_trigger.sql`
3. `supabase/migrations/20260520000002_storage_buckets.sql`
4. `supabase/seed.sql` (after filling placeholders — see Pre-flight B)

### Run RLS smoke test
```bash
psql "$DATABASE_URL" -f supabase/tests/rls_smoke.sql
```

Expect: `NOTICE: RLS SELECT isolation OK` and `NOTICE: RLS INSERT isolation OK`. Anything else = leak; do not proceed.

### Create your auth user
Supabase Dashboard → Authentication → Users → "Invite user" → enter your email. After confirming the email, run in SQL editor:
```sql
INSERT INTO tenant_users (tenant_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', id, 'member'
  FROM auth.users WHERE email = 'hafnas008@gmail.com';
```

---

## 2. Deploy doc-render to Hostinger VPS

### Generate the shared secret
On the VPS, in the docker-compose stack folder (where your existing `n8n` / TV-rates services live):
```bash
echo "DOC_RENDER_SECRET=$(openssl rand -hex 32)" >> .env
cat .env | grep DOC_RENDER_SECRET   # copy this value
```

### Pull the repo + build
The VPS doesn't have this repo yet. Either:
- Push to GitHub first, then clone on VPS, OR
- `rsync` the `apps/doc-render/` folder up

After it's on the VPS:
```bash
cd <wherever>/documentation-ai/apps/doc-render
docker compose up -d --build
docker compose logs -f doc-render
```

Expect: `doc-render listening on :3017`.

### Verify Traefik routing
```bash
curl https://doc-render.srv1279727.hstgr.cloud/health
```
Expect: `{"ok":true,"libreOffice":true}`.

```bash
curl -X POST https://doc-render.srv1279727.hstgr.cloud/xlsx-to-pdf
```
Expect: `{"error":"unauthorized"}` (401).

### Make sure Traefik has the route
If `/health` returns 404 from the Traefik default, ensure:
- The `traefik` external Docker network exists on the VPS
- Your Traefik config recognizes the labels in `docker-compose.yml` (it should — same pattern as your existing services per memory `reference_hostinger_vps_traefik`)
- DNS for `doc-render.srv1279727.hstgr.cloud` resolves to the VPS

---

## 3. Deploy apps/web to Vercel

### Create Vercel project
- Import the GitHub repo
- **Root directory:** `apps/web`
- **Build command:** `cd ../.. && corepack pnpm install && corepack pnpm --filter web build`
- **Install command:** leave default
- **Framework:** Next.js (auto-detected)
- **Node version:** 20

### Environment variables (Production)
| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase (secret) |
| `ANTHROPIC_API_KEY` | from Anthropic console |
| `VPS_RENDER_URL` | `https://doc-render.srv1279727.hstgr.cloud` |
| `VPS_RENDER_SECRET` | the secret you generated in step 2 |

### Deploy
```bash
git push origin main
```
Watch Vercel build log. The first deploy may take 4–5 min (cold install).

---

## 4. End-to-end smoke test

1. Visit the Vercel URL — should redirect `/` → `/login`.
2. Sign in with the email you invited.
3. Expected: if branding is complete (logo + TRN + name), goes to `/costing`. Otherwise routes to `/settings/branding` (forced gate).
4. Click **`+ New costing sheet`** — should land on `/costing/<id>` editor.
5. Click **`+ Material`** to add a row. Type a description, quantity, unit, rate. Sidebar totals update live.
6. On an empty Rate cell with description + unit filled, click ✨ — should fill the rate (yellow dot indicator) within 3–5 seconds. Verify the dot appears.
7. Click **Preview** — opens `/costing/<id>/preview` showing the HTML render with your logo + branding.
8. Click **Generate final** — wait 6–10 seconds — sheet flips to `final` status, download URLs appear in `costing_sheets.pdf_url` / `.xlsx_url` columns.
9. Open the PDF and the XLSX — verify:
   - Aspect logo is in place
   - Company name, TRN, address are populated
   - Items are listed in the correct sections
   - Totals match the sidebar
10. Click **Duplicate as v2** — should create a new draft sheet with version 2. Original stays `final`.
11. Verify `audit_log` table contains rows for `create`, `update`, `generate`, `create` (duplicate).

### Tag the release
```bash
cd documentation-ai
git tag v1.0.0-costing
git push origin v1.0.0-costing
```

---

## Known v1 sequelae (not bugs — by design)

- **Other 5 templates** (Quotation, Invoice, Proforma, LPO, Delivery Note) — v2 spec.
- **Voice + image input** — v1.1 / v1.2 specs.
- **WhatsApp + email send-out** — Subsystem 4 spec (uses n8n + Unipile).
- **Roles + approvals** — Subsystem 5 spec.
- **Inventory, projects, payments, dashboard** — Subsystem 3 (ERP Core) spec.
- **Multi-language EN/AR** — v3 spec.
- **`tsbuildinfo` / `next-env.d.ts`** — gitignored, regenerate on every build.

## Troubleshooting

- **Vercel build fails on `xlsx-populate`** — usually a missing peer dep warning, not a build failure. Verify the build log shows "Compiled successfully" at the bottom.
- **Logo upload returns 403** — check Phase 1 storage policies are applied. The `logo update` policy was added in commit `76e11e2` and is required for `upsert: true`.
- **Generate returns 500 "VPS render failed"** — check `https://doc-render.srv1279727.hstgr.cloud/health` returns OK. Most likely `VPS_RENDER_SECRET` mismatch between Vercel env and VPS `.env`.
- **Generate returns 400 "complete branding first"** — tenant is missing `logo_url`, `company_name`, or `trn_number`. Fill them on `/settings/branding`.
- **`anthropic.messages.create` returns model-not-found** — `claude-sonnet-4-6` may need to be swapped to the closest available model on your Anthropic account. Single-line change in `apps/web/lib/claude.ts:6`.
- **Concurrent generates time out** — by design. doc-render runs a single-worker queue. If load grows, switch to a multi-worker setup (Bull + Redis) per spec §9.

---

## Architecture recap (for new contributors)

- **Two deployable apps:** `apps/web` (Vercel) + `apps/doc-render` (Hostinger VPS, LibreOffice headless).
- **One Postgres + Auth + Storage:** Supabase EU-West.
- **One Claude tenant-isolated cache key per item:** sha256(tenant + normalized description + unit).
- **One xlsx template, N branded outputs:** master `common-costing.xlsx` + per-tenant variables.
- **Source of truth for totals:** `apps/web/lib/formulas.ts` (pure JS, same in browser + server).

Spec: `docs/superpowers/specs/2026-05-20-documentation-ai-v1-costing-design.md`
Plan: `docs/superpowers/plans/2026-05-20-documentation-ai-v1-costing.md`
