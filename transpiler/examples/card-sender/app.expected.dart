import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class SharedState extends ChangeNotifier {
  String theme_mode = 'system';
  String sender_name = '';
  List<dynamic> cards = <dynamic>[{'id': 1, 'title': 'Birthday', 'occasion': 'birthday', 'bg': 'card-birthday.jpg', 'is_new': true}, {'id': 2, 'title': 'Thank You', 'occasion': 'thank-you', 'bg': 'card-thank-you.jpg', 'is_new': false}, {'id': 3, 'title': 'Holiday', 'occasion': 'holiday', 'bg': 'card-holiday.jpg', 'is_new': true}, {'id': 4, 'title': 'Get Well', 'occasion': 'get-well', 'bg': 'card-get-well.jpg', 'is_new': false}, {'id': 5, 'title': 'Congrats', 'occasion': 'congrats', 'bg': 'card-congrats.jpg', 'is_new': false}, {'id': 6, 'title': 'Just Because', 'occasion': 'generic', 'bg': 'card-generic.jpg', 'is_new': true}];
  var picked_card = null;
  String draft_recipient = '';
  String draft_message = '';
  String draft_accent = 'brand';
  String send_url = '';
  List<dynamic> sent_history = <dynamic>[];

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }
}

final shared = SharedState();


ThemeMode _resolveThemeMode(dynamic mode) {
  if (mode == 'light') return ThemeMode.light;
  if (mode == 'dark') return ThemeMode.dark;
  return ThemeMode.system;
}

void main() {
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFD14545)), scaffoldBackgroundColor: const Color(0xFFFBF3E4), textTheme: TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5, fontFamily: 'Source Sans 3'), headlineLarge: TextStyle(fontFamily: 'Pacifico'), headlineSmall: TextStyle(fontFamily: 'Pacifico'), bodyLarge: TextStyle(fontFamily: 'Source Sans 3')), appBarTheme: AppBarTheme(backgroundColor: const Color(0xFFFBF3E4), foregroundColor: const Color(0xFF3D2E26))), darkTheme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFD14545), brightness: Brightness.dark), scaffoldBackgroundColor: const Color(0xFF1F1812), textTheme: TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5, fontFamily: 'Source Sans 3'), headlineLarge: TextStyle(fontFamily: 'Pacifico'), headlineSmall: TextStyle(fontFamily: 'Pacifico'), bodyLarge: TextStyle(fontFamily: 'Source Sans 3')), appBarTheme: AppBarTheme(backgroundColor: const Color(0xFF1F1812), foregroundColor: const Color(0xFFF5EDE0))), themeMode: _resolveThemeMode(shared.theme_mode), home: HomeScreen()),
  ));
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  void pick(dynamic c) {
    shared.update(() {
      shared.picked_card = c;
    });
    Navigator.push(context, MaterialPageRoute(builder: (context) => DesignerScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Cards')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Pick a card',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Text(
              'Tap a design to start customising',
              style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
            ),
            const SizedBox(height: 16),
            for (final (_i, card) in shared.cards.indexed) ...[
                            GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  pick(card);
                },
                child: Container(
                decoration: BoxDecoration(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF2D241D) : const Color(0xFFFFFFFF)), borderRadius: BorderRadius.circular(16)),
                child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Text(
                          (((card['title']) as dynamic)?.toString() ?? ''),
                          style: Theme.of(context).textTheme.headlineSmall!,
                        ),
                        const SizedBox(width: 12),
                        if (card['is_new']) ...[
                          Text(
                            'NEW!',
                            style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1F1812) : const Color(0xFFFBF3E4))),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      (((card['occasion']) as dynamic)?.toString() ?? ''),
                      style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
                    ),
                  ],
                ),
              ),
              ),
              ),
              if (_i < shared.cards.length - 1) const SizedBox(height: 16),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E)), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => HistoryScreen()));
                  },
                  child: const Text('History'),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E)), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => SettingsScreen()));
                  },
                  child: const Text('Settings'),
                ),
              ],
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}

class DesignerScreen extends StatefulWidget {
  const DesignerScreen({super.key});

  @override
  State<DesignerScreen> createState() => _DesignerScreenState();
}

class _DesignerScreenState extends State<DesignerScreen> {
  var recipient_draft = shared.draft_recipient;
  var message_draft = shared.draft_message;
  late final TextEditingController _recipient_draftController;
  late final TextEditingController _message_draftController;

