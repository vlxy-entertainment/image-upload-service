# Setup & Deployment

## Prerequisites

- **Node.js 24.10.0** (pinned in `package.json` `engines`)
- **pnpm** (preferred — `pnpm-lock.yaml` is the committed lockfile) or npm
- A **Supabase** project with a `tiktok_accounts` table (see
  [architecture.md](architecture.md) for the schema) and at least one `active`
  account row with valid `csrftoken` + `sid_guard_ads`
- For container deploys: **Docker ≥ 20.10** and **Docker Compose ≥ 2.0**

## Environment variables

Validated at startup by Zod (`src/config/env.ts`). The process **exits with code 1**
if required vars are missing or malformed.

| Variable                     | Required | Default       | Notes                                   |
|------------------------------|----------|---------------|-----------------------------------------|
| `SUPABASE_URL`               | yes      | —             | must be a valid URL                     |
| `SUPABASE_SERVICE_ROLE_KEY`  | yes      | —             | service role — bypasses RLS, keep secret |
| `PORT`                       | no       | `3003`        | coerced to number                       |
| `NODE_ENV`                   | no       | `development` | `development` \| `production` \| `test` |
| `CORS_ALLOWED_ORIGINS`       | no       | —             | comma-separated; only enforced in production |

> ⚠️ `env.example` currently ships real-looking Supabase credentials. Replace them
> with placeholders and **never** commit a real service-role key. See
> [architecture.md](architecture.md) known issues.

## Local development

```bash
pnpm install            # or: npm install
cp env.example .env     # then edit .env with real values

pnpm dev                # ts-node, runs src/index.ts directly
pnpm dev:watch          # nodemon — auto-restart on change
pnpm build              # tsc -> dist/
pnpm start              # node dist/index.js  (run build first)
```

(Scripts are defined in `package.json`; `npm run …` works equivalently.)

### Smoke test

```bash
curl http://localhost:3003/health
curl -X POST http://localhost:3003/api/upload/tiktok -F "file=@test.png"
```

## Docker

Multi-stage build (`Dockerfile`): builder compiles TypeScript, production stage
installs prod-only deps, runs as a non-root `nodejs` user, and ships an HTTP
`HEALTHCHECK` against `/health`.

```bash
cp env.example .env             # edit with real values
docker-compose up -d --build    # build image + start
docker-compose logs -f          # follow logs
curl http://localhost:3003/health
```

### The `.env` gotcha (important)

Changing `.env` does **not** require rebuilding the image, but you **must
recreate the container** for new env values to load — a plain
`docker-compose restart` may not pick them up.

```bash
./restart.sh                          # helper: docker-compose up -d --force-recreate
# or
docker-compose up -d --force-recreate
```

Rule of thumb:
- code / Dockerfile changed → `docker-compose up -d --build --force-recreate`
- only `.env` changed → `docker-compose up -d --force-recreate` (no `--build`)

See `DEPLOY.md` and the README for full Docker command reference, Ubuntu server
setup, and production hardening tips (reverse proxy, TLS, secrets).

See also: [architecture](architecture.md) · [features](features.md) · [conventions](conventions.md)
