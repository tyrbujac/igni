import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: FindIdentityScreen()));
}

class FindIdentityScreen extends StatefulWidget {
  const FindIdentityScreen({super.key});

  @override
  State<FindIdentityScreen> createState() => _FindIdentityScreenState();
}

class _FindIdentityScreenState extends State<FindIdentityScreen> {
  List<dynamic> fruits = <dynamic>['apple', 'banana', 'cherry'];

  @override
  Widget build(BuildContext context) {
    var found = fruits.cast<dynamic>().firstWhere((e) => e == 'banana', orElse: () => null);
    var missing = fruits.cast<dynamic>().firstWhere((e) => e == 'grape', orElse: () => null);
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              '$found',
            ),
            const SizedBox(height: 8),
            if (missing == null) ...[
              Text(
                'grape not found',
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
