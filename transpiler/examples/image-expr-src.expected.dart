import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: GalleryScreen()));
}

class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key});

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  List<dynamic> photos = <dynamic>[{'url': 'https://picsum.photos/200', 'caption': 'remote'}, {'url': 'logo.png', 'caption': 'local'}];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            for (final (_i, photo) in photos.indexed) ...[
              Image(
                image: (photo['url']).toString().startsWith('http') ? NetworkImage((photo['url']).toString()) as ImageProvider : AssetImage('assets/' + (photo['url']).toString()),
                width: 24,
                height: 24,
                fit: BoxFit.cover,
              ),
              Text(
                (((photo['caption']) as dynamic)?.toString() ?? ''),
              ),
              if (_i < photos.length - 1) const SizedBox(height: 8),
            ],
          ],
        ),
      ),
        ),
      ),
    );
  }
}
