import 'package:flutter/material.dart';
import 'dart:async';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ScrubberScreen()));
}

class ScrubberScreen extends StatefulWidget {
  const ScrubberScreen({super.key});

  @override
  State<ScrubberScreen> createState() => _ScrubberScreenState();
}

class _ScrubberScreenState extends State<ScrubberScreen> {
  int pos = 0;
  Timer? _everyTimer0;

  @override
  void initState() {
    super.initState();
    _everyTimer0 = Timer.periodic(const Duration(milliseconds: 100), (_) {
      setState(() {
        pos = pos + 1;
      });
    });
  }

  @override
  void dispose() {
    _everyTimer0?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              '$pos',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
