import 'package:flutter/material.dart';
import 'dart:math';

void main() {
  runApp(const MaterialApp(home: DiceeScreen()));
}

class DiceeScreen extends StatefulWidget {
  const DiceeScreen({super.key});

  @override
  State<DiceeScreen> createState() => _DiceeScreenState();
}

class _DiceeScreenState extends State<DiceeScreen> {
  int die1 = 1;
  int die2 = 1;

  void roll() {
    setState(() {
      die1 = (Random().nextInt(6 - 1 + 1) + 1);
    });
    setState(() {
      die2 = (Random().nextInt(6 - 1 + 1) + 1);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Dicee'), backgroundColor: Colors.red, foregroundColor: Colors.white),
      backgroundColor: Colors.red,
      body: Center(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            GestureDetector(
              onTap: () {
                roll();
              },
              child: Image.asset(
              'assets/' + 'dice'.toString() + die1.toString().toString() + '.png'.toString(),
              width: 120,
              height: 120,
              fit: BoxFit.cover,
            ),
            ),
            const SizedBox(width: 24),
            GestureDetector(
              onTap: () {
                roll();
              },
              child: Image.asset(
              'assets/' + 'dice'.toString() + die2.toString().toString() + '.png'.toString(),
              width: 120,
              height: 120,
              fit: BoxFit.cover,
            ),
            ),
          ],
        ),
      ),
    );
  }
}
