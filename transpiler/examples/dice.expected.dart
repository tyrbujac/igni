import 'package:flutter/material.dart';
import 'dart:math';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 16))), home: DiceRollerScreen()));
}

class DiceRollerScreen extends StatefulWidget {
  const DiceRollerScreen({super.key});

  @override
  State<DiceRollerScreen> createState() => _DiceRollerScreenState();
}

class _DiceRollerScreenState extends State<DiceRollerScreen> {
  int result = 0;
  bool rolled = false;

  void roll() {
    setState(() {
      result = (Random().nextInt(6 - 1 + 1) + 1);
    });
    setState(() {
      rolled = true;
    });
  }

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
              Text(
                'Dice Roller',
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              const SizedBox(height: 16),
              if (rolled) ...[
                Text(
                  'You rolled:',
                  style: Theme.of(context).textTheme.bodyLarge!,
                ),
                Text(
                  '$result',
                  style: Theme.of(context).textTheme.headlineLarge!,
                ),
              ] else ...[
                Text(
                  'Tap Roll to start!',
                  style: Theme.of(context).textTheme.bodyLarge!,
                ),
              ],
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  roll();
                },
                child: const Text('Roll'),
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}
