```dart
import 'dart:async';
import 'package:flutter/material.dart';

void main() => runApp(const PomodonutApp());

class PomodoroState extends ChangeNotifier {
  int workMinutes = 25;
  int breakMinutes = 5;
  bool soundOn = true;

  void setWork(int v) {
    workMinutes = v;
    notifyListeners();
  }

  void setBreak(int v) {
    breakMinutes = v;
    notifyListeners();
  }

  void setSound(bool v) {
    soundOn = v;
    notifyListeners();
  }
}

final PomodoroState appState = PomodoroState();

class PomodonutApp extends StatelessWidget {
  const PomodonutApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pomodonut',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepOrange),
        useMaterial3: true,
      ),
      home: const TimerScreen(),
    );
  }
}

void playDing() {
  // Placeholder: assume ding.wav playback. Intentionally a no-op.
}

class TimerScreen extends StatefulWidget {
  const TimerScreen({super.key});

  @override
  State<TimerScreen> createState() => _TimerScreenState();
}

class _TimerScreenState extends State<TimerScreen> {
  Timer? _timer;
  bool _isRunning = false;
  bool _isWork = true;
  late int _secondsLeft;

  @override
  void initState() {
    super.initState();
    _secondsLeft = appState.workMinutes * 60;
    appState.addListener(_onStateChanged);
  }

  @override
  void dispose() {
    _timer?.cancel();
    appState.removeListener(_onStateChanged);
    super.dispose();
  }

  void _onStateChanged() {
    if (!_isRunning) {
      setState(() {
        _secondsLeft = _currentSegmentSeconds();
      });
    } else {
      setState(() {});
    }
  }

  int _currentSegmentSeconds() {
    return (_isWork ? appState.workMinutes : appState.breakMinutes) * 60;
  }

  void _toggleStartPause() {
    if (_isRunning) {
      _timer?.cancel();
      setState(() => _isRunning = false);
    } else {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
      setState(() => _isRunning = true);
    }
  }

  void _tick() {
    setState(() {
      if (_secondsLeft > 0) {
        _secondsLeft--;
      }
      if (_secondsLeft == 0) {
        if (appState.soundOn) playDing();
        _isWork = !_isWork;
        _secondsLeft = _currentSegmentSeconds();
      }
    });
  }

  void _reset() {
    _timer?.cancel();
    setState(() {
      _isRunning = false;
      _secondsLeft = _currentSegmentSeconds();
    });
  }

  String _formatTime(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pomodonut')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const SizedBox(height: 40),
            Text(
              _isWork ? 'Work' : 'Break',
              style: Theme.of(context).textTheme.displaySmall,
            ),
            const SizedBox(height: 32),
            Text(
              _formatTime(_secondsLeft),
              style: Theme.of(context).textTheme.displayLarge,
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: _toggleStartPause,
                  child: Text(_isRunning ? 'Pause' : 'Start'),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: _reset,
                  child: const Text('Reset'),
                ),
              ],
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const SettingsScreen()),
                );
              },
              child: const Text('Settings'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Text('Work Duration: ${appState.workMinutes} min',
                style: Theme.of(context).textTheme.titleMedium),
            Slider(
              value: appState.workMinutes.toDouble(),
              min: 1,
              max: 60,
              divisions: 59,
              label: '${appState.workMinutes}',
              onChanged: (v) {
                setState(() {
                  appState.setWork(v.round());
                });
              },
            ),
            const SizedBox(height: 16),
            Text('Break Duration: ${appState.breakMinutes} min',
                style: Theme.of(context).textTheme.titleMedium),
            Slider(
              value: appState.breakMinutes.toDouble(),
              min: 1,
              max: 30,
              divisions: 29,
              label: '${appState.breakMinutes}',
              onChanged: (v) {
                setState(() {
                  appState.setBreak(v.round());
                });
              },
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              title: const Text('Sound'),
              value: appState.soundOn,
              onChanged: (v) {
                setState(() {
                  appState.setSound(v);
                });
              },
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Back'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
```