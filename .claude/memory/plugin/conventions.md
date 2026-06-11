---
scope: "Coding conventions for tiktok-upload-service: config access, generated code, TS strictness, logging and response shapes."
not: "Tech-stack inventory (see tech-stack.md), deployment (see deployment.md), or upload-domain behavior (see patterns-upload.md)."
anchors:
  - "Env access only via validated env from config/env.ts"
  - "supabase.ts is generated — don't hand-edit"
---

## Env access only via the validated `env` export

All environment access goes through the `env` object exported from `src/config/env.ts`, which validates against a Zod schema and calls `process.exit(1)` on any missing/invalid var. Never read `process.env` directly elsewhere. Add new config by extending `envSchema`.

**Why:** Centralized fail-fast validation means misconfiguration is caught at startup with a clear message, not as a runtime undefined deep in a handler. Bypassing it breaks that guarantee.

---

## src/types/supabase.ts is generated — regenerate, never hand-edit

`src/types/supabase.ts` is produced by the Supabase CLI (`Database`, `Tables<>`, `TablesUpdate<>`, `Enums<>` helpers). Use `Tables<'tiktok_accounts'>` rather than redefining row shapes.

**Why:** Hand edits are lost on the next generation and silently drift from the real DB schema. Schema changes should flow from Supabase → regenerate the file.

---

## tsconfig is intentionally loose

`strict: false`, `noImplicitAny: false`, `noUnusedLocals/Parameters: false`. Non-null assertions (`account.csrftoken!`) are used where a prior query guarantees presence.

**Why:** Don't rely on strict-mode guarantees when editing — the compiler won't catch implicit-any or null issues for you here. Be deliberate about null handling.

---

## Verbose structured-JSON errors; emoji console logging

Error responses are structured JSON (`error: true`, `statusCode`, `statusMessage`, `message`, plus `accountInfo` / `tiktokApiResponse` / `requestDetails` context objects), never bare statuses. Success responses stay minimal. Logging is plain `console.log`/`console.error` with emoji prefixes (🚀 🔧 📊 📤 🚫 ❌ ✅), verbose on the upload path.

**Why:** TikTok's upstream is opaque, so failures intentionally surface full context for debugging. Keep the established error shape when adding handlers so clients can parse consistently. Note: error responses currently echo the CSRF token/cookie — a known leak.

---
