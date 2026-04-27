import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: FormScreen()));
}

class FormScreen extends StatefulWidget {
  const FormScreen({super.key});

  @override
  State<FormScreen> createState() => _FormScreenState();
}

class _FormScreenState extends State<FormScreen> {
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
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320),
              child: TextField(
              key: const ValueKey("name"),
              controller: _nameController,
              onChanged: (value) {
                setState(() {
                  name = value;
                });
              },
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: 'Your name',
              ),
            ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                setState(() {
                  name = '';
                });
              },
              child: const Text('Submit'),
            ),
            const SizedBox(height: 16),
            Text(
              'Hello, '.toString() + (((name) as dynamic)?.toString() ?? ''),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
