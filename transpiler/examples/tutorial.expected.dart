import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(
    debugShowCheckedModeBanner: false,
    home: Scaffold(
      body: Center(
        child: Text(
          'Add a screen to app.igni to get started',
          style: TextStyle(fontSize: 16, color: Colors.black54),
        ),
      ),
    ),
  ));
}
