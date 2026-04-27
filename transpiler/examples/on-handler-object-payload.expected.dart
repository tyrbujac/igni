import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: LoginScreen()));
}

class LoginForm extends StatelessWidget {
  final dynamic button_text;
  final void Function(dynamic)? onSubmit;
  const LoginForm({super.key, required this.button_text, this.onSubmit});

  @override
  Widget build(BuildContext context) {
    final dynamic email = '';
    final dynamic password = '';
    return Column(
      children: [
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 320),
          child: TextField(
          key: const ValueKey("email"),
          controller: _emailController,
          onChanged: (value) {
            setState(() {
              email = value;
            });
          },
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            hintText: 'Email',
          ),
        ),
        ),
        const SizedBox(height: 16),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 320),
          child: TextField(
          key: const ValueKey("password"),
          controller: _passwordController,
          onChanged: (value) {
            setState(() {
              password = value;
            });
          },
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            hintText: 'Password',
          ),
        ),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
          onPressed: () {
            onSubmit?.call({'email': email, 'password': password});
          },
          child: Text('$button_text'),
        ),
      ],
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String status = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            LoginForm(button_text: 'Sign in', onSubmit: (creds) {
              setState(() {
                status = 'Welcome '.toString() + (((creds['email']) as dynamic)?.toString() ?? '');
              });
              }),
            const SizedBox(height: 16),
            Text(
              '$status',
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
