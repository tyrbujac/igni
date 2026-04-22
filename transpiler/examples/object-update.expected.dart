import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ObjectUpdateDemoScreen()));
}

class ObjectUpdateDemoScreen extends StatefulWidget {
  const ObjectUpdateDemoScreen({super.key});

  @override
  State<ObjectUpdateDemoScreen> createState() => _ObjectUpdateDemoScreenState();
}

class _ObjectUpdateDemoScreenState extends State<ObjectUpdateDemoScreen> {
  List<dynamic> items = [{'text': 'Buy milk', 'done': false}, {'text': 'Walk dog', 'done': true}];
  var user = {'name': 'Tyr', 'profile': {'age': 24, 'city': 'Liverpool'}};

  void flip(dynamic target) {
    setState(() {
      items = items.map((e) => e == target ? {...target, 'done': !target['done']} : e).toList();
    });
  }

  void rename(dynamic target, dynamic new_text) {
    setState(() {
      items = items.map((e) => e == target ? {...target, 'text': new_text} : e).toList();
    });
  }

  void mark_done(dynamic target) {
    setState(() {
      items = items.map((e) => e == target ? {...target, 'text': 'Done', 'done': true} : e).toList();
    });
  }

  void annotate(dynamic target) {
    setState(() {
      items = items.map((e) => e == target ? {...target, 'notes': 'added'} : e).toList();
    });
  }

  void move_city() {
    setState(() {
      user = {...user, 'profile': {...user['profile'], 'city': 'Dublin'}};
    });
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
              'Object Update Demo',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Text(
              user['name'].toString(),
            ),
            const SizedBox(height: 16),
            Text(
              user['profile']['city'].toString(),
            ),
            const SizedBox(height: 16),
            for (final item in items) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    item['text'].toString(),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      flip(item);
                    },
                    child: const Text('Flip'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
        ),
      ),
    );
  }
}
