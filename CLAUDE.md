# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (all services in parallel via Turborepo)
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check

# Database
pnpm db:migrate      # run pending migrations
pnpm db:seed         # seed reference data
pnpm db:studio       # open Prisma Studio
pnpm db:generate     # regenerate Prisma client after schema changes
pnpm db:reset        # drop + recreate + seed (destructive)
```

## Architecture

Turborepo monorepo with pnpm workspaces:

- `apps/api` — NestJS 10 REST API, port 3001
- `apps/web` — Next.js 15 App Router frontend, port 3000
- `packages/database` — Prisma 6 schema, migrations, seed; exported as `@taekwombats/database`
- `packages/types` — Shared TypeScript types; exported as `@taekwombats/types`

### API modules

`AuthModule`, `UsersModule`, `ClubsModule`, `TournamentsModule`, `RegistrationsModule`, `BracketsModule`, `InvoicesModule`, `UploadsModule`, `AdminModule`

Auth flow: `POST /auth/login` returns `{ accessToken }` in body + `refresh_token` httpOnly cookie. The web client stores the access token in localStorage and sends it as `Authorization: Bearer`. The Next.js middleware checks for the `refresh_token` cookie to determine auth state for routing.

Swagger UI: `/api/docs` with Bearer auth support.

### Critical build path quirk

TypeScript workspace path aliases cause NestJS to output to a nested path. The compiled entry point is:

```
apps/api/dist/apps/api/src/main.js
```

Not `dist/main.js`. Both `apps/api/package.json` (`start` script) and `Dockerfile.api` CMD must use this full path.

### Two `grade` type shapes in the web

Different API response types use different shapes for grade/weightCategory names — make sure to use the right one:
- `registrations.ts` / `invoices.ts` API types: `grade.names['en']`, `weightCategory.displayNames['en']`
- `tournaments.ts` / `clubs.ts` API types: `grade.nameEn`, `weightCategory.displayNameEn`

### Cross-subdomain cookies (production)

The `refresh_token` cookie must be set with `domain: .kombatlypro.com` so it is shared between `api.kombatlypro.com` and `kombatlypro.com`. Controlled via the `COOKIE_DOMAIN` environment variable in `auth.controller.ts`.

## Deployment

CI/CD via Coolify on Hetzner (204.168.144.59):
- `main` branch → production at `kombatlypro.com` / `api.kombatlypro.com`
- `dev` branch → staging at `dev.kombatlypro.com` / `api-dev.kombatlypro.com`

Docker: `Dockerfile.api` and `Dockerfile.web` in repo root. `docker-compose.prod.yml` for multi-service orchestration (postgres, redis, api, web). Env vars injected by Coolify at runtime.

## Key env vars

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Access token signing key |
| `JWT_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `FRONTEND_URL` | CORS allowed origin |
| `COOKIE_DOMAIN` | Cookie domain (e.g. `.kombatlypro.com`) |
| `API_PORT` | API listen port (default 3001) |
| `NEXT_PUBLIC_API_URL` | Web → API URL (must be set at Next.js build time) |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for real-time features |
