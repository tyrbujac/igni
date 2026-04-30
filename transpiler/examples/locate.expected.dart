import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: WhereScreen()));
}

class WhereScreen extends StatefulWidget {
  const WhereScreen({super.key});

  @override
  State<WhereScreen> createState() => _WhereScreenState();
}

class _WhereScreenState extends State<WhereScreen> {
  dynamic here;
  bool _hereLoading = true;
  bool _hereError = false;

  @override
  void initState() {
    super.initState();
    _locateHere();
  }

  Future<void> _locateHere() async {
    try {
      bool _igni_serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!_igni_serviceEnabled) {
        setState(() { _hereError = true; _hereLoading = false; });
        return;
      }
      LocationPermission _igni_permission = await Geolocator.checkPermission();
      if (_igni_permission == LocationPermission.denied) {
        _igni_permission = await Geolocator.requestPermission();
        if (_igni_permission == LocationPermission.denied) {
          setState(() { _hereError = true; _hereLoading = false; });
          return;
        }
      }
      if (_igni_permission == LocationPermission.deniedForever) {
        setState(() { _hereError = true; _hereLoading = false; });
        return;
      }
      Position _igni_pos = await Geolocator.getCurrentPosition();
      setState(() {
        here = {'latitude': _igni_pos.latitude, 'longitude': _igni_pos.longitude};
        _hereLoading = false;
      });
    } catch (e) {
      setState(() { _hereError = true; _hereLoading = false; });
    }
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
              if (_hereLoading) ...[
                const CircularProgressIndicator(),
              ] else if (_hereError) ...[
                Text(
                  'Couldn\'t get location',
                ),
              ] else ...[
                Text(
                  (((here['latitude'].toStringAsFixed(4)) as dynamic)?.toString() ?? '') + ', '.toString().toString() + (((here['longitude'].toStringAsFixed(4)) as dynamic)?.toString() ?? ''),
                ),
              ],
            ],
          ),
        ),
      ),
        ),
      ),
    );
  }
}
