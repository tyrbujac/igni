import 'package:flutter/material.dart';


ThemeMode _resolveThemeMode(dynamic mode) {
  if (mode == 'light') return ThemeMode.light;
  if (mode == 'dark') return ThemeMode.dark;
  return ThemeMode.system;
}

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF80CBC4)), scaffoldBackgroundColor: const Color(0xFFFFFFFF), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), darkTheme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF80CBC4), brightness: Brightness.dark), scaffoldBackgroundColor: const Color(0xFF0D0D14), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), themeMode: _resolveThemeMode("system"), home: HomeScreen()));
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
    // `brand` and `accent` not redeclared — auto-fall-back to light values

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Brand stays #80CBC4 in both modes (auto-fall-back)',
              style: TextStyle(color: const Color(0xFF80CBC4)),
            ),
            const SizedBox(height: 16),
            Text(
              'Accent stays #FF6B35 in both modes (auto-fall-back)',
              style: TextStyle(color: const Color(0xFFFF6B35)),
            ),
            const SizedBox(height: 16),
            Text(
              'Text flips between light and dark',
              style: TextStyle(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFFF5F5F5) : const Color(0xFF0D0D14))),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
