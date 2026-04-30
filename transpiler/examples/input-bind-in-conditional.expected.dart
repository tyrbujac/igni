import 'package:flutter/material.dart';

class SharedState extends ChangeNotifier {
  bool show_form = false;

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }
}

final shared = SharedState();

void main() {
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: FormScreen()),
  ));
}

class FormScreen extends StatefulWidget {
  const FormScreen({super.key});

  @override
  State<FormScreen> createState() => _FormScreenState();
}

class _FormScreenState extends State<FormScreen> {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                shared.update(() {
                  shared.show_form = !shared.show_form;
                });
              },
              child: const Text('Toggle form'),
            ),
            const SizedBox(height: 16),
            if (shared.show_form) ...[
              Text(
                'Enter text:',
              ),
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
                  hintText: 'type here',
                ),
              ),
              ),
              Text(
                '$draft',
              ),
            ] else ...[
              Text(
                'Form hidden',
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
