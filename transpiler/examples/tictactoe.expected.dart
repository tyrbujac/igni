import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: TicTacToeScreen()));
}

class TicTacToeScreen extends StatefulWidget {
  const TicTacToeScreen({super.key});

  @override
  State<TicTacToeScreen> createState() => _TicTacToeScreenState();
}

class _TicTacToeScreenState extends State<TicTacToeScreen> {
  List<dynamic> cells = [{'id': 0, 'mark': ''}, {'id': 1, 'mark': ''}, {'id': 2, 'mark': ''}, {'id': 3, 'mark': ''}, {'id': 4, 'mark': ''}, {'id': 5, 'mark': ''}, {'id': 6, 'mark': ''}, {'id': 7, 'mark': ''}, {'id': 8, 'mark': ''}];
  String player = 'X';
  String winner = '';

  void place(dynamic cell) {
    if (winner.isEmpty && cell['mark'].isEmpty) {
      setState(() {
        cells = cells.map((e) => e == cell ? {...cell, 'mark': player} : e).toList();
      });
      setState(() {
        winner = check();
      });
      if (winner.isEmpty) {
        if (player == 'X') {
          setState(() {
            player = 'O';
          });
        } else {
          setState(() {
            player = 'X';
          });
        }
      }
    }
  }

  dynamic check() {
    dynamic lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    dynamic result = '';
    for (final line in lines) {
      dynamic a = ((0 >= 0 && 0 < line.length ? line[0] : null) >= 0 && (0 >= 0 && 0 < line.length ? line[0] : null) < cells.length ? cells[(0 >= 0 && 0 < line.length ? line[0] : null)] : null)['mark'];
      dynamic b = ((1 >= 0 && 1 < line.length ? line[1] : null) >= 0 && (1 >= 0 && 1 < line.length ? line[1] : null) < cells.length ? cells[(1 >= 0 && 1 < line.length ? line[1] : null)] : null)['mark'];
      dynamic c = ((2 >= 0 && 2 < line.length ? line[2] : null) >= 0 && (2 >= 0 && 2 < line.length ? line[2] : null) < cells.length ? cells[(2 >= 0 && 2 < line.length ? line[2] : null)] : null)['mark'];
      if (a.isNotEmpty && a == b && b == c) {
        result = a;
      }
    }
    if (result.isEmpty) {
      dynamic filled = 0;
      for (final cell in cells) {
        if (cell['mark'].isNotEmpty) {
          filled = filled + 1;
        }
      }
      if (filled == 9) {
        result = 'draw';
      }
    }
    return result;
  }

  void reset() {
    setState(() {
      cells = [{'id': 0, 'mark': ''}, {'id': 1, 'mark': ''}, {'id': 2, 'mark': ''}, {'id': 3, 'mark': ''}, {'id': 4, 'mark': ''}, {'id': 5, 'mark': ''}, {'id': 6, 'mark': ''}, {'id': 7, 'mark': ''}, {'id': 8, 'mark': ''}];
    });
    setState(() {
      player = 'X';
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
                'Noughts & Crosses',
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              const SizedBox(height: 16),
              if (winner.isEmpty) ...[
                Text(
                  'Your move, '.toString() + player.toString(),
                ),
              ] else ...[
                if (winner == 'draw') ...[
                  Text(
                    'Draw — nobody takes it!',
                    style: Theme.of(context).textTheme.headlineSmall!,
                  ),
                ] else ...[
                  Text(
                    winner.toString() + ' takes it!'.toString(),
                    style: Theme.of(context).textTheme.headlineSmall!,
                  ),
                ],
              ],
              const SizedBox(height: 16),
              Column(
                children: [
                  for (final row_start in [0, 3, 6]) ...[
                    Row(
                      children: [
                        for (final offset in [0, 1, 2]) ...[
                          Expanded(
                            child:                           GestureDetector(
                            onTap: () {
                              place((row_start + offset >= 0 && row_start + offset < cells.length ? cells[row_start + offset] : null));
                            },
                            child: Container(
                            decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(16)),
                            child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    (row_start + offset >= 0 && row_start + offset < cells.length ? cells[row_start + offset] : null)['mark'].toString(),
                                    style: Theme.of(context).textTheme.headlineLarge!,
                                  ),
                                ],
                              ),
                            ),
                          ),
                          ),
                          ),
                          ),
                        ],
                      ],
                    ),
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
