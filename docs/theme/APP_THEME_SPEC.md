# Grama Seva – Complete App Theme (Light + Dark Mode)

Single source of truth for the Telangana-themed Grama Seva app: light and dark mode.

---

## Colour Palette (Official Telangana State Emblem)

| Token | Light mode | Dark mode | Usage |
|-------|------------|-----------|--------|
| **Emblem Green (Primary)** | `#2F6C27` | `#3d8b33` | From seal: outer band, Thoranam, Charminar. Buttons, nav, brand. |
| **Emblem Green light** | `#3d8b33` | `#4a9e3d` | Hover, active primary |
| **Emblem Gold** | `#B8860B` | `#c99a1a` | From seal: outer border, Ashoka Chakra, motto. Accents, borders, icons. |
| **Emblem Gold light** | `#c99a1a` | `#d4a81f` | Gold hover |
| **Maroon (optional)** | `#67001A` | `#8B0026` | Alternate accent if needed |
| **Sidebar / Surface dark** | `#0a1f14` | `#06100b` | Nav, dark panels |
| **Sidebar accent** | `#0f2d1f` | `#0a1f14` | Nav hover/active bg |

### Neutrals

| Token | Light | Dark |
|-------|--------|------|
| **Background** | `#f8faf8` | `#0a1f14` |
| **Surface** | `#ffffff` | `#0f2d1f` |
| **Surface elevated** | `#ffffff` | `#142d22` |
| **Border** | `rgba(22,101,52,0.12)` | `rgba(201,162,39,0.15)` |
| **Text primary** | `#0f172a` | `#f1f5f9` |
| **Text secondary** | `#475569` | `#94a3b8` |
| **Text muted** | `#64748b` | `#64748b` |

### Semantic

| Role | Light | Dark |
|------|--------|------|
| **Success** | `#166534` | `#22c55e` |
| **Error** | `#b91c1c` | `#ef4444` |
| **Warning** | `#C9A227` | `#E5B82E` |
| **Info** | `#0ea5e9` | `#38bdf8` |

---

## Typography

| Role | Font | Light weight | Dark weight |
|------|------|--------------|-------------|
| **Heading** | Instrument Serif, Georgia | — | — |
| **Body** | Plus Jakarta Sans, system-ui | — | — |
| **H1** | heading, italic | 800, `#0f172a` | 800, `#f1f5f9` |
| **H2** | heading, italic | 800, `#0f172a` | 800, `#f1f5f9` |
| **Body** | body | 500, `#0f172a` | 500, `#e2e8f0` |
| **Caption** | body | 600, `#475569` | 600, `#94a3b8` |

---

## Spacing & Radius

- **Base unit:** 4px  
- **Card padding:** 2rem (32px)  
- **Section gap:** 2.5rem (40px)  
- **Radius glass/card:** 2.5rem (40px)  
- **Radius button:** 2rem (32px)  
- **Radius input:** 1.5rem (24px)  

---

## Shadows

- **Light:** `0 25px 50px -12px rgba(22, 101, 52, 0.08)`  
- **Dark:** `0 25px 50px -12px rgba(0, 0, 0, 0.4)`  
- **Button primary:** `0 10px 25px -5px rgba(103, 0, 26, 0.2)`  

---

## Mode Toggle

- Store preference in `localStorage`: key `grama_seva_theme`, values `light` | `dark` | `system`.
- Respect `prefers-color-scheme: dark` when `system`.
- Apply class `dark` on `<html>` or set `data-theme="dark"` for CSS/JS.

See `theme-variables.css` for copy-paste CSS custom properties (light + dark).
