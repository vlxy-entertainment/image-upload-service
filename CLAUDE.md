# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

tiktok-upload-service is the VLXY thumbnail upload proxy: a small Express + TypeScript service (Docker on port 3000) that re-hosts a single image to TikTok's CDN using a pool of `tiktok_accounts`. It is called over HTTP by torbox-app and video-manager (`POST /api/upload/tiktok`). Full system context: `../vlxy-docs/`.

## Workflow

This repo follows the VLXY workflow standard (`../vlxy-docs/docs/workflow.md`; summary in `../CLAUDE.md`).

- **Branch:** `main`.
- **Test runner:** none yet (`npm test` is not implemented). **Bootstrap-then-enforce:** the first task touching testable logic (a route handler, the account-selection logic, or a util) must stand up Vitest — config, one passing smoke test, and `test` / `test:coverage` scripts — before the feature work, then replace this line with the real test command.
- **TDD:** mandatory for route handlers, the account-rotation/selection logic, request validation, and utils; bug fixes start with a failing regression test. Real red → green → refactor.
- **Docs:** update this repo's docs on any contract/command change; update `vlxy-docs` per the trigger table (e.g. a new endpoint, a new env var, or a change to how `tiktok_accounts` is read/updated).
