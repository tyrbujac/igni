import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 16))), home: CreatePostScreen()));
}

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  String title = 'New Post';
  dynamic result;
  bool _resultLoading = true;
  bool _resultError = false;

  @override
  void initState() {
    super.initState();
    _fetchResult();
  }

  Future<void> _fetchResult() async {
    try {
      final response = await http.post(
        Uri.parse('/api/posts'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'title': title, 'published': true}),
      );
      if (response.statusCode == 200) {
        setState(() {
          result = jsonDecode(response.body);
          _resultLoading = false;
        });
      } else {
        setState(() {
          _resultError = true;
          _resultLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _resultError = true;
        _resultLoading = false;
      });
    }
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
            if (_resultLoading) ...[
              const CircularProgressIndicator(),
            ] else if (_resultError) ...[
              Text(
                'Failed to create post',
                style: TextStyle(color: Colors.red),
              ),
            ] else ...[
              Text(
                'Post created!',
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              Text(
                result['id'].toString(),
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
