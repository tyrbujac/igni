import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: IconRowScreen()));
}

class IconRowScreen extends StatefulWidget {
  const IconRowScreen({super.key});

  @override
  State<IconRowScreen> createState() => _IconRowScreenState();
}

class _IconRowScreenState extends State<IconRowScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              'Tightly packed',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 0),
            Container(
              decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(0)),
              child: Padding(
              padding: const EdgeInsets.all(0),
              child: Row(
                children: [
                  Icon(
                    Icons.favorite,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 0),
                  Icon(
                    Icons.share,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 0),
                  Icon(
                    Icons.more,
                    color: Colors.grey,
                  ),
                ],
              ),
            ),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
