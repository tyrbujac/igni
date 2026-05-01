```dart
import 'package:flutter/material.dart';

void main() => runApp(const IdentityCardApp());

class IdentityCardApp extends StatelessWidget {
  const IdentityCardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Identity Card',
      debugShowCheckedModeBanner: false,
      home: const IdentityCardScreen(),
    );
  }
}

class IdentityCardScreen extends StatelessWidget {
  const IdentityCardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const teal = Color(0xFF008B8B);

    return Scaffold(
      backgroundColor: teal,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 140,
                height: 140,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  image: DecorationImage(
                    image: AssetImage('avatar.png'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Joe Bloggs',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'IGNI DEVELOPER',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              const _InfoPill(
                icon: Icons.phone,
                text: '+44 123 456 7890',
              ),
              const SizedBox(height: 16),
              const _InfoPill(
                icon: Icons.mail,
                text: 'joe@bloggs.dev',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoPill({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    const teal = Color(0xFF008B8B);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFFF2F2F2),
        borderRadius: BorderRadius.circular(32),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: teal, size: 22),
          const SizedBox(width: 12),
          Text(
            text,
            style: const TextStyle(
              color: Colors.black87,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}
```