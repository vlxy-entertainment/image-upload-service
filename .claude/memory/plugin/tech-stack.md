---
scope: "Languages, frameworks, package manager, runtime, and project shape for tiktok-upload-service."
not: "Coding conventions (see conventions.md), deployment steps (see deployment.md), or upload-domain logic (see patterns-upload.md)."
anchors:
  - "Single-file Express app in src/index.ts"
  - "pnpm + Node 24.10.0 pinned"
---

## Single-file Express app — all logic in src/index.ts

Routing, middleware (cors, multer, body parsers), and the entire upload pipeline live in a single `src/index.ts` (~340 lines). There is no controller/service/router split. Supporting files are only `config/env.ts` and `types/`.

**Why:** It's a deliberately small, single-purpose service. Knowing everything is in one file means you don't go hunting for layered abstractions that don't exist. If real account-management endpoints are added, that single file is the natural first refactor boundary.

---

## Stack: TypeScript + Express 4 + multer + Supabase + Zod

Core deps: `express@^4`, `multer` (memory storage, 10MB image-only), `@supabase/supabase-js`, `zod` for env validation, `cors`. Native `fetch` is used to call TikTok (no axios/got).

**Why:** Tells you the toolset before reading code — e.g. multer uses memory storage (buffers, no disk), and HTTP calls use the built-in fetch, so don't add an HTTP client.

---

## pnpm is the package manager; Node pinned to 24.10.0

`pnpm-lock.yaml` is the committed lockfile and pnpm is preferred; the Dockerfile falls back to npm only if no pnpm lock exists. Node is pinned via `engines: node 24.10.0` and matched by the `node:24.10.0-alpine` Docker base image.

**Why:** Use `pnpm install`, not `npm install`, to respect the lockfile. Version skew between local and container is avoided by the pin — keep them aligned.

---

## No test framework configured

`npm test` is a placeholder that prints an error and exits non-zero. There are no test files, no jest/vitest config.

**Why:** Don't assume a test harness exists. Verifying changes means running the service (`pnpm dev`) and hitting endpoints manually (curl), not running a suite.

---
