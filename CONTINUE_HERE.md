# CONTINUE HERE — Documentation AI (full handoff)

> **To resume on another PC:** tell Claude the folder path and say **"continue the ai documentation app"**.
> This file is the single source of truth (the prior PC's Claude memory does NOT travel). Read it fully first.

---

## 0. What this is
A **mobile-first PWA** (Next.js 14, App Router) for an engineering/contracting firm (Aspect, Qatar) to generate documents — **Costing, Quotation, Invoice, Proforma, Delivery Note, LPO** — with AI (Claude Sonnet) smart input and branded PDF output. Multi-tenant, but currently single tenant (Aspect).

Repo root: `documentation-ai/` · App: `apps/web` (Next.js) · `apps/doc-render` (legacy Express xlsx→pdf, now unused).

## 1. Live + cloud (accessible from ANY PC — nothing to move)
| Thing | Where |
|---|---|
| Live app | https://document-automation-sooty.vercel.app |
| Login | **no login** — "easy access" mode auto-signs-in as Aspect (`/api/auto-login`). Underlying creds: `hafnas008@gmail.com` / `aspect12345` |
| GitHub | https://github.com/hafnas008/document-automation (branch `main`) |
| Vercel | project `document-automation`, team `hafnas008-4343s-projects`, **Root Directory = apps/web** |
| Supabase | project `aspect-interior-factory`, ref `txntkxjvocknldnkzvhd` (EU). Shared w/ Factory app. Tables: tenants, tenant_users, costing_sheets, costing_items, clients, costing_projects, rate_history, ai_suggestion_cache, generated_documents, audit_log. Buckets: `tenant-logos` (public), `generated-docs` (private). |
| Framer (doc design drafts) | Hafnas's **City Exchange** Framer project, **design pages** (non-publishing): `Aspect · Costing Sheet / Invoice / Proforma Invoice / Delivery Note / LPO / Quotation`. Used only to communicate layout; do NOT publish/edit CE web pages. |
| Anthropic | model `claude-sonnet-4-6`. Key in `.env` + Vercel env. |

## 2. ⚠️ ONE PENDING ACTION (do first) — run this SQL in Supabase
Saving costing sheets FAILS until this runs (PDF/AI still work without it). Supabase → SQL Editor → run:
```sql
ALTER TABLE costing_sheets
  ADD COLUMN IF NOT EXISTS client_name   text,
  ADD COLUMN IF NOT EXISTS done_by       text,
  ADD COLUMN IF NOT EXISTS doc_date      date,
  ADD COLUMN IF NOT EXISTS project_size  text,
  ADD COLUMN IF NOT EXISTS markup_pct    numeric NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS labour_cnc    numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_selling numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photo_url     text;
```
(Same as `supabase/migrations/20260605000000_costing_markup_model.sql`.)

## 3. NEW-PC SETUP (critical)
1. **Get the code:** copy the folder, OR `git clone https://github.com/hafnas008/document-automation`.
2. **Copy `.env`** (repo root `documentation-ai/.env`) — it is **gitignored**, NOT in GitHub. Must hand-copy. Keys it holds: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `VPS_RENDER_URL`, `VPS_RENDER_SECRET`. (Template: `.env.example`.)
3. **Install with pnpm — NOT npm.** This is a pnpm workspace.
   `npx -y pnpm@9.7.0 install` (from repo root). Using `npm install` creates a stray `package-lock.json` that BREAKS the Vercel build ("No Next.js version detected"). If you ever must npm, delete any `apps/web/package-lock.json` after.
4. **Re-auth CLIs on the new PC** (per-machine): `vercel login` (for deploys) and `gh auth login` / git creds (for push).
5. Dev: from `apps/web` → `npx next dev`. Build check: `npx next build`.

## 4. DEPLOY (manual only — GitHub→Vercel auto-deploy is NOT wired)
From **repo root** `documentation-ai/`: `vercel --prod --yes`. Auto-aliases to document-automation-sooty.vercel.app. Then hard-refresh (Ctrl+Shift+R). Pushing to GitHub does NOT trigger a build.

## 5. WHAT WORKS NOW (shipped + live)
- **Shell / PWA:** mobile-first, installable. Light **grayscale** theme (canvas `#ECECEE`, white cards, dark `#18181B` ink, mid-gray accents). Fonts **Manrope** + **JetBrains Mono**. Zaha-inspired motion: `PageEnter` (curtain intro), `PageFlow` (drifting line backdrop), `MagneticButton`, grain, ease `cubic-bezier(0.16,1,0.3,1)`.
- **Home** (`app/(app)/home`): GreetingHeader ("Hey, {company}" + logo `public/logo.png`) + DateStrip (week, today=black pill) + SmartCommand AI hero + module menu + Fab (+). DailyLoop-inspired clean layout.
- **Brand logo:** `public/logo.png` (Higgsfield-generated dark tile, document+set-square). Also PWA icon.
- **Costing module = Hafnas's REAL model** (`components/costing/CostingEditor.tsx`): Client/Done-by/Date/Size + project + **product photo**; flat items (Item·Qty·Cost Unit→Total Cost→Selling); single **Profit Markup %** (default 100) with ± and **margin%/profit reverse-calc**; **Labour & CNC**; summary. Math in `lib/formulas.ts` (`computeMarkupTotals`, `marginToMarkup`, `profitToMarkup`). Editor input fields are bordered light-gray boxes.
- **AI (Claude Sonnet 4-6)** — verified live:
  - **Smart inputs** on home: Type / Snap (camera, Claude **vision**) / Speak (Web Speech) → `/api/costing/smart` → Claude extracts item list → creates sheet+items (+stores photo). 
  - **Per-item ✨ cost-suggest** in editor → `/api/costing/[id]/suggest-rate`.
- **PDF = A4 print template** (`app/(print)/print/costing/[id]`, `components/print/CostingDoc.tsx` + `print.css`): branded (tenant logo/accent/address/footer), vector via browser `window.print()` (PrintBar "Save / Print PDF"). Editor "Generate PDF" opens it. (Old jsPDF `lib/pdf/costingPdf.ts` now unused.)

## 6. COSTING MATH (the real model — reuse exactly)
`total_cost = qty × cost_unit` per line · `cost_base = Σ items + labour_cnc` · `total_selling = cost_base × (1 + markup/100)` (markup default **100% = 2×**) · `profit = selling − cost` · `margin = profit/selling×100`. Reverse: margin M → `markup = M/(100−M)×100`; profit P → `markup = P/cost×100`. Origin: Hafnas's older app `D:\AI AUTOMATION\PRACTICE -1\costing-form.html` (also had jsPDF + n8n webhook `n8n.srv1279727.hstgr.cloud/webhook/costing-save`, which is ALIVE but NOT wired into this app — he chose AI features over n8n-save).

## 7. DESIGN LANGUAGE (locked — keep consistent)
Light grayscale + Manrope/JetBrains Mono + Zaha motion + DailyLoop clean-card layout. Tailwind tokens are semantically flipped: `graphite`=light surfaces, `mist`=dark ink, `ash`=mid grays. Reusable shell in `components/shell/`.

## 8. DOCUMENT TEMPLATES — status
- **Costing** print template DONE (code, live). 
- **Invoice/Proforma/Delivery/LPO/Quotation:** designed as **Framer drafts** only (see §1). Hafnas redesigns them in Framer, then we **port the look into code print-templates** under `app/(print)/print/<doc>/[id]` + `components/print/<Doc>.tsx` (same A4 foundation as CostingDoc). Brand = **Aspect Trading W.L.L**, navy `#1F3A5F` + orange `#E85D2A` (see `REFERANCE/_INVOICE.pdf`). NOTE: app tenant is "Aspect Interior" — Trading vs Interior may need separate tenant brands.
- Reference source docs: `../REFERANCE/` (Invoice pdf/docx, LPO, Proforma, Delivery Note, Quotation, Common Costing Sheet.xlsx).

## 9. NEXT STEPS / ROADMAP
1. Run the §2 SQL (unblocks saving). 2. Hafnas finishes Framer redesigns → port each doc to a code print-template. 3. Build Quotation/Invoice/etc. modules (editors + data) reusing the costing pattern. 4. Per-company branding in Settings (logo/accent/address/footer drive every PDF). 5. Reskin leftover legacy pages (`settings/branding`, `onboarding`) off old `ink` tokens. 6. Optional: wire n8n `costing-save` webhook on save.

## 10. GOTCHAS
- **pnpm only** (see §3). · **Deploy from repo root, manual** (§4). · `.env` must be hand-copied (§3). · Vercel/gh re-auth per PC. · Framer = shared CE project, design pages only — never publish. · Costing editor saves fail until §2 SQL runs.
