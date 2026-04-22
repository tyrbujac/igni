import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: SettingsScreen()));
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String country = 'UK';
  String city = '';
  bool notifications = true;
  int volume = 50;
  bool agreed = false;
  List<dynamic> countries = ['UK', 'US', 'France', 'Germany'];
  late final TextEditingController _cityController;

  @override
  void initState() {
    super.initState();
    _cityController = TextEditingController(text: city);
  }

  @override
  void dispose() {
    _cityController.dispose();
    super.dispose();
  }

  void reset_city() {
    setState(() {
      city = '';
    });
    _cityController.text = city;
  }

  void save_prefs() {
    setState(() {
      city = 'saved';
    });
    _cityController.text = city;
  }

  void update_volume() {
    setState(() {
      city = 'vol';
    });
    _cityController.text = city;
  }

  void check_terms() {
    setState(() {
      city = 'terms';
    });
    _cityController.text = city;
  }

  void validate_city() {
    setState(() {
      city = 'valid';
    });
    _cityController.text = city;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Settings',
              style: Theme.of(context).textTheme.headlineLarge!,
            ),
            const SizedBox(height: 16),
            DropdownButton<dynamic>(
              value: country,
              items: (countries as List).map((e) => DropdownMenuItem<dynamic>(value: e, child: Text(e.toString()))).toList(),
              onChanged: (value) {
                setState(() {
                  country = value;
                });
                reset_city();
              },
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              value: notifications,
              title: Text('Notifications'),
              onChanged: (value) {
                setState(() {
                  notifications = value;
                });
                save_prefs();
              },
            ),
            const SizedBox(height: 16),
            Slider(
              value: volume.toDouble(),
              min: 0.toDouble(),
              max: 100.toDouble(),
              onChanged: (value) {
                setState(() {
                  volume = value.round();
                });
                update_volume();
              },
            ),
            const SizedBox(height: 16),
            CheckboxListTile(
              value: agreed,
              title: Text('I agree'),
              onChanged: (value) {
                setState(() {
                  agreed = value ?? false;
                });
                check_terms();
              },
            ),
            const SizedBox(height: 16),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320),
              child: TextField(
              controller: _cityController,
              onChanged: (value) {
                setState(() {
                  city = value;
                });
                validate_city();
              },
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: 'City',
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
