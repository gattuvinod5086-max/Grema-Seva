/**
 * Grama Seva – React Native theme (Telangana State colours)
 * Use with ThemeProvider or pass to styled components / StyleSheet.
 */

export const TGColors = {
  maroon: '#67001A',
  maroonLight: '#8B0026',
  gold: '#C9A227',
  goldLight: '#E5B82E',
  green: '#166534',
  greenLight: '#15803d',
  sidebar: '#0a1f14',
  sidebarAccent: '#0f2d1f',
} as const;

export const lightTheme = {
  colors: {
    ...TGColors,
    background: '#f8faf8',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    border: 'rgba(22, 101, 52, 0.12)',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    success: '#166534',
    error: '#b91c1c',
    warning: '#C9A227',
    info: '#0ea5e9',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 12,
    md: 16,
    lg: 24,
    glass: 40,
    button: 32,
  },
  typography: {
    fontFamily: {
      heading: 'InstrumentSerif',
      body: 'PlusJakartaSans',
    },
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 20,
      xxl: 24,
      display: 32,
    },
    fontWeight: {
      normal: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      black: '800' as const,
    },
  },
  shadows: {
    card: {
      shadowColor: '#166534',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
    },
    button: {
      shadowColor: '#67001A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
  },
} as const;

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...TGColors,
    background: '#0a1f14',
    surface: '#0f2d1f',
    surfaceElevated: '#142d22',
    border: 'rgba(201, 162, 39, 0.15)',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#E5B82E',
    info: '#38bdf8',
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 8,
    },
    button: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 4,
    },
  },
} as const;

export type GramaSevaTheme = typeof lightTheme;

// Example usage with React Native Paper or custom context:
// const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;
// <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.glass }}>
