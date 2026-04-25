import 'package:flutter/material.dart';
import 'dart:async';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: NoteEditorScreen()));
}

class NoteEditorScreen extends StatefulWidget {
  const NoteEditorScreen({super.key});

  @override
  State<NoteEditorScreen> createState() => _NoteEditorScreenState();
}

class _NoteEditorScreenState extends State<NoteEditorScreen> {
  String draft = '';
  var last_saved = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
  int saved_seconds_ago = 0;
  int save_count = 0;
  late final TextEditingController _draftController;
  Timer? _everyTimer0;
  Timer? _everyTimer1;
  Timer? _everyTimer2;

  @override
  void initState() {
    super.initState();
    _draftController = TextEditingController(text: draft);
    _everyTimer0 = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() {
        saved_seconds_ago = (DateTime.now().millisecondsSinceEpoch ~/ 1000) - last_saved;
      });
    });
    _everyTimer1 = Timer.periodic(const Duration(seconds: 5), (_) {
      setState(() {
        save_count = save_count + 1;
      });
      setState(() {
        last_saved = (DateTime.now().millisecondsSinceEpoch ~/ 1000);
      });
    });
    _everyTimer2 = Timer.periodic(const Duration(seconds: 30), (_) {
      setState(() {
        save_count = save_count;
      });
    });
  }

  @override
  void dispose() {
    _draftController.dispose();
    _everyTimer0?.cancel();
    _everyTimer1?.cancel();
    _everyTimer2?.cancel();
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
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320),
              child: TextField(
              controller: _draftController,
              onChanged: (value) {
                setState(() {
                  draft = value;
                });
              },
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: 'Start typing...',
              ),
            ),
            ),
            const SizedBox(height: 16),
            Text(
              '$saved_seconds_ago',
            ),
            const SizedBox(height: 16),
            Text(
              '$save_count',
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
