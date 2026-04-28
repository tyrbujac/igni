import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: DerivedCountsScreen()));
}

class DerivedCountsScreen extends StatefulWidget {
  const DerivedCountsScreen({super.key});

  @override
  State<DerivedCountsScreen> createState() => _DerivedCountsScreenState();
}

class _DerivedCountsScreenState extends State<DerivedCountsScreen> {
  List<dynamic> items = <dynamic>[{'level': 'critical', 'name': 'A'}, {'level': 'warning', 'name': 'B'}, {'level': 'critical', 'name': 'C'}, {'level': 'info', 'name': 'D'}];

  @override
  Widget build(BuildContext context) {
    var critical = items.where((i) => (i['level'] == 'critical') == true).toList().length;
    var warning = items.where((i) => (i['level'] == 'warning') == true).toList().length;
    var info = items.where((i) => (i['level'] == 'info') == true).toList().length;
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              (((critical) as dynamic)?.toString() ?? '') + ' critical'.toString(),
              style: Theme.of(context).textTheme.headlineSmall!,
            ),
            const SizedBox(height: 16),
            Text(
              (((warning) as dynamic)?.toString() ?? '') + ' warning'.toString(),
            ),
            const SizedBox(height: 16),
            Text(
              (((info) as dynamic)?.toString() ?? '') + ' info'.toString(),
            ),
            const SizedBox(height: 16),
            for (final (_i, item) in items.indexed) ...[
              Text(
                (((item['level'].toString().toUpperCase()) as dynamic)?.toString() ?? '') + ' — '.toString().toString() + (((item['name']) as dynamic)?.toString() ?? ''),
              ),
              if (_i < items.length - 1) const SizedBox(height: 16),
            ],
          ],
        ),
      ),
        ),
      ),
    );
  }
}