  @override
  void initState() {
    super.initState();
    _recipient_draftController = TextEditingController(text: recipient_draft);
    _message_draftController = TextEditingController(text: message_draft);
  }

  @override
  void dispose() {
    _recipient_draftController.dispose();
    _message_draftController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Customise')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E)), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('← Back'),
            ),
            const SizedBox(height: 16),
            if (shared.picked_card == null) ...[
              Text(
                'No card selected',
              ),
            ] else ...[
              Container(
                decoration: BoxDecoration(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF2D241D) : const Color(0xFFFFFFFF)), borderRadius: BorderRadius.circular(16), border: Border.all(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E)), width: 1.0)),
                child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Text(
                      (((shared.picked_card['title']) as dynamic)?.toString() ?? ''),
                      style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: _igniColorValue(context, shared.draft_accent)),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      (((shared.picked_card['occasion']) as dynamic)?.toString() ?? ''),
                      style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
                    ),
                    const SizedBox(height: 12),
                    if (shared.draft_recipient != '') ...[
                      Text(
                        'To '.toString() + (((shared.draft_recipient) as dynamic)?.toString() ?? ''),
                        style: Theme.of(context).textTheme.bodyLarge!,
                      ),
                    ],
                    const SizedBox(height: 12),
                    if (shared.draft_message != '') ...[
                      Text(
                        (((shared.draft_message) as dynamic)?.toString() ?? ''),
                        style: Theme.of(context).textTheme.bodyLarge!,
                      ),
                    ],
                    const SizedBox(height: 12),
                    if (shared.sender_name != '') ...[
                      Text(
                        '— '.toString() + (((shared.sender_name) as dynamic)?.toString() ?? ''),
                        style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
                      ),
                    ],
                  ],
                ),
              ),
              ),
              Text(
                'Recipient',
                style: Theme.of(context).textTheme.headlineSmall!,
              ),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 320),
                child: TextField(
                key: const ValueKey("recipient_draft"),
                controller: _recipient_draftController,
                onChanged: (value) {
                  setState(() {
                    recipient_draft = value;
                  });
                  shared.update(() {
                    shared.draft_recipient = recipient_draft;
                  });
                },
                decoration: InputDecoration(
                  border: const OutlineInputBorder(),
                  hintText: 'Who is this for?',
                ),
              ),
              ),
              Text(
                'Message',
                style: Theme.of(context).textTheme.headlineSmall!,
              ),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 320),
                child: TextField(
                key: const ValueKey("message_draft"),
                controller: _message_draftController,
                onChanged: (value) {
                  setState(() {
                    message_draft = value;
                  });
                  shared.update(() {
                    shared.draft_message = message_draft;
                  });
                },
                decoration: InputDecoration(
                  border: const OutlineInputBorder(),
                  hintText: 'Add a personal touch',
                ),
              ),
              ),
              Text(
                'Accent',
                style: Theme.of(context).textTheme.headlineSmall!,
              ),
              Row(
                children: [
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD14545), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      shared.update(() {
                        shared.draft_accent = 'brand';
                      });
                    },
                    child: const Text('Brand red'),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8FA876), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      shared.update(() {
                        shared.draft_accent = 'sage';
                      });
                    },
                    child: const Text('Sage green'),
                  ),
                ],
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD14545), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => PreviewScreen()));
                },
                child: const Text('Preview'),
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

class PreviewScreen extends StatefulWidget {
  const PreviewScreen({super.key});

  @override
  State<PreviewScreen> createState() => _PreviewScreenState();
}

class _PreviewScreenState extends State<PreviewScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Preview')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E)), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('← Back'),
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF2D241D) : const Color(0xFFFFFFFF)), borderRadius: BorderRadius.circular(16)),
              child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Text(
                    (((shared.picked_card['title']) as dynamic)?.toString() ?? ''),
                    style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: _igniColorValue(context, shared.draft_accent)),
                  ),
                  const SizedBox(height: 16),
                  if (shared.draft_recipient != '') ...[
                    Text(
                      'To '.toString() + (((shared.draft_recipient) as dynamic)?.toString() ?? ''),
                      style: Theme.of(context).textTheme.bodyLarge!,
                    ),
                  ],
                  const SizedBox(height: 16),
                  if (shared.draft_message != '') ...[
                    Text(
                      (((shared.draft_message) as dynamic)?.toString() ?? ''),
                      style: Theme.of(context).textTheme.bodyLarge!,
                    ),
                  ],
                  const SizedBox(height: 16),
                  if (shared.sender_name != '') ...[
                    Text(
                      '— '.toString() + (((shared.sender_name) as dynamic)?.toString() ?? ''),
                      style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
                    ),
                  ],
                ],
              ),
            ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD14545), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => SendScreen()));
              },
              child: const Text('Send →'),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}

class SendScreen extends StatefulWidget {
  const SendScreen({super.key});

  @override
  State<SendScreen> createState() => _SendScreenState();
}

class _SendScreenState extends State<SendScreen> {
  dynamic response;
  bool _responseLoading = true;
  bool _responseError = false;

  @override
  void initState() {
    super.initState();
    _fetchResponse();
  }

  Future<void> _fetchResponse() async {
    try {
      final _igni_response = await http.post(
        Uri.parse(shared.send_url),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'recipient': shared.draft_recipient, 'message': shared.draft_message, 'sender': shared.sender_name, 'card_id': shared.picked_card['id'], 'card_title': shared.picked_card['title']}),
      );
      if (_igni_response.statusCode == 200) {
        setState(() {
          response = jsonDecode(_igni_response.body);
          _responseLoading = false;
        });
      } else {
        setState(() {
          _responseError = true;
          _responseLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _responseError = true;
        _responseLoading = false;
      });
    }
  }

  void finalize_send() {
    dynamic entry = {'card_id': shared.picked_card['id'], 'card_title': shared.picked_card['title'], 'recipient': shared.draft_recipient, 'message': shared.draft_message};
    shared.update(() {
      shared.sent_history = shared.sent_history + <dynamic>[entry];
    });
    shared.update(() {
      shared.send_url = '';
    });
    shared.update(() {
      shared.draft_recipient = '';
    });
    shared.update(() {
      shared.draft_message = '';
    });
    Navigator.push(context, MaterialPageRoute(builder: (context) => SentScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Send card')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E)), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('← Back'),
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF2D241D) : const Color(0xFFFFFFFF)), borderRadius: BorderRadius.circular(16)),
              child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Text(
                    (((shared.picked_card['title']) as dynamic)?.toString() ?? ''),
                    style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: _igniColorValue(context, shared.draft_accent)),
                  ),
                  const SizedBox(height: 12),
                  if (shared.draft_recipient != '') ...[
                    Text(
                      'To '.toString() + (((shared.draft_recipient) as dynamic)?.toString() ?? ''),
                      style: Theme.of(context).textTheme.bodyLarge!,
                    ),
                  ],
                  const SizedBox(height: 12),
                  if (shared.draft_message != '') ...[
                    Text(
                      (((shared.draft_message) as dynamic)?.toString() ?? ''),
                      style: Theme.of(context).textTheme.bodyLarge!,
                    ),
                  ],
                  const SizedBox(height: 12),
                  if (shared.sender_name != '') ...[
                    Text(
                      '— '.toString() + (((shared.sender_name) as dynamic)?.toString() ?? ''),
                      style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
                    ),
                  ],
                ],
              ),
            ),
            ),
            const SizedBox(height: 16),
            if (shared.send_url == '') ...[
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD14545), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  shared.update(() {
                    shared.send_url = 'https://httpbin.org/post';
                  });
                },
                child: const Text('Send'),
              ),
            ] else if (_responseLoading) ...[
              const CircularProgressIndicator(),
              Text(
                'Sending…',
                style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
              ),
            ] else if (_responseError) ...[
              Text(
                'Send failed',
                style: Theme.of(context).textTheme.headlineSmall!.copyWith(color: const Color(0xFFD14545)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E)), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  shared.update(() {
                    shared.send_url = '';
                  });
                },
                child: const Text('Try again'),
              ),
            ] else ...[
              Text(
                'Sent!',
                style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: const Color(0xFF8FA876)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD14545), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  finalize_send();
                },
                child: const Text('Done'),
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

class SentScreen extends StatefulWidget {
  const SentScreen({super.key});

  @override
  State<SentScreen> createState() => _SentScreenState();
}

