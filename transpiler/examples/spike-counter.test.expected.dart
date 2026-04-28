import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

int? _igniMockedNow;

void main() {
  testWidgets("counter starts at zero", (tester) async {
    _igniMockedNow = null;
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: CounterSpikeScreen()));
    await tester.pump();
    expect(find.text("0"), findsAtLeastNWidgets(1));
  });
}

class CounterSpikeScreen extends StatefulWidget {
  const CounterSpikeScreen({super.key});

  @override
  State<CounterSpikeScreen> createState() => _CounterSpikeScreenState();
}

class _CounterSpikeScreenState extends State<CounterSpikeScreen> {
  int count = 0;

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
              '$count',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                setState(() {
                  count = count + 1;
                });
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
