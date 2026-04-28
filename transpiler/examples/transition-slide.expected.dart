import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ToolbarScreen()));
}

class ToolbarScreen extends StatefulWidget {
  const ToolbarScreen({super.key});

  @override
  State<ToolbarScreen> createState() => _ToolbarScreenState();
}

class _ToolbarScreenState extends State<ToolbarScreen> {
  bool expanded = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Column(
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  transitionBuilder: (Widget child, Animation<double> animation) => SlideTransition(
                    position: Tween<Offset>(begin: const Offset(1.0, 0.0), end: Offset.zero).animate(animation),
                    child: child,
                  ),
                  child: expanded ? KeyedSubtree(key: const ValueKey('branch-0'), child: Text(
                        'Tools open',
                        style: Theme.of(context).textTheme.headlineLarge!,
                      )) : KeyedSubtree(key: const ValueKey('branch-1'), child: Text(
                        'Click to expand',
                      )),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                setState(() {
                  expanded = !expanded;
                });
              },
              child: const Text('Toggle'),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
