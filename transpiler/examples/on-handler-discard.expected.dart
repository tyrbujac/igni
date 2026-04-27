import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: DemoScreen()));
}

class AlertButton extends StatelessWidget {
  final dynamic button_text;
  final void Function(dynamic)? onFire;
  const AlertButton({super.key, required this.button_text, this.onFire});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ElevatedButton(
          style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
          onPressed: () {
            onFire?.call('ignored payload');
          },
          child: Text('$button_text'),
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
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            AlertButton(button_text: 'Alert', onFire: (_) {
              setState(() {
                count = count + 1;
              });
              }),
            const SizedBox(height: 16),
            Text(
              '$count',
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
