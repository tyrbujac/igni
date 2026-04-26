import 'package:flutter/material.dart';
import 'dart:async';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: PomodonutScreen()));
}

class PomodonutScreen extends StatefulWidget {
  const PomodonutScreen({super.key});

  @override
  State<PomodonutScreen> createState() => _PomodonutScreenState();
}

class _PomodonutScreenState extends State<PomodonutScreen> {
  int duration = 1500;
  int start_time = 0;
  bool running = false;
  var tick = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
  Timer? _everyTimer0;

  @override
  void initState() {
    super.initState();
    _everyTimer0 = Timer.periodic(const Duration(seconds: 1), (_) {
      if (running) {
        setState(() {
          tick = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
        });
      }
    });
  }

  @override
  void dispose() {
    _everyTimer0?.cancel();
    super.dispose();
  }

  void start() {
    setState(() {
      start_time = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
    });
    setState(() {
      tick = start_time;
    });
    setState(() {
      running = true;
    });
  }

  void pause() {
    setState(() {
      running = false;
    });
  }

  void reset() {
    setState(() {
      running = false;
    });
    setState(() {
      start_time = 0;
    });
    setState(() {
      tick = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
    });
  }

  dynamic remaining(dynamic dur, dynamic s, dynamic t) {
    if (s == 0) {
      return dur;
    }
    dynamic elapsed = t - s;
    if (elapsed >= dur) {
      return 0;
    }
    return dur - elapsed;
  }

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
                (((remaining(duration, start_time, tick)) as dynamic)?.toString() ?? ''),
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      start();
                    },
                    child: const Text('Start'),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      pause();
                    },
                    child: const Text('Pause'),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.grey, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      reset();
                    },
                    child: const Text('Reset'),
                  ),
                ],
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
