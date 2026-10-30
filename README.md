# Ledgerly

A small POS and accounting demo for the Saudi market: Arabic/RTL, keyboard-first
checkout, a virtualised ledger, and ZATCA-style e-invoicing. Original code and
invented data. Not affiliated with any company.

**Live:** <url> (free instance: first load may take ~1 min; data resets on restart)
**Video:** <url>

## What's in it
- **POS**: keyboard-only sale, split cash/card, optimistic checkout with rollback
- **Ledger**: 51k double-entry rows, cursor pagination, virtualised grid, filters in the URL
- **Invoices**: UBL-style XML, SHA-256 hash chain, TLV QR, reporting vs clearance,
  retry with backoff, tamper detection
- **English + Arabic**, full RTL via Tailwind logical utilities

## Stack
React 19, TypeScript, Vite, Tailwind v4, shadcn/ui (Radix), TanStack Query/Table/Virtual,
react-i18next, Node + Hono, Drizzle + SQLite (better-sqlite3), Zod schemas shared
between web and API (pnpm workspace).

## Decisions
- Money is stored as integer halalas; the server recomputes prices and never trusts the client
- One shared pricing function used by both server and UI
- Sale, invoice hash chain and ledger posting happen in one DB transaction
- Keyset (cursor) pagination instead of OFFSET

## What is simulated / not done
- The ZATCA gateway is a simulator: no XAdES signing, no CSID onboarding, no Fatoora sandbox.
  Error codes are SIM-xxx, not real BR-KSA codes.
- No automated tests yet (next step), and the Arabic copy needs a native review.
- Demo tools (outage/tamper) are enabled on the live site and share state.

## Run locally
pnpm install
pnpm --filter api db:migrate && pnpm --filter api seed && pnpm --filter api seed:ledger
pnpm --filter api dev   # terminal 1
pnpm --filter web dev   # terminal 2