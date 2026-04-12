import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: GreetingScreen()));
}

class GreetingScreen extends StatefulWidget {
  const GreetingScreen({super.key});

  @override
  State<GreetingScreen> createState() => _GreetingScreenState();
}

class _GreetingScreenState extends State<GreetingScreen> {
  String name = '';
  late final TextEditingController _nameController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: name);
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TextField(
              controller: _nameController,
              onChanged: (value) {
                setState(() {
                  name = value;
                });
              },
              decoration: const InputDecoration(hintText: 'Name'),
            ),
            const SizedBox(height: 16),
            if (name.isNotEmpty) ...[
              Text(
                'Hello, ' + name,
              ),
            ] else ...[
              Text(
                'Type your name above',
              ),
            ],
          ],
        ),
      ),
    );
  }
}
