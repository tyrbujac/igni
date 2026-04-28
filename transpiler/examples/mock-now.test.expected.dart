import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

int? _igniMockedNow;

void main() {
  testWidgets("mock now: fixes timestamp deterministically", (tester) async {
    _igniMockedNow = null;
    _igniMockedNow = DateTime.parse("2026-04-28T12:00:00Z").toUtc().millisecondsSinceEpoch ~/ 1000;
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ClockScreen()));
    await tester.pump();
    expect(find.text("Now:"), findsAtLeastNWidgets(1));
  });
}

class ClockScreen extends StatefulWidget {
  const ClockScreen({super.key});

  @override
  State<ClockScreen> createState() => _ClockScreenState();
}

class _ClockScreenState extends State<ClockScreen> {
  var current = (_igniMockedNow ?? (DateTime.now().millisecondsSinceEpoch ~/ 1000));

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
              'Now: '.toString() + (((current) as dynamic)?.toString() ?? ''),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
