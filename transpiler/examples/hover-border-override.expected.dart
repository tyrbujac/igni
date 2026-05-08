import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: OutlinedScreen()));
}

class OutlinedScreen extends StatefulWidget {
  const OutlinedScreen({super.key});

  @override
  State<OutlinedScreen> createState() => _OutlinedScreenState();
}

class _OutlinedScreenState extends State<OutlinedScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _HoverScope(
              builder: (context, _hover0) => AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              curve: Curves.easeOut,
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: _hover0 ? Border.all(color: Theme.of(context).colorScheme.primary, width: 2.0) : Border.all(color: Colors.grey, width: 1.0)),
              child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'Hover for accent border',
                  ),
                ],
              ),
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

class _HoverScope extends StatefulWidget {
  final Widget Function(BuildContext, bool) builder;
  final MouseCursor cursor;
  const _HoverScope({required this.builder, this.cursor = MouseCursor.defer});
  @override
  State<_HoverScope> createState() => _HoverScopeState();
}

class _HoverScopeState extends State<_HoverScope> {
  bool _hovered = false;
  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: widget.cursor,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: widget.builder(context, _hovered),
    );
  }
}
