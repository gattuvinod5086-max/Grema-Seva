# Where to put your PNG files

Put your image files **inside this folder** (`public`). The app serves them from the site root.

## Folder location

```
GramSeva/
├── public/              ← YOU ARE HERE (put PNGs in this folder)
│   ├── logo.png         ← State emblem
│   ├── thalli.png       ← Telangana Thalli image
│   ├── bg-map.png       ← 33-district map
│   └── README.md        ← this file
├── src/
├── index.html
└── ...
```

**Full path on your computer:**  
`GramSeva/public/`  
(e.g. `Downloads/GramSeva/public/` or wherever your project lives)

---

## File names and where they appear

| Put this file here       | Exact name   | Where it shows in the app |
|-------------------------|-------------|----------------------------|
| `public/logo.png`       | **logo.png**   | Login page, TerminalAuth card emblem, header |
| `public/thalli.png`      | **thalli.png** | Right panel – “తెలంగాణ తల్లి” (Mother Telangana) |
| `public/bg-map.png`      | **bg-map.png** | Right panel – “తెలంగాణ మ్యాప్” (district map) |

---

## Steps

1. Open the **`public`** folder in your project (same folder as this README).
2. Copy your PNG (or JPG) into `public/`.
3. **Rename** it to one of: `logo.png`, `thalli.png`, or `bg-map.png`.
4. Save. Refresh the app (or hard refresh: Ctrl+Shift+R / Cmd+Shift+R).

The app looks for these files first. If a file is missing, it uses a default image from the web instead.
