import 'package:flutter/material.dart';

class SharedState extends ChangeNotifier {
  String theme_mode = 'system';

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }
}

final shared = SharedState();


ThemeMode _resolveThemeMode(dynamic mode) {
  if (mode == 'light') return ThemeMode.light;
  if (mode == 'dark') return ThemeMode.dark;
  return ThemeMode.system;
}

void main() {
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF80CBC4)), scaffoldBackgroundColor: const Color(0xFFFFFFFF), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5)), appBarTheme: AppBarTheme(backgroundColor: const Color(0xFFFFFFFF), foregroundColor: const Color(0xFF0D0D14))), darkTheme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF80CBC4), brightness: Brightness.dark), scaffoldBackgroundColor: const Color(0xFF0D0D14), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5)), appBarTheme: AppBarTheme(backgroundColor: const Color(0xFF0D0D14), foregroundColor: const Color(0xFFF5F5F5))), themeMode: _resolveThemeMode(shared.theme_mode), home: HomeScreen()),
  ));
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Hello')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Theme-aware app',
              style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFFF5F5F5) : const Color(0xFF0D0D14))),
            ),
            const SizedBox(height: 16),
            Text(
              'This text flips with the active variant.',
              style: TextStyle(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFFF5F5F5) : const Color(0xFF0D0D14))),
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0D0D14) : const Color(0xFFFFFFFF)), borderRadius: BorderRadius.circular(16)),
              child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'Surface card',
                  ),
                ],
              ),
            ),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
