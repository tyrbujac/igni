import 'package:flutter/material.dart';

class SharedState extends ChangeNotifier {
  List<dynamic> notes = [{'title': 'Welcome to Boojy Notes', 'blocks': [{'type': 'heading', 'content': 'Getting started', 'checked': false}, {'type': 'text', 'content': 'A minimal notes app built in Igni for app 2 v1.0 criterion 4 #3.', 'checked': false}, {'type': 'bullet', 'content': 'Tap a note title to view it', 'checked': false}, {'type': 'bullet', 'content': 'Use the buttons below to add blocks', 'checked': false}, {'type': 'checkbox', 'content': 'Tap to toggle me', 'checked': false}]}, {'title': 'Second note', 'blocks': [{'type': 'heading', 'content': 'A simpler note', 'checked': false}, {'type': 'text', 'content': 'Just one block of text below the heading.', 'checked': false}]}, {'title': 'Third note', 'blocks': [{'type': 'text', 'content': 'Even simpler. Just text.', 'checked': false}]}];
  var selected_note = null;
  int font_size = 15;

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }
}

final shared = SharedState();

void main() {
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF80CBC4)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: FilesScreen()),
  ));
}

class FilesScreen extends StatefulWidget {
  const FilesScreen({super.key});

  @override
  State<FilesScreen> createState() => _FilesScreenState();
}

class _FilesScreenState extends State<FilesScreen> {
  void open(dynamic n) {
    shared.update(() {
      shared.selected_note = n;
    });
    Navigator.push(context, MaterialPageRoute(builder: (context) => NoteScreen()));
  }

  void add_note() {
    dynamic note = {'title': 'Untitled', 'blocks': [{'type': 'text', 'content': '', 'checked': false}]};
    shared.update(() {
      shared.notes = shared.notes + [note];
    });
    shared.update(() {
      shared.selected_note = note;
    });
    Navigator.push(context, MaterialPageRoute(builder: (context) => NoteScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Notes')),
      body: Container(
        decoration: BoxDecoration(color: Colors.black),
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final (_i, note) in shared.notes.indexed) ...[
                            GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  open(note);
                },
                child: Container(
                decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
                child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Text(
                      (((note['title']) as dynamic)?.toString() ?? ''),
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
              ),
              ),
              if (_i < shared.notes.length - 1) const SizedBox(height: 16),
            ],
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF80CBC4), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                add_note();
              },
              child: const Text('+ New Note'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF37474F), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => SettingsScreen()));
              },
              child: const Text('Settings'),
            ),
          ],
        ),
      ),
      ),
    );
  }
}

class NoteScreen extends StatefulWidget {
  const NoteScreen({super.key});

  @override
  State<NoteScreen> createState() => _NoteScreenState();
}

class _NoteScreenState extends State<NoteScreen> {
  void add_block(dynamic t) {
    dynamic current = shared.selected_note;
    dynamic new_block = {'type': t, 'content': '', 'checked': false};
    dynamic updated = {...current, 'blocks': current['blocks'] + [new_block]};
    shared.update(() {
      shared.notes = shared.notes.map((e) => e == current ? updated : e).toList();
    });
    shared.update(() {
      shared.selected_note = updated;
    });
  }

  void toggle_check(dynamic b) {
    dynamic current = shared.selected_note;
    dynamic flipped = {...b, 'checked': !b['checked']};
    dynamic new_blocks = current['blocks'].map((e) => e == b ? flipped : e).toList();
    dynamic updated = {...current, 'blocks': new_blocks};
    shared.update(() {
      shared.notes = shared.notes.map((e) => e == current ? updated : e).toList();
    });
    shared.update(() {
      shared.selected_note = updated;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Note')),
      body: Container(
        decoration: BoxDecoration(color: Colors.black),
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF37474F), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('← Back'),
            ),
            const SizedBox(height: 16),
            if (shared.selected_note == null) ...[
              Text(
                'No note selected',
                style: TextStyle(color: Colors.white),
              ),
            ] else ...[
              Text(
                (((shared.selected_note['title']) as dynamic)?.toString() ?? ''),
                style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: Colors.white),
              ),
              for (final block in shared.selected_note['blocks']) ...[
                if (block['type'] == 'heading') ...[
                  Text(
                    (((block['content']) as dynamic)?.toString() ?? ''),
                    style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: Colors.white),
                  ),
                ] else if (block['type'] == 'text') ...[
                  Text(
                    (((block['content']) as dynamic)?.toString() ?? ''),
                    style: TextStyle(color: Colors.white),
                  ),
                ] else if (block['type'] == 'bullet') ...[
                  Row(
                    children: [
                      Text(
                        '•',
                        style: TextStyle(color: const Color(0xFF80CBC4)),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        (((block['content']) as dynamic)?.toString() ?? ''),
                        style: TextStyle(color: Colors.white),
                      ),
                    ],
                  ),
                ] else if (block['type'] == 'checkbox') ...[
                                    GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      toggle_check(block);
                    },
                    child: Row(
                    children: [
                      if (block['checked']) ...[
                        Text(
                          '[x]',
                          style: TextStyle(color: const Color(0xFF80CBC4)),
                        ),
                      ] else ...[
                        Text(
                          '[ ]',
                          style: TextStyle(color: const Color(0xFF37474F)),
                        ),
                      ],
                      const SizedBox(width: 8),
                      Text(
                        (((block['content']) as dynamic)?.toString() ?? ''),
                        style: TextStyle(color: Colors.white),
                      ),
                    ],
                  ),
                  ),
                ],
              ],
              Row(
                children: [
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF37474F), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      add_block('heading');
                    },
                    child: const Text('+ H'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF37474F), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      add_block('text');
                    },
                    child: const Text('+ T'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF37474F), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      add_block('bullet');
                    },
                    child: const Text('+ B'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF37474F), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      add_block('checkbox');
                    },
                    child: const Text('+ C'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
      ),
    );
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Settings')),
      body: Container(
        decoration: BoxDecoration(color: Colors.black),
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF37474F), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('← Back'),
            ),
            const SizedBox(height: 16),
            Text(
              'Font size',
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(color: Colors.white),
            ),
            const SizedBox(height: 16),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Slider(
                    key: const ValueKey("shared.font_size"),
                    value: shared.font_size.toDouble(),
                    min: 10.toDouble(),
                    max: 24.toDouble(),
                    onChanged: (value) {
                      shared.update(() {
                        shared.font_size = value.round();
                      });
                    },
                  ),
                  const SizedBox(width: 16),
                  Text(
                    (((shared.font_size) as dynamic)?.toString() ?? ''),
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'About',
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(color: Colors.white),
            ),
            const SizedBox(height: 16),
            Text(
              'Boojy Notes — Igni MVP build',
              style: TextStyle(color: Colors.white),
            ),
            const SizedBox(height: 16),
            Text(
              'Built with Igni v0.19.1',
              style: TextStyle(color: Colors.white),
            ),
          ],
        ),
      ),
      ),
    );
  }
}
