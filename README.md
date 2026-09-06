# GramSeva — Backend & App (POC)

Village grievance-redressal app for Telangana: citizens report problems,
approved officials (sarpanch / ward member / mandal-district admin) act on
them, and reporters track status and progress end to end.

## Architecture (POC)

```
web/        React 19 + Vite + Tailwind (Leaflet/OSM maps)
server/     Hono on Node.js 22 + Drizzle ORM → PostgreSQL (Supabase)
shared/     Zod schemas + pure business logic used by BOTH sides
uploads/    local file storage (StorageProvider interface — S3-swappable)
```

- **Auth**: phone OTP (MSG91 with a console driver for dev) + Google OAuth,
  both issuing server-side sessions (opaque token, hashed in DB, revocable)
- **Isolation**: every user binds to a `jurisdictions` row; issue visibility
  is composed server-side from the session (see
  `server/src/services/issueScope.ts`), enforced by a contract test suite
- **Official access**: registration is OTP-verified and requires super-admin
  approval (`server/src/routes/admin.ts`); a seeded super admin reviews the
  queue at `/admin/officials`
- **DB migrations**: Drizzle Kit (`server/src/db/migrations/`)

## Local development

```bash
cp .env.example .env          # fill DATABASE_URL + SESSION_SECRET
npm install
npm run db:migrate            # apply schema to Postgres
npm run db:seed               # jurisdictions + super admin
npm run dev:server            # API on :3000 (console SMS driver prints OTPs)
npm run dev                   # web on :5173, /api proxied to the API
npm test                      # isolation + lifecycle contract tests
```

With `SMS_DRIVER=console` the OTP is printed in the server log instead of
being sent — the full login flow works before DLT/MSG91 are ready.

The super admin (phone from `SUPER_ADMIN_PHONE`) signs in with the same OTP
flow, then opens `/admin/officials` to approve or decline officials.

## Production deployment (single VPS)

```bash
npm ci && npm run db:migrate && npm run db:seed
npm run build                 # tsc + vite bundle into dist/web
node --env-file=.env server/src/index.ts   # serves API + static web
```

Put nginx (or Caddy) in front for TLS; the server is a plain HTTP Node
process (`PORT` env). Set `SMS_DRIVER=msg91` plus the MSG91 credentials once
the DLT template is approved, and `GOOGLE_CLIENT_ID/SECRET` with redirect
URI `{APP_BASE_URL}/api/auth/google/callback`.

## Environment

See `.env.example`. Required: `DATABASE_URL`, `SESSION_SECRET` (≥32 chars,
distinct from the Google client secret), `APP_BASE_URL`.

## Docs

- `docs/BACKEND_PLAN.md` — architecture review, security findings and the
  phase plan (implemented POC scope noted at the top)
