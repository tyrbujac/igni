```dart
import 'package:flutter/material.dart';

void main() => runApp(const BmiApp());

class BmiModel extends ChangeNotifier {
  String _gender = 'male';
  int _height = 180;
  int _weight = 60;
  int _age = 20;

  String get gender => _gender;
  int get height => _height;
  int get weight => _weight;
  int get age => _age;

  set gender(String value) {
    if (_gender == value) return;
    _gender = value;
    notifyListeners();
  }

  set height(int value) {
    final clamped = value.clamp(120, 220);
    if (_height == clamped) return;
    _height = clamped;
    notifyListeners();
  }

  void incrementWeight() {
    _weight++;
    notifyListeners();
  }

  void decrementWeight() {
    if (_weight <= 1) return;
    _weight--;
    notifyListeners();
  }

  void incrementAge() {
    _age++;
    notifyListeners();
  }

  void decrementAge() {
    if (_age <= 1) return;
    _age--;
    notifyListeners();
  }
}

class BmiApp extends StatefulWidget {
  const BmiApp({super.key});

  @override
  State<BmiApp> createState() => _BmiAppState();
}

class _BmiAppState extends State<BmiApp> {
  final BmiModel model = BmiModel();

  @override
  void dispose() {
    model.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'BMI Calculator',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.background,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.background,
          foregroundColor: Colors.white,
          centerTitle: true,
          elevation: 0,
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        textTheme: const TextTheme(
          bodyMedium: TextStyle(color: Colors.white),
        ),
        sliderTheme: SliderThemeData(
          activeTrackColor: Colors.white,
          inactiveTrackColor: Colors.white24,
          thumbColor: AppColors.accent,
          overlayColor: AppColors.accent.withOpacity(0.2),
          thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 13),
          overlayShape: const RoundSliderOverlayShape(overlayRadius: 24),
        ),
      ),
      home: InputScreen(model: model),
    );
  }
}

class AppColors {
  static const Color background = Color(0xFF0A0E21);
  static const Color card = Color(0xFF1D1E33);
  static const Color inactiveCard = Color(0xFF111328);
  static const Color accent = Color(0xFFEB1555);
  static const Color buttonCircle = Color(0xFF4C4F5E);
}

class InputScreen extends StatelessWidget {
  const InputScreen({super.key, required this.model});

  final BmiModel model;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: model,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('BMI CALCULATOR'),
          ),
          body: SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Expanded(
                                child: GenderCard(
                                  label: 'Male',
                                  icon: Icons.male,
                                  selected: model.gender == 'male',
                                  onTap: () => model.gender = 'male',
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: GenderCard(
                                  label: 'Female',
                                  icon: Icons.female,
                                  selected: model.gender == 'female',
                                  onTap: () => model.gender = 'female',
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        Expanded(
                          child: AppCard(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const LabelText('HEIGHT'),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.baseline,
                                  textBaseline: TextBaseline.alphabetic,
                                  children: [
                                    HeadingText(model.height.toString()),
                                    const SizedBox(width: 6),
                                    const Text(
                                      'cm',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 20,
                                      ),
                                    ),
                                  ],
                                ),
                                Slider(
                                  min: 120,
                                  max: 220,
                                  value: model.height.toDouble(),
                                  onChanged: (value) {
                                    model.height = value.round();
                                  },
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Expanded(
                          child: Row(
                            children: [
                              Expanded(
                                child: ValueCard(
                                  label: 'WEIGHT',
                                  value: model.weight,
                                  onMinus: model.decrementWeight,
                                  onPlus: model.incrementWeight,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: ValueCard(
                                  label: 'AGE',
                                  value: model.age,
                                  onMinus: model.decrementAge,
                                  onPlus: model.incrementAge,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                BottomButton(
                  label: 'CALCULATE',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ResultScreen(model: model),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class ResultScreen extends StatelessWidget {
  const ResultScreen({super.key, required this.model});

  final BmiModel model;

  double get bmi {
    final heightMeters = model.height / 100;
    return model.weight / (heightMeters * heightMeters);
  }

  String get category {
    if (bmi < 18.5) return 'UNDERWEIGHT';
    if (bmi < 25) return 'NORMAL';
    return 'OVERWEIGHT';
  }

  Color get categoryColor {
    if (bmi < 18.5) return Colors.blue;
    if (bmi < 25) return Colors.green;
    return Colors.orange;
  }

  String get advice {
    if (bmi < 18.5) {
      return 'You are below the normal body weight range, so consider eating a balanced, nutrient-rich diet.';
    }
    if (bmi < 25) {
      return 'You have a normal body weight, so keep maintaining your healthy lifestyle.';
    }
    return 'You are above the normal body weight range, so consider regular activity and balanced meals.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('YOUR RESULT'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: AppCard(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Text(
                          category,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: categoryColor,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                        Text(
                          bmi.toStringAsFixed(1),
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 86,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          advice,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            BottomButton(
              label: 'RE-CALCULATE',
              onTap: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }
}

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.color = AppColors.card,
    this.onTap,
  });

  final Widget child;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          width: double.infinity,
          height: double.infinity,
          padding: const EdgeInsets.all(16),
          child: child,
        ),
      ),
    );
  }
}

class GenderCard extends StatelessWidget {
  const GenderCard({
    super.key,
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      color: selected ? AppColors.card : AppColors.inactiveCard,
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 70,
            color: selected ? Colors.white : Colors.white54,
          ),
          const SizedBox(height: 12),
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: selected ? Colors.white : Colors.white54,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class ValueCard extends StatelessWidget {
  const ValueCard({
    super.key,
    required this.label,
    required this.value,
    required this.onMinus,
    required this.onPlus,
  });

  final String label;
  final int value;
  final VoidCallback onMinus;
  final VoidCallback onPlus;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          LabelText(label),
          const SizedBox(height: 8),
          HeadingText(value.toString()),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              RoundStepperButton(
                label: '–',
                onTap: onMinus,
              ),
              const SizedBox(width: 14),
              RoundStepperButton(
                label: '+',
                onTap: onPlus,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class RoundStepperButton extends StatelessWidget {
  const RoundStepperButton({
    super.key,
    required this.label,
    required this.onTap,
  });

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.buttonCircle,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 48,
          height: 48,
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 30,
                fontWeight: FontWeight.bold,
                height: 1,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class BottomButton extends StatelessWidget {
  const BottomButton({
    super.key,
    required this.label,
    required this.onTap,
  });

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 64,
      child: Material(
        color: AppColors.accent,
        child: InkWell(
          onTap: onTap,
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class LabelText extends StatelessWidget {
  const LabelText(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: Colors.white60,
        fontSize: 18,
        fontWeight: FontWeight.bold,
        letterSpacing: 1,
      ),
    );
  }
}

class HeadingText extends StatelessWidget {
  const HeadingText(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 48,
        fontWeight: FontWeight.w900,
      ),
    );
  }
}
```