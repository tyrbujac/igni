import 'package:flutter/material.dart';
import 'dart:async';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: TimestampDemoScreen()));
}

class TimestampDemoScreen extends StatefulWidget {
  const TimestampDemoScreen({super.key});

  @override
  State<TimestampDemoScreen> createState() => _TimestampDemoScreenState();
}

class _TimestampDemoScreenState extends State<TimestampDemoScreen> {
  var opened_at = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
  var current = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
  Timer? _everyTimer0;

  @override
  void initState() {
    super.initState();
    _everyTimer0 = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() {
        current = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
      });
    });
  }

  @override
  void dispose() {
    _everyTimer0?.cancel();
    super.dispose();
  }

  dynamic seconds_open(dynamic start, dynamic t) {
    return t - start;
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
              '$opened_at',
            ),
            const SizedBox(height: 16),
            Text(
              '$current',
            ),
            const SizedBox(height: 16),
            Text(
              (((seconds_open(opened_at, current)) as dynamic)?.toString() ?? ''),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
