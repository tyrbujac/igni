import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: ToggleScreen()));
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
