import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: CardsScreen()));
}

class CardsScreen extends StatefulWidget {
  const CardsScreen({super.key});

  @override
  State<CardsScreen> createState() => _CardsScreenState();
}

class _CardsScreenState extends State<CardsScreen> {
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
              cursor: SystemMouseCursors.click,
              builder: (context, _hover0) => AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              curve: Curves.easeOut,
              decoration: BoxDecoration(color: _hover0 ? Theme.of(context).colorScheme.primary : Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16)),
              child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'Sunset',
                  ),
                  if (_hover0) ...[
                    Text(
                      'Photo by Anna — taken last summer',
                      style: Theme.of(context).textTheme.bodySmall!,
                    ),
                  ],
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
