import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: DemoScreen()));
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
  List<dynamic> options = <dynamic>['Option A', 'Option B', 'Option C'];
  List<dynamic> favorites = <dynamic>['Alice', 'Charlie'];
  bool chosen = true;

  @override
  Widget build(BuildContext context) {
    var bg = 'card';
    var status_color = 'green';
    if (chosen) {
      bg = 'brand';
      status_color = 'white';
    }
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
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
              key: const ValueKey("volume"),
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
              'Volume: '.toString() + (((volume) as dynamic)?.toString() ?? ''),
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
              'Selected: '.toString() + (((selected) as dynamic)?.toString() ?? ''),
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
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(color: _igniBackgroundValue(context, bg), borderRadius: BorderRadius.circular(16)),
              child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'Styled with variables',
                    style: TextStyle(color: _igniColorValue(context, status_color)),
                  ),
                ],
              ),
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

Color _igniColorValue(BuildContext context, dynamic value) {
  if (value is Color) return value;
  switch (value) {
    case 'brand': return Theme.of(context).colorScheme.primary;
    case 'subtle': return Colors.grey;
    case 'danger': return Colors.red;
    case 'green': return Colors.green;
    case 'red': return Colors.red;
    case 'blue': return Colors.blue;
    case 'white': return Colors.white;
    case 'black': return Colors.black;
    case 'yellow': return Colors.yellow;
    case 'orange': return Colors.orange;
    case 'purple': return Colors.purple;
    case 'teal': return Colors.teal;
    case 'card':
      throw FlutterError('Igni: `card` is background-only. Use it with `background:`, not `color:`.');
    default:
      return Colors.grey;
  }
}

Color _igniBackgroundValue(BuildContext context, dynamic value) {
  if (value is Color) return value;
  switch (value) {
    case 'card': return Theme.of(context).cardColor;
    case 'brand': return Theme.of(context).colorScheme.primary;
    case 'subtle': return Colors.grey;
    case 'danger': return Colors.red;
    case 'green': return Colors.green;
    case 'red': return Colors.red;
    case 'blue': return Colors.blue;
    case 'white': return Colors.white;
    case 'black': return Colors.black;
    case 'yellow': return Colors.yellow;
    case 'orange': return Colors.orange;
    case 'purple': return Colors.purple;
    case 'teal': return Colors.teal;
    default:
      return Theme.of(context).cardColor;
  }
}
