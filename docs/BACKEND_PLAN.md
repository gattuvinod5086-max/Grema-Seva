# GramSeva — Production Backend

> **POC status (implemented on branch `feat/backend-production`).** The POC
> implements the core loop end to end on a new Node/Hono + Postgres
> (Supabase) stack: OTP+Google auth with server-side sessions, jurisdiction
> reference data replacing free-text matching, official registration with
> super-admin approval, scoped issue lifecycle (create → acknowledge →
> progress → resolve → confirm/reopen) with idempotency and proximity
> dedup, auth-gated local file storage, Leaflet/OSM maps, and a 19-test
> isolation/lifecycle contract suite in `server/test/`.
>
> **Deferred to the production phase** (sections below remain the plan for
> that): RLS policies, `official_assignments` validity windows, the
> notifications queue / `sms_log` / consents / DPDP work, the SLA cron job,
> backups/load tests, and the news & emergency modules. Files flagged below
> with old line numbers refer to `main` and are historical.

## Context

GramSeva is a village grievance-redressal app for Telangana. The intended loop is: a citizen
reports a problem → it reaches the sarpanch or the responsible department → the citizen tracks
its status → the official updates status and progress. Today that loop only half-exists, and
the repo is really **two apps that share no state**:

- **Track A — `/app` "Terminal"** looks finished but is a pure demo: `MockDB` in
  `src/react-app/data/terminalData.ts`, a `localStorage` session, and an OTP that is a
  hardcoded string compared in the browser (`TerminalAuth.tsx:108` checks `otp !== "1234"`;
  `Onboarding.tsx:9` uses `OTP_DEMO = "123456"`). Nothing reaches a server.
- **Track B — `/`, `/telangana`** is genuinely server-backed (Hono on Cloudflare Workers, D1,
  R2, Google OAuth) with real SLA, escalation, audit trail and citizen confirmation — but its
  authorization has holes that make the stated "data isolation is must" requirement false, and
  its login path is half-migrated between two auth providers so registration cannot complete.

The goal is one real backend: SMS OTP login, Google login, routing to actual officials,
citizen-visible status, official status/progress updates, enforced data isolation, and map
location on reports.

**Decisions already made with the user:** separate Node backend on **Postgres** (not staying on
D1), **MSG91** for SMS OTP, **Leaflet + OpenStreetMap** for maps.

**Branch `feat/backend-production` is already created** (carrying the pre-existing uncommitted
`package.json` / `package-lock.json` changes).

---

## What the review found

All verified by reading source, not inferred. Line numbers are against `main` at `96030b2`.

### Critical — live data exposure

1. **Every citizen can read every neighbour's complaint.** With a village set, the list query
   is `SELECT * FROM issues WHERE village = ?` with no owner filter
   (`src/worker/index.ts:290`, `:305`), and `canViewIssue` ends with a blanket same-village
   allow (`src/worker/governance.ts:75`). Full text, photo, GPS and reporter id of every
   complaint in the village. *This may be an intentional transparency feature — it is
   undocumented and uncontrolled either way, and it is the one product decision that must be
   settled before Phase 3.*
2. **Complaint photos are served with no auth.** `GET /api/files/:key` is registered with no
   middleware (`src/worker/index.ts:670`).
3. **Any sarpanch can make themselves admin.** `PATCH /api/users/:id/role`
   (`src/worker/index.ts:723`) admits `sarpanch`, takes an arbitrary target id and an
   unvalidated role string, with no jurisdiction check.
4. **The village-analytics guard cannot fail.** `canViewIssue(user, { user_id: user.id, ... })`
   passes the caller's own id as the record owner, so the `issue.user_id === user.id` branch
   always returns true — and the query runs before the check anyway
   (`src/worker/index.ts:655–668`).
5. **A sarpanch can close complaints in any village.** `canUpdateIssueStatus` returns true for
   `admin || sarpanch` with no village comparison (`src/worker/governance.ts:85`) — while
   `mandal_official` below them *is* scoped correctly.

