import 'package:flutter/material.dart';

class SharedState extends ChangeNotifier {
  int height = 180;
  int weight = 60;
  int age = 20;
  String gender = 'male';

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }
}

final shared = SharedState();

void main() {
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: InputScreen()),
  ));
}

class GenderCard extends StatelessWidget {
  final dynamic value;
  final dynamic text;
  final dynamic accent;
  const GenderCard({super.key, required this.value, required this.text, required this.accent});

  @override
  Widget build(BuildContext context) {
    var bg = 'card';
    var fg = accent;
    if (shared.gender == value) {
      bg = accent;
      fg = 'white';
    }
    return Expanded(
      child:     GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        shared.update(() {
          shared.gender = value;
        });
      },
      child: Container(
      decoration: BoxDecoration(color: _igniBackgroundValue(context, bg), borderRadius: BorderRadius.circular(16)),
      child: Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _iconFromName(value),
              size: 24,
              color: _igniColorValue(context, fg),
            ),
            const SizedBox(height: 8),
            Text(
              '$text',
              style: TextStyle(color: _igniColorValue(context, fg)),
            ),
          ],
        ),
      ),
    ),
    ),
    ),
    );
  }
}

class HeightCard extends StatelessWidget {
  const HeightCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
      child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'HEIGHT',
          ),
          const SizedBox(height: 8),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  (((shared.height) as dynamic)?.toString() ?? ''),
                  style: Theme.of(context).textTheme.headlineLarge!,
                ),
                const SizedBox(width: 8),
                Text(
                  'cm',
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Slider(
            value: shared.height.toDouble(),
            min: 120.toDouble(),
            max: 220.toDouble(),
            onChanged: (value) {
              shared.update(() {
                shared.height = value.round();
              });
            },
          ),
        ],
      ),
    ),
    ),
    );
  }
}

class ValueCard extends StatelessWidget {
  final dynamic label_text;
  final dynamic value;
  final void Function(dynamic)? onStep;
  const ValueCard({super.key, required this.label_text, required this.value, this.onStep});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
      child: Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$label_text',
            ),
            const SizedBox(height: 8),
            Text(
              '$value',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 8),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.grey, foregroundColor: Colors.white, shape: const CircleBorder(), padding: const EdgeInsets.all(16), minimumSize: const Size(48, 48)),
                    onPressed: () {
                      onStep?.call(-1);
                    },
                    child: const Text('-'),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.grey, foregroundColor: Colors.white, shape: const CircleBorder(), padding: const EdgeInsets.all(16), minimumSize: const Size(48, 48)),
                    onPressed: () {
                      onStep?.call(1);
                    },
                    child: const Text('+'),
                  ),
                ],
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

class InputScreen extends StatefulWidget {
  const InputScreen({super.key});

  @override
  State<InputScreen> createState() => _InputScreenState();
}

class _InputScreenState extends State<InputScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('BMI CALCULATOR')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Row(
              children: [
                GenderCard(value: 'male', text: 'MALE', accent: 'blue'),
                const SizedBox(width: 16),
                GenderCard(value: 'female', text: 'FEMALE', accent: 'brand'),
              ],
            ),
            ),
            const SizedBox(height: 16),
            HeightCard(),
            const SizedBox(height: 16),
            Expanded(
              child: Row(
              children: [
                ValueCard(label_text: 'WEIGHT', value: shared.weight, onStep: (d) {
                  shared.update(() {
                    shared.weight = (shared.weight + d).toInt();
                  });
                  }),
                const SizedBox(width: 16),
                ValueCard(label_text: 'AGE', value: shared.age, onStep: (d) {
                  shared.update(() {
                    shared.age = (shared.age + d).toInt();
                  });
                  }),
              ],
            ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEB1555), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => ResultsScreen()));
              },
              child: const Text('CALCULATE'),
            ),
          ],
        ),
      ),
    );
  }
}

class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key});

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  var bmi_value = shared.weight / (shared.height / 100 * shared.height / 100);

  @override
  Widget build(BuildContext context) {
    var category = 'NORMAL';
    var status_color = 'green';
    var advice = 'You have a normal body weight. Good job!';
    if (bmi_value >= 25) {
      category = 'OVERWEIGHT';
      status_color = 'orange';
      advice = 'You have a higher than normal body weight. Try to exercise more.';
    } else if (bmi_value < 18.5) {
      category = 'UNDERWEIGHT';
      status_color = 'blue';
      advice = 'You have a lower than normal body weight. You can eat a bit more.';
    }
    return Scaffold(
      appBar: AppBar(title: Text('YOUR RESULT')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$category',
                    style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: _igniColorValue(context, status_color)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    (((bmi_value.toStringAsFixed(1)) as dynamic)?.toString() ?? ''),
                    style: Theme.of(context).textTheme.headlineLarge!,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '$advice',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEB1555), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('RE-CALCULATE'),
            ),
          ],
        ),
      ),
    );
  }
}

IconData _iconFromName(dynamic name) {
  if (name is IconData) return name;
  switch (name as String) {
    case 'play': return Icons.play_arrow;
    case 'pause': return Icons.pause;
    case 'stop': return Icons.stop;
    case 'skip': return Icons.skip_next;
    case 'back': return Icons.arrow_back;
    case 'close': return Icons.close;
    case 'search': return Icons.search;
    case 'settings': return Icons.settings;
    case 'plus': return Icons.add;
    case 'minus': return Icons.remove;
    case 'add': return Icons.add;
    case 'remove': return Icons.remove;
    case 'trash': return Icons.delete;
    case 'edit': return Icons.edit;
    case 'phone': return Icons.phone;
    case 'cart': return Icons.shopping_cart;
    case 'shopping-cart': return Icons.shopping_cart;
    case 'heart': return Icons.favorite;
    case 'star': return Icons.star;
    case 'check': return Icons.check;
    case 'user': return Icons.person;
    case 'person': return Icons.person;
    case 'home': return Icons.home;
    case 'mail': return Icons.mail;
    case 'male': return Icons.male;
    case 'female': return Icons.female;
    default: return Icons.help_outline;
  }
}

Color _igniColorValue(BuildContext context, dynamic value) {
  if (value is Color) return value;
  switch (value) {
    case 'brand': return const Color(0xFFEB1555);
    case 'card': return const Color(0xFFEEEEEE);
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
    case 'brand': return const Color(0xFFEB1555);
    case 'card': return const Color(0xFFEEEEEE);
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
