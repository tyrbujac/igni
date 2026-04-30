import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: MiCardScreen()));
}

class MiCardScreen extends StatefulWidget {
  const MiCardScreen({super.key});

  @override
  State<MiCardScreen> createState() => _MiCardScreenState();
}

class _MiCardScreenState extends State<MiCardScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.teal,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipOval(
                child: Image.asset(
                'assets/avatar.png',
                width: 140,
                height: 140,
                fit: BoxFit.cover,
              ),
              ),
              const SizedBox(height: 16),
              Text(
                'Joe Bloggs',
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              const SizedBox(height: 16),
              Text(
                'IGNI DEVELOPER',
                style: TextStyle(color: Colors.white),
              ),
              const SizedBox(height: 16),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: Container(
                decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
                child: Padding(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.phone,
                        color: Colors.teal,
                      ),
                      const SizedBox(width: 16),
                      Text(
                        '+44 123 456 7890',
                      ),
                    ],
                  ),
                ),
              ),
              ),
              ),
              const SizedBox(height: 16),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: Container(
                decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
                child: Padding(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.mail,
                        color: Colors.teal,
                      ),
                      const SizedBox(width: 16),
                      Text(
                        'joe@bloggs.dev',
                      ),
                    ],
                  ),
                ),
              ),
              ),
              ),
            ],
          ),
        ),
      ),
        ),
      ),
    );
  }
}
