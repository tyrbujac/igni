import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 16))), home: StatsScreen()));
}

class Stepper extends StatelessWidget {
  final dynamic value;
  final void Function()? onDecrement;
  final void Function()? onIncrement;
  const Stepper({super.key, required this.value, this.onDecrement, this.onIncrement});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(shape: const CircleBorder(), padding: const EdgeInsets.all(16), minimumSize: const Size(48, 48)),
            onPressed: () {
              onDecrement?.call();
            },
            child: const Text('-'),
          ),
          const SizedBox(width: 16),
          Text(
            '$value',
            style: Theme.of(context).textTheme.headlineLarge!,
          ),
          const SizedBox(width: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(shape: const CircleBorder(), padding: const EdgeInsets.all(16), minimumSize: const Size(48, 48)),
            onPressed: () {
              onIncrement?.call();
            },
            child: const Text('+'),
          ),
        ],
      ),
    );
  }
}

class StatsScreen extends StatefulWidget {
  const StatsScreen({super.key});

  @override
  State<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends State<StatsScreen> {
  int weight = 60;
  int age = 25;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'WEIGHT',
              style: Theme.of(context).textTheme.bodySmall!,
            ),
            const SizedBox(height: 24),
            Stepper(value: weight, onIncrement: () {
              setState(() {
                weight = weight + 1;
              });
              }, onDecrement: () {
              setState(() {
                weight = weight - 1;
              });
              }),
            const SizedBox(height: 24),
            Text(
              'AGE',
              style: Theme.of(context).textTheme.bodySmall!,
            ),
            const SizedBox(height: 24),
            Stepper(value: age, onIncrement: () {
              setState(() {
                age = age + 1;
              });
              }, onDecrement: () {
              setState(() {
                age = age - 1;
              });
              }),
          ],
        ),
      ),
      ),
    );
  }
}
