# Grama Seva – Theme & Design Assets

This folder contains design prompts, theme specs, and ready-to-use theme code for the Grama Seva (Telangana Digital Village) app.

| File | Description |
|------|-------------|
| **LOGIN_UI_DESIGN_PROMPT.md** | Copy-paste design prompt for the Login screen: layout, colours, typography, behaviour, and don’ts. |
| **APP_THEME_SPEC.md** | Full app theme: light + dark palette, typography, spacing, shadows, mode toggle. |
| **theme-variables.css** | CSS custom properties for light and dark mode; use with `data-theme="dark"` or `.dark` on `<html>`. |
| **material-ui-theme.json** | MUI (Material UI) theme: `palette`, `typography`, `shape`, `components` for light and dark. |
| **flutter_theme.dart** | Flutter `ThemeData` (light + dark) with Telangana colours, buttons, cards, inputs. |
| **react-native-theme.ts** | React Native theme object: colours, spacing, radius, typography, shadows; light and dark. |
| **TELANGANA_BACKGROUND_PATTERNS.md** | Ideas for Telangana-themed backgrounds: Pochampally, Charminar, Thoranam, dot grid, etc. |

## Telangana palette (quick reference)

- **Maroon:** `#67001A` (primary actions, brand)
- **Maroon light:** `#8B0026` (hover)
- **Gold:** `#C9A227` (accents, labels)
- **Green:** `#166534` (success, agriculture)
- **Sidebar dark:** `#0a1f14` (nav, dark surfaces)

## Using the theme files

- **Web (React):** Merge `theme-variables.css` into your global CSS and toggle `data-theme="dark"` or class `dark` on `<html>`.
- **MUI:** `import theme from './material-ui-theme.json'` and `createTheme(theme.gramaSevaTheme.light)` (and `.dark` for dark).
- **Flutter:** Add `flutter_theme.dart`, ensure fonts (Instrument Serif, Plus Jakarta Sans) are in `pubspec.yaml`, then `theme: GramaSevaTheme.light`, `darkTheme: GramaSevaTheme.dark`.
- **React Native:** Import `lightTheme` / `darkTheme` and use with your theme context or StyleSheet; optionally add the font families to the project.
