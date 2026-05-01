import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: RangeBrowserScreen()));
}

class RangeBrowserScreen extends StatefulWidget {
  const RangeBrowserScreen({super.key});

  @override
  State<RangeBrowserScreen> createState() => _RangeBrowserScreenState();
}

class _RangeBrowserScreenState extends State<RangeBrowserScreen> {
  int amount = 0;
  dynamic range;
  bool _rangeLoading = true;
  bool _rangeError = false;
  String? _lastRangeUrl;
  int _rangeRequestId = 0;
  http.Client? _rangeClient;

  @override
  void initState() {
    super.initState();
    _fetchRange();
  }

  @override
  void dispose() {
    _rangeClient?.close();
    super.dispose();
  }

  Future<void> _fetchRange() async {
    _rangeClient?.close();
    _rangeClient = http.Client();
    final _myId = ++_rangeRequestId;
    try {
      final _igni_response = await _rangeClient!.get(Uri.parse('/api/range/'.toString() + (((amount) as dynamic)?.toString() ?? '')));
      if (_myId != _rangeRequestId) return;
      if (_igni_response.statusCode == 200) {
        setState(() {
          range = jsonDecode(_igni_response.body);
          _rangeLoading = false;
        });
      } else {
        setState(() {
          _rangeError = true;
          _rangeLoading = false;
        });
      }
    } on http.ClientException {
      return;
    } catch (e) {
      if (_myId != _rangeRequestId) return;
      setState(() {
        _rangeError = true;
        _rangeLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final _currentRangeUrl = '/api/range/'.toString() + (((amount) as dynamic)?.toString() ?? '');
    if (_currentRangeUrl != _lastRangeUrl) {
      _lastRangeUrl = _currentRangeUrl;
      _rangeLoading = true;
      _rangeError = false;
      _fetchRange();
    }
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Amount: '.toString() + (((amount) as dynamic)?.toString() ?? ''),
            ),
            const SizedBox(height: 16),
            Slider(
              key: const ValueKey("amount"),
              value: amount.toDouble(),
              min: 0.toDouble(),
              max: 1000.toDouble(),
              onChanged: (value) {
                setState(() {
                  amount = value.round();
                });
              },
            ),
            const SizedBox(height: 16),
            if (_rangeLoading) ...[
              const CircularProgressIndicator(),
            ] else if (_rangeError) ...[
              Text(
                'Lookup failed',
                style: TextStyle(color: Colors.red),
              ),
            ] else ...[
              Text(
                (((range['name']) as dynamic)?.toString() ?? ''),
                style: Theme.of(context).textTheme.headlineLarge!,
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
