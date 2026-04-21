import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 16))), home: ShopScreen()));
}

class Entry extends StatelessWidget {
  final dynamic item;
  const Entry({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    final dynamic label_text = item['name'].toString() + ': \$'.toString().toString() + item['price'].toString();
    return Container(
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
      child: Padding(
      padding: const EdgeInsets.all(8),
      child: Row(
        children: [
          Text(
            '$label_text',
          ),
        ],
      ),
    ),
    );
  }
}

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  List<dynamic> items = [{'name': 'Apples', 'price': 3}, {'name': 'Bread', 'price': 2}];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            for (final item in items) ...[
              Entry(item: item),
            ],
          ],
        ),
      ),
      ),
    );
  }
}
