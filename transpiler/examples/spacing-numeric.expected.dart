import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: CardScreen()));
}

class CardScreen extends StatefulWidget {
  const CardScreen({super.key});

  @override
  State<CardScreen> createState() => _CardScreenState();
}

class _CardScreenState extends State<CardScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(32),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
                child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      'Greeting',
                      style: Theme.of(context).textTheme.headlineLarge!,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'A short message that uses fine-grained spacing.',
                      style: Theme.of(context).textTheme.bodyLarge!,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '— With love',
                      style: Theme.of(context).textTheme.bodySmall!,
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
      ),
    );
  }
}
