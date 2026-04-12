import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: DemoScreen()));
}

class DemoScreen extends StatefulWidget {
  const DemoScreen({super.key});

  @override
  State<DemoScreen> createState() => _DemoScreenState();
}

class _DemoScreenState extends State<DemoScreen> {
  int volume = 50;
  bool agreed = false;
  String selected = 'Option A';
  List<dynamic> options = ['Option A', 'Option B', 'Option C'];
  List<dynamic> favorites = ['Alice', 'Charlie'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Primitives Demo',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Icon(
              Icons.star,
              size: 24,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            ClipOval(
              child: Image.network(
              'https://picsum.photos/100',
              width: 100,
              height: 100,
              fit: BoxFit.cover,
            ),
            ),
            const SizedBox(height: 16),
            Chip(
              label: Text('Online'),
              backgroundColor: Colors.green,
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
            Slider(
              value: volume.toDouble(),
              min: 0.toDouble(),
              max: 100.toDouble(),
              onChanged: (value) {
                setState(() {
                  volume = value.round();
                });
              },
            ),
            const SizedBox(height: 16),
            Text(
              'Volume: '.toString() + volume.toString(),
            ),
            const SizedBox(height: 16),
            CheckboxListTile(
              value: agreed,
              title: Text('I agree to the terms'),
              onChanged: (value) {
                setState(() {
                  agreed = value ?? false;
                });
              },
            ),
            const SizedBox(height: 16),
            DropdownButton<dynamic>(
              value: selected,
              items: (options as List).map((e) => DropdownMenuItem<dynamic>(value: e, child: Text(e.toString()))).toList(),
              onChanged: (value) {
                setState(() {
                  selected = value;
                });
              },
            ),
            const SizedBox(height: 16),
            Text(
              'Selected: '.toString() + selected.toString(),
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
            if (favorites.contains('Alice')) ...[
              Text(
                'Alice is a favorite',
              ),
            ],
            const SizedBox(height: 16),
            if (!favorites.contains('Bob')) ...[
              Text(
                'Bob is not a favorite',
              ),
            ],
          ],
        ),
      ),
      ),
    );
  }
}
