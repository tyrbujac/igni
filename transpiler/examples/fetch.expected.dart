import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: UserProfileScreen()));
}

class UserProfileScreen extends StatefulWidget {
  const UserProfileScreen({super.key});

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  dynamic user;
  bool _userLoading = true;
  bool _userError = false;

  @override
  void initState() {
    super.initState();
    _fetchUser();
  }

  Future<void> _fetchUser() async {
    try {
      final _igni_response = await http.get(Uri.parse('https://api.github.com/users/octocat'));
      if (_igni_response.statusCode == 200) {
        setState(() {
          user = jsonDecode(_igni_response.body);
          _userLoading = false;
        });
      } else {
        setState(() {
          _userError = true;
          _userLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _userError = true;
        _userLoading = false;
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
            if (_userLoading) ...[
              const CircularProgressIndicator(),
            ] else if (_userError) ...[
              Text(
                'Failed to load user',
              ),
            ] else ...[
              Text(
                (((user['name']) as dynamic)?.toString() ?? ''),
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              Text(
                (((user['login']) as dynamic)?.toString() ?? ''),
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
