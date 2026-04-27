import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: BorderFullFeatureScreen()));
}

class BorderFullFeatureScreen extends StatefulWidget {
  const BorderFullFeatureScreen({super.key});

  @override
  State<BorderFullFeatureScreen> createState() => _BorderFullFeatureScreenState();
}

class _BorderFullFeatureScreenState extends State<BorderFullFeatureScreen> {
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
              'All width tokens',
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
                    'thin border (subtle)',
                  ),
                ],
              ),
            ),
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: Theme.of(context).colorScheme.primary, width: 2.0)),
              child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'medium border (brand)',
                  ),
                ],
              ),
            ),
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.red, width: 4.0)),
              child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'thick border (danger)',
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
