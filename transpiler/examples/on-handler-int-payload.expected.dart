import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: CounterScreen()));
}

class Stepper extends StatelessWidget {
  final dynamic value;
  final void Function(dynamic)? onStep;
  const Stepper({super.key, required this.value, this.onStep});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(shape: const CircleBorder(), padding: const EdgeInsets.all(16), minimumSize: const Size(48, 48)),
            onPressed: () {
              onStep?.call(-1);
            },
            child: const Text('-'),
          ),
          const SizedBox(width: 8),
          Text(
            '$value',
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            style: ElevatedButton.styleFrom(shape: const CircleBorder(), padding: const EdgeInsets.all(16), minimumSize: const Size(48, 48)),
            onPressed: () {
              onStep?.call(1);
            },
            child: const Text('+'),
          ),
        ],
      ),
    );
  }
}

class CounterScreen extends StatefulWidget {
  const CounterScreen({super.key});

  @override
  State<CounterScreen> createState() => _CounterScreenState();
}

class _CounterScreenState extends State<CounterScreen> {
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Count: '.toString() + (((count) as dynamic)?.toString() ?? ''),
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              const SizedBox(height: 16),
              Stepper(value: count, onStep: (d) {
                setState(() {
                  count = (count + d).toInt();
                });
                }),
            ],
          ),
        ),
      ),
        ),
      ),
    );
  }
}
