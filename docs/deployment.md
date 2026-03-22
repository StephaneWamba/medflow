# Deployment

## Frontend — Vercel

```bash
cd apps/web
npx vercel --prod --yes
```

The project is linked to Vercel automatically. No extra config needed.

Live: https://medflow-five.vercel.app

---

## API — Fly.io

```bash
flyctl deploy   # from repo root
```

Migrations run automatically at container startup via `migrate deploy` (idempotent).

Live: https://medflow-api.fly.dev/api/v1

### Machines

| Machine | ID | Region | Memory |
|---------|-----|--------|--------|
| API | `185354db920728` | iad (Washington DC) | 512 MB |
| Redis | `918551d6b60428` | iad (Washington DC) | 256 MB |

Redis is accessed internally at `redis://medflow-redis.internal:6379` — not exposed publicly.

### Secrets

Set via `flyctl secrets set KEY=value`. Required secrets mirror the env vars in [setup.md](./setup.md).

```bash
flyctl secrets set AUTH_SECRET=... ENCRYPTION_KEY=... RESEND_API_KEY=...
```

### Docker

The Dockerfile uses a multi-stage build:
1. Builder stage — installs deps, generates Prisma client, compiles TypeScript
2. Deploy stage — copies only production artifacts

The generated Prisma client is copied explicitly since it lives outside `node_modules`:
```dockerfile
COPY --from=builder /app/packages/db/generated /deploy/node_modules/@medflow/db/generated
```

---

## Database — Neon

Project: `bold-scene-74357059`

Migrations are managed by Prisma:
```bash
pnpm db:migrate        # create + apply (dev)
flyctl ssh console -C "cd /deploy && npx prisma migrate deploy"  # prod (manual)
```

Applied migrations:
- `20260306122341_init` — initial 21-table schema
- `20260306232744_make_public_key_optional` — nullable public key field
