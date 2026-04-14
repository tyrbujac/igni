import 'package:flutter/material.dart';

class SharedState extends ChangeNotifier {
  List<dynamic> cart = [];

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }
}

final shared = SharedState();

void main() {
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555))), home: ProductListScreen()),
  ));
}

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  List<dynamic> products = [{'id': 1, 'name': 'Laptop', 'price': 1200}, {'id': 2, 'name': 'Headphones', 'price': 150}, {'id': 3, 'name': 'Mechanical Keyboard', 'price': 100}];

  void add_to_cart(dynamic product) {
    dynamic existing = shared.cart.cast<dynamic>().firstWhere((item) => item['id'] == product['id'], orElse: () => null);
    if (existing != null) {
      dynamic updated = {'id': existing['id'], 'name': existing['name'], 'price': existing['price'], 'quantity': existing['quantity'] + 1};
      shared.update(() {
        shared.cart = shared.cart.map((e) => e == existing ? updated : e).toList();
      });
    } else {
      dynamic new_item = {'id': product['id'], 'name': product['name'], 'price': product['price'], 'quantity': 1};
      shared.update(() {
        shared.cart = shared.cart + [new_item];
      });
    }
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
                  'Products',
                  style: Theme.of(context).textTheme.headlineLarge!,
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => CartScreen()));
                  },
                  child: const Text('View Cart'),
                ),
              ],
            ),
            for (final product in products) ...[
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      children: [
                        Text(
                          product['name'].toString(),
                          style: Theme.of(context).textTheme.headlineSmall!,
                        ),
                        Text(
                          '\$'.toString() + product['price'].toString(),
                        ),
                      ],
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                      onPressed: () {
                        add_to_cart(product);
                      },
                      child: const Text('Add to Cart'),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
      ),
    );
  }
}

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  int total = 0;

  void remove_item(dynamic target) {
    shared.update(() {
      shared.cart = shared.cart.where((item) => (item['id'] != target['id']) == true).toList();
    });
  }

  dynamic cart_total() {
    dynamic t = 0;
    for (final item in shared.cart) {
      t = t + item['price'] * item['quantity'];
    }
    return t;
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
                  'Your Cart',
                  style: Theme.of(context).textTheme.headlineLarge!,
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: const Text('Back to Shop'),
                ),
              ],
            ),
            if (shared.cart.isEmpty) ...[
              Text(
                'The cart is empty.',
              ),
            ] else ...[
              for (final item in shared.cart) ...[
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        children: [
                          Text(
                            item['name'].toString(),
                            style: Theme.of(context).textTheme.headlineSmall!,
                          ),
                          Text(
                            '\$'.toString() + item['price'].toString().toString() + ' (Qty: '.toString().toString() + item['quantity'].toString().toString() + ')'.toString(),
                          ),
                        ],
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                        onPressed: () {
                          remove_item(item);
                        },
                        child: const Text('Remove'),
                      ),
                    ],
                  ),
                ),
              ],
              const Divider(),
              Text(
                'Total: \$'.toString() + cart_total().toString(),
                style: Theme.of(context).textTheme.headlineSmall!,
              ),
            ],
          ],
        ),
      ),
      ),
    );
  }
}
