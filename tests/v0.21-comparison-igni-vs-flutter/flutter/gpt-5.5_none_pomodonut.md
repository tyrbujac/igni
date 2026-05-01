```dart
import 'dart:async';

import 'package:flutter/material.dart';

void main() => runApp(const PomodonutApp());

class PomodonutApp extends StatefulWidget {
  const PomodonutApp({super.key});

  @override
  State<PomodonutApp> createState() => _PomodonutAppState();
}

class _PomodonutAppState extends State<PomodonutApp> {
  late final PomodoroSettings settings = PomodoroSettings();

  @override
  void dispose() {
    settings.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppSettingsScope(
      settings: settings,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Pomodonut',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepOrange),
          useMaterial3: true,
        ),
        home: const PomodoroScreen(),
      ),
    );
  }
}

class PomodoroSettings extends ChangeNotifier {
  int _workMinutes = 25;
  int _breakMinutes = 5;
  bool _soundOn = true;

  int get workMinutes => _workMinutes;
  int get breakMinutes => _breakMinutes;
  bool get soundOn => _soundOn;

  void setWorkMinutes(int value) {
    final clamped = value.clamp(1, 60);
    if (_workMinutes == clamped) return;
    _workMinutes = clamped;
    notifyListeners();
  }

  void setBreakMinutes(int value) {
    final clamped = value.clamp(1, 30);
    if (_breakMinutes == clamped) return;
    _breakMinutes = clamped;
    notifyListeners();
  }

  void setSoundOn(bool value) {
    if (_soundOn == value) return;
    _soundOn = value;
    notifyListeners();
  }
}

class AppSettingsScope extends InheritedNotifier<PomodoroSettings> {
  const AppSettingsScope({
    super.key,
    required PomodoroSettings settings,
    required super.child,
  }) : super(notifier: settings);

  static PomodoroSettings of(BuildContext context) {
    final scope =
        context.dependOnInheritedWidgetOfExactType<AppSettingsScope>();
    assert(scope != null, 'No AppSettingsScope found in context.');
    return scope!.notifier!;
  }
}

enum PomodoroSegment {
  work,
  rest,
}

class PomodoroScreen extends StatefulWidget {
  const PomodoroScreen({super.key});

  @override
  State<PomodoroScreen> createState() => _PomodoroScreenState();
}

class _PomodoroScreenState extends State<PomodoroScreen> {
  PomodoroSegment _segment = PomodoroSegment.work;
  int _remainingSeconds = 25 * 60;
  bool _isRunning = false;
  Timer? _timer;

  late PomodoroSettings _settings;
  bool _initializedSettings = false;
  int _lastWorkSeconds = 25 * 60;
  int _lastBreakSeconds = 5 * 60;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    _settings = AppSettingsScope.of(context);

    final newWorkSeconds = _settings.workMinutes * 60;
    final newBreakSeconds = _settings.breakMinutes * 60;

    if (!_initializedSettings) {
      _remainingSeconds = _durationForSegment(_segment);
      _initializedSettings = true;
    } else {
      final currentSegmentDurationChanged =
          (_segment == PomodoroSegment.work &&
              _lastWorkSeconds != newWorkSeconds) ||
          (_segment == PomodoroSegment.rest &&
              _lastBreakSeconds != newBreakSeconds);

      if (currentSegmentDurationChanged) {
        _remainingSeconds = _durationForSegment(_segment);
      }
    }

    _lastWorkSeconds = newWorkSeconds;
    _lastBreakSeconds = newBreakSeconds;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  int _durationForSegment(PomodoroSegment segment) {
    return segment == PomodoroSegment.work
        ? _settings.workMinutes * 60
        : _settings.breakMinutes * 60;
  }

  String get _segmentLabel {
    return _segment == PomodoroSegment.work ? 'Work' : 'Break';
  }

  String _formatTime(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:'
        '${seconds.toString().padLeft(2, '0')}';
  }

  void _toggleTimer() {
    if (_isRunning) {
      _pauseTimer();
    } else {
      _startTimer();
    }
  }

  void _startTimer() {
    if (_timer?.isActive ?? false) return;

    setState(() {
      _isRunning = true;
    });

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;

      if (_remainingSeconds <= 1) {
        final nextSegment = _segment == PomodoroSegment.work
            ? PomodoroSegment.rest
            : PomodoroSegment.work;

        setState(() {
          _segment = nextSegment;
          _remainingSeconds = _durationForSegment(nextSegment);
        });

        if (_settings.soundOn) {
          _playDing();
        }
      } else {
        setState(() {
          _remainingSeconds--;
        });
      }
    });
  }

  void _pauseTimer() {
    _timer?.cancel();
    _timer = null;

    setState(() {
      _isRunning = false;
    });
  }

  void _resetTimer() {
    _timer?.cancel();
    _timer = null;

    setState(() {
      _isRunning = false;
      _remainingSeconds = _durationForSegment(_segment);
    });
  }

  void _playDing() {
    // Placeholder for playing assets/ding.wav.
    // With an audio package, this is where playback would be triggered.
    debugPrint('Ding! assets/ding.wav');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pomodonut'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              Text(
                _segmentLabel,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                _formatTime(_remainingSeconds),
                style: theme.textTheme.displayLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  fontFeatures: const [],
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton(
                    onPressed: _toggleTimer,
                    child: Text(_isRunning ? 'Pause' : 'Start'),
                  ),
                  const SizedBox(width: 16),
                  OutlinedButton(
                    onPressed: _resetTimer,
                    child: const Text('Reset'),
                  ),
                ],
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const SettingsScreen(),
                      ),
                    );
                  },
                  child: const Text('Settings'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = AppSettingsScope.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              DurationSliderRow(
                label: 'Work duration',
                value: settings.workMinutes,
                min: 1,
                max: 60,
                onChanged: settings.setWorkMinutes,
              ),
              const SizedBox(height: 20),
              DurationSliderRow(
                label: 'Break duration',
                value: settings.breakMinutes,
                min: 1,
                max: 30,
                onChanged: settings.setBreakMinutes,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Sound',
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                  Text(settings.soundOn ? 'On' : 'Off'),
                  const SizedBox(width: 12),
                  Switch(
                    value: settings.soundOn,
                    onChanged: settings.setSoundOn,
                  ),
                ],
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Back'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DurationSliderRow extends StatelessWidget {
  const DurationSliderRow({
    super.key,
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.onChanged,
  });

  final String label;
  final int value;
  final int min;
  final int max;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 130,
          child: Text(
            label,
            style: const TextStyle(fontSize: 16),
          ),
        ),
        Expanded(
          child: Slider(
            value: value.toDouble(),
            min: min.toDouble(),
            max: max.toDouble(),
            divisions: max - min,
            label: '$value min',
            onChanged: (newValue) => onChanged(newValue.round()),
          ),
        ),
        SizedBox(
          width: 56,
          child: Text(
            '$value min',
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }
}
```