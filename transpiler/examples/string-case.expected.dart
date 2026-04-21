import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 16))), home: StringCaseScreen()));
}

class StringCaseScreen extends StatefulWidget {
  const StringCaseScreen({super.key});

  @override
  State<StringCaseScreen> createState() => _StringCaseScreenState();
}

class _StringCaseScreenState extends State<StringCaseScreen> {
  String level = 'critical';
  String title = 'Hello World';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              level.toString().toUpperCase().toString(),
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Text(
              title.toString().toLowerCase().toString(),
              style: Theme.of(context).textTheme.bodyLarge!,
            ),
            const SizedBox(height: 16),
            Text(
              'info'.toString().toUpperCase().toString(),
              style: TextStyle(color: Colors.green),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                setState(() {
                  level = level.toString().toUpperCase();
                });
              },
              child: const Text('Shout'),
            ),
          ],
        ),
      ),
      ),
    );
  }
}