### High

6. **Registration cannot complete under direct Google OAuth.** Five endpoints still use Mocha's
   `authMiddleware` instead of `requireAuth()` (`src/worker/index.ts:689, 701, 723, 752, 781`)
   and `ProtectedRoute.tsx:14` gates on Mocha's `useAuth()`. A direct-Google user gets a
   session the rest of the app refuses, 404s on `complete-registration`, and loops back to
   `/login`.
7. **No OTP backend at all** — see Track A above. Net-new work, not a fix.
8. **Session JWT is signed with `GOOGLE_CLIENT_SECRET`** (`src/worker/index.ts:144–151`,
   `governance.ts:25`). Rotating the OAuth credential kills every session; either leak
   compromises both. No server-side session record, so logout only drops the cookie.
9. **OAuth flow carries no `state` parameter** (`src/worker/google-auth.ts:33–47`) — no CSRF
   protection on the callback; `redirect_uri` also falls back to a value derived from the
   request's own `Origin`/`Referer` (`index.ts:60–64`).
10. **A personal-looking PDF is committed and publicly served.**
    `public/Statement_FEB2026_182057584.pdf` is tracked since the initial commit and sits in the
    static asset root, so it is served at `/Statement_FEB2026_182057584.pdf` on every deploy.
    Separately a 168 MB `claude-desktop_1.46388.2_amd64.deb` sits untracked in the working tree.
11. **`GET /api/users` returns every user in every village** with email, phone and father's
    name, unpaginated (`src/worker/index.ts:701`).
12. **No rate limiting anywhere** — tolerable today, a direct financial attack the moment OTP
    ships.

### Medium

13. **SLA escalation only runs when someone opens a list** — `processEscalations` is called
    inside `GET /api/issues` (`src/worker/index.ts:315`). Belongs on a scheduled job.
14. **Migrations 3 and 4 do not exist** (folder runs 1, 2, 5–11). The live D1 schema cannot be
    reproduced from the repo, and there is no migration command in `package.json`.
15. **Dead authorization guard, twice** — `if (!canUpdateIssueStatus(user, {})) { }` calls the
    function, discards the result, runs an empty block (`index.ts:409`, `:498`). Not
    exploitable; reads as protection that isn't there.
16. **CORS open to all origins** — `app.use("/*", cors())` (`index.ts:46`).
17. **Google `id_token` signature never verified and `email_verified` never checked**
    (`google-auth.ts:78–95`). Safe at the one call site, unsafe by the exported contract.
18. **Photo upload is a second request that can silently fail** (`index.ts:583–620`); no size
    cap, no MIME validation, no EXIF stripping, one photo per issue.
19. **No idempotency on create** (`index.ts:352`) — a double tap files two complaints;
    `shared/services/duplicateDetection.ts` is only wired into the client demo.
20. **No pagination on any list endpoint.**
21. **No tests, no CI, no error contract** — Zod failures throw out of handlers instead of
    returning a 400 with field errors.

### Gaps beyond the seven features named

- **No directory of who the officials are.** "Routes to the sarpanch" needs a table answering
  *who is the sarpanch of this village right now*. `departmentRouting` returns a department
  *string*; `assigned_to_user_id` is only ever set by a human clicking assign. Terms end and
  officials transfer, so assignments need validity windows.
- **Location is free text**, so isolation is string equality on `district`/`mandal`/`village`.
  One `"Kondapur"` vs `"Kondapuram"` and a complaint is invisible to the right person, or
  visible to the wrong one.
- **Nobody is notified of anything.** The whole loop has no notification layer. Status SMS needs
  its own DLT templates in Telugu and English — a lead-time item alongside OTP.
- **Consent, retention, residency unaddressed.** Phone numbers, father's names, GPS and photos
  of identifiable people collected for a government body: DPDP Act 2023 needs a consent record,
  stated purpose, retention period and deletion path, and very likely an Indian region.
