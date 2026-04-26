import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: CartScreen()));
}

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  List<dynamic> items = [{'name': 'Shoes', 'price': 50}, {'name': 'Hat', 'price': 15}, {'name': 'Shirt', 'price': 30}];

  dynamic total() {
    dynamic sum = 0;
    for (final item in items) {
      sum = sum + item['price'];
    }
    return sum;
  }

  dynamic status() {
    dynamic t = total();
    if (t == 0) {
      return 'Empty cart';
    } else {
      return 'Ready to checkout';
    }
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
              'Cart',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            for (final (_i, item) in items.indexed) ...[
              Text(
                (((item['name']) as dynamic)?.toString() ?? '') + ' - \$'.toString().toString() + (((item['price']) as dynamic)?.toString() ?? ''),
              ),
              if (_i < items.length - 1) const SizedBox(height: 16),
            ],
            const SizedBox(height: 16),
            Text(
              'Total: \$'.toString() + (((total()) as dynamic)?.toString() ?? ''),
            ),
            const SizedBox(height: 16),
            Text(
              (((status()) as dynamic)?.toString() ?? ''),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
