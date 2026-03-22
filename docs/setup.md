# Setup

## Prerequisites

- Node.js 22
- pnpm 10
- PostgreSQL — use [Neon](https://neon.tech) for a managed instance
- Redis — use [Upstash](https://upstash.com) or run locally

## Local Development

```bash
# Install dependencies
pnpm install

# Copy env template
cp apps/api/.env.example apps/api/.env
# Fill in values — see Environment Variables below

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed demo data (15 doctors)
pnpm --filter @medflow/db db:seed

# Start all apps
pnpm dev
```

Frontend → `http://localhost:3000`
API → `http://localhost:3001`

---

## Environment Variables

All variables are validated at startup by Zod (`apps/api/src/env.ts`). Missing required vars crash the process immediately with a clear error.

### API (`apps/api/.env`)

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | Neon pooler connection string |
| `DIRECT_URL` | ✅ | Neon direct connection (migrations only) |
| `AUTH_SECRET` | ✅ | ≥32 chars — session token signing |
| `ENCRYPTION_KEY` | ✅ | 64-char hex — AES-256 health record encryption |
| `REDIS_URL` | ✅ | `redis://...` |
| `RESEND_API_KEY` | ✅ | [resend.com](https://resend.com) API key |
| `LIVEKIT_URL` | ✅ | `wss://your-project.livekit.cloud` |
| `LIVEKIT_API_KEY` | ✅ | LiveKit credentials |
| `LIVEKIT_API_SECRET` | ✅ | LiveKit credentials |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | ✅ | R2 access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 secret |
| `R2_PUBLIC_URL` | ✅ | Public CDN base URL for R2 |
| `FRONTEND_URL` | ✅ | CORS origin (`http://localhost:3000` in dev) |
| `API_URL` | ✅ | Self-reference for token generation |
| `NODE_ENV` | — | `development` \| `production` |
| `PORT` | — | Default `3001` |
| `HOST` | — | Default `0.0.0.0` |
| `R2_BUCKET_NAME` | — | Default `medflow-documents` |
| `EMAIL_FROM` | — | Default `MedFlow <noreply@medflow.com>` |

### Frontend (`apps/web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | API base URL — defaults to `https://medflow-api.fly.dev/api/v1` |

---

## Project Structure

```
medflow/
├── apps/
│   ├── api/                # Fastify REST API
│   │   └── src/
│   │       ├── routes/     # /auth /appointments /doctors /patients ...
│   │       ├── services/   # auth, appointment, scheduler, email
│   │       ├── plugins/    # auth-guard, error-handler, audit
│   │       ├── jobs/       # BullMQ workers (email, notifications, reminders)
│   │       └── realtime/   # Socket.io server
│   └── web/                # Next.js 16 frontend
│       ├── app/
│       │   ├── (public)/   # Landing, doctors, legal pages
│       │   ├── (auth)/     # Login, register, verify
│       │   ├── dashboard/  # Patient portal
│       │   ├── doctor/     # Doctor portal
│       │   └── admin/      # Admin panel
│       ├── components/     # UI components
│       ├── hooks/          # useAuth, useNotifications, useDebounce
│       ├── stores/         # Zustand (auth, notifications)
│       └── lib/            # API client, socket, query client
├── packages/
│   ├── db/                 # Prisma schema, migrations, seed
│   └── shared/             # Zod schemas, enums, constants
├── Dockerfile              # Multi-stage API build → Fly.io
└── fly.toml                # Fly.io app config
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Patient | alice.testpatient@mailinator.com | TestPass123! |
| Doctor | sarah.testdoctor@mailinator.com | TestPass123! |
| Admin | admin.test@mailinator.com | TestPass123! |
