```dart
import 'package:flutter/material.dart';

void main() => runApp(const BMIApp());

class BMIState {
  static double height = 180;
  static int weight = 60;
  static int age = 20;
  static String gender = 'male';
}

class BMIApp extends StatelessWidget {
  const BMIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BMI Calculator',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0A0E21),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0A0E21),
          centerTitle: true,
          elevation: 0,
        ),
      ),
      home: const InputScreen(),
    );
  }
}

class InputScreen extends StatefulWidget {
  const InputScreen({super.key});

  @override
  State<InputScreen> createState() => _InputScreenState();
}

class _InputScreenState extends State<InputScreen> {
  static const Color activeColor = Color(0xFF1D1E33);
  static const Color inactiveColor = Color(0xFF111328);
  static const Color accent = Color(0xFFEB1555);

  Widget _card({required Widget child, Color color = activeColor, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(10),
        ),
        child: child,
      ),
    );
  }

  Widget _genderContent(IconData icon, String label) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 80),
        const SizedBox(height: 15),
        Text(label, style: const TextStyle(fontSize: 18, color: Colors.white70)),
      ],
    );
  }

  Widget _roundButton(IconData icon, VoidCallback onPressed) {
    return RawMaterialButton(
      onPressed: onPressed,
      shape: const CircleBorder(),
      fillColor: const Color(0xFF4C4F5E),
      constraints: const BoxConstraints.tightFor(width: 56, height: 56),
      child: Icon(icon, color: Colors.white),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('BMI CALCULATOR')),
      body: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                Expanded(
                  child: _card(
                    color: BMIState.gender == 'male' ? activeColor : inactiveColor,
                    onTap: () => setState(() => BMIState.gender = 'male'),
                    child: _genderContent(Icons.male, 'MALE'),
                  ),
                ),
                Expanded(
                  child: _card(
                    color: BMIState.gender == 'female' ? activeColor : inactiveColor,
                    onTap: () => setState(() => BMIState.gender = 'female'),
                    child: _genderContent(Icons.female, 'FEMALE'),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _card(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('HEIGHT', style: TextStyle(fontSize: 18, color: Colors.white70)),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        BMIState.height.round().toString(),
                        style: const TextStyle(fontSize: 50, fontWeight: FontWeight.w900),
                      ),
                      const Text('cm', style: TextStyle(fontSize: 18, color: Colors.white70)),
                    ],
                  ),
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      activeTrackColor: Colors.white,
                      inactiveTrackColor: const Color(0xFF8D8E98),
                      thumbColor: accent,
                      overlayColor: const Color(0x29EB1555),
                    ),
                    child: Slider(
                      value: BMIState.height,
                      min: 120,
                      max: 220,
                      onChanged: (v) => setState(() => BMIState.height = v),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Row(
              children: [
                Expanded(
                  child: _card(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('WEIGHT', style: TextStyle(fontSize: 18, color: Colors.white70)),
                        Text('${BMIState.weight}',
                            style: const TextStyle(fontSize: 50, fontWeight: FontWeight.w900)),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _roundButton(Icons.remove, () => setState(() {
                                  if (BMIState.weight > 0) BMIState.weight--;
                                })),
                            const SizedBox(width: 10),
                            _roundButton(Icons.add, () => setState(() => BMIState.weight++)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  child: _card(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('AGE', style: TextStyle(fontSize: 18, color: Colors.white70)),
                        Text('${BMIState.age}',
                            style: const TextStyle(fontSize: 50, fontWeight: FontWeight.w900)),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _roundButton(Icons.remove, () => setState(() {
                                  if (BMIState.age > 0) BMIState.age--;
                                })),
                            const SizedBox(width: 10),
                            _roundButton(Icons.add, () => setState(() => BMIState.age++)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ResultScreen()),
              );
            },
            child: Container(
              color: accent,
              margin: const EdgeInsets.only(top: 10),
              padding: const EdgeInsets.only(bottom: 20),
              width: double.infinity,
              height: 80,
              child: const Center(
                child: Text(
                  'CALCULATE',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ResultScreen extends StatelessWidget {
  const ResultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final h = BMIState.height / 100;
    final bmi = BMIState.weight / (h * h);
    String category;
    Color color;
    String advice;
    if (bmi < 18.5) {
      category = 'UNDERWEIGHT';
      color = Colors.blue;
      advice = 'You have a lower than normal body weight. You can eat a bit more.';
    } else if (bmi < 25) {
      category = 'NORMAL';
      color = Colors.green;
      advice = 'You have a normal body weight. Good job!';
    } else {
      category = 'OVERWEIGHT';
      color = Colors.orange;
      advice = 'You have a higher than normal body weight. Try to exercise more.';
    }

    return Scaffold(
      appBar: AppBar(title: const Text('BMI CALCULATOR')),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(20),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text('YOUR RESULT',
                  style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold)),
            ),
          ),
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(15),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1D1E33),
                borderRadius: BorderRadius.circular(10),
              ),
              width: double.infinity,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Text(category,
                      style: TextStyle(
                          color: color,
                          fontSize: 24,
                          fontWeight: FontWeight.bold)),
                  Text(bmi.toStringAsFixed(1),
                      style: const TextStyle(
                          fontSize: 90, fontWeight: FontWeight.bold)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Text(
                      advice,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              color: const Color(0xFFEB1555),
              margin: const EdgeInsets.only(top: 10),
              padding: const EdgeInsets.only(bottom: 20),
              width: double.infinity,
              height: 80,
              child: const Center(
                child: Text(
                  'RE-CALCULATE',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```