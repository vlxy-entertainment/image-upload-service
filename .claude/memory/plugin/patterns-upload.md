---
scope: "Domain logic of the TikTok image upload: account selection, the credential-replay mechanism, and the unimplemented rotation design."
not: "Generic tech stack (see tech-stack.md), coding conventions (see conventions.md), or deployment (see deployment.md)."
anchors:
  - "Account selection by lowest upload_count"
  - "Replays TikTok's internal browser API, not the official one"
---

## Account selection: least-used active account

Each upload queries `tiktok_accounts` for `status='active'` with non-null `csrftoken` AND `sid_guard_ads`, ordered by `upload_count ASC`, limit 1. On success it increments `upload_count` and stamps `last_upload_at`/`updated_at`.

**Why:** This is the entire load-balancing strategy — usage spreads across the pool by always picking the least-used healthy account. There is no other rotation logic, so an account is only ever picked based on count, never rested after a rejection.

---

## Uploads replay TikTok's INTERNAL browser API, not the official one

The service POSTs to `https://www.tiktok.com/api/upload/image/` with `tt-csrf-token` header and `Cookie: tt_csrf_token=…; sid_guard=…`, plus a desktop-Chrome User-Agent and `Host: www.tiktok.com`. Success = `status_code === 0` with `data.uri`; the final URL is `https://p16-sg.tiktokcdn.com/obj/{uri}`. This is NOT TikTok's official Content Posting API.

**Why:** It depends on stolen/borrowed browser session credentials per account and is inherently fragile — TikTok can change the endpoint, headers, or invalidate sessions at any time. Credentials (csrftoken, sid_guard_ads) must be harvested from a real session and kept fresh in the DB.

---

## cooldown_until and limited/inactive statuses are unimplemented

The `tiktok_accounts` schema defines `cooldown_until` and the enum values `limited`/`inactive`, but the service never reads or writes them — only `active` is ever queried, and nothing demotes an account or sets a cooldown.

**Why:** The rotation/cooldown system was designed but not built. Don't assume failing accounts get rested automatically — a `limited`/`inactive` account stays out only if set manually in the DB. This is the obvious next feature if account health management is needed.

---
