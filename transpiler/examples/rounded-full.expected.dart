import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: PillScreen()));
}

class PillScreen extends StatefulWidget {
  const PillScreen({super.key});

  @override
  State<PillScreen> createState() => _PillScreenState();
}

class _PillScreenState extends State<PillScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, borderRadius: BorderRadius.circular(9999)),
                child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      'Follow',
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
              ),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(9999)),
                child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  children: [
                    Text(
                      'AB',
                      style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: Colors.white),
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
