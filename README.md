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
