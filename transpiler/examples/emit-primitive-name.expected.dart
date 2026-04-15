import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555))), home: DemoScreen()));
}

class Flip extends StatelessWidget {
  final dynamic value;
  final void Function()? onToggle;
  const Flip({super.key, required this.value, this.onToggle});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ElevatedButton(
          style: ElevatedButton.styleFrom(shape: const CircleBorder(), padding: const EdgeInsets.all(16), minimumSize: const Size(48, 48)),
          onPressed: () {
            onToggle?.call();
          },
          child: const Text('flip'),
        ),
        const SizedBox(width: 16),
        Text(
          '$value',
        ),
      ],
    );
  }
}

class DemoScreen extends StatefulWidget {
  const DemoScreen({super.key});

  @override
  State<DemoScreen> createState() => _DemoScreenState();
}

class _DemoScreenState extends State<DemoScreen> {
  bool checked = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Flip(value: checked, onToggle: () {
              setState(() {
                checked = !checked;
              });
              }),
            const SizedBox(height: 16),
            Text(
              '$checked',
            ),
          ],
        ),
      ),
      ),
    );
  }
}
