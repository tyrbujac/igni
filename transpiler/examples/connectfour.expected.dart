import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ConnectFourScreen()));
}

class ConnectFourScreen extends StatefulWidget {
  const ConnectFourScreen({super.key});

  @override
  State<ConnectFourScreen> createState() => _ConnectFourScreenState();
}

class _ConnectFourScreenState extends State<ConnectFourScreen> {
  List<dynamic> cells = [{'id': 0, 'mark': ''}, {'id': 1, 'mark': ''}, {'id': 2, 'mark': ''}, {'id': 3, 'mark': ''}, {'id': 4, 'mark': ''}, {'id': 5, 'mark': ''}, {'id': 6, 'mark': ''}, {'id': 7, 'mark': ''}, {'id': 8, 'mark': ''}, {'id': 9, 'mark': ''}, {'id': 10, 'mark': ''}, {'id': 11, 'mark': ''}, {'id': 12, 'mark': ''}, {'id': 13, 'mark': ''}, {'id': 14, 'mark': ''}, {'id': 15, 'mark': ''}, {'id': 16, 'mark': ''}, {'id': 17, 'mark': ''}, {'id': 18, 'mark': ''}, {'id': 19, 'mark': ''}, {'id': 20, 'mark': ''}, {'id': 21, 'mark': ''}, {'id': 22, 'mark': ''}, {'id': 23, 'mark': ''}, {'id': 24, 'mark': ''}, {'id': 25, 'mark': ''}, {'id': 26, 'mark': ''}, {'id': 27, 'mark': ''}, {'id': 28, 'mark': ''}, {'id': 29, 'mark': ''}, {'id': 30, 'mark': ''}, {'id': 31, 'mark': ''}, {'id': 32, 'mark': ''}, {'id': 33, 'mark': ''}, {'id': 34, 'mark': ''}, {'id': 35, 'mark': ''}, {'id': 36, 'mark': ''}, {'id': 37, 'mark': ''}, {'id': 38, 'mark': ''}, {'id': 39, 'mark': ''}, {'id': 40, 'mark': ''}, {'id': 41, 'mark': ''}];
  String player = 'red';
  String winner = '';

  void drop(dynamic col) {
    if (winner.isEmpty) {
      dynamic target_row = [5, 4, 3, 2, 1, 0].cast<dynamic>().firstWhere((r) => (r * 7 + col >= 0 && r * 7 + col < cells.length ? cells[r * 7 + col] : null)['mark'].isEmpty, orElse: () => null);
      if (target_row != null) {
        dynamic target = (target_row * 7 + col >= 0 && target_row * 7 + col < cells.length ? cells[target_row * 7 + col] : null);
        setState(() {
          cells = cells.map((e) => e == target ? {...target, 'mark': player} : e).toList();
        });
        setState(() {
          winner = check_winner();
        });
        if (winner.isEmpty) {
          if (player == 'red') {
            setState(() {
              player = 'yellow';
            });
          } else {
            setState(() {
              player = 'red';
            });
          }
        }
      }
    }
  }

  dynamic four_in_a_row(dynamic r, dynamic c, dynamic dr, dynamic dc) {
    dynamic a = (r * 7 + c >= 0 && r * 7 + c < cells.length ? cells[r * 7 + c] : null)['mark'];
    dynamic b = ((r + dr) * 7 + c + dc >= 0 && (r + dr) * 7 + c + dc < cells.length ? cells[(r + dr) * 7 + c + dc] : null)['mark'];
    dynamic cc = ((r + 2 * dr) * 7 + c + 2 * dc >= 0 && (r + 2 * dr) * 7 + c + 2 * dc < cells.length ? cells[(r + 2 * dr) * 7 + c + 2 * dc] : null)['mark'];
    dynamic d = ((r + 3 * dr) * 7 + c + 3 * dc >= 0 && (r + 3 * dr) * 7 + c + 3 * dc < cells.length ? cells[(r + 3 * dr) * 7 + c + 3 * dc] : null)['mark'];
    if (a.isNotEmpty && a == b && b == cc && cc == d) {
      return a;
    }
    return '';
  }

