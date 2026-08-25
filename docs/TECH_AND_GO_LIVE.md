# GramSeva – Technology Stack & Go-Live Support

## 1. Technology Used

### Frontend
| Technology | Purpose |
|------------|--------|
| **React 19** | UI framework |
| **TypeScript** | Type-safe JavaScript |
| **Vite 7** | Build tool, dev server, bundling |
| **React Router 7** | Client-side routing |
| **Tailwind CSS** | Styling (Telangana theme, responsive) |
| **Lucide React** | Icons |
| **Zod** | Schema validation |

### Backend & Runtime
| Technology | Purpose |
|------------|--------|
| **Hono** | Web framework (API routes) |
| **Cloudflare Workers** | Serverless runtime (edge) |
| **Wrangler** | Deploy and manage Workers, D1, R2 |

### Data & Storage
| Technology | Purpose |
|------------|--------|
| **Cloudflare D1** | SQLite database (users, issues, etc.) |
| **Cloudflare R2** | Object storage (e.g. photo uploads) |

### Auth & External Services
| Technology | Purpose |
|------------|--------|
| **@getmocha/users-service** | Google OAuth (login, sessions) |
| **@google/genai** | Gemini AI (Vikas Sahayak chat, Krishi soil analysis) |

### Mobile (Optional)
| Technology | Purpose |
|------------|--------|
| **Capacitor 6** | Wrap web app as Android / iOS native app |

### DevOps / Tooling
| Technology | Purpose |
|------------|--------|
| **ESLint** | Linting |
| **TypeScript (tsc)** | Type checking |
| **Knip** | Dead code / unused deps |

---

## 2. Go Live – What Support You Need

### A. Cloudflare Account & Resources

- **Cloudflare account** (free tier is enough to start).
- This project is set up for:
  - **Workers** – runs the Hono API and serves the app.
  - **D1** – database (name/ID in `wrangler.json`: `019be4f8-599d-7e44-bc53-21277779b119`).
  - **R2** – bucket for uploads (same ID).
- **First-time setup:** Run migrations for D1 (see Cloudflare D1 docs or project migrations folder).

### B. Environment Variables / Secrets (Production)

Set these in **Cloudflare Dashboard** → your Worker → **Settings** → **Variables and Secrets** (not in `.dev.vars`):

| Variable | Required | Description |
|----------|----------|-------------|
| `MOCHA_USERS_SERVICE_API_KEY` | **Yes** (for Google login) | From [getmocha.com/dashboard](https://getmocha.com/dashboard). |
| `MOCHA_USERS_SERVICE_API_URL` | Optional | Default: `https://getmocha.com/u`. Override only if you use a custom Mocha URL. |

- For **Google sign-in** to work in production, `MOCHA_USERS_SERVICE_API_KEY` is mandatory.
- `.dev.vars` is for **local only**; never commit it. Production uses Cloudflare secrets.

### C. Optional: AI Features (Vikas Sahayak & Krishi)

- **Google AI (Gemini) key** from [Google AI Studio](https://aistudio.google.com/apikey).
- In **local** dev: put in `.env` as `VITE_GEMINI_API_KEY=...`.
- For **production**: either:
  - bake into build via a **Vite env var** (e.g. in your CI: `VITE_GEMINI_API_KEY=... npm run build`), or  
  - expose an API in your Worker that uses the key from a Cloudflare secret and call it from the frontend (key never in client bundle).

### D. Build & Deploy

```bash
# Install dependencies
npm install

# Build (TypeScript + Vite)
npm run build

# Deploy to Cloudflare (requires Wrangler login and correct wrangler.json)
npx wrangler deploy
```

- **First time:** run `npx wrangler login` and ensure `wrangler.json` points to the right Worker/D1/R2.
- **Custom domain:** configure in Cloudflare Dashboard (Workers & Pages → your Worker → Domains).

### E. Checklist for Go Live

1. **Cloudflare**
   - [ ] Account created.
   - [ ] D1 database created and migrations run.
   - [ ] R2 bucket created (if using uploads).
   - [ ] Worker deployed (`npx wrangler deploy`).

2. **Auth (Google login)**
   - [ ] Mocha account and API key from [getmocha.com/dashboard](https://getmocha.com/dashboard).
   - [ ] `MOCHA_USERS_SERVICE_API_KEY` set as **secret** in Cloudflare Worker.

3. **Optional**
   - [ ] Gemini API key for AI (Vikas Sahayak / Krishi) – env or backend secret.
   - [ ] Custom domain and SSL (handled by Cloudflare when you add the domain).

4. **App behaviour**
   - [ ] `/app` flow uses **localStorage** and does not require Mocha auth (mobile-style onboarding).
   - [ ] Main web flow (`/`, `/login`, etc.) **does** require Mocha + Google OAuth.

### F. Where to Get Help

- **Mocha / Auth:** [getmocha.com](https://getmocha.com), [Discord](https://discord.gg/shDEGBSe2d).
- **Cloudflare:** [Cloudflare Docs](https://developers.cloudflare.com/) (Workers, D1, R2, Wrangler).
- **Build / run issues:** See project `README.md` and `AUTH_SETUP.md`.

---

## Summary

- **Tech:** React 19 + TypeScript + Vite (frontend), Hono on Cloudflare Workers (backend), D1 (DB), R2 (storage), Mocha (Google auth), optional Gemini AI and Capacitor for mobile.
- **Go live:** Cloudflare account + Worker + D1 + R2, set **MOCHA_USERS_SERVICE_API_KEY** in production, run migrations, then `npm run build` and `npx wrangler deploy`. Optionally add Gemini key and custom domain.
