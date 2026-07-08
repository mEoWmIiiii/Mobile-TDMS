# Mobile TDMS

A mobile transport & logistics dashboard for field operators and warehouse staff. Tracks, enters, and organises cargo for both land and air transport, with live truck progress, job management, and light/dark theme support.

## Run & Operate

- **Mobile App** (preview): `PORT=8099 pnpm --filter @workspace/mobile run dev` — Expo web on port 8099
- **API Server**: `PORT=8080 pnpm --filter @workspace/api-server run dev` — Express on port 8080
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provided by Replit; only needed once DB schema and routes are in use)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo 54 + React Native 0.81 + Expo Router (file-based routing)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (ESM bundle)
- Theme: Deep Corporate Navy (`#0A1F4C`) + Vibrant Logistics Orange (`#E87722`)

## Where things live

- `artifacts/mobile/` — Expo mobile app (mock data in `data/mockData.ts`)
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/` — generated React Query hooks
- `lib/api-zod/` — generated Zod schemas
- `lib/db/src/schema/index.ts` — Drizzle DB schema (currently empty; add tables here)

## Architecture decisions

- Mobile app currently uses mock data (`data/mockData.ts`); no DB queries from the frontend yet.
- DB schema is empty — no tables defined. Add Drizzle tables to `lib/db/src/schema/index.ts`, then run `pnpm --filter @workspace/db run push`.
- All API contracts flow through `lib/api-spec/openapi.yaml` → codegen → generated hooks. Don't write manual fetch wrappers.

## Product

Dashboard tabs: **Dashboard** (KPIs, job list, truck tracker), **Jobs**, **Tracking**. Light/dark theme toggle. Animated truck progress updates every 3 s.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `DATABASE_URL` is runtime-managed by Replit — do not set it manually.
- Port 8099 (mobile) and 8080 (API) must be used; these are set explicitly in the workflow commands since artifacts were imported without managed workflow registration.
- Run `pnpm --filter @workspace/api-spec run codegen` after any change to `openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
- See the `expo` skill for mobile development patterns.
