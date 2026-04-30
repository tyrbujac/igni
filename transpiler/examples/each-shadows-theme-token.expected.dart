import 'package:flutter/material.dart';

class SharedState extends ChangeNotifier {
  List<dynamic> cards = <dynamic>[{'title': 'Birthday'}, {'title': 'Thank you'}];

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }
}

final shared = SharedState();

void main() {
  runApp(ListenableBuilder(
    listenable: shared,
    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: HomeScreen()),
  ));
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            for (final (_i, card) in shared.cards.indexed) ...[
              Container(
                decoration: BoxDecoration(color: const Color(0xFFFFFFFF)),
                child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  children: [
                    Text(
                      (((card['title']) as dynamic)?.toString() ?? ''),
                    ),
                  ],
                ),
              ),
              ),
              if (_i < shared.cards.length - 1) const SizedBox(height: 8),
            ],
          ],
        ),
      ),
        ),
      ),
    );
  }
}
