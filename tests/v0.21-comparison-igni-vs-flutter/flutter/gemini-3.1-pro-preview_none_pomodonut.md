```dart
import 'dart:async';
import 'package:flutter/material.dart';

void main() => runApp(const PomodoroApp());

/// Shared state controller for the Pomodoro App
class PomodoroController extends ChangeNotifier {
  int workDurationMinutes = 25;
  int breakDurationMinutes = 5;
  bool soundEnabled = true;

  bool isWorkSegment = true;
  late int remainingSeconds;
  bool isRunning = false;
  Timer? _timer;

  PomodoroController() {
    remainingSeconds = workDurationMinutes * 60;
  }

  void toggleTimer() {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }

  void start() {
    isRunning = true;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), _tick);
    notifyListeners();
  }

  void pause() {
    isRunning = false;
    _timer?.cancel();
    notifyListeners();
  }

  void reset() {
    pause();
    remainingSeconds = (isWorkSegment ? workDurationMinutes : breakDurationMinutes) * 60;
    notifyListeners();
  }

  void _tick(Timer timer) {
    if (remainingSeconds > 0) {
      remainingSeconds--;
    } else {
      // Countdown reached zero -> swap segments
      isWorkSegment = !isWorkSegment;
      remainingSeconds = (isWorkSegment ? workDurationMinutes : breakDurationMinutes) * 60;
      if (soundEnabled) {
        _playSound();
      }
    }
    notifyListeners();
  }

  void _playSound() {
    // Placeholder for playing ding.wav
    // Assuming an audio package is used here, e.g.:
    // AudioPlayer().play(AssetSource('ding.wav'));
    debugPrint("DING! Playing ding.wav");
  }

  void updateWorkDuration(int mins) {
    workDurationMinutes = mins;
    // Update the current timer if we are stopped and in the work segment
    if (!isRunning && isWorkSegment) {
      remainingSeconds = workDurationMinutes * 60;
    }
    notifyListeners();
  }

  void updateBreakDuration(int mins) {
    breakDurationMinutes = mins;
    // Update the current timer if we are stopped and in the break segment
    if (!isRunning && !isWorkSegment) {
      remainingSeconds = breakDurationMinutes * 60;
    }
    notifyListeners();
  }

  void setSoundEnabled(bool val) {
    soundEnabled = val;
    notifyListeners();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

class PomodoroApp extends StatefulWidget {
  const PomodoroApp({super.key});

  @override
  State<PomodoroApp> createState() => _PomodoroAppState();
}

class _PomodoroAppState extends State<PomodoroApp> {
  final PomodoroController _controller = PomodoroController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pomodonut',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepOrange),
        useMaterial3: true,
      ),
      home: TimerScreen(controller: _controller),
    );
  }
}

class TimerScreen extends StatelessWidget {
  final PomodoroController controller;

  const TimerScreen({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pomodonut'),
        centerTitle: true,
      ),
      body: AnimatedBuilder(
        animation: controller,
        builder: (context, child) {
          final minutes = (controller.remainingSeconds ~/ 60).toString().padLeft(2, '0');
          final seconds = (controller.remainingSeconds % 60).toString().padLeft(2, '0');

          return Column(
            children: [
              const Spacer(),
              // Segment Label
              Text(
                controller.isWorkSegment ? 'Work' : 'Break',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: controller.isWorkSegment ? Colors.deepOrange : Colors.green,
                ),
              ),
              const SizedBox(height: 16),
              // Countdown Timer
              Text(
                '$minutes:$seconds',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  fontSize: 80,
                  fontWeight: FontWeight.w300,
                ),
              ),
              const SizedBox(height: 48),
              // Controls
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton.icon(
                    onPressed: controller.toggleTimer,
                    icon: Icon(controller.isRunning ? Icons.pause : Icons.play_arrow),
                    label: Text(controller.isRunning ? 'Pause' : 'Start'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                      textStyle: const TextStyle(fontSize: 18),
                    ),
                  ),
                  const SizedBox(width: 16),
                  OutlinedButton.icon(
                    onPressed: controller.reset,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reset'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                      textStyle: const TextStyle(fontSize: 18),
                    ),
                  ),
                ],
              ),
              const Spacer(),
              // Settings Button
              Padding(
                padding: const EdgeInsets.only(bottom: 32.0),
                child: TextButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => SettingsScreen(controller: controller),
                      ),
                    );
                  },
                  icon: const Icon(Icons.settings),
                  label: const Text('Settings', style: TextStyle(fontSize: 16)),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  final PomodoroController controller;

  const SettingsScreen({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: AnimatedBuilder(
        animation: controller,
        builder: (context, child) {
          return Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Work Duration Slider
                Text(
                  'Work Duration: ${controller.workDurationMinutes} min',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Slider(
                  value: controller.workDurationMinutes.toDouble(),
                  min: 1,
                  max: 60,
                  divisions: 59,
                  label: controller.workDurationMinutes.toString(),
                  onChanged: (val) => controller.updateWorkDuration(val.toInt()),
                ),
                const SizedBox(height: 32),

                // Break Duration Slider
                Text(
                  'Break Duration: ${controller.breakDurationMinutes} min',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Slider(
                  value: controller.breakDurationMinutes.toDouble(),
                  min: 1,
                  max: 30,
                  divisions: 29,
                  label: controller.breakDurationMinutes.toString(),
                  onChanged: (val) => controller.updateBreakDuration(val.toInt()),
                ),
                const SizedBox(height: 32),

                // Sound Toggle
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Play sound on complete'),
                  subtitle: const Text('Plays ding.wav when segment ends'),
                  value: controller.soundEnabled,
                  onChanged: controller.setSoundEnabled,
                ),
                const Spacer(),

                // Back Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Back', style: TextStyle(fontSize: 18)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
```