# Login Screen UI Design Prompt

Use this prompt to design or implement the **Grama Seva / Telangana Digital Village** login screen.

---

## Brand & Identity

- **App name:** Grama Seva (గ్రామ సేవ) — Village Service  
- **Tagline:** Digital Governance Portal | Telangana State Government Initiative  
- **Visual identity:** Official Telangana State colours (emblem): **Maroon** (authority), **Gold** (heritage/soil), **Green** (prosperity, peace). Use glassmorphism, clean typography, and subtle landmark motifs (Charminar, Kakatiya Kala Thoranam) as watermarks only.

---

## Layout & Structure

1. **Full-viewport layout**
   - Single scrollable column on mobile; optional two-column on desktop (branding left, form right).
   - Minimum tap targets 44px; spacing generous for readability.

2. **Header / Banner (optional)**
   - Slim bar: Telangana emblem or “తెలంగాణ రాష్ట్రం | Telangana State” with gold/maroon gradient or solid maroon.
   - No heavy gradients; prefer solid TG colours or very subtle gradients.

3. **Hero / Branding block**
   - App logo or wordmark “Grama Seva” in Instrument Serif (or similar serif), italic, maroon or dark slate.
   - Subtitle: “గ్రామ సేవ | Village Service” and “Digital Governance Portal” in Plus Jakarta Sans (or similar sans).
   - Optional: small state map or emblem, low opacity, as background only.

4. **Login card**
   - One clear card (glass or white) containing:
     - Short welcome line (e.g. “Welcome to Digital Village Development”).
     - **Primary CTA:** “Continue with Mobile” — full-width, maroon button, white text, rounded (e.g. 2rem). Icon: smartphone.
     - **Secondary CTA (if backend available):** “Sign in with Google” — outlined or muted style so mobile remains primary.
   - Error state: inline alert below CTAs, red border, icon; link “Continue with Mobile instead” if Google fails.
   - Footer: small text “Google sign-in available when…” when backend is unavailable.

5. **Trust / Scheme teasers (optional)**
   - 2–3 lines or small cards: e.g. Palle Pragathi, Mission Bhagiratha, Rythu Bandhu — icon + one line each. Use TG green/gold/maroon for icons or badges, not rainbow gradients.

6. **Cultural touch**
   - Small “జై తెలంగాణ | Jai Telangana” badge or text near bottom, discreet (e.g. pill with gold/maroon).

---

## Colour Rules

- **Primary action:** Maroon `#67001A`; hover `#8B0026`.
- **Accents:** Gold `#C9A227` for highlights, labels, or secondary buttons; Green `#166534` for success or scheme-related elements.
- **Background:** Light mode: off-white / very light green tint (e.g. `#f8faf8`); optional dot-grid or TG pattern at 4–6% opacity. Dark mode: deep green `#0a1f14` or dark slate; cards slightly lighter.
- **Text:** High contrast: dark slate/black on light; white/off-white on dark. No low-contrast grey on grey.
- **Cards:** White or glass (e.g. 95% white, blur); border subtle (e.g. maroon or green at 5–10% opacity). No thick coloured borders.

---

## Typography

- **Headings:** Instrument Serif (or Georgia), italic for “Grama Seva”.
- **Body & UI:** Plus Jakarta Sans (or system sans), weights 500–700 for labels and buttons.
- **Scale:** One clear H1 (app name), H2 for “Welcome…”, body 16px minimum for inputs and copy.

---

## Behaviour & Copy

- **Primary path:** “Continue with Mobile” → navigates to `/app` (Grama Seva Terminal mobile onboarding).
- **Secondary path:** “Sign in with Google” only if backend is up; show loading state and error with “Continue with Mobile instead” link.
- **Copy tone:** Governmental but friendly; Telugu + English where it adds identity; no jargon.

---

## Accessibility & Tech

- Semantic HTML: one `<h1>`, form or links for actions, `aria-label` on icon-only buttons.
- Focus visible: 2px outline or ring in maroon/gold.
- Prefer 16px base font and no zoom disable on inputs (avoid `maximum-scale=1` on viewport).

---

## Don’ts

- No pink/purple/blue gradients for primary UI; reserve for optional decorative use only.
- No heavy clip-art or busy illustrations; keep background patterns subtle.
- Don’t hide “Continue with Mobile”; it must stay visible as the main entry when backend is down.

---

Use this prompt to generate mockups, Figma specs, or implementation tickets so the login screen stays on-brand and consistent with the Grama Seva Terminal (Telangana) theme.
