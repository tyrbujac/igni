import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: GapEachScreen()));
}

class GapEachScreen extends StatefulWidget {
  const GapEachScreen({super.key});

  @override
  State<GapEachScreen> createState() => _GapEachScreenState();
}

class _GapEachScreenState extends State<GapEachScreen> {
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
              'Vertical gap between each iterations',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Column(
              children: [
                for (final (_i, n) in [1, 2, 3].indexed) ...[
                  Text(
                    '$n',
                  ),
                  if (_i < [1, 2, 3].length - 1) const SizedBox(height: 16),
                ],
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Horizontal gap between each iterations',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                for (final (_i, m) in [1, 2, 3].indexed) ...[
                  Text(
                    '$m',
                  ),
                  if (_i < [1, 2, 3].length - 1) const SizedBox(width: 8),
                ],
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Duplicate-element list (the bug-class fixed)',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Column(
              children: [
                for (final (_i, x) in [7, 7, 7].indexed) ...[
                  Text(
                    '$x',
                  ),
                  if (_i < [7, 7, 7].length - 1) const SizedBox(height: 8),
                ],
              ],
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
