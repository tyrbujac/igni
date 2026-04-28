import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: NotesScreen()));
}

class NotesScreen extends StatefulWidget {
  const NotesScreen({super.key});

  @override
  State<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  List<dynamic> notes = <dynamic>[{'title': 'First', 'blocks': <dynamic>[{'type': 'text', 'body': 'hi'}]}];

  @override
  Widget build(BuildContext context) {
    var current = (0 >= 0 && 0 < notes.length ? notes[0] : null);
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              (((current['title']) as dynamic)?.toString() ?? ''),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                setState(() {
                  current = {...current, 'blocks': current['blocks'] + <dynamic>[{'type': 'text', 'body': 'new'}]};
                });
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
