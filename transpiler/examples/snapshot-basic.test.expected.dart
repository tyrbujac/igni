import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

int? _igniMockedNow;

void main() {
  testWidgets("greeting renders snapshot", (tester) async {
    _igniMockedNow = null;
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: GreetingScreen()));
    await tester.pump();
    // snapshot "greeting_loaded" — Session 2 stub; Session 3 lands the text-tree serializer.
  });
}

class GreetingScreen extends StatefulWidget {
  const GreetingScreen({super.key});

  @override
  State<GreetingScreen> createState() => _GreetingScreenState();
}

class _GreetingScreenState extends State<GreetingScreen> {
  String name = 'Tyr';

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
              'Hello, '.toString() + (((name) as dynamic)?.toString() ?? ''),
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
