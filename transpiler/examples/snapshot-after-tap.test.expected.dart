import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'dart:io';

int? _igniMockedNow;

String _igniSerializeTree(WidgetTester tester) {
  final apps = find.byType(MaterialApp).evaluate().toList();
  if (apps.isEmpty) return '(empty)';
  Element? home;
  apps.first.visitChildElements((e) { home ??= e; });
  if (home == null) return '(empty)';
  final buf = StringBuffer();
  _igniSerializeNode(home!, buf, 0);
  return buf.toString().trimRight();
}

void _igniSerializeNode(Element element, StringBuffer buf, int depth) {
  final w = element.widget;
  final indent = '  ' * depth;
  // Outer-shell unwrap: Igni's emit chain is Scaffold > SafeArea >
  // SingleChildScrollView > Padding > (Center >) Column. Pass-through.
  if (w is Scaffold || w is SafeArea || w is SingleChildScrollView ||
      w is ListenableBuilder || w is KeyedSubtree) {
    element.visitChildElements((c) => _igniSerializeNode(c, buf, depth));
    return;
  }
  // Padding > [Center >] Column/Row → fold padding (+ align=center) into the layout.
  if (w is Padding) {
    final pad = w.padding;
    final padN = pad is EdgeInsets ? pad.left.toInt() : 0;
    Element? inner;
    element.visitChildElements((e) { inner ??= e; });
    final iw = inner?.widget;
    if (iw is Center) {
      Element? innerInner;
      inner!.visitChildElements((e) { innerInner ??= e; });
      final iiw = innerInner?.widget;
      if (iiw is Column || iiw is Row) {
        final dir = iiw is Column ? 'vertical' : 'horizontal';
        buf.writeln('${indent}(layout ${dir} padding=${padN} align=center');
        innerInner!.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));
        buf.writeln('${indent})');
        return;
      }
    }
    if (iw is Column || iw is Row) {
      final dir = iw is Column ? 'vertical' : 'horizontal';
      buf.writeln('${indent}(layout ${dir} padding=${padN}');
      inner!.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));
      buf.writeln('${indent})');
      return;
    }
    // Plain padding wrap.
    buf.writeln('${indent}(padding ${padN}');
    element.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));
    buf.writeln('${indent})');
    return;
  }
  // Standalone Column/Row (no Padding wrapper).
  if (w is Column || w is Row) {
    final dir = w is Column ? 'vertical' : 'horizontal';
    buf.writeln('${indent}(layout ${dir}');
    element.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));
    buf.writeln('${indent})');
    return;
  }
  // Center standalone (not folded by Padding case).
  if (w is Center) {
    buf.writeln('${indent}(center');
    element.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));
    buf.writeln('${indent})');
    return;
  }
  // Container — fold decoration tokens.
  if (w is Container) {
    final dec = w.decoration;
    final props = <String>[];
    if (dec is BoxDecoration) {
      if (dec.color != null) {
        final v = dec.color!.value.toRadixString(16).padLeft(8, '0').substring(2);
        props.add('background=#${v}');
      }
      if (dec.borderRadius is BorderRadius) {
        final br = dec.borderRadius as BorderRadius;
        if (br.topLeft.x > 0) props.add('rounded=${br.topLeft.x.toInt()}');
      }
      if (dec.border != null) props.add('border=true');
    }
    final ps = props.isEmpty ? '' : ' ${props.join(' ')}';
    buf.writeln('${indent}(container${ps}');
    element.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));
    buf.writeln('${indent})');
    return;
  }
  // Text → label.
  if (w is Text) {
    final text = (w.data ?? '').replaceAll('\\', '\\\\').replaceAll('"', '\\"');
    final styled = w.style != null ? ' style=themed' : '';
    buf.writeln('${indent}(label "${text}"${styled})');
    return;
  }
  // ElevatedButton → button.
  if (w is ElevatedButton) {
    var label = '';
    final c = w.child;
    if (c is Text) label = c.data ?? '';
    label = label.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
    buf.writeln('${indent}(button "${label}")');
    return;
  }
  // SizedBox spacers — skip (Igni emits between layout children to
  // realise gap:; the structural shape is captured by the parent layout).
  if (w is SizedBox) return;
  // TweenAnimationBuilder<double> → spring (Q4c target capture).
  if (w is TweenAnimationBuilder<double>) {
    final end = w.tween.end ?? 0.0;
    buf.writeln('${indent}(spring target=${end})');
    return;
  }
  // AnimatedSwitcher → transition with active-branch identity (Q4d).
  if (w is AnimatedSwitcher) {
    String branch = '?';
    Element? child;
    element.visitChildElements((e) { child ??= e; });
    if (child != null && child!.widget is KeyedSubtree) {
      final ks = child!.widget as KeyedSubtree;
      if (ks.key is ValueKey) branch = (ks.key as ValueKey).value.toString();
    }
    buf.writeln('${indent}(transition active-branch=${branch}');
    if (child != null) {
      child!.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));
    }
    buf.writeln('${indent})');
    return;
  }
  // Spinner.
  if (w is CircularProgressIndicator) { buf.writeln('${indent}(spinner)'); return; }
  // Fallback — unknown widget type. Diff-noisy but doesn't crash.
  buf.writeln('${indent}(${w.runtimeType})');
  element.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));
}
void main() {
  testWidgets("counter increments on tap", (tester) async {
    _igniMockedNow = null;
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)), scaffoldBackgroundColor: const Color(0xFFFAFAFA), textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 17, height: 1.5))), home: CounterScreen()));
    await tester.pump();
    await tester.tap(find.text("Add"));
    await tester.pumpAndSettle();
    // snapshot "counter_after_tap"
    {
      final _igniSnapTree = _igniSerializeTree(tester);
      final _igniSnapFile = File("../__snapshots__/counter_increments_on_tap__counter_after_tap.txt");
      final _igniShouldUpdate = Platform.environment['IGNI_UPDATE_SNAPSHOTS'] == '1';
      if (_igniShouldUpdate || !_igniSnapFile.existsSync()) {
        _igniSnapFile.parent.createSync(recursive: true);
        _igniSnapFile.writeAsStringSync(_igniSnapTree);
      } else {
        expect(_igniSnapTree, equals(_igniSnapFile.readAsStringSync()));
      }
    }
  });
}

class CounterScreen extends StatefulWidget {
  const CounterScreen({super.key});

  @override
  State<CounterScreen> createState() => _CounterScreenState();
}

class _CounterScreenState extends State<CounterScreen> {
  int count = 0;

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
              Text(
                '$count',
                style: Theme.of(context).textTheme.headlineLarge!,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                onPressed: () {
                  setState(() {
                    count = count + 1;
                  });
                },
                child: const Text('Add'),
              ),
            ],
          ),
        ),
      ),
        ),
      ),
    );
  }
}
