import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: NotificationsScreen()));
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> notifications = [{'id': 1, 'message': 'Welcome to Igni', 'recency': 0.95}, {'id': 2, 'message': 'Build finished', 'recency': 0.7}, {'id': 3, 'message': 'Reminder: standup at 10am', 'recency': 0.3}];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            for (final (_i, item) in notifications.indexed) ...[
              Row(
                children: [
                  Text(
                    (((item['message']) as dynamic)?.toString() ?? ''),
                  ),
                  const SizedBox(width: 8),
                  TweenAnimationBuilder<double>(
                    tween: Tween<double>(begin: 0.0, end: (item['recency'] * 100).toDouble()),
                    duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 400),
                    curve: Curves.easeOutCubic,
                    builder: (context, value, _) => Text(value.toStringAsFixed(0)),
                  ),
                ],
              ),
              if (_i < notifications.length - 1) const SizedBox(height: 16),
            ],
          ],
        ),
      ),
        ),
      ),
    );
  }
}
