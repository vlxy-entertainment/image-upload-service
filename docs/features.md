# Features

## Endpoints

| Method | Path                  | Purpose                                              |
|--------|-----------------------|------------------------------------------------------|
| `GET`  | `/`                   | Service info + endpoint listing                      |
| `GET`  | `/health`             | Health check — `{ status, timestamp, service, environment, version }` |
| `POST` | `/api/upload/tiktok`  | Upload one image to TikTok via a pooled account      |

The `/health` endpoint is also wired into the Docker `HEALTHCHECK`.

## Image upload

- **Field name:** `file` (multipart/form-data, single file).
- **Storage:** `multer` memory storage — the file never touches disk; the buffer
  is forwarded straight to TikTok.
- **Constraints:** images only (`mimetype` must start with `image/`); max **10 MB**.
- **Success response:**
  ```json
  { "success": true, "url": "https://p16-webcast.tiktokcdn.com/obj/...", "accountUsed": "account-name" }
  ```

Example:
```bash
curl -X POST http://localhost:3003/api/upload/tiktok -F "file=@test.png"
```

## Account pooling & load balancing

Each upload picks the **active account with the lowest `upload_count`** that has
both a `csrftoken` and a `sid_guard_ads` value. After a successful upload the
account's `upload_count` is incremented, so usage naturally spreads across the
pool. There is no time-based cooldown or automatic disabling of bad accounts —
see [architecture.md](architecture.md) known issues.

Accounts are managed directly in the Supabase `tiktok_accounts` table; the
service has no admin endpoints for adding or editing them.

## CORS

Configured in `src/index.ts`:

- **Development** (`NODE_ENV=development`): all origins allowed.
- **Production:** only origins in `CORS_ALLOWED_ORIGINS` (comma-separated env var)
  are allowed; if unset, a small hardcoded default list is used. Blocked origins
  are logged and rejected.
- Credentials enabled; methods `GET, POST, PUT, DELETE, OPTIONS`;
  `optionsSuccessStatus: 200` for legacy browsers.

## Structured error reporting

Every failure path returns a rich JSON body rather than a bare status — including
the selected account's info and TikTok's raw response — so an opaque upstream is
debuggable from the client side. See the error contract in
[architecture.md](architecture.md).

## Body-size limits

`express.json` and `express.urlencoded` are bumped to a `10mb` limit (the Express
default of 100 kb is too small for base64/large payloads). The multer limit is
the real guard for the binary upload.

See also: [architecture](architecture.md) · [setup](setup.md) · [conventions](conventions.md)
