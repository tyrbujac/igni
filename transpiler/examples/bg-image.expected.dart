import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(debugShowCheckedModeBanner: false, home: HeroScreen()));
}

class HeroScreen extends StatefulWidget {
  const HeroScreen({super.key});

  @override
  State<HeroScreen> createState() => _HeroScreenState();
}

class _HeroScreenState extends State<HeroScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/' + 'hero.jpg'),
            fit: BoxFit.cover,
          ),
        ),
        child: SafeArea(
          child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
        Expanded(
          child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Welcome',
                style: Theme.of(context).textTheme.headlineLarge!.copyWith(color: Colors.white),
              ),
            ],
          ),
        ),
        ),
        Container(
          decoration: BoxDecoration(image: DecorationImage(image: AssetImage('assets/' + 'card-bg.png'), fit: BoxFit.cover), borderRadius: BorderRadius.circular(16)),
          child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Text(
                'Card with image background',
              ),
            ],
          ),
        ),
        ),
        ],
      ),
        ),
      ),
    );
  }
}
