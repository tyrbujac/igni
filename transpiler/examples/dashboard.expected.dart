import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: DashboardScreen()));
}

class StatCard extends StatelessWidget {
  final dynamic title;
  final dynamic value;
  final dynamic icon_name;
  final Widget child;
  const StatCard({super.key, required this.title, required this.value, required this.icon_name, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
      child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$title',
                style: Theme.of(context).textTheme.bodySmall!,
              ),
              Icon(
                icon_name,
                size: 16,
                color: Theme.of(context).colorScheme.primary,
              ),
            ],
          ),
          Text(
            '$value',
            style: Theme.of(context).textTheme.headlineLarge!,
          ),
          child,
        ],
      ),
    ),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int users = 1240;
  String revenue = '\$14,200';
  int orders = 84;
  List<dynamic> activities = [{'text': 'New user registered', 'time': '2m ago'}, {'text': 'Order #4421 shipped', 'time': '15m ago'}, {'text': 'Revenue goal reached', 'time': '1h ago'}];

  void refresh() {
    setState(() {
      activities = [{'text': 'Data refreshed', 'time': 'just now'}] + activities;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Dashboard',
                  style: Theme.of(context).textTheme.headlineLarge!,
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                  onPressed: () {
                    refresh();
                  },
                  child: const Text('Refresh'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                StatCard(
                  title: 'Users',
                  value: users,
                  icon_name: 'users',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                    Chip(
                      label: Text('+12%'),
                      backgroundColor: Colors.green,
                    ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                StatCard(
                  title: 'Revenue',
                  value: revenue,
                  icon_name: 'dollar',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                    Chip(
                      label: Text('Stable'),
                      backgroundColor: Colors.grey,
                    ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                StatCard(
                  title: 'Orders',
                  value: orders,
                  icon_name: 'cart',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                    Chip(
                      label: Text('Active'),
                      backgroundColor: Theme.of(context).colorScheme.primary,
                    ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Column(
              children: [
                Text(
                  'Recent Activity',
                  style: Theme.of(context).textTheme.headlineSmall!,
                ),
                const SizedBox(height: 8),
                for (final event in activities) ...[
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          event['text'].toString(),
                          style: Theme.of(context).textTheme.bodyLarge!,
                        ),
                        Text(
                          event['time'].toString(),
                          style: Theme.of(context).textTheme.bodySmall!,
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
      ),
    );
  }
}
