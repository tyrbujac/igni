import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 16))), home: DemoScreen()));
}

class SelectableCard extends StatelessWidget {
  final dynamic title;
  final dynamic selected;
  const SelectableCard({super.key, required this.title, required this.selected});

  @override
  Widget build(BuildContext context) {
    var bg = 'card';
    var text_color = 'white';
    if (selected) {
      bg = 'brand';
      text_color = 'black';
    }
    return Container(
      decoration: BoxDecoration(color: _igniBackgroundValue(context, bg), borderRadius: BorderRadius.circular(16)),
      child: Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$title',
              style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: _igniColorValue(context, text_color)),
            ),
          ],
        ),
      ),
    ),
    );
  }
}

class DemoScreen extends StatefulWidget {
  const DemoScreen({super.key});

  @override
  State<DemoScreen> createState() => _DemoScreenState();
}

class _DemoScreenState extends State<DemoScreen> {
  String active = 'A';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                GestureDetector(
                  onTap: () {
                    setState(() {
                      active = 'A';
                    });
                  },
                  child: SelectableCard(title: 'Option A', selected: active == 'A'),
                ),
                const SizedBox(width: 16),
                GestureDetector(
                  onTap: () {
                    setState(() {
                      active = 'B';
                    });
                  },
                  child: SelectableCard(title: 'Option B', selected: active == 'B'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Selected: '.toString() + active.toString(),
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
