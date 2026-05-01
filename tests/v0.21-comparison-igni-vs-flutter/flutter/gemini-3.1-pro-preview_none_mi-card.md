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
      home: Scaffold(
        backgroundColor: Colors.teal,
        body: SafeArea(
          child: SizedBox(
            width: double.infinity,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Avatar (140px diameter = 70px radius)
                const CircleAvatar(
                  radius: 70.0,
                  backgroundImage: AssetImage('avatar.png'),
                  backgroundColor: Colors.tealAccent, // Fallback while loading
                ),
                const SizedBox(height: 24.0),
                
                // Name Heading
                const Text(
                  'Joe Bloggs',
                  style: TextStyle(
                    fontSize: 40.0,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8.0),
                
                // Role
                const Text(
                  'IGNI DEVELOPER',
                  style: TextStyle(
                    fontSize: 16.0,
                    color: Colors.white,
                    letterSpacing: 2.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 32.0),
                
                // Phone Information Row
                _buildInfoPill(
                  icon: Icons.phone,
                  text: '+44 123 456 7890',
                ),
                const SizedBox(height: 16.0),
                
                // Email Information Row
                _buildInfoPill(
                  icon: Icons.email,
                  text: 'joe@bloggs.dev',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Reusable widget for the information pill rows
  Widget _buildInfoPill({required IconData icon, required String text}) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24.0),
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
      decoration: BoxDecoration(
        color: Colors.white, // Light card background
        borderRadius: BorderRadius.circular(50.0), // Rounded corners (pill shape)
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.teal),
          const SizedBox(width: 20.0),
          Text(
            text,
            style: TextStyle(
              color: Colors.teal.shade900,
              fontSize: 16.0,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
```