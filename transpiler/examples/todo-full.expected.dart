import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(debugShowCheckedModeBanner: false, home: TodoScreen()));
}

class TodoScreen extends StatefulWidget {
  const TodoScreen({super.key});

  @override
  State<TodoScreen> createState() => _TodoScreenState();
}

class _TodoScreenState extends State<TodoScreen> {
  List<dynamic> items = [];
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
      items = items + [{'text': draft}];
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
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Todo',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _draftController,
              onChanged: (value) {
                setState(() {
                  draft = value;
                });
              },
              decoration: const InputDecoration(hintText: 'New task'),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  add();
                },
                child: const Text('Add'),
              ),
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
                      item['text'].toString(),
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
    );
  }
}
