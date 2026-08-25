// Grama Seva – Flutter theme (Telangana State colours)
// Use with MaterialApp: theme: GramaSevaTheme.light, darkTheme: GramaSevaTheme.dark

import 'package:flutter/material.dart';

class GramaSevaColors {
  static const Color maroon = Color(0xFF67001A);
  static const Color maroonLight = Color(0xFF8B0026);
  static const Color gold = Color(0xFFC9A227);
  static const Color goldLight = Color(0xFFE5B82E);
  static const Color green = Color(0xFF166534);
  static const Color greenLight = Color(0xFF15803d);
  static const Color sidebar = Color(0xFF0a1f14);
  static const Color sidebarAccent = Color(0xFF0f2d1f);
}

class GramaSevaTheme {
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: GramaSevaColors.maroon,
      colorScheme: ColorScheme.light(
        primary: GramaSevaColors.maroon,
        primaryContainer: GramaSevaColors.maroonLight,
        secondary: GramaSevaColors.gold,
        secondaryContainer: GramaSevaColors.goldLight,
        tertiary: GramaSevaColors.green,
        surface: Colors.white,
        surfaceContainerHighest: const Color(0xFFf8faf8),
        error: const Color(0xFFb91c1c),
        onPrimary: Colors.white,
        onSecondary: const Color(0xFF0f172a),
        onSurface: const Color(0xFF0f172a),
        onSurfaceVariant: const Color(0xFF475569),
        outline: const Color(0xFF166534).withOpacity(0.12),
      ),
      scaffoldBackgroundColor: const Color(0xFFf8faf8),
      fontFamily: 'PlusJakartaSans',
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontFamily: 'InstrumentSerif',
          fontWeight: FontWeight.w800,
          fontStyle: FontStyle.italic,
          color: Color(0xFF0f172a),
        ),
        headlineMedium: TextStyle(
          fontFamily: 'InstrumentSerif',
          fontWeight: FontWeight.w800,
          fontStyle: FontStyle.italic,
          color: Color(0xFF0f172a),
        ),
        bodyLarge: TextStyle(color: Color(0xFF0f172a), fontWeight: FontWeight.w500),
        bodyMedium: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.w500),
        labelLarge: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.1),
      ).apply(bodyColor: const Color(0xFF0f172a)),
      appBarTheme: const AppBarTheme(
        backgroundColor: GramaSevaColors.maroon,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: GramaSevaColors.maroon,
          foregroundColor: Colors.white,
          elevation: 4,
          shadowColor: GramaSevaColors.maroon.withOpacity(0.3),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w700,
            letterSpacing: 0.2,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: GramaSevaColors.maroon,
          side: const BorderSide(color: GramaSevaColors.maroon),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        ),
      ),
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 8,
        shadowColor: GramaSevaColors.green.withOpacity(0.08),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(40)),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: GramaSevaColors.maroon, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      ),
    );
  }

  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: GramaSevaColors.maroonLight,
      colorScheme: ColorScheme.dark(
        primary: const Color(0xFF8B0026),
        primaryContainer: const Color(0xFFA31233),
        secondary: GramaSevaColors.goldLight,
        secondaryContainer: const Color(0xFFF0C84A),
        tertiary: const Color(0xFF15803d),
        surface: GramaSevaColors.sidebarAccent,
        surfaceContainerHighest: GramaSevaColors.sidebar,
        error: const Color(0xFFef4444),
        onPrimary: Colors.white,
        onSecondary: GramaSevaColors.sidebar,
        onSurface: const Color(0xFFf1f5f9),
        onSurfaceVariant: const Color(0xFF94a3b8),
        outline: GramaSevaColors.gold.withOpacity(0.15),
      ),
      scaffoldBackgroundColor: GramaSevaColors.sidebar,
      fontFamily: 'PlusJakartaSans',
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontFamily: 'InstrumentSerif',
          fontWeight: FontWeight.w800,
          fontStyle: FontStyle.italic,
          color: Color(0xFFf1f5f9),
        ),
        bodyLarge: TextStyle(color: Color(0xFFe2e8f0), fontWeight: FontWeight.w500),
        bodyMedium: TextStyle(color: Color(0xFF94a3b8), fontWeight: FontWeight.w500),
      ).apply(bodyColor: const Color(0xFFf1f5f9)),
      appBarTheme: const AppBarTheme(
        backgroundColor: GramaSevaColors.sidebar,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF8B0026),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        ),
      ),
      cardTheme: CardTheme(
        color: GramaSevaColors.sidebarAccent,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(40)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: GramaSevaColors.sidebarAccent,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide(color: GramaSevaColors.goldLight, width: 2),
        ),
      ),
    );
  }
}
