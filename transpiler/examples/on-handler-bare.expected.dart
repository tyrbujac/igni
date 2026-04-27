import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ModalScreen()));
}

class CloseIcon extends StatelessWidget {
  final dynamic icon_text;
  final void Function()? onClose;
  const CloseIcon({super.key, required this.icon_text, this.onClose});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ElevatedButton(
          style: ElevatedButton.styleFrom(shape: const CircleBorder(), padding: const EdgeInsets.all(16), minimumSize: const Size(48, 48)),
          onPressed: () {
            onClose?.call();
          },
          child: Text('$icon_text'),
        ),
      ],
    );
  }
}

class ModalScreen extends StatefulWidget {
  const ModalScreen({super.key});

  @override
  State<ModalScreen> createState() => _ModalScreenState();
}

class _ModalScreenState extends State<ModalScreen> {
  bool is_open = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            if (is_open) ...[
              Text(
                'I\'m a modal',
              ),
              CloseIcon(icon_text: '✕', onClose: () {
                setState(() {
                  is_open = false;
                });
                }),
            ] else ...[
              Text(
                'Modal closed',
              ),
            ],
          ],
        ),
      ),
        ),
      ),
    );
  }
}
