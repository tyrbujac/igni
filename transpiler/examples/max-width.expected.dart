import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: MaxWidthDemoScreen()));
}

class MaxWidthDemoScreen extends StatefulWidget {
  const MaxWidthDemoScreen({super.key});

  @override
  State<MaxWidthDemoScreen> createState() => _MaxWidthDemoScreenState();
}

class _MaxWidthDemoScreenState extends State<MaxWidthDemoScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'max_width composition rules',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Text(
              '1. Shrink-wrap-then-cap (no fill)',
              style: Theme.of(context).textTheme.bodySmall!,
            ),
            const SizedBox(height: 16),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Container(
              decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
              child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'Capped at 480px',
                  ),
                ],
              ),
            ),
            ),
            ),
            const SizedBox(height: 16),
            Text(
              '2. Cap-then-fill remainder (fill: true, parent wider)',
              style: Theme.of(context).textTheme.bodySmall!,
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 768),
              child: Container(
              decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(16)),
              child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Capped at 768px inside fill',
                  ),
                ],
              ),
            ),
            ),
            ),
            ),
            const SizedBox(height: 16),
            Text(
              '3. Multi-fill siblings, one capped',
              style: Theme.of(context).textTheme.bodySmall!,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 480),
                  child: Container(
                  decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'capped 480',
                      ),
                    ],
                  ),
                ),
                ),
                ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                  decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'uncapped',
                      ),
                    ],
                  ),
                ),
                ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              '4. Box model — cap includes padding/background',
              style: Theme.of(context).textTheme.bodySmall!,
            ),
            const SizedBox(height: 16),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Container(
              decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
              child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Text(
                    '480 outer, 432 inner',
                  ),
                ],
              ),
            ),
            ),
            ),
            const SizedBox(height: 16),
            Text(
              '5. Centered MiCard-style card',
              style: Theme.of(context).textTheme.bodySmall!,
            ),
            const SizedBox(height: 16),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Container(
              decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
              child: Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'MiCard',
                      style: Theme.of(context).textTheme.headlineLarge!,
                    ),
                    Text(
                      '+44 123 456 7890',
                    ),
                  ],
                ),
              ),
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
