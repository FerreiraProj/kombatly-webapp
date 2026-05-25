# Taekwombats

SaaS platform for Taekwondo tournament management.

## Tech Stack

- **Frontend:** Next.js 15 + TypeScript + TailwindCSS + shadcn/ui
- **Backend:** NestJS 10 + TypeScript
- **Database:** PostgreSQL 15 + Prisma 5
- **Cache:** Redis 7
- **Monorepo:** Turborepo + pnpm workspaces

## Development Setup

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker Desktop

### 1. Clone & install
```bash
pnpm install
```

### 2. Copy environment variables
```bash
cp .env.example .env
```

### 3. Start database services
```bash
docker compose up -d
```

### 4. Run database migrations + seed
```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start development servers
```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs
- Prisma Studio: `pnpm db:studio`

## Default Admin
- Email: `admin@taekwombats.com`
- Password: `Admin@Taekwombats2025!`

## Monorepo Structure

```
apps/
  web/    → Next.js frontend (port 3000)
  api/    → NestJS backend (port 3001)
packages/
  database/ → Prisma schema + seed
  types/    → Shared TypeScript types
```
