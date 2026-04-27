import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: SearchScreen()));
}

class QueryBar extends StatelessWidget {
  final dynamic placeholder_text;
  final void Function(dynamic)? onSubmit;
  const QueryBar({super.key, required this.placeholder_text, this.onSubmit});

  @override
  Widget build(BuildContext context) {
    final dynamic text = '';
    return Row(
      children: [
        Expanded(
          child: TextField(
          controller: _textController,
          onChanged: (value) {
            setState(() {
              text = value;
            });
          },
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            hintText: '$placeholder_text',
          ),
        ),
        ),
        const SizedBox(width: 8),
        ElevatedButton(
          style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
          onPressed: () {
            onSubmit?.call(text);
          },
          child: const Text('Go'),
        ),
      ],
    );
  }
}

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  List<dynamic> results = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            QueryBar(placeholder_text: 'Search', onSubmit: (query) {
              setState(() {
                results = [{'title': 'Result for: '.toString() + (((query) as dynamic)?.toString() ?? '')}];
              });
              }),
            const SizedBox(height: 16),
            for (final (_i, item) in results.indexed) ...[
              Text(
                (((item['title']) as dynamic)?.toString() ?? ''),
              ),
              if (_i < results.length - 1) const SizedBox(height: 16),
            ],
          ],
        ),
      ),
        ),
      ),
    );
  }
}
