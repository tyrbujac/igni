import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ContactsScreen()));
}

class ContactsScreen extends StatefulWidget {
  const ContactsScreen({super.key});

  @override
  State<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends State<ContactsScreen> {
  List<dynamic> contacts = [{'name': 'Charlie', 'active': true}, {'name': 'Alice', 'active': true}, {'name': 'Bob', 'active': false}];

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
            Text(
              'Active (sorted):',
              style: Theme.of(context).textTheme.bodyLarge!,
            ),
            const SizedBox(height: 16),
            for (final (_i, contact) in (List.from(contacts.where((c) => (c['active']) == true).toList())..sort((a, b) => (a['name'] as Comparable).compareTo(b['name']))).indexed) ...[
              Text(
                (((contact['name']) as dynamic)?.toString() ?? ''),
              ),
              if (_i < (List.from(contacts.where((c) => (c['active']) == true).toList())..sort((a, b) => (a['name'] as Comparable).compareTo(b['name']))).length - 1) const SizedBox(height: 16),
            ],
            const SizedBox(height: 16),
            Text(
              'All (reversed):',
              style: Theme.of(context).textTheme.bodyLarge!,
            ),
            const SizedBox(height: 16),
            for (final (_i, contact) in (List.from(contacts)..sort((a, b) => (a['name'] as Comparable).compareTo(b['name']))).reversed.toList().indexed) ...[
              Text(
                (((contact['name']) as dynamic)?.toString() ?? ''),
              ),
              if (_i < (List.from(contacts)..sort((a, b) => (a['name'] as Comparable).compareTo(b['name']))).reversed.toList().length - 1) const SizedBox(height: 16),
            ],
          ],
        ),
      ),
        ),
      ),
    );
  }
}
