import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'dart:async';

class SharedState extends ChangeNotifier {
  int work_minutes = 25;
  int break_minutes = 5;
  bool sound_on = true;

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }
}

final shared = SharedState();

void main() {
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: PomodonutScreen()),
  ));
}

class PomodonutScreen extends StatefulWidget {
  const PomodonutScreen({super.key});

  @override
  State<PomodonutScreen> createState() => _PomodonutScreenState();
}

class _PomodonutScreenState extends State<PomodonutScreen> {
  String mode = 'work';
  bool running = false;
  int start_time = 0;
  int accumulated = 0;
  var tick = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
  final _audioPlayer = AudioPlayer();
  Timer? _everyTimer0;

  @override
  void initState() {
    super.initState();
    _everyTimer0 = Timer.periodic(const Duration(milliseconds: 1000), (_) {
      if (running) {
        setState(() {
          tick = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
        });
        if ((tick - start_time + accumulated) >= segment_seconds()) {
          if (shared.sound_on) {
            _audioPlayer.play(AssetSource('ding.wav'));
          }
          if (mode == 'work') {
            setState(() {
              mode = 'break';
            });
          } else {
            setState(() {
              mode = 'work';
            });
          }
          setState(() {
            start_time = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
          });
          setState(() {
            accumulated = 0;
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _everyTimer0?.cancel();
    super.dispose();
  }

  dynamic segment_seconds() {
    if (mode == 'work') {
      return shared.work_minutes * 60;
    }
    return shared.break_minutes * 60;
  }

  dynamic segment_label() {
    if (mode == 'work') {
      return 'Work';
    }
    return 'Break';
  }

  dynamic segment_color() {
    if (mode == 'work') {
      return 'brand';
    }
    return 'green';
  }

  dynamic remaining() {
    dynamic elapsed = accumulated;
    if (running) {
      elapsed = accumulated + tick - start_time;
    }
    dynamic left = segment_seconds() - elapsed;
    if (left < 0) {
      return 0;
    }
    return left;
  }

  void start() {
    setState(() {
      start_time = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
    });
    setState(() {
      tick = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
    });
    setState(() {
      running = true;
    });
  }

  void pause() {
    setState(() {
      accumulated = accumulated + (DateTime.now().millisecondsSinceEpoch ~/ 1000) - start_time;
    });
    setState(() {
      running = false;
    });
  }

  void reset() {
    setState(() {
      running = false;
    });
    setState(() {
      accumulated = 0;
    });
    setState(() {
      start_time = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
    });
    setState(() {
      tick = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
    });
  }

  dynamic format_time(dynamic s) {
    dynamic m = (s / 60).floor();
    dynamic sec = s - m * 60;
    return (((pad(m)) as dynamic)?.toString() ?? '') + ':'.toString().toString() + (((pad(sec)) as dynamic)?.toString() ?? '');
  }

  dynamic pad(dynamic n) {
    if (n < 10) {
      return '0'.toString() + (((n.toStringAsFixed(0)) as dynamic)?.toString() ?? '');
    }
    return n.toStringAsFixed(0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Pomodonut')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                (((segment_label()) as dynamic)?.toString() ?? ''),
                style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: _igniColorValue(context, segment_color())),
              ),
              const SizedBox(height: 24),
              Text(
                (((format_time(remaining())) as dynamic)?.toString() ?? ''),
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              const SizedBox(height: 24),
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (running) ...[
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.grey, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                        onPressed: () {
                          pause();
                        },
                        child: const Text('Pause'),
                      ),
                    ] else ...[
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                        onPressed: () {
                          start();
                        },
                        child: const Text('Start'),
                      ),
                    ],
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
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => SettingsScreen()));
                },
                child: const Text('Settings'),
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

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Settings')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Work duration (minutes)',
              style: Theme.of(context).textTheme.bodyLarge!,
            ),
            const SizedBox(height: 24),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Slider(
                    key: const ValueKey("shared.work_minutes"),
                    value: shared.work_minutes.toDouble(),
                    min: 1.toDouble(),
                    max: 60.toDouble(),
                    onChanged: (value) {
                      shared.update(() {
                        shared.work_minutes = value.round();
                      });
                    },
                  ),
                  const SizedBox(width: 16),
                  Text(
                    (((shared.work_minutes) as dynamic)?.toString() ?? ''),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Break duration (minutes)',
              style: Theme.of(context).textTheme.bodyLarge!,
            ),
            const SizedBox(height: 24),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Slider(
                    key: const ValueKey("shared.break_minutes"),
                    value: shared.break_minutes.toDouble(),
                    min: 1.toDouble(),
                    max: 30.toDouble(),
                    onChanged: (value) {
                      shared.update(() {
                        shared.break_minutes = value.round();
                      });
                    },
                  ),
                  const SizedBox(width: 16),
                  Text(
                    (((shared.break_minutes) as dynamic)?.toString() ?? ''),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SwitchListTile(
              key: const ValueKey("shared.sound_on"),
              value: shared.sound_on,
              title: Text('Sound'),
              onChanged: (value) {
                shared.update(() {
                  shared.sound_on = value;
                });
              },
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('Back'),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}

Color _igniColorValue(BuildContext context, dynamic value) {
  if (value is Color) return value;
  switch (value) {
    case 'brand': return Theme.of(context).colorScheme.primary;
    case 'subtle': return Colors.grey;
    case 'danger': return Colors.red;
    case 'green': return Colors.green;
    case 'red': return Colors.red;
    case 'blue': return Colors.blue;
    case 'white': return Colors.white;
    case 'black': return Colors.black;
    case 'yellow': return Colors.yellow;
    case 'orange': return Colors.orange;
    case 'purple': return Colors.purple;
    case 'teal': return Colors.teal;
    case 'card':
      throw FlutterError('Igni: `card` is background-only. Use it with `background:`, not `color:`.');
    default:
      return Colors.grey;
  }
}

Color _igniBackgroundValue(BuildContext context, dynamic value) {
  if (value is Color) return value;
  switch (value) {
    case 'card': return Theme.of(context).cardColor;
    case 'brand': return Theme.of(context).colorScheme.primary;
    case 'subtle': return Colors.grey;
    case 'danger': return Colors.red;
    case 'green': return Colors.green;
    case 'red': return Colors.red;
    case 'blue': return Colors.blue;
    case 'white': return Colors.white;
    case 'black': return Colors.black;
    case 'yellow': return Colors.yellow;
    case 'orange': return Colors.orange;
    case 'purple': return Colors.purple;
    case 'teal': return Colors.teal;
    default:
      return Theme.of(context).cardColor;
  }
}
