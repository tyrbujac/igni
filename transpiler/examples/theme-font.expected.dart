import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5, fontFamily: GoogleFonts.sourceSans3().fontFamily), headlineLarge: TextStyle(fontFamily: GoogleFonts.pacifico().fontFamily), headlineSmall: TextStyle(fontFamily: GoogleFonts.pacifico().fontFamily), bodyLarge: TextStyle(fontFamily: GoogleFonts.sourceSans3().fontFamily), bodySmall: TextStyle(fontFamily: GoogleFonts.sourceSans3().fontFamily))), home: DemoScreen()));
}

class DemoScreen extends StatefulWidget {
  const DemoScreen({super.key});

  @override
  State<DemoScreen> createState() => _DemoScreenState();
}

class _DemoScreenState extends State<DemoScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
        Text(
          'Igni v0.12.1',
          style: Theme.of(context).textTheme.headlineLarge!,
        ),
        Text(
          'Body text',
          style: Theme.of(context).textTheme.bodyLarge!,
        ),
        Text(
          'Caption',
          style: Theme.of(context).textTheme.bodySmall!,
        ),
        ],
      ),
      ),
        ),
      ),
    );
  }
}