class _SentScreenState extends State<SentScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Sent')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Card sent!',
                style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: const Color(0xFF8FA876)),
              ),
              const SizedBox(height: 16),
              Text(
                'Shareable link generation lands next session.',
                style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD14545), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => HomeScreen()));
                },
                child: const Text('Send another'),
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

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Sent history')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E)), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('← Back'),
            ),
            const SizedBox(height: 16),
            if (shared.sent_history.isEmpty) ...[
              Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'No cards sent yet',
                        style: Theme.of(context).textTheme.headlineSmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Send one from the Home screen',
                        style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              Text(
                'Recently sent',
                style: Theme.of(context).textTheme.headlineSmall!,
              ),
              for (final entry in shared.sent_history) ...[
                Container(
                  decoration: BoxDecoration(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF2D241D) : const Color(0xFFFFFFFF)), borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text(
                        (((entry['card_title']) as dynamic)?.toString() ?? ''),
                        style: Theme.of(context).textTheme.headlineSmall!,
                      ),
                      const SizedBox(height: 8),
                      if (entry['recipient'] != '') ...[
                        Text(
                          'To '.toString() + (((entry['recipient']) as dynamic)?.toString() ?? ''),
                          style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
                        ),
                      ],
                      const SizedBox(height: 8),
                      if (entry['message'] != '') ...[
                        Text(
                          (((entry['message']) as dynamic)?.toString() ?? ''),
                          style: Theme.of(context).textTheme.bodySmall!,
                        ),
                      ],
                    ],
                  ),
                ),
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

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  var sender_draft = shared.sender_name;
  late final TextEditingController _sender_draftController;

  @override
  void initState() {
    super.initState();
    _sender_draftController = TextEditingController(text: sender_draft);
  }

  @override
  void dispose() {
    _sender_draftController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Settings')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E)), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  Navigator.pop(context);
                },
                child: const Text('← Back'),
              ),
              const SizedBox(height: 16),
              Text(
                'Theme',
                style: Theme.of(context).textTheme.headlineSmall!,
              ),
              const SizedBox(height: 16),
              Column(
                children: [
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD14545), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      shared.update(() {
                        shared.theme_mode = 'system';
                      });
                    },
                    child: const Text('Follow system'),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD14545), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      shared.update(() {
                        shared.theme_mode = 'light';
                      });
                    },
                    child: const Text('Light'),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD14545), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      shared.update(() {
                        shared.theme_mode = 'dark';
                      });
                    },
                    child: const Text('Dark'),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Active: '.toString() + (((shared.theme_mode) as dynamic)?.toString() ?? ''),
                    style: Theme.of(context).textTheme.bodySmall!.copyWith(color: (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E))),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Sender name',
                style: Theme.of(context).textTheme.headlineSmall!,
              ),
              const SizedBox(height: 16),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 320),
                child: TextField(
                key: const ValueKey("sender_draft"),
                controller: _sender_draftController,
                onChanged: (value) {
                  setState(() {
                    sender_draft = value;
                  });
                  shared.update(() {
                    shared.sender_name = sender_draft;
                  });
                },
                decoration: InputDecoration(
                  border: const OutlineInputBorder(),
                  hintText: 'Your name on sent cards',
                ),
              ),
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

Color _igniColorValue(BuildContext context, dynamic value) {
  if (value is Color) return value;
  switch (value) {
    case 'brand': return const Color(0xFFD14545);
    case 'cream': return Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1F1812) : const Color(0xFFFBF3E4);
    case 'sage': return const Color(0xFF8FA876);
    case 'surface': return Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1F1812) : const Color(0xFFFBF3E4);
    case 'text': return Theme.of(context).brightness == Brightness.dark ? const Color(0xFFF5EDE0) : const Color(0xFF3D2E26);
    case 'card': return Theme.of(context).brightness == Brightness.dark ? const Color(0xFF2D241D) : const Color(0xFFFFFFFF);
    case 'subtle': return Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E);
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
    case 'brand': return const Color(0xFFD14545);
    case 'cream': return Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1F1812) : const Color(0xFFFBF3E4);
    case 'sage': return const Color(0xFF8FA876);
    case 'surface': return Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1F1812) : const Color(0xFFFBF3E4);
    case 'text': return Theme.of(context).brightness == Brightness.dark ? const Color(0xFFF5EDE0) : const Color(0xFF3D2E26);
    case 'card': return Theme.of(context).brightness == Brightness.dark ? const Color(0xFF2D241D) : const Color(0xFFFFFFFF);
    case 'subtle': return Theme.of(context).brightness == Brightness.dark ? const Color(0xFF6B6055) : const Color(0xFFA89C8E);
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