- **Smaller:** voice notes have UI (`VoiceInput`) but no attachment model; no multi-photo
  before/after evidence; no withdraw/hide/flag or soft delete; no search or export; notification
  language not stored per user; `offlineSync.ts` models sync state but no batch-accept endpoint
  exists; twelve `FIX_*`/`START_HERE` markdown files and eight shell scripts clutter the root.

### What is already good and gets reused

The eleven files in `src/shared/services/` — `sla.ts`, `escalation.ts`,
`issueClassification.ts`, `departmentRouting.ts`, `duplicateDetection.ts`, `villageScore.ts`,
`audit.ts`, `analytics.ts`, `mapData.ts`, `mapDirections.ts`, `offlineSync.ts` — plus
`src/shared/constants/` are written against plain objects with no platform dependency. **They
move to `packages/shared/` unchanged.** `src/data/telangana.ts` (899 lines of district/mandal/
village data) seeds the jurisdiction table. This is why the restructure is a move, not a rewrite.

---

## Target structure

Workspace monorepo, three roots. `packages/shared` holds the Zod schemas that are simultaneously
what the server validates and what the client expects — that is what stops the two tracks
drifting apart again.

```
apps/api/                        Node 22 · Hono · Postgres · Drizzle
  src/
    index.ts                     bootstrap, route mounting
    env.ts                       zod-validated config, fails fast on boot
    db/
      client.ts                  pg pool + drizzle
      schema/                    table definitions
      migrations/                generated, ordered, checked in
      seed/                      jurisdictions from src/data/telangana.ts + LGD codes
    modules/                     each: routes · service · repo · schema · test
      auth/ users/ officials/ issues/ attachments/
      notifications/ news/ emergency/ analytics/
    middleware/                  auth · scope · ratelimit · error · request-log
    providers/
      sms/msg91.ts               + console driver for local dev
      storage/s3.ts
      geocode/nominatim.ts
    jobs/
      sla-escalation.ts          cron; replaces the read-path hack
      notification-dispatch.ts
  test/                          integration, incl. isolation contract suite

apps/web/                        existing React app moved wholesale
packages/shared/                 types/ (zod = API contract) · constants/ · services/
infra/                           docker-compose (postgres+postgis, minio) · Dockerfile.api
docs/                            root FIX_*.md files fold in here
```

## Data model additions

Beyond a straight port of the eleven existing tables:

| Table | Carries | Why |
|---|---|---|
| `jurisdictions` | district, mandal, village, ward, LGD code, centroid | Canonical geography; users/issues/officials FK here instead of comparing strings |
| `official_assignments` | user, role, jurisdiction, department, valid_from/to | Answers "who is the sarpanch here today" — the lookup auto-routing needs; keeps history correct after a transfer |
| `auth_identities` | user, provider, provider_uid, verified_at | One citizen, two login methods, one account |
| `otp_requests` | phone, code_hash, purpose, attempts, expires_at, consumed_at, ip | Hashed codes, 5-min expiry, capped attempts, per-phone/per-IP throttle |
| `sessions` | user, token_hash, device, ip, expires_at, revoked_at | Makes logout mean something; revoke an official's session when their term ends |
| `issue_attachments` | issue, kind (photo/voice), key, mime, bytes, phase | Multiple files; before/after evidence pairing |
| `notifications` | user, channel, template, payload, status, provider_msg_id | One queue behind SMS/push/in-app with debuggable delivery state |
| `sms_log` | phone, dlt_template_id, provider_msg_id, status, cost | DLT compliance evidence and a running cost line |
| `consents` | user, purpose, version, granted_at, withdrawn_at | DPDP Act record |
| `audit_log` | actor, action, entity, before, after, ip | Generalises `issue_updates` to cover role and assignment changes |

New columns on `issues`: `jurisdiction_id`, `geom geography(Point,4326)` + GiST index,
`accuracy_m`, `address_text`, `reported_via`, `visibility`, `idempotency_key` (unique),
`duplicate_of_id`, `withdrawn_at`.

