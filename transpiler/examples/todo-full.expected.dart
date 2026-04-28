import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: TodoScreen()));
}

class TodoScreen extends StatefulWidget {
  const TodoScreen({super.key});

  @override
  State<TodoScreen> createState() => _TodoScreenState();
}

class _TodoScreenState extends State<TodoScreen> {
  List<dynamic> items = <dynamic>[];
  String draft = '';
  late final TextEditingController _draftController;

  @override
  void initState() {
    super.initState();
    _draftController = TextEditingController(text: draft);
  }

  @override
  void dispose() {
    _draftController.dispose();
    super.dispose();
  }

  void add() {
    setState(() {
      items = items + <dynamic>[{'text': draft}];
    });
    setState(() {
      draft = '';
    });
    _draftController.text = draft;
  }

  void remove(dynamic item) {
    setState(() {
      items = items.where((e) => e != item).toList();
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
              'Todo',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320),
              child: TextField(
              key: const ValueKey("draft"),
              controller: _draftController,
              onChanged: (value) {
                setState(() {
                  draft = value;
                });
              },
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: 'New task',
              ),
            ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                add();
              },
              child: const Text('Add'),
            ),
            const SizedBox(height: 16),
            if (items.isEmpty) ...[
              Text(
                'No tasks yet',
              ),
            ] else ...[
              for (final item in items) ...[
                Row(
                  children: [
                    Text(
                      (((item['text']) as dynamic)?.toString() ?? ''),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                      onPressed: () {
                        remove(item);
                      },
                      child: const Text('Done'),
                    ),
                  ],
                ),
              ],
            ],
          ],
        ),
      ),
        ),
      ),
    );
  }
}
