import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const MaterialApp(debugShowCheckedModeBanner: false, home: SearchScreen()));
}

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String query = '';
  String active = '';
  dynamic results;
  bool _resultsLoading = true;
  bool _resultsError = false;
  String? _lastResultsUrl;
  late final TextEditingController _queryController;

  @override
  void initState() {
    super.initState();
    _queryController = TextEditingController(text: query);
    _fetchResults();
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _fetchResults() async {
    try {
      final response = await http.get(Uri.parse('/api/search?q='.toString() + active.toString()));
      if (response.statusCode == 200) {
        setState(() {
          results = jsonDecode(response.body);
          _resultsLoading = false;
        });
      } else {
        setState(() {
          _resultsError = true;
          _resultsLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _resultsError = true;
        _resultsLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final _currentResultsUrl = '/api/search?q='.toString() + active.toString();
    if (_currentResultsUrl != _lastResultsUrl) {
      _lastResultsUrl = _currentResultsUrl;
      _resultsLoading = true;
      _resultsError = false;
      _fetchResults();
    }
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                  controller: _queryController,
                  onChanged: (value) {
                    setState(() {
                      query = value;
                    });
                  },
                  decoration: const InputDecoration(hintText: 'Search...'),
                ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                  onPressed: () {
                    setState(() {
                      active = query;
                    });
                  },
                  child: const Text('Search'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_resultsLoading) ...[
              const CircularProgressIndicator(),
            ] else if (_resultsError) ...[
              Text(
                'Search failed',
                style: TextStyle(color: Colors.red),
              ),
            ] else ...[
              Text(
                'Results for: '.toString() + active.toString(),
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
            ],
          ],
        ),
      ),
      ),
    );
  }
}
