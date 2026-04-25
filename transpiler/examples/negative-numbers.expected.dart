import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: NegativeNumbersScreen()));
}

class NegativeNumbersScreen extends StatefulWidget {
  const NegativeNumbersScreen({super.key});

  @override
  State<NegativeNumbersScreen> createState() => _NegativeNumbersScreenState();
}

class _NegativeNumbersScreenState extends State<NegativeNumbersScreen> {
  int temperature = -5;
  List<dynamic> offsets = [-3, -2, -1, 0, 1, 2, 3];
  double scale = -1.5;

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
                'Negative number literals',
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              const SizedBox(height: 16),
              Text(
                'Temperature: '.toString() + temperature.toString().toString() + '°C'.toString(),
              ),
              const SizedBox(height: 16),
              Text(
                'Scale factor: '.toString() + scale.toString(),
              ),
              const SizedBox(height: 16),
              Text(
                'Offsets:',
              ),
              const SizedBox(height: 16),
              for (final (_i, o) in offsets.indexed) ...[
                Text(
                  '$o',
                ),
                if (_i < offsets.length - 1) const SizedBox(height: 16),
              ],
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  setState(() {
                    temperature = temperature + -1;
                  });
                },
                child: const Text('Bump down'),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  setState(() {
                    temperature = -5;
                  });
                },
                child: const Text('Reset to -5'),
              ),
            ],
          ),
        ),
      ),
        ),
      ),
    );
  }
}
