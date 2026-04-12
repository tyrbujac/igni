import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: SettingsScreen()));
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String username = 'Tyr';
  String email = 'tyr@example.com';
  bool dark_mode = false;
  bool notifications = true;
  late final TextEditingController _usernameController;
  late final TextEditingController _emailController;

  @override
  void initState() {
    super.initState();
    _usernameController = TextEditingController(text: username);
    _emailController = TextEditingController(text: email);
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Settings',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _usernameController,
              onChanged: (value) {
                setState(() {
                  username = value;
                });
              },
              decoration: const InputDecoration(hintText: 'Username'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailController,
              onChanged: (value) {
                setState(() {
                  email = value;
                });
              },
              decoration: const InputDecoration(hintText: 'Email'),
            ),
            const SizedBox(height: 16),
            Switch(
              value: dark_mode,
              onChanged: (value) {
                setState(() {
                  dark_mode = value;
                });
              },
            ),
            const SizedBox(height: 16),
            Switch(
              value: notifications,
              onChanged: (value) {
                setState(() {
                  notifications = value;
                });
              },
            ),
          ],
        ),
      ),
      ),
    );
  }
}
