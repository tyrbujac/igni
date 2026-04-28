import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: LoginScreen()));
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  int refresh = 0;
  dynamic user;
  bool _userLoading = true;
  bool _userError = false;
  String? _lastUserUrl;

  @override
  void initState() {
    super.initState();
    _fetchUser();
  }

  Future<void> _fetchUser() async {
    try {
      final response = await http.get(Uri.parse('/api/user/me?r='.toString() + (((refresh) as dynamic)?.toString() ?? '')));
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
    final _currentUserUrl = '/api/user/me?r='.toString() + (((refresh) as dynamic)?.toString() ?? '');
    if (_currentUserUrl != _lastUserUrl) {
      _lastUserUrl = _currentUserUrl;
      _userLoading = true;
      _userError = false;
      _fetchUser();
    }
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: _userLoading ? KeyedSubtree(key: const ValueKey('branch-0'), child: const CircularProgressIndicator()) : _userError ? KeyedSubtree(key: const ValueKey('branch-1'), child: Text(
                    'Couldn\'t load — try again',
                  )) : KeyedSubtree(key: const ValueKey('branch-2'), child: Text(
                    (((user['name']) as dynamic)?.toString() ?? ''),
                    style: Theme.of(context).textTheme.headlineLarge!,
                  )),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