  dynamic check_winner() {
    dynamic result = '';
    dynamic hit = '';
    for (final r in [0, 1, 2, 3, 4, 5]) {
      for (final c in [0, 1, 2, 3]) {
        hit = four_in_a_row(r, c, 0, 1);
        if (hit.isNotEmpty) {
          result = hit;
        }
      }
    }
    for (final c in [0, 1, 2, 3, 4, 5, 6]) {
      for (final r in [0, 1, 2]) {
        hit = four_in_a_row(r, c, 1, 0);
        if (hit.isNotEmpty) {
          result = hit;
        }
      }
    }
    for (final r in [0, 1, 2]) {
      for (final c in [0, 1, 2, 3]) {
        hit = four_in_a_row(r, c, 1, 1);
        if (hit.isNotEmpty) {
          result = hit;
        }
      }
    }
    for (final r in [3, 4, 5]) {
      for (final c in [0, 1, 2, 3]) {
        hit = four_in_a_row(r, c, 0 - 1, 1);
        if (hit.isNotEmpty) {
          result = hit;
        }
      }
    }
    if (result.isEmpty) {
      dynamic filled = cells.where((c) => (c['mark'].isNotEmpty) == true).toList().length;
      if (filled == 42) {
        result = 'draw';
      }
    }
    return result;
  }

  void reset() {
    setState(() {
      cells = [{'id': 0, 'mark': ''}, {'id': 1, 'mark': ''}, {'id': 2, 'mark': ''}, {'id': 3, 'mark': ''}, {'id': 4, 'mark': ''}, {'id': 5, 'mark': ''}, {'id': 6, 'mark': ''}, {'id': 7, 'mark': ''}, {'id': 8, 'mark': ''}, {'id': 9, 'mark': ''}, {'id': 10, 'mark': ''}, {'id': 11, 'mark': ''}, {'id': 12, 'mark': ''}, {'id': 13, 'mark': ''}, {'id': 14, 'mark': ''}, {'id': 15, 'mark': ''}, {'id': 16, 'mark': ''}, {'id': 17, 'mark': ''}, {'id': 18, 'mark': ''}, {'id': 19, 'mark': ''}, {'id': 20, 'mark': ''}, {'id': 21, 'mark': ''}, {'id': 22, 'mark': ''}, {'id': 23, 'mark': ''}, {'id': 24, 'mark': ''}, {'id': 25, 'mark': ''}, {'id': 26, 'mark': ''}, {'id': 27, 'mark': ''}, {'id': 28, 'mark': ''}, {'id': 29, 'mark': ''}, {'id': 30, 'mark': ''}, {'id': 31, 'mark': ''}, {'id': 32, 'mark': ''}, {'id': 33, 'mark': ''}, {'id': 34, 'mark': ''}, {'id': 35, 'mark': ''}, {'id': 36, 'mark': ''}, {'id': 37, 'mark': ''}, {'id': 38, 'mark': ''}, {'id': 39, 'mark': ''}, {'id': 40, 'mark': ''}, {'id': 41, 'mark': ''}];
    });
    setState(() {
      player = 'red';
    });
    setState(() {
      winner = '';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Connect Four',
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              const SizedBox(height: 16),
              if (winner.isEmpty) ...[
                Text(
                  'Turn: '.toString() + player.toString(),
                ),
              ] else ...[
                if (winner == 'draw') ...[
                  Text(
                    'Draw — board full',
                    style: Theme.of(context).textTheme.headlineSmall!,
                  ),
                ] else ...[
                  Text(
                    winner.toString() + ' wins!'.toString(),
                    style: Theme.of(context).textTheme.headlineSmall!,
                  ),
                ],
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  for (final (_i, col) in [0, 1, 2, 3, 4, 5, 6].indexed) ...[
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                      onPressed: () {
                        drop(col);
                      },
                      child: const Text('↓'),
                    ),
                    if (_i < [0, 1, 2, 3, 4, 5, 6].length - 1) const SizedBox(width: 8),
                  ],
                ],
              ),
              const SizedBox(height: 16),
              Column(
                children: [
                  for (final (_i, r) in [0, 1, 2, 3, 4, 5].indexed) ...[
                    Row(
                      children: [
                        for (final (_i, c) in [0, 1, 2, 3, 4, 5, 6].indexed) ...[
                          Expanded(
                            child: Container(
                            decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(16)),
                            child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    (r * 7 + c >= 0 && r * 7 + c < cells.length ? cells[r * 7 + c] : null)['mark'].toString(),
                                    style: Theme.of(context).textTheme.headlineLarge!,
                                  ),
                                ],
                              ),
                            ),
                          ),
                          ),
                          ),
                          if (_i < [0, 1, 2, 3, 4, 5, 6].length - 1) const SizedBox(width: 8),
                        ],
                      ],
                    ),
                    if (_i < [0, 1, 2, 3, 4, 5].length - 1) const SizedBox(height: 8),
                  ],
                ],
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  reset();
                },
                child: const Text('New Game'),
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
