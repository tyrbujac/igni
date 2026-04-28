import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

int? _igniMockedNow;

void main() {
  testWidgets("shows empty state on initial render", (tester) async {
    _igniMockedNow = null;
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: TodoScreen()));
    await tester.pump();
    expect(find.text("No tasks yet"), findsAtLeastNWidgets(1));
  });
  testWidgets("adding an item renders it and clears the draft", (tester) async {
    _igniMockedNow = null;
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: TodoScreen()));
    await tester.pump();
    await tester.enterText(find.byKey(const ValueKey("draft")), 'buy milk');
    await tester.pumpAndSettle();
    await tester.tap(find.text("Add"));
    await tester.pumpAndSettle();
    expect(find.text("buy milk"), findsAtLeastNWidgets(1));
    expect(find.text("No tasks yet"), findsNothing);
    expect((tester.state(find.byType(TodoScreen)) as _TodoScreenState).draft == '', isTrue);
    expect((tester.state(find.byType(TodoScreen)) as _TodoScreenState).items.length == 1, isTrue);
  });
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
                Text(
                  (((item['text']) as dynamic)?.toString() ?? ''),
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
