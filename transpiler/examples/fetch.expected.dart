import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const MaterialApp(home: UserProfileScreen()));
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
      final response = await http.get(Uri.parse('https://jsonplaceholder.typicode.com/users/1'));
      if (response.statusCode == 200) {
        setState(() {
          user = jsonDecode(response.body);
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
      body: Padding(
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
                user['name'].toString(),
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              Text(
                user['email'].toString(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
