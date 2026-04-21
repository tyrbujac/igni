import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 16))), home: ToggleScreen()));
}

class ToggleScreen extends StatefulWidget {
  const ToggleScreen({super.key});

  @override
  State<ToggleScreen> createState() => _ToggleScreenState();
}

class _ToggleScreenState extends State<ToggleScreen> {
  bool show = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  setState(() {
                    show = !show;
                  });
                },
                child: const Text('Toggle'),
              ),
              const SizedBox(height: 16),
              if (show) ...[
                Text(
                  'Now you see me',
                  style: Theme.of(context).textTheme.headlineLarge!,
                ),
              ] else ...[
                Text(
                  'Gone!',
                  style: Theme.of(context).textTheme.bodySmall!,
                ),
              ],
            ],
          ),
        ),
      ),
      ),
    );
  }
}
