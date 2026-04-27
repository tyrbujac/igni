import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: BorderSelectedStateScreen()));
}

class BorderSelectedStateScreen extends StatefulWidget {
  const BorderSelectedStateScreen({super.key});

  @override
  State<BorderSelectedStateScreen> createState() => _BorderSelectedStateScreenState();
}

class _BorderSelectedStateScreenState extends State<BorderSelectedStateScreen> {
  List<dynamic> methods = [{'name': 'Credit Card'}, {'name': 'PayPal'}, {'name': 'Bank Transfer'}];

  dynamic width_for(dynamic method) {
    if (method == selected) {
      return thick;
    }
    return thin;
  }

  dynamic color_for(dynamic method) {
    if (method == selected) {
      return 'brand';
    }
    return 'subtle';
  }

  @override
  Widget build(BuildContext context) {
    var selected = (0 >= 0 && 0 < methods.length ? methods[0] : null);
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Payment method',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            for (final (_i, method) in methods.indexed) ...[
                            GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  setState(() {
                    selected = method;
                  });
                },
                child: Container(
                decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: _igniColorValue(context, color_for(method)), width: _igniBorderWidth(width_for(method)))),
                child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Text(
                      (((method['name']) as dynamic)?.toString() ?? ''),
                    ),
                  ],
                ),
              ),
              ),
              ),
              if (_i < methods.length - 1) const SizedBox(height: 16),
            ],
          ],
        ),
      ),
        ),
      ),
    );
  }
}

double _igniBorderWidth(dynamic value) {
  if (value is num) return value.toDouble();
  switch (value) {
    case 'thin': return 1.0;
    case 'medium': return 2.0;
    case 'thick': return 4.0;
    default: return 1.0;
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
