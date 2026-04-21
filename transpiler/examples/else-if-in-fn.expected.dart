import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 16))), home: GraderScreen()));
}

class GraderScreen extends StatefulWidget {
  const GraderScreen({super.key});

  @override
  State<GraderScreen> createState() => _GraderScreenState();
}

class _GraderScreenState extends State<GraderScreen> {
  int score = 75;

  dynamic grade_for(dynamic n) {
    dynamic result = 'F';
    if (n >= 90) {
      result = 'A';
    } else {
      if (n >= 80) {
        result = 'B';
      } else {
        if (n >= 70) {
          result = 'C';
        } else {
          if (n >= 60) {
            result = 'D';
          }
        }
      }
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Grade: '.toString() + grade_for(score).toString(),
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                setState(() {
                  score = score + 10;
                });
              },
              child: const Text('Raise'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                setState(() {
                  score = score - 10;
                });
              },
              child: const Text('Lower'),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