**On data isolation.** Findings 1–5 are all one failure: authorization hand-written per handler
and eventually forgotten in one. Postgres **row-level security** fixes the category rather than
the instances — policies on `issues`, `users`, `issue_attachments` keyed to a per-request
`SET LOCAL app.user_id / app.role / app.jurisdiction`, so a handler that forgets its `WHERE`
returns nothing instead of everything. This is the main reason Postgres beat staying on D1,
which has no equivalent.

---

## Phases

Ordered by dependency. Phase 0 ships to the current Cloudflare deployment on day one, because
the rewrite takes weeks and the leaks are live now. Estimates assume one developer.

### Phase 0 — Stop the bleeding on what's deployed · 1–2 days
Patches to the existing worker, before any restructuring.
- Identify and purge the PDF from `public/` **and from git history**; gitignore the `.deb`
- Auth + ownership check on `GET /api/files/:key` (`index.ts:670`)
- Delete `PATCH /api/users/:id/role` or restrict to `admin` with a role allowlist (`:723`)
- Fix the analytics guard (`:655–668`); add village scoping for sarpanch in
  `canUpdateIssueStatus` (`governance.ts:85`)
- Lock CORS to known origins (`:46`); scope and paginate `GET /api/users` (`:701`)

→ *nothing sensitive is publicly readable*

### Phase 1 — Monorepo and API skeleton · 3–4 days
The move, with no behaviour change, so the diff stays reviewable.
- Workspaces; `src/react-app` → `apps/web`, `src/shared` → `packages/shared`
- `apps/api` on Hono + Node adapter; Drizzle over Postgres; docker-compose for
  Postgres/PostGIS/MinIO
- Port the eleven tables as migration 001, reconstructing what missing migrations 3 and 4 did
  (from the live D1 instance if no copy is recoverable)
- Boot-time config validation, structured request logging, one error shape, health endpoint

→ *existing endpoints answer from Postgres*

### Phase 2 — Real authentication · 4–5 days
- MSG91 adapter behind an `SmsProvider` interface, with a **console driver** so the whole flow
  is testable before DLT clears
- `POST /auth/otp/request` and `/auth/otp/verify` — hashed codes, 5-min expiry, 5 attempts,
  throttled per phone, per IP and per day
- Google OAuth with `state`, verified `id_token`, `email_verified` enforced, and its own
  `SESSION_SECRET` distinct from the OAuth client secret
- Account linking on matching verified phone or email; server-side sessions with real logout
- Retire Mocha and the `authMiddleware`/`requireAuth()` split — one middleware everywhere,
  including `ProtectedRoute`

→ *OTP arrives on a real handset*

### Phase 3 — Isolation as structure · 3–4 days
- Seed `jurisdictions` from `src/data/telangana.ts` + LGD codes; migrate text columns to FKs
- `official_assignments` with validity windows; role and scope resolved once per request
- RLS policies on issues, users, attachments driven by `SET LOCAL` session variables
- **Contract test suite asserting each role sees exactly its own slice** — the regression net
  for findings 1–5
- Settle and implement the complaint-visibility decision (private / village-public / opt-in)

→ *a forgotten WHERE clause returns nothing, not everything*

### Phase 4 — The complaint lifecycle, end to end · 5–6 days
- Create in one transaction: text, attachments, location, idempotency key, server-side dedup
  via `duplicateDetection.ts`
- Auto-route on category + jurisdiction to a **named official**, escalation targets resolved
  from `official_assignments`
- Status and progress updates with mandatory evidence on resolve; citizen confirm/reopen;
  full audit
- SLA escalation moved from `index.ts:315` to a scheduled job; notification queue with SMS and
  in-app, Telugu and English
- Paginated, filterable list endpoints for citizen and official views

→ *the reporting loop actually closes*

### Phase 5 — Map and geography · 3–4 days
- Leaflet + OSM pin-drop and GPS capture on the report form, accuracy shown, manual correction
- Reverse geocode to address + jurisdiction suggestion; Nominatim results cached server-side to
  stay inside its usage policy
