# Documentation AI

Multi-tenant Costing Sheet generator for contracting companies.

## Apps

- `apps/web` — Next.js 14 app (Vercel)
- `apps/doc-render` — Express xlsx→pdf converter (Hostinger VPS, LibreOffice headless)

## Quick start

```
pnpm install
pnpm dev          # Next.js on :3000
pnpm dev:render   # converter on :3017
```

See `docs/DEPLOYMENT.md` for production setup.

## RLS smoke test

After applying migrations to a Supabase project (cloud or local), run:

```
psql "$DATABASE_URL" -f supabase/tests/rls_smoke.sql
```

Should print `NOTICE: RLS smoke OK`. Any other output is a leak.
