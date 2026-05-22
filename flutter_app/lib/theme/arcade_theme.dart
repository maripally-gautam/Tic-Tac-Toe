import 'package:flutter/material';

class ArcadeTheme {
  // Vibrant custom arcade neon palette
  static const Color neonOrange = Color(0xFFFF5722);
  static const Color neonPink = Color(0xFFE91E63);
  static const Color neonLime = Color(0xFF8BC34A);
  static const Color neonCyan = Color(0xFF00BCD4);
  static const Color cosmicDeep = Color(0xFF0A0715);
  static const Color cosmicMedium = Color(0xFF130F26);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: cosmicDeep,
      primaryColor: neonOrange,
      colorScheme: const ColorScheme.dark(
        primary: neonOrange,
        secondary: neonPink,
        tertiary: neonLime,
        background: cosmicDeep,
        surface: cosmicMedium,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.black,
          letterSpacing: -1.2,
          color: Colors.white,
        ),
        titleLarge: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
          color: Colors.white,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Colors.white70,
        ),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: const Color(0xFFFFF5F0),
      primaryColor: neonOrange,
      colorScheme: const ColorScheme.light(
        primary: neonOrange,
        secondary: neonPink,
        tertiary: neonLime,
        background: Color(0xFFFFF5F0),
        surface: Colors.white,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.black,
          letterSpacing: -1.2,
          color: Color(0xFF261204),
        ),
        titleLarge: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
          color: Color(0xFF261204),
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Color(0xFF5C4E43),
        ),
      ),
    );
  }
}