- Officials' map view: clustered pins, severity colouring, heatmap over the existing
  `toMapPoints` in `shared/services/mapData.ts`
- PostGIS radius query feeding duplicate detection ("three reports within 50 m")

→ *location is data, not a text field*

### Phase 6 — Hardening and go-live · 4–5 days
- Rate limits on auth, create and upload; upload size/MIME caps, EXIF stripping
- Integration tests on auth, isolation and the issue lifecycle; CI on every push
- Consent capture, retention policy, deletion path, privacy notice
- Backups with a **tested restore**, error tracking, uptime checks, runbook
- Load check at district volume; staging environment mirroring production

→ *ready for a real village*

**Total ≈ 23–30 working days**, five to six calendar weeks for one developer. Phases 0 and 1
depend on nothing external and can start immediately.

---

## Verification

- **Phase 0:** curl `/api/files/<known key>` unauthenticated → 401. Sign in as a seeded sarpanch
  of village A, `PATCH` an issue in village B → 403. Confirm the PDF is gone from
  `git log --all -- public/`.
- **Phase 1:** `docker compose up`, run migrations, `npm run test:api`; hit every ported
  endpoint and diff responses against the Worker's for the same seed data.
- **Phase 2:** console SMS driver prints a code in local dev; full OTP request → verify →
  session → `/users/me` round trip in an integration test. Then one live MSG91 send to a real
  handset once DLT clears. Assert throttles by firing 6 requests for one phone.
- **Phase 3:** the isolation contract suite is the verification — a matrix of (role × record
  ownership × jurisdiction) asserting allow/deny on read, list and write for each of findings
  1–5. Additionally connect as the app role in `psql` without `SET LOCAL` and confirm RLS
  returns zero rows.
- **Phase 4:** end-to-end test — citizen files with photo + location, assert it lands on the
  correct official from `official_assignments`, official acknowledges and resolves with
  evidence, citizen confirms, audit trail has every step. Run the SLA job against a backdated
  issue and assert escalation.
- **Phase 5:** file a report from a phone with GPS on, confirm the pin, address and jurisdiction
  suggestion; open the officials' map and confirm clustering; file two reports 30 m apart and
  assert the duplicate warning.
- **Phase 6:** `npm run test` green in CI; restore a backup into a scratch database and query it;
  load-test the issue list at ~50k rows.

---

## Blocking on the user

1. **Start today — DLT registration on TRAI's portal.** Entity + header + template approval takes
   1–2 weeks and needs the sponsoring organisation's documents. Every SMS template (OTP,
   complaint received, status changed, resolved) must be pre-registered in Telugu and English.
   **Longest pole in the plan, and not a coding task.**
2. **Decide — are complaints visible to the whole village, or only to the reporter and
   officials?** The code currently says village-visible with no control and no notice. Needed
   before Phase 3.
3. **Confirm — what is `public/Statement_FEB2026_182057584.pdf`?** Not opened beyond confirming
   it is a PDF. If it is what the filename suggests, purge from history and treat anything it
   references as exposed.
4. **Provision — hosting and an India region.** Managed Postgres + a container host; Supabase and
   AWS offer Mumbai `ap-south-1`, Neon's nearest is Singapore. If the sponsoring body requires
   Indian data residency that rules options out.
5. **Provision — production Google OAuth client** with a verified consent screen; MSG91
   credentials once DLT clears.
6. **Supply — real officials data for pilot villages** (names, phones, roles, jurisdictions), and
   name an owner for keeping it current as terms and postings change.
7. **Recover — migrations 3 and 4** if a copy exists; otherwise reconstruct from live D1 and note
   the gap.

---

## Also ready

A formatted, readable version of this review — findings, architecture, phases and the asks — is
at `docs/BACKEND_PLAN.html`. Open it in a browser, or ask me to publish it as a shareable link
for the team.
