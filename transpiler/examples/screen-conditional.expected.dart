import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555))), home: GreeterScreen()));
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
      body: SingleChildScrollView(
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
    );
  }
}
