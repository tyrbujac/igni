import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: HomeScreen()));
}

class Card extends StatelessWidget {
  final dynamic title;
  final Widget child;
  const Card({super.key, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
      child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Text(
            '$title',
            style: Theme.of(context).textTheme.headlineSmall!,
          ),
          child,
        ],
      ),
    ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool dark_mode = false;
  bool notifications = true;

  void logged_out() {
    setState(() {
      dark_mode = false;
    });
  }

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
              'Wrapper Demo',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Card(
              title: 'Settings',
              child: Column(
                children: [
                  Switch(
                    key: const ValueKey("dark_mode"),
                    value: dark_mode,
                    onChanged: (value) {
                      setState(() {
                        dark_mode = value;
                      });
                    },
                  ),
                  const SizedBox(height: 8),
                  Switch(
                    key: const ValueKey("notifications"),
                    value: notifications,
                    onChanged: (value) {
                      setState(() {
                        notifications = value;
                      });
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Card(
              title: 'Account',
              child: Column(
                children: [
                  Text(
                    'user@example.com',
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      logged_out();
                    },
                    child: const Text('Logout'),
                  ),
                ],
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
