import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: AccessScreen()));
}

class AccessScreen extends StatefulWidget {
  const AccessScreen({super.key});

  @override
  State<AccessScreen> createState() => _AccessScreenState();
}

class _AccessScreenState extends State<AccessScreen> {
  bool logged_in = false;
  bool verified = false;
  int age = 0;

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
              'Access Check',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Switch(
              value: logged_in,
              onChanged: (value) {
                setState(() {
                  logged_in = value;
                });
              },
            ),
            const SizedBox(height: 16),
            Switch(
              value: verified,
              onChanged: (value) {
                setState(() {
                  verified = value;
                });
              },
            ),
            const SizedBox(height: 16),
            if (logged_in && verified) ...[
              Text(
                'Full access granted',
              ),
            ] else if (logged_in && !verified) ...[
              Text(
                'Please verify your email',
              ),
            ] else ...[
              Text(
                'Please log in',
              ),
            ],
            const SizedBox(height: 16),
            if (age > 12 || verified) ...[
              Text(
                'Content visible',
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
