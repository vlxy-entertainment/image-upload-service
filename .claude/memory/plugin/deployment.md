---
scope: "Building, running, and deploying tiktok-upload-service — Docker workflow and environment-reload gotchas."
not: "Tech stack (see tech-stack.md), coding conventions (see conventions.md), or upload-domain logic (see patterns-upload.md)."
anchors:
  - "Recreate container after .env changes"
---

## After changing .env you MUST recreate the container

Changing `.env` does NOT require an image rebuild, but a plain `docker-compose restart` may not reload env vars. You must recreate the container: `docker-compose up -d --force-recreate` (or run the helper `./restart.sh`). Rule of thumb: code/Dockerfile changed → add `--build`; only `.env` changed → `--force-recreate` without `--build`.

**Why:** Docker Compose doesn't recreate a container when only `.env` changes, so updated secrets/config silently fail to take effect after a normal restart. This has its own section in DEPLOY.md and a dedicated `restart.sh` because it bites repeatedly.

---

## dist/ is gitignored; dist/scripts/* are orphaned stale artifacts

`dist/` is build output and gitignored (local only). It contains `scripts/export-videos.js` and `scripts/migrate-titles.js` with NO matching `src/` source — they are one-off data-migration scripts for the larger parent `tiktok-video` project (target tables `videos`, `video_networks`, `actresses`), not part of this service.

**Why:** Don't treat those compiled scripts as live code for this service or try to maintain them here — they're leftovers. The real build (`pnpm build`) only emits `index.ts`, `config/`, and `types/`.

---
