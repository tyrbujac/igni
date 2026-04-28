import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'dart:async';

int? _igniMockedNow;

void main() {
  testWidgets("freeze_time block keeps now() stable; advance moves both clocks", (tester) async {
    _igniMockedNow = null;
    {
      final _prevMockedNow = _igniMockedNow;
      _igniMockedNow = DateTime.parse("2026-04-28T12:00:00Z").toUtc().millisecondsSinceEpoch ~/ 1000;
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: StopwatchScreen()));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 1000));
    if (_igniMockedNow != null) _igniMockedNow = _igniMockedNow! + (1000 ~/ 1000);
    await tester.pump();
    expect(find.text("Elapsed:"), findsAtLeastNWidgets(1));
      _igniMockedNow = _prevMockedNow;
    }
  });
}

class StopwatchScreen extends StatefulWidget {
  const StopwatchScreen({super.key});

  @override
  State<StopwatchScreen> createState() => _StopwatchScreenState();
}

class _StopwatchScreenState extends State<StopwatchScreen> {
  var start = (_igniMockedNow ?? (DateTime.now().millisecondsSinceEpoch ~/ 1000));
  var tick = (_igniMockedNow ?? (DateTime.now().millisecondsSinceEpoch ~/ 1000));
  Timer? _everyTimer0;

  @override
  void initState() {
    super.initState();
    _everyTimer0 = Timer.periodic(const Duration(milliseconds: 1000), (_) {
      setState(() {
        tick = (_igniMockedNow ?? (DateTime.now().millisecondsSinceEpoch ~/ 1000));
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
              'Elapsed: '.toString() + (((tick - start) as dynamic)?.toString() ?? '').toString() + 's'.toString(),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
