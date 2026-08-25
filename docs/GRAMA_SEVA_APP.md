# Grama Seva – Digital Telangana Terminal

Cross-platform **Android & iOS** app (web + Capacitor) for the G2C portal: onboarding, Vikas Sahayak (AI), Krishi Terminal (Agri vision), Grievance, and Panchayat Directory.

## Quick start

1. **Install dependencies** (includes `@google/genai` and Capacitor):
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run in browser**:
   - Start dev server: `npm run dev`
   - Open **http://localhost:5173/app** for the Grama Seva flow (onboarding → dashboard).

3. **Gemini AI** (Vikas Sahayak & Krishi Terminal):
   - Create `.env` in project root with:
     ```
     VITE_GEMINI_API_KEY=your_gemini_api_key
     ```
   - Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Android / iOS (Capacitor)**:
   ```bash
   npm run build
   npx cap add android    # first time only
   npx cap add ios        # first time only
   npx cap sync
   npx cap open android   # or: npx cap open ios
   ```
   Open the project in Android Studio or Xcode and run on device/emulator.

## App entry and flow

- **URL:** `/app` (or `/app/`).
- **First visit:** Multi-step onboarding (Welcome → Mobile → District/Mandal/Village → OTP). Demo OTP: **123456**.
- **After onboarding:** Dashboard with four modules:
  - **Vikas Sahayak** – Chat with Gemini (schemes, Rythu Bandhu, Mission Bhagiratha, etc.).
  - **Krishi Terminal** – Upload soil/crop photo for AI analysis (soil type, NPK, crop suggestions).
  - **Grievance** – New grievance (category, priority, photo), Official Logs feed (localStorage).
  - **Panchayat Directory** – Sarpanch & Ward Members with **Direct Call** and **Leadership Bio**.

## Design (Modern Heritage)

- **Primary:** Royal Maroon `#67001A`.
- **Accents:** Gold/Amber (Welfare), Emerald (Agriculture), Slate (Administration).
- **Typography:** Instrument Serif (headings), Plus Jakarta Sans (body).
- **UI:** GlassCard (glassmorphism), Pochampally-inspired pattern, low-opacity Charminar/Thoranam watermarks.
- **Animations:** `terminalReveal` (0.8s cubic-bezier) on cards/list items.
- **Interaction:** Active state `scale(0.94)` on buttons/links.

## Data and AI

- **Session & grievances:** Stored in **localStorage** (session key: `grama_seva_session`, grievances: `grama_seva_grievances`).
- **Geography:** Telangana hierarchy (districts, mandals, villages) from `src/data/telangana.ts`.
- **AI:** `@google/genai` with model `gemini-2.0-flash`. Vikas Sahayak uses a system instruction with scheme knowledge (Mission Bhagiratha, Rythu Bandhu, Palle Pragathi, Aasara, Grama Jyothi).
- **Disclaimers:** Krishi Terminal shows an agricultural advice disclaimer; State Emblem uses a CSS fallback if the image fails.

## Existing web app

The rest of the app (e.g. `/`, `/login`, `/ward-members`) is unchanged. The Grama Seva flow is self-contained under `/app` and uses its own session in localStorage (no Mocha auth required for `/app`).
