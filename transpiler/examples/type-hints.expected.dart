import 'package:flutter/material.dart';

class SharedState extends ChangeNotifier {
  List<Item> items = [{'name': 'Milk'}, {'name': 'Bread'}];

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }
}

final shared = SharedState();

void main() {
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, home: HomeScreen()),
  ));
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String title = 'Shopping';
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              '$title',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Text(
              '$count',
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  setState(() {
                    count = count + 1;
                  });
                },
                child: const Text('Add'),
              ),
            ),
            const SizedBox(height: 16),
            for (final item in shared.items) ...[
              Text(
                item['name'].toString(),
              ),
            ],
          ],
        ),
      ),
      ),
    );
  }
}
