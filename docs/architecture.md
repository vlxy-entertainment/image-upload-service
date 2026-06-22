# Architecture

## What the service does

`tiktok-upload-service` is a small TypeScript + Express microservice that proxies
image uploads to TikTok's **internal** image-upload endpoint
(`https://www.tiktok.com/api/upload/image/`). It does not use TikTok's official
Content Posting API — it replays a browser's authenticated request using session
credentials (CSRF token + `sid_guard` cookie) stored per account in Supabase.

Its job: accept an image over HTTP, pick a healthy TikTok account, upload the
image on that account's behalf, and return the resulting TikTok CDN URL. A pool
of accounts is used so that uploads spread across many identities rather than
hammering one.

It is a single-purpose service — there is no UI, no auth on the service itself,
and effectively one meaningful endpoint.

## Upload request flow

`POST /api/upload/tiktok` (`src/index.ts`) runs this pipeline:

1. **Receive** — `multer` (memory storage) accepts a single `file` field.
   Rejects non-images and anything over 10 MB.
2. **Select account** — query Supabase `tiktok_accounts` for the row with:
   - `status = 'active'`
   - `csrftoken IS NOT NULL` and `sid_guard_ads IS NOT NULL`
   - ordered by `upload_count ASC`, `limit 1`
   This is the load-balancing strategy: always use the least-used healthy account.
3. **Forward** — build a `FormData` with the image blob + `source=0`, set the
   account's `tt-csrf-token` header and `Cookie: tt_csrf_token=…; sid_guard=…`,
   plus a desktop-Chrome `User-Agent` and `Host: www.tiktok.com`. `fetch` POSTs
   it to the TikTok upload URL.
4. **On success** (`status_code === 0` and `data.uri` present):
   - increment `upload_count`, set `last_upload_at` and `updated_at`
   - construct the final URL: `https://p16-webcast.tiktokcdn.com/obj/{data.uri}`
   - return `{ success: true, url, accountUsed }`
5. **On failure** — return a detailed error payload (see below).

## Data model

Single table, `public.tiktok_accounts` (types generated into
`src/types/supabase.ts`):

| Column           | Type                       | Notes                                   |
|------------------|----------------------------|-----------------------------------------|
| `id`             | uuid                       | primary key                             |
| `name`          | text (required)            | human label, returned as `accountUsed`  |
| `aadvid`         | text (required)            | TikTok ad account id (stored, unused in upload) |
| `csrftoken`      | text \| null               | required for selection                  |
| `sid_guard_ads`  | text (required)            | session cookie value; required for selection |
| `status`         | enum \| null               | `active` \| `limited` \| `inactive`     |
| `upload_count`   | int \| null                | drives least-used selection             |
| `last_upload_at` | timestamptz \| null        | stamped on success                      |
| `cooldown_until` | timestamptz \| null        | **defined but never read/written**      |
| `created_at`     | timestamptz \| null        |                                         |
| `updated_at`     | timestamptz \| null        | stamped on success                      |

Enum `tiktok_account_status`: `active`, `limited`, `inactive`. Only `active` is
ever queried; `limited`/`inactive` are never set by the service.

## External dependencies

- **Supabase** — accessed with the **service-role key** via `@supabase/supabase-js`.
  No RLS context; full table access. Used both to select an account and to update
  its counters.
- **TikTok internal API** — `https://www.tiktok.com/api/upload/image/`. Undocumented;
  authenticated by replaying browser session credentials. Fragile by nature.
- **TikTok CDN** — final URLs are constructed against `p16-webcast.tiktokcdn.com`.

## Error-response contract

The success shape is intentionally minimal; the error shapes are intentionally
verbose to aid debugging an opaque upstream. Failures return:

```jsonc
{
  "error": true,
  "url": "/api/upload/tiktok",
  "statusCode": <number>,
  "statusMessage": "<string>",
  "message": "<string>",
  "accountInfo": { "id", "name", "status", "uploadCount", "lastUploadAt", "cooldownUntil" },
  "tiktokApiResponse": { "statusCode", "statusMessage", "responseBody" },
  "requestDetails": { "url", "method", "headers" }   // included on TikTok-side failures
}
```

Three failure branches exist: no file (400), no available account (500), TikTok
HTTP error (passthrough status), TikTok logical failure (`status_code !== 0`, 400),
and an outer catch (500). The TikTok-failure branches echo the request headers
(including the CSRF token) back in the response — useful for debugging, but it
does leak credentials to the caller.

## Known issues / tech debt

These are documented for awareness; the code is not changed here.

1. **Real-looking service-role key committed in `env.example`.** That file is
   tracked by git and contains a `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   that look genuine. A service-role key bypasses RLS — if real, it should be
   rotated in the Supabase dashboard and `env.example` should carry only
   placeholders. (`.env` itself is correctly gitignored.)
2. **Orphaned compiled scripts.** `dist/scripts/export-videos.js` and
   `dist/scripts/migrate-titles.js` exist as build artifacts with **no matching
   `src/scripts/` source**. They target a different schema (`videos`,
   `video_networks`, `actresses`) belonging to the larger parent `tiktok-video`
   project — one-off data migrations, not part of this service. `dist/` is
   gitignored, so these are local-only stale artifacts.
3. **Cooldown / rotation designed but unimplemented.** `cooldown_until` and the
   `limited` / `inactive` statuses exist in the schema but the service never reads
   or sets them. There is no automatic demotion of an account that TikTok rejects;
   accounts are only ever balanced by `upload_count`.
4. **Credentials echoed in error responses.** TikTok-failure branches return the
   CSRF token and cookie in `requestDetails.headers`.

See also: [features](features.md) · [setup](setup.md) · [conventions](conventions.md)
