import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ProfileScreen()));
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
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
      final _igni_response = await http.get(Uri.parse('https://api.example.com/user'));
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            if (_responseLoading) ...[
              const CircularProgressIndicator(),
            ] else if (_responseError) ...[
              Text(
                'Failed',
              ),
            ] else ...[
              Text(
                (((response['name']) as dynamic)?.toString() ?? ''),
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
