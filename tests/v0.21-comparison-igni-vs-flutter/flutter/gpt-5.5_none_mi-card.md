```dart
import 'package:flutter/material.dart';

void main() => runApp(const IdentityCardApp());

class IdentityCardApp extends StatelessWidget {
  const IdentityCardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Identity Card',
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      home: const IdentityCardScreen(),
    );
  }
}

class IdentityCardScreen extends StatelessWidget {
  const IdentityCardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.teal,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              CircleAvatar(
                radius: 70,
                backgroundImage: AssetImage('assets/avatar.png'),
              ),
              SizedBox(height: 24),
              Text(
                'Joe Bloggs',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 1.2,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'IGNI DEVELOPER',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  letterSpacing: 2.5,
                ),
              ),
              SizedBox(height: 32),
              InfoPill(
                icon: Icons.phone,
                text: '+44 123 456 7890',
              ),
              SizedBox(height: 16),
              InfoPill(
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

class InfoPill extends StatelessWidget {
  final IconData icon;
  final String text;

  const InfoPill({
    super.key,
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 320,
      padding: const EdgeInsets.symmetric(
        horizontal: 20,
        vertical: 16,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: Colors.teal,
            size: 26,
          ),
          const SizedBox(width: 18),
          Text(
            text,
            style: const TextStyle(
              fontSize: 18,
              color: Colors.black87,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
```