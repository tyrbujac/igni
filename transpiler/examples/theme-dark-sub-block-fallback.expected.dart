import 'package:flutter/material.dart';


ThemeMode _resolveThemeMode(dynamic mode) {
  if (mode == 'light') return ThemeMode.light;
  if (mode == 'dark') return ThemeMode.dark;
  return ThemeMode.system;
}

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF80CBC4)), scaffoldBackgroundColor: const Color(0xFFFFFFFF), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5)), appBarTheme: AppBarTheme(backgroundColor: const Color(0xFFFFFFFF), foregroundColor: const Color(0xFF0D0D14))), darkTheme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF80CBC4), brightness: Brightness.dark), scaffoldBackgroundColor: const Color(0xFF0D0D14), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5)), appBarTheme: AppBarTheme(backgroundColor: const Color(0xFF0D0D14), foregroundColor: const Color(0xFFF5F5F5))), themeMode: _resolveThemeMode("system"), home: HomeScreen()));
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
    // No scaffold: or appbar: sub-blocks — they auto-fall-back to light's
    // declarations (background: surface / foreground: text), and the surviving
    // token references resolve through dark's color palette.

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Sub-block fall-back')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Scaffold uses dark surface in dark mode (sub-block auto-fall-back)',
              style: TextStyle(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFFF5F5F5) : const Color(0xFF0D0D14))),
            ),
            const SizedBox(height: 16),
            Text(
              'AppBar foreground uses dark text in dark mode',
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
