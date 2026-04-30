import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

Map<String, dynamic>? _igniMockFetch;
final List<String> _igniRequests = [];

Future<http.Response> _igniHttpGet(String url) async {
  _igniRequests.add(url);
  final mock = _igniMockFetch;
  if (mock == null) {
    throw Exception('No mock fetch set for url ${url}; add a mock fetch: block to the test body.');
  }
  if (!mock.containsKey(url)) {
    throw Exception('No mock entry for ${url}; add it to the test mock fetch: block.');
  }
  final entry = mock[url];
  if (entry is Exception) throw entry;
  return http.Response(jsonEncode(entry), 200);
}

int? _igniMockedNow;

void main() {
  testWidgets("shows offline state when fetch fails", (tester) async {
    _igniMockFetch = null;
    _igniRequests.clear();
    _igniMockedNow = null;
    _igniMockFetch = {
      "/api/user/me?refresh=0": Exception("network timeout"),
    };
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ProfileScreen()));
    await tester.pump();
    expect(find.text("Couldn't load — try again"), findsAtLeastNWidgets(1));
  });
  testWidgets("shows user name and email on success", (tester) async {
    _igniMockFetch = null;
    _igniRequests.clear();
    _igniMockedNow = null;
    _igniMockFetch = {
      "/api/user/me?refresh=0": {'name': 'Ada Lovelace', 'email': 'ada@example.com'},
    };
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ProfileScreen()));
    await tester.pump();
    expect(find.text("Ada Lovelace"), findsAtLeastNWidgets(1));
    expect(find.text("ada@example.com"), findsAtLeastNWidgets(1));
  });
  testWidgets("tapping Refresh triggers a new fetch", (tester) async {
    _igniMockFetch = null;
    _igniRequests.clear();
    _igniMockedNow = null;
    _igniMockFetch = {
      "/api/user/me?refresh=0": {'name': 'Ada Lovelace', 'email': 'ada@example.com'},
      "/api/user/me?refresh=1": {'name': 'Grace Hopper', 'email': 'grace@example.com'},
    };
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: ProfileScreen()));
    await tester.pump();
    expect(_igniRequests.contains('/api/user/me?refresh=0'), isTrue);
    await tester.tap(find.text("Refresh"));
    await tester.pumpAndSettle();
    expect(_igniRequests.contains('/api/user/me?refresh=1'), isTrue);
    expect(_igniRequests.where((u) => u == '/api/user/me?refresh=1').length == 1, isTrue);
  });
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  int refresh = 0;
  dynamic user;
  bool _userLoading = true;
  bool _userError = false;
  String? _lastUserUrl;

  @override
  void initState() {
    super.initState();
    _fetchUser();
  }

  Future<void> _fetchUser() async {
    try {
      final _igni_response = await _igniHttpGet('/api/user/me?refresh='.toString() + (((refresh) as dynamic)?.toString() ?? ''));
      if (_igni_response.statusCode == 200) {
        setState(() {
          user = jsonDecode(_igni_response.body);
          _userLoading = false;
        });
      } else {
        setState(() {
          _userError = true;
          _userLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _userError = true;
        _userLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final _currentUserUrl = '/api/user/me?refresh='.toString() + (((refresh) as dynamic)?.toString() ?? '');
    if (_currentUserUrl != _lastUserUrl) {
      _lastUserUrl = _currentUserUrl;
      _userLoading = true;
      _userError = false;
      _fetchUser();
    }
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            if (_userLoading) ...[
              const CircularProgressIndicator(),
            ] else if (_userError) ...[
              Text(
                'Couldn\'t load — try again',
              ),
            ] else ...[
              Text(
                (((user['name']) as dynamic)?.toString() ?? ''),
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              Text(
                (((user['email']) as dynamic)?.toString() ?? ''),
                style: Theme.of(context).textTheme.bodySmall!,
              ),
            ],
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              onPressed: () {
                setState(() {
                  refresh = refresh + 1;
                });
              },
              child: const Text('Refresh'),
            ),
          ],
        ),
      ),
        ),
      ),
    );
  }
}
