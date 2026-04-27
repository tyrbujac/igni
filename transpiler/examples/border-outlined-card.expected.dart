import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: BorderOutlinedCardScreen()));
}

class BorderOutlinedCardScreen extends StatefulWidget {
  const BorderOutlinedCardScreen({super.key});

  @override
  State<BorderOutlinedCardScreen> createState() => _BorderOutlinedCardScreenState();
}

class _BorderOutlinedCardScreenState extends State<BorderOutlinedCardScreen> {
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
              'Outlined card',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey, width: 1.0)),
              child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'Notifications',
                    style: Theme.of(context).textTheme.headlineSmall!,
                  ),
                  Text(
                    'Get alerts when something happens',
                    style: Theme.of(context).textTheme.bodySmall!,
                  ),
                ],
              ),
            ),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
