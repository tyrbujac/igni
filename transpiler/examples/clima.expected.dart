import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:geolocator/geolocator.dart';

void main() {
  runApp(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555))), home: WeatherScreen()));
}

class WeatherScreen extends StatefulWidget {
  const WeatherScreen({super.key});

  @override
  State<WeatherScreen> createState() => _WeatherScreenState();
}

class _WeatherScreenState extends State<WeatherScreen> {
  String coords = '';
  dynamic here;
  bool _hereLoading = true;
  bool _hereError = false;
  dynamic forecast;
  bool _forecastLoading = true;
  bool _forecastError = false;
  String? _lastForecastUrl;

  @override
  void initState() {
    super.initState();
    _locateHere();
    _fetchForecast();
  }

  Future<void> _locateHere() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() { _hereError = true; _hereLoading = false; });
        return;
      }
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() { _hereError = true; _hereLoading = false; });
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        setState(() { _hereError = true; _hereLoading = false; });
        return;
      }
      Position pos = await Geolocator.getCurrentPosition();
      setState(() {
        here = {'latitude': pos.latitude, 'longitude': pos.longitude};
        _hereLoading = false;
      });
    } catch (e) {
      setState(() { _hereError = true; _hereLoading = false; });
    }
  }

  Future<void> _fetchForecast() async {
    try {
      final response = await http.get(Uri.parse('https://api.example.com/forecast?c='.toString() + coords.toString()));
      if (response.statusCode == 200) {
        setState(() {
          forecast = jsonDecode(response.body);
          _forecastLoading = false;
        });
      } else {
        setState(() {
          _forecastError = true;
          _forecastLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _forecastError = true;
        _forecastLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final _currentForecastUrl = 'https://api.example.com/forecast?c='.toString() + coords.toString();
    if (_currentForecastUrl != _lastForecastUrl) {
      _lastForecastUrl = _currentForecastUrl;
      _forecastLoading = true;
      _forecastError = false;
      _fetchForecast();
    }
    return Scaffold(
      body: SingleChildScrollView(
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
                  'Location unavailable',
                ),
              ] else ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: () {
                      setState(() {
                        coords = here['latitude'].toStringAsFixed(4).toString() + ','.toString().toString() + here['longitude'].toStringAsFixed(4).toString();
                      });
                    },
                    child: const Text('Get forecast'),
                  ),
                ),
                if (coords == '') ...[
                  Text(
                    'Tap to load forecast',
                  ),
                ] else if (_forecastLoading) ...[
                  const CircularProgressIndicator(),
                ] else if (_forecastError) ...[
                  Text(
                    'Forecast unavailable',
                  ),
                ] else ...[
                  Text(
                    forecast['summary'].toString(),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
      ),
    );
  }
}
