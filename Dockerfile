# ─── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install deps (layer-cache friendly — copy manifests first)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json           ./apps/api/
COPY packages/db/package.json        ./packages/db/
COPY packages/shared/package.json    ./packages/shared/

RUN pnpm install --frozen-lockfile

# Copy all source
COPY . .

# 1. Generate Prisma client to packages/db/generated/client/
#    (custom output avoids pnpm virtual-store resolution issues at runtime)
RUN pnpm --filter @medflow/db exec prisma generate

# 2. Build packages (CJS — no "type":"module" in any package.json)
RUN pnpm --filter @medflow/shared exec tsc -p tsconfig.json
RUN pnpm --filter @medflow/db     exec tsc -p tsconfig.json

# 3. Patch main fields so the API build resolves @medflow/* to dist/
RUN node -e " \
  const fs = require('fs'); \
  ['packages/db', 'packages/shared'].forEach(p => { \
    const f = p + '/package.json'; \
    const j = JSON.parse(fs.readFileSync(f, 'utf8')); \
    j.main = './dist/index.js'; \
    fs.writeFileSync(f, JSON.stringify(j, null, 2)); \
  }); \
"

# 4. Build the API
RUN pnpm --filter @medflow/api exec tsc -p tsconfig.json

# 5. Prune to production-only deployment directory
RUN pnpm deploy --filter @medflow/api --prod --legacy /deploy

# 6. Copy compiled dist/ for internal packages (pnpm deploy copies source, not dist)
RUN cp -r packages/db/dist      /deploy/node_modules/@medflow/db/dist
RUN cp -r packages/shared/dist  /deploy/node_modules/@medflow/shared/dist

# 7. Copy the Prisma-generated client (self-contained, no .prisma/ lookup needed)
RUN cp -r packages/db/generated /deploy/node_modules/@medflow/db/generated

# 8. Fix deployed package.json: point main to dist/, strip type/exports overrides
RUN node -e " \
  const fs = require('fs'); \
  ['db', 'shared'].forEach(name => { \
    const f = '/deploy/node_modules/@medflow/' + name + '/package.json'; \
    const j = JSON.parse(fs.readFileSync(f, 'utf8')); \
    j.main = './dist/index.js'; \
    delete j.type; \
    delete j.exports; \
    fs.writeFileSync(f, JSON.stringify(j, null, 2)); \
  }); \
"

# 9. Copy Prisma schema (needed by prisma migrate deploy at startup)
RUN cp -r packages/db/prisma /deploy/prisma

# ─── Stage 2: runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /deploy .

EXPOSE 8080

# Migrate (idempotent) then start
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/server.js"]
