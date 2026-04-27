import 'package:flutter/material.dart';

class SharedState extends ChangeNotifier {
  List<dynamic> contacts = [{'name': 'Alice', 'phone': '555-0101', 'favourite': false}, {'name': 'Bob', 'phone': '555-0102', 'favourite': true}, {'name': 'Charlie', 'phone': '555-0103', 'favourite': false}, {'name': 'Diana', 'phone': '555-0104', 'favourite': true}, {'name': 'Eve', 'phone': '555-0105', 'favourite': false}];

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }
}

final shared = SharedState();

void main() {
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ContactListScreen()),
  ));
}

class ContactRow extends StatelessWidget {
  final dynamic contact;
  const ContactRow({super.key, required this.contact});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
      child: Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            (((contact['name']) as dynamic)?.toString() ?? ''),
            style: Theme.of(context).textTheme.bodyLarge!,
          ),
          if (contact['favourite']) ...[
            Icon(
              Icons.star,
              color: Theme.of(context).colorScheme.primary,
            ),
          ],
        ],
      ),
    ),
    );
  }
}

class ContactListScreen extends StatefulWidget {
  const ContactListScreen({super.key});

  @override
  State<ContactListScreen> createState() => _ContactListScreenState();
}

class _ContactListScreenState extends State<ContactListScreen> {
  String query = '';
  bool favourites_only = false;
  late final TextEditingController _queryController;

  @override
  void initState() {
    super.initState();
    _queryController = TextEditingController(text: query);
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  dynamic visible() {
    dynamic result = shared.contacts;
    if (favourites_only) {
      result = result.where((c) => (c['favourite']) == true).toList();
    }
    if (query.isNotEmpty) {
      result = result.where((c) => (c['name'].toString().toLowerCase().contains(query.toString().toLowerCase())) == true).toList();
    }
    return (List.from(result)..sort((a, b) => (a['name'] as Comparable).compareTo(b['name'])));
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
              'Contacts',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320),
              child: TextField(
              key: const ValueKey("query"),
              controller: _queryController,
              onChanged: (value) {
                setState(() {
                  query = value;
                });
              },
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: 'Search...',
              ),
            ),
            ),
            const SizedBox(height: 16),
            Switch(
              key: const ValueKey("favourites_only"),
              value: favourites_only,
              onChanged: (value) {
                setState(() {
                  favourites_only = value;
                });
              },
            ),
            const SizedBox(height: 16),
            if (visible().isEmpty) ...[
              Text(
                'No contacts found',
                style: Theme.of(context).textTheme.bodyLarge!.copyWith(color: Colors.grey),
              ),
            ] else ...[
              for (final contact in visible()) ...[
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => ContactDetailScreen(contact: contact)));
                  },
                  child: ContactRow(contact: contact),
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

class ContactDetailScreen extends StatefulWidget {
  final dynamic contact;
  ContactDetailScreen({super.key, required this.contact});

  @override
  State<ContactDetailScreen> createState() => _ContactDetailScreenState();
}

class _ContactDetailScreenState extends State<ContactDetailScreen> {
  late var current = shared.contacts.cast<dynamic>().firstWhere((c) => c['name'] == widget.contact['name'], orElse: () => null);

  void toggle_fav() {
    dynamic c = shared.contacts.cast<dynamic>().firstWhere((c) => c['name'] == widget.contact['name'], orElse: () => null);
    shared.update(() {
      shared.contacts = shared.contacts.map((e) => e == c ? {...c, 'favourite': !c['favourite']} : e).toList();
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
              (((current['name']) as dynamic)?.toString() ?? ''),
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            Text(
              (((current['phone']) as dynamic)?.toString() ?? ''),
              style: Theme.of(context).textTheme.bodyLarge!,
            ),
            const SizedBox(height: 16),
            if (current['favourite']) ...[
              Chip(
                label: Text('Favourite'),
                backgroundColor: Theme.of(context).colorScheme.primary,
              ),
            ],
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                toggle_fav();
              },
              child: const Text('Toggle Favourite'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('Back'),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
