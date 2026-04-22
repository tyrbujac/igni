import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: GreeterScreen()));
}

class GreeterScreen extends StatefulWidget {
  const GreeterScreen({super.key});

  @override
  State<GreeterScreen> createState() => _GreeterScreenState();
}

class _GreeterScreenState extends State<GreeterScreen> {
  String name = 'Alex';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
        if (name == 'Alex') ...[
          Text(
            'Welcome back, Alex!',
          ),
        ] else ...[
          Text(
            'Nice to meet you',
          ),
        ],
        ],
      ),
      ),
        ),
      ),
    );
  }
}
