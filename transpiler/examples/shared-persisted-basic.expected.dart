import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class SharedState extends ChangeNotifier {
  List<dynamic> cart = <dynamic>[];
  String current_filter = 'all';
  dynamic theme_mode = 'system';
  dynamic font_size = 17;
  dynamic recent_searches = <dynamic>[];

  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    final _raw_theme_mode = _prefs!.getString('theme_mode');
    if (_raw_theme_mode != null) {
      try { shared.theme_mode = jsonDecode(_raw_theme_mode); } catch (_) {}
    }
    final _raw_font_size = _prefs!.getString('font_size');
    if (_raw_font_size != null) {
      try { shared.font_size = jsonDecode(_raw_font_size); } catch (_) {}
    }
    final _raw_recent_searches = _prefs!.getString('recent_searches');
    if (_raw_recent_searches != null) {
      try { shared.recent_searches = jsonDecode(_raw_recent_searches); } catch (_) {}
    }
  }

  void _savePersisted() {
    final prefs = _prefs;
    if (prefs == null) return;
    prefs.setString('theme_mode', jsonEncode(theme_mode));
    prefs.setString('font_size', jsonEncode(font_size));
    prefs.setString('recent_searches', jsonEncode(recent_searches));
  }

  void update(void Function() fn) {
    fn();
    _savePersisted();
    notifyListeners();
  }
}

final shared = SharedState();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SharedState.init();
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: SettingsScreen()),
  ));
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
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
              'Theme: '.toString() + (((shared.theme_mode) as dynamic)?.toString() ?? ''),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                shared.update(() {
                  shared.theme_mode = 'light';
                });
              },
              child: const Text('Light'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                shared.update(() {
                  shared.theme_mode = 'dark';
                });
              },
              child: const Text('Dark'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                shared.update(() {
                  shared.theme_mode = 'system';
                });
              },
              child: const Text('System'),
            ),
            const SizedBox(height: 16),
            Text(
              'Font size: '.toString() + (((shared.font_size) as dynamic)?.toString() ?? ''),
            ),
            const SizedBox(height: 16),
            Slider(
              key: const ValueKey("shared.font_size"),
              value: shared.font_size.toDouble(),
              min: 12.toDouble(),
              max: 24.toDouble(),
              onChanged: (value) {
                shared.update(() {
                  shared.font_size = value.round();
                });
              },
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
