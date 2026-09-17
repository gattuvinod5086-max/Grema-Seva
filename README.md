# GramSeva — Telangana Digital Governance Platform

A village-level grievance-redressal and public governance platform for Telangana. Citizens report local community issues with geolocated pins and photos, approved officials (Sarpanches, Ward Members, Mandal Officials, and District Admins) act on them within SLAs, and reporters track status transparently from submission to resolution.

---

## Architecture

- **Web Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + React-Leaflet (OSM France / Carto maps)
- **Backend API**: Hono on Node.js 22 + Drizzle ORM → PostgreSQL (Supabase)
- **Cloud Storage**: Supabase Storage (S3-compatible API via `@aws-sdk/client-s3`) with automatic local disk fallback
- **Shared Logic**: Zod validation schemas, administrative hierarchy data (33 Telangana districts, mandals, and villages), and TypeScript models shared across web and server

---

## Prerequisites

- **Node.js**: `v20+` or `v22+` (Node 22 recommended)
- **npm**: `v9+` or `v10+`
- **Postgres Database**: Supabase PostgreSQL project (or any Postgres 15+ instance)

---

## Quick Start (How to Run)

### 1. Clone & Setup Environment

```bash
# Copy example environment configuration
cp .env.example .env

# Edit .env and supply your credentials:
# - DATABASE_URL (Supabase Postgres connection string)
# - SESSION_SECRET (generate with: openssl rand -hex 32)
# - SUPBASE_* (Supabase Cloud Storage S3 credentials)
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Migration & Seeding

```bash
# Apply schema tables and constraints to Postgres
npm run db:migrate

# Seed initial administrative jurisdictions (33 Telangana districts) and Super Admin
npm run db:seed
```

---

## Running the Application

### Option A: Unified Server (Recommended)
Builds the client and serves both the API endpoints (`/api/*`) and the frontend on a single port (`PORT=3010` by default):

```bash
# Step 1: Build client assets
npm run build

# Step 2: Start server
npm start
```
Open **`http://localhost:3010`** in your browser.

> **Note**: In unified mode, client-side route changes, static assets, and API requests are all handled seamlessly without CORS overhead.

---

### Option B: Development Mode (with Hot Reload / HMR)
Run backend and frontend independently for active frontend development:

**Terminal 1 (Backend API with watch mode):**
```bash
npm run dev:server
# API listening on http://localhost:3010
```

**Terminal 2 (Vite Frontend with HMR):**
```bash
npm run dev
# Frontend running on http://localhost:5173 (proxies /api to :3010)
```
Open **`http://localhost:5173`** in your browser.

---

## Testing & Verification

Run the comprehensive Vitest contract, isolation, and lifecycle tests:

```bash
npm test
```

To run lint checks:
```bash
npm run lint
```

---

## Key Features & Roles

- **Citizen Portal**:
  - Sign in with mobile number (OTP) or Google OAuth.
  - Profile completion requires choosing your District, Mandal, and Home Village in Telangana.
  - Report issues with photo uploads, GPS pin drop, and category selection.
  - Real-time Telugu / English language toggle.
- **Officials Portal (`/register/official` & `/login?official=1`)**:
  - **Mandal Official**: Mandal-wide administrative authority across all villages in their mandal.
  - **Sarpanch**: Village-wide governance authority for their Gram Panchayat.
  - **Ward Member**: Strict ward-isolated issue management (scoped strictly to their designated ward number).
  - **Admin / Super Admin**: Statewide dashboard and official approval queue (`/admin/officials`).
- **Cloud Storage**:
  - Issue attachments, grievance photos, and landmark place images are stored directly in Supabase Cloud Storage (`grama-seva-uploads`).
  - Auth-gated serving (`/api/files/:key`) ensures sensitive photos are only accessible to authorized citizens and officials.
- **Interactive Mapping**:
  - Interactive Leaflet maps powered by OpenStreetMap France / Carto tile services without rate-limiting blocks or hazard watermarks.
