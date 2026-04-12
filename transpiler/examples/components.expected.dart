import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: NoteListScreen()));
}

class NoteCard extends StatelessWidget {
  final dynamic title;
  final dynamic body;
  const NoteCard({super.key, required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Text(
            '$title',
            style: Theme.of(context).textTheme.headlineLarge!,
          ),
          Text(
            '$body',
          ),
        ],
      ),
    );
  }
}

class NoteListScreen extends StatefulWidget {
  const NoteListScreen({super.key});

  @override
  State<NoteListScreen> createState() => _NoteListScreenState();
}

class _NoteListScreenState extends State<NoteListScreen> {
  List<dynamic> notes = [{'title': 'First', 'body': 'Hello'}, {'title': 'Second', 'body': 'World'}];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Notes',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            for (final note in notes) ...[
              NoteCard(title: note['title'], body: note['body']),
            ],
          ],
        ),
      ),
      ),
    );
  }
}
