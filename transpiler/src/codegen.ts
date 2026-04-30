import {
  Program, Screen, ScreenItem, VariableDecl,
  UINode, Layout, LabelNode, ButtonNode, InputNode, ToggleNode, IfNode, EachNode,
  ComponentDef, ComponentItem, ComponentInvocation,
  Property, EventHandler, FunctionDef, EveryNode, Statement, Expr, Ident, IsExpr, NodeBase,
  LambdaExpr, EqualityExpr, IconNode, ImageNode, SliderNode, CheckboxNode, DropdownNode, BadgeNode,
  SourceLocation,
  ThemeBlock, ThemeTextTokenName,
  TestBlock, TestStatement, RenderStmt, ExpectStmt,
} from './ast.js';
import {
  findProp, resolveIdentName, resolveDesignToken, resolveMaxWidthToken, resolveStyle,
  resolveAlign, resolveBackground, resolveColor, mapIconName,
  inferType, isStringExpr, substituteLambdaParam, isImageBackground,
  generateIconLookupHelper, isDarkBackgroundExpr, generateStyleValueResolvers,
  BORDER_WIDTH_TOKENS, isBorderWidthTokenName, resolveBorderWidthToken, generateBorderWidthResolver,
  isColorTokenName, isStyleValueName, isStyleValueExpr,
  resolveFontToken, hexToDartColor,
} from './codegen-helpers.js';
import { TranspileError } from './errors.js';

export interface GeneratedLineMapEntry {
  dartLine: number;
  sourceLine: number;
  sourceColumn: number;
  context: string;
}

export interface GeneratedOutput {
  dart: string;
  lineMap: GeneratedLineMapEntry[];
}

// Per-screen/component generation context. Collapsed from four parallel fields
// so save/restore across component boundaries is a single assignment, and so
// this slice can be extracted and passed to sub-generators in a later refactor.
interface ScreenContext {
  stateVars: string[];
  stateVarTypes: Record<string, string>;
  boundInputVars: string[];
  screenParams: readonly string[];
  isComponent: boolean;
  // v0.19: maps `displayed = spring(target)` alias names to their target
  // argument expression. Aliases don't emit state fields; reads substitute
  // the target value. `label <alias>` and `label spring(...)` both lower to
  // TweenAnimationBuilder<double>.
  springAliases: Record<string, Expr>;
}

function newScreenContext(): ScreenContext {
  return { stateVars: [], stateVarTypes: {}, boundInputVars: [], screenParams: [], isComponent: false, springAliases: {} };
}

export class CodeGenerator {
  private ctx: ScreenContext = newScreenContext();
  private functionParams: string[] = [];
  private declaredLocals: Set<string> = new Set();
  // v0.16.x: emit-payload params are typed `dynamic` at the closure boundary
  // (`void Function(dynamic)?`), so any `int_field = int_field + d` inside a
  // parent's `on X(d):` body fails Dart's static analysis (`int + dynamic →
  // num`, `int = num` rejected). Track the names of payload params currently
  // in scope so the Assignment generator can post-wrap with `.toInt()` for
  // int-typed targets. Surfaced by the BMI hand-translation (2026-04-27); the
  // v0.16.0 fixtures only exercised String/object payloads, missing the
  // int-delta-stepper shape.
  private dynamicParamsInScope: Set<string> = new Set();
  private sharedVarTypes: Record<string, string> = {};

  private indent(depth: number): string {
    return '  '.repeat(depth);
  }

  // v0.14.1: bind: shared.X widening — onChanged writes wrap in shared.update()
  // so the SharedState ChangeNotifier fires and the app-root ListenableBuilder
  // re-renders. Plain (non-shared) bind: keeps the existing setState path so
  // every pre-v0.14.1 snapshot is byte-identical.
  private genBindWrite(bindPath: string, valueExpr: string, ind: string): string {
    if (bindPath.startsWith('shared.')) {
      return `${ind}    shared.update(() {\n${ind}      ${bindPath} = ${valueExpr};\n${ind}    });\n`;
    }
    return `${ind}    setState(() {\n${ind}      ${bindPath} = ${valueExpr};\n${ind}    });\n`;
  }
  private allScreens: Screen[] = [];

  private allComponents: ComponentDef[] = [];
  private fetchVars: { name: string; url: string; urlExpr: Expr; method?: string; body?: string; reactive: boolean; kind?: 'fetch' | 'locate' }[] = [];

  private hasShared = false;
  // v0.18: when generating a *.test.igni file, fetch codegen routes through
  // `_igniHttpGet` (the test-scope wrapper) instead of `http.get(...)` so
  // `mock fetch:` blocks can intercept calls.
  private testMode = false;
  private hasFetch = false;
  // v0.19: cached theme arg from genTestBlock so freeze_time:'s nested
  // genRenderStmt calls can reuse it without threading the parameter through
  // genTestStmt.
  private cachedIgniTheme = '';
  // v0.19 Session 3: gates emission of `import 'dart:io';` and the
  // `_igniSerializeTree` helper. Set during AST scan when any test body
  // contains a SnapshotStmt (including inside FreezeTimeBlock bodies).
  private needsSnapshot = false;
  // v0.19 Session 3: slug of the currently-emitting test block, computed in
  // genTestBlock from test.name. Used by SnapshotStmt codegen to derive the
  // golden file path.
  private cachedTestSlug = '';
  private needsIconLookup = false;
  private needsStyleResolvers = false;
  // v0.17.0: emitted when a `border:` width on a layout uses a non-literal
  // expression (function call, field access, etc.) and needs runtime token
  // resolution. Literal tokens (`border: thin`) resolve at compile time.
  private needsBorderWidthResolver = false;
  private emitLineMarkers = false;
  // v0.15.0: theme: color: <token>: "<hex>" overrides + user-defined tokens.
  // Populated from program.theme.color at build start; consulted by
  // resolveColor / resolveBackground / _igniColorValue runtime resolver.
  private themeColors: Record<string, string> = {};
  // v0.20.0: theme dark: color: tokens. Auto-fall-back applied at build start
  // (light-variant values copied for missing dark tokens). Null when no
  // theme dark: block exists; non-null implies dual-theme MaterialApp emission.
  private themeDarkColors: Record<string, string> | null = null;
  // v0.20.0: theme: scaffold: / theme: appbar: chrome sub-blocks (token
  // references resolved at MaterialApp emission).
  private themeScaffold: { background?: string } = {};
  private themeAppbar: { background?: string; foreground?: string } = {};
  private themeDarkScaffold: { background?: string } = {};
  private themeDarkAppbar: { background?: string; foreground?: string } = {};

  generate(program: Program): string {
    // v0.18 spike: auto-detect test mode when the program contains `test "name":`
    // blocks (parsed into `program.tests`). The spike's `igni test` CLI uses
    // this auto-detection rather than a separate code path; sibling
    // `*.test.igni` files transpile cleanly via the same `igni run`/`igni build`
    // codegen entry.
    return this.build(program, false, program.tests.length > 0).dart;
  }

  generateWithSourceMap(program: Program, testMode: boolean = false): GeneratedOutput {
    return this.build(program, true, testMode);
  }

  // v0.18 testing infrastructure — Stage 1.5 framework-spike scope.
  // When the input file contains `test "name":` blocks (parsed into
  // `program.tests`), emit a `flutter_test`-flavored Dart file: same screen
  // classes via existing codegen, plus a test main with `testWidgets(...)`
  // blocks instead of the production `runApp()`. The CLI (`igni test`)
  // dispatches `*.test.igni` files through this method.
  // Per `docs/private/112_v018_testing_infrastructure.md`.
  generateTestFile(program: Program): string {
    return this.build(program, false, true).dart;
  }

  private build(program: Program, emitLineMarkers: boolean, testMode: boolean = false): GeneratedOutput {
    this.emitLineMarkers = emitLineMarkers;
    this.testMode = testMode;
    this.allScreens = program.screens;
    this.allComponents = program.components;
    this.hasShared = program.shared.length > 0;
    // v0.15.0: load theme.color overrides + user-defined tokens.
    this.themeColors = {};
    this.themeScaffold = {};
    this.themeAppbar = {};
    this.themeDarkColors = null;
    this.themeDarkScaffold = {};
    this.themeDarkAppbar = {};
    if (program.theme) {
      for (const t of program.theme.color) {
        this.themeColors[t.name] = t.hex;
      }
      for (const t of program.theme.scaffold) {
        this.themeScaffold[t.property] = t.ref;
      }
      for (const t of program.theme.appbar) {
        this.themeAppbar[t.property] = t.ref;
      }
    }
    // v0.20.0: theme dark: variant. Auto-fall-back applied at build start —
    // dark map starts as a copy of light, then dark declarations override.
    if (program.themeDark) {
      this.themeDarkColors = { ...this.themeColors };
      for (const t of program.themeDark.color) {
        this.themeDarkColors[t.name] = t.hex;
      }
      for (const t of program.themeDark.scaffold) {
        this.themeDarkScaffold[t.property] = t.ref;
      }
      for (const t of program.themeDark.appbar) {
        this.themeDarkAppbar[t.property] = t.ref;
      }
    }
    this.validateEmitPlacement(program);
    this.validateAsyncReactivity(program);
    this.validateSharedPrefix(program);
    this.validateCountLambda(program);
    this.validateButtons(program);
    this.validateTransition(program);
    this.validateSpringTypes(program);

    // No screens → emit a friendly placeholder app so `igni run` stays alive
    // while the user types their first screen. Parser produces an empty
    // Program for 0-byte / whitespace-only input; without this guard the
    // first `program.screens[0].name` access throws.
    if (program.screens.length === 0) {
      return {
        dart: [
          "import 'package:flutter/material.dart';",
          '',
          'void main() {',
          '  runApp(MaterialApp(',
          '    debugShowCheckedModeBanner: false,',
          '    home: Scaffold(',
          '      body: Center(',
          '        child: Text(',
          "          'Add a screen to app.igni to get started',",
          '          style: TextStyle(fontSize: 16, color: Colors.black54),',
          '        ),',
          '      ),',
          '    ),',
          '  ));',
          '}',
          '',
        ].join('\n'),
        lineMap: [],
      };
    }

    const firstName = program.screens[0].name;

    // Detect if any screen uses fetch
    this.hasFetch = program.screens.some(s =>
      s.body.some(item => item.type === 'VariableDecl' && item.value.type === 'FunctionCall' && item.value.name === 'fetch')
    );

    // Detect random usage by checking if any generated code will use Random()
    const hasRandom = this.detectBuiltin(program, 'random');
    const hasAudio = this.detectBuiltin(program, 'play');
    const hasLocate = program.screens.some(s =>
      s.body.some(item => item.type === 'VariableDecl' && item.value.type === 'FunctionCall' && item.value.name === 'locate')
    );
    // v0.14: any `every` block on any screen pulls in dart:async for Timer.
    const hasEvery = program.screens.some(s => s.body.some(i => i.type === 'Every'));

    // v0.19 Session 3: detect snapshot usage so we can gate the dart:io
    // import + the _igniSerializeTree helper. Recursively walk test bodies
    // (incl. FreezeTimeBlock bodies which may contain snapshot calls).
    if (testMode) {
      this.needsSnapshot = program.tests.some(t => this.testBodyHasSnapshot(t.body));
    } else {
      this.needsSnapshot = false;
    }

    let code = `import 'package:flutter/material.dart';\n`;
    if (testMode) {
      code += `import 'package:flutter_test/flutter_test.dart';\n`;
      if (this.needsSnapshot) {
        code += `import 'dart:io';\n`;
      }
    }
    if (this.hasFetch) {
      code += `import 'package:http/http.dart' as http;\n`;
      code += `import 'dart:convert';\n`;
    }
    if (hasRandom) {
      code += `import 'dart:math';\n`;
    }
    if (hasAudio) {
      code += `import 'package:audioplayers/audioplayers.dart';\n`;
    }
    if (hasLocate) {
      code += `import 'package:geolocator/geolocator.dart';\n`;
    }
    if (hasEvery) {
      code += `import 'dart:async';\n`;
    }
    code += '\n';

    // Igni's brand colour applied app-wide via the MaterialApp's theme.
    // `brand` (== colorScheme.primary) renders as this warm pink-red across
    // every generated app — the language's visual identity.
    //
    // If any screen declares a dark background, the whole app uses a dark
    // ColorScheme so `Theme.of(context).cardColor` and other derived tokens
    // resolve to dark-theme variants. The MaterialApp theme is at the top of
    // the widget tree, so inline `Theme.of(context)` calls inside screen
    // State.build methods correctly see these values (a per-screen Theme
    // wrap does not — inline children use the state's context, which is
    // above the wrap).
    const anyDarkScreen = program.screens.some(s => this.screenHasDarkBackground(s));
    const hasThemeDark = this.themeDarkColors !== null;
    const textTheme = this.buildTextTheme(program.theme);
    // v0.15.0: theme: color: brand: "#X" overrides the MaterialApp seed.
    const seedHex = this.themeColors['brand']
      ? `0xFF${this.themeColors['brand'].slice(1).toUpperCase().padStart(6, '0')}`
      : '0xFFEB1555';
    const darkSeedHex = hasThemeDark && this.themeDarkColors!['brand']
      ? `0xFF${this.themeDarkColors!['brand'].slice(1).toUpperCase().padStart(6, '0')}`
      : seedHex; // fall back to light seed (brand often unchanged across variants)

    // v0.20.0: build a ThemeData string for either variant. variant === 'dark'
    // pulls scaffold/appbar overrides from themeDarkScaffold/themeDarkAppbar
    // (with auto-fall-back: empty dark sub-block inherits light values).
    const buildThemeData = (variant: 'light' | 'dark'): string => {
      const isDark = variant === 'dark';
      const brightness = isDark ? ', brightness: Brightness.dark' : '';
      const seed = isDark ? darkSeedHex : seedHex;
      // Scaffold background: explicit override > Material default > legacy off-white (light only)
      const scaffoldRef = isDark
        ? (this.themeDarkScaffold.background ?? this.themeScaffold.background)
        : this.themeScaffold.background;
      let scaffoldBg = '';
      if (scaffoldRef) {
        const refLight = this.themeColors[scaffoldRef];
        const refDark = this.themeDarkColors?.[scaffoldRef];
        const hex = isDark ? (refDark ?? refLight) : refLight;
        if (hex) scaffoldBg = `, scaffoldBackgroundColor: ${hexToDartColor(hex)}`;
      } else if (!isDark && !anyDarkScreen) {
        // Legacy v0.19 default: light apps without scaffold override get the off-white.
        scaffoldBg = ', scaffoldBackgroundColor: const Color(0xFFFAFAFA)';
      }
      // AppBar theme: explicit override > none.
      const appbarRef = isDark
        ? { background: this.themeDarkAppbar.background ?? this.themeAppbar.background, foreground: this.themeDarkAppbar.foreground ?? this.themeAppbar.foreground }
        : this.themeAppbar;
      let appBarTheme = '';
      if (appbarRef.background || appbarRef.foreground) {
        const parts: string[] = [];
        if (appbarRef.background) {
          const refLight = this.themeColors[appbarRef.background];
          const refDark = this.themeDarkColors?.[appbarRef.background];
          const hex = isDark ? (refDark ?? refLight) : refLight;
          if (hex) parts.push(`backgroundColor: ${hexToDartColor(hex)}`);
        }
        if (appbarRef.foreground) {
          const refLight = this.themeColors[appbarRef.foreground];
          const refDark = this.themeDarkColors?.[appbarRef.foreground];
          const hex = isDark ? (refDark ?? refLight) : refLight;
          if (hex) parts.push(`foregroundColor: ${hexToDartColor(hex)}`);
        }
        if (parts.length) appBarTheme = `, appBarTheme: AppBarTheme(${parts.join(', ')})`;
      }
      return `ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(${seed})${brightness})${scaffoldBg}, textTheme: ${textTheme}${appBarTheme})`;
    };

    const lightThemeData = buildThemeData('light');
    const darkThemeData = hasThemeDark ? buildThemeData('dark') : null;
    // Test mode keeps `igniTheme` shape unchanged (single theme, no themeMode).
    const igniTheme = `theme: ${anyDarkScreen && !hasThemeDark
      ? buildThemeData('dark')  // legacy: any-dark-screen flips the WHOLE app to dark Material
      : lightThemeData}`;
    // v0.20.0: when theme dark: exists, emit dual-theme MaterialApp.
    const dualThemeArgs = hasThemeDark
      ? `theme: ${lightThemeData}, darkTheme: ${darkThemeData}, themeMode: _resolveThemeMode(${this.hasShared ? 'shared.theme_mode' : '"system"'})`
      : igniTheme;
    if (testMode) {
      // v0.18 spike: emit `void main() { testWidgets(...); ... }` instead of
      // `runApp(...)`. Each `test "name":` block becomes a `testWidgets` call.
      if (this.hasShared) {
        code += this.genSharedState(program.shared) + '\n';
      }
      // Test-scope fetch interception: every `fetch()` call in test mode
      // routes through `_igniHttpGet`. The `mock fetch:` block populates
      // `_igniMockFetch`; without a mock, the wrapper throws so accidental
      // real network calls don't pass tests silently. `_igniRequests` backs
      // the `requested(<url>)` and `request_count(<url>)` builtins.
      if (this.hasFetch) {
        code += `Map<String, dynamic>? _igniMockFetch;\n`;
        code += `final List<String> _igniRequests = [];\n\n`;
        code += `Future<http.Response> _igniHttpGet(String url) async {\n`;
        code += `  _igniRequests.add(url);\n`;
        code += `  final mock = _igniMockFetch;\n`;
        code += `  if (mock == null) {\n`;
        code += `    throw Exception('No mock fetch set for url \${url}; add a mock fetch: block to the test body.');\n`;
        code += `  }\n`;
        code += `  if (!mock.containsKey(url)) {\n`;
        code += `    throw Exception('No mock entry for \${url}; add it to the test mock fetch: block.');\n`;
        code += `  }\n`;
        code += `  final entry = mock[url];\n`;
        code += `  if (entry is Exception) throw entry;\n`;
        code += `  return http.Response(jsonEncode(entry), 200);\n`;
        code += `}\n\n`;
      }
      // v0.19: `mock now:` and `freeze_time:` set this test-scope global to
      // a fixed seconds-since-epoch value. `now()` codegen reads from here
      // first when in test mode. Reset to null between tests in genTestBlock.
      // Q4b: `mock every: advance` bumps this forward when set, so a frozen
      // clock and the every-block scheduler advance together.
      code += `int? _igniMockedNow;\n\n`;
      // v0.19 Session 3: snapshot text-tree serializer. Walks the rendered
      // widget tree from MaterialApp's home and emits a deterministic Igni-
      // flavoured sexpr representation. Q5-serializer scope: captures node
      // identity + branch/list structure + bound layout properties + spring
      // target + transition active-branch. Q4c: spring target read from the
      // TweenAnimationBuilder's Tween.end (deterministic-by-construction;
      // doesn't require pumpAndSettle). Unknown widgets fall back to their
      // runtimeType name — diff-noisy but doesn't crash.
      if (this.needsSnapshot) {
        code += this.generateSnapshotSerializer();
      }
      code += 'void main() {\n';
      for (const test of program.tests) {
        code += this.genTestBlock(test, igniTheme);
      }
      code += '}\n';
    } else if (this.hasShared) {
      code += this.genSharedState(program.shared) + '\n';
      if (hasThemeDark) {
        code += `\nThemeMode _resolveThemeMode(dynamic mode) {\n  if (mode == 'light') return ThemeMode.light;\n  if (mode == 'dark') return ThemeMode.dark;\n  return ThemeMode.system;\n}\n\n`;
      }
      code += `void main() {\n  runApp(ListenableBuilder(\n    listenable: shared,\n    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, ${dualThemeArgs}, home: ${firstName}Screen()),\n  ));\n}\n`;
    } else {
      if (hasThemeDark) {
        code += `\nThemeMode _resolveThemeMode(dynamic mode) {\n  if (mode == 'light') return ThemeMode.light;\n  if (mode == 'dark') return ThemeMode.dark;\n  return ThemeMode.system;\n}\n\n`;
      }
      code += `void main() {\n  runApp(MaterialApp(debugShowCheckedModeBanner: false, ${dualThemeArgs}, home: ${firstName}Screen()));\n}\n`;
    }

    for (const comp of program.components) {
      code += '\n' + this.genComponentDef(comp);
    }

    for (const screen of program.screens) {
      code += '\n' + this.genScreen(screen);
    }

    if (this.needsIconLookup) {
      code += '\n' + generateIconLookupHelper() + '\n';
    }
    if (this.needsBorderWidthResolver) {
      code += '\n' + generateBorderWidthResolver() + '\n';
    }
    if (this.needsStyleResolvers) {
      code += '\n' + generateStyleValueResolvers(this.themeColors, this.themeDarkColors) + '\n';
    }

    if (!emitLineMarkers) {
      return { dart: code, lineMap: [] };
    }
    return this.stripLineMarkers(code);
  }

  // Build the MaterialApp's `textTheme`. Patch semantics — omitted tokens keep
  // the existing hardcoded default (bodyMedium with fontSize 17, height 1.5).
  //
  // The no-theme branch must be byte-identical to Igni's pre-v0.12.1 output so
  // all existing diff fixtures pass unchanged. The has-theme branch patches
  // the slots Igni's STYLE_MAP reads from with a bare fontFamily string:
  //   heading  → headlineLarge + mirror to headlineSmall (so `title` inherits)
  //   body     → bodyLarge + bodyMedium (bodyMedium is the default unstyled label)
  //   caption  → bodySmall
  // (v0.20.4: `title` was renamed from `heading.small`; same Material 3
  //  headlineSmall mapping under the hood.)
  //
  // The family string (e.g. 'Pacifico') must match one of the entries that
  // syncFonts() registers under `flutter.fonts:` in pubspec.yaml. Both trace
  // back to FONT_MAP in codegen-helpers.ts, which is the single source of
  // truth for the six curated v0.12.1 tokens. TTFs live in assets/fonts/ at
  // the repo root and are copied into .igni/assets/fonts/ on every run
  // (offline-first, no runtime CDN fetch — see docs/private/87).
  private buildTextTheme(theme?: ThemeBlock): string {
    const baseBodyMedium = 'bodyMedium: TextStyle(fontSize: 17, height: 1.5)';
    if (!theme || !theme.typography.some(t => t.font)) {
      return `const TextTheme(${baseBodyMedium})`;
    }
    const fontOf = (name: ThemeTextTokenName): string | undefined =>
      theme.typography.find(t => t.token === name)?.font;
    const headingFont = fontOf('heading');
    const bodyFont = fontOf('body');
    const captionFont = fontOf('caption');
    const family = (token: string) => `'${resolveFontToken(token)}'`;

    const parts: string[] = [];
    parts.push(
      bodyFont
        ? `bodyMedium: TextStyle(fontSize: 17, height: 1.5, fontFamily: ${family(bodyFont)})`
        : baseBodyMedium,
    );
    if (headingFont) {
      parts.push(`headlineLarge: TextStyle(fontFamily: ${family(headingFont)})`);
      parts.push(`headlineSmall: TextStyle(fontFamily: ${family(headingFont)})`);
    }
    if (bodyFont) {
      parts.push(`bodyLarge: TextStyle(fontFamily: ${family(bodyFont)})`);
    }
    if (captionFont) {
      parts.push(`bodySmall: TextStyle(fontFamily: ${family(captionFont)})`);
    }
    return `TextTheme(${parts.join(', ')})`;
  }

  private genSharedState(vars: VariableDecl[]): string {
    const fields = vars.map(v => {
      const dartType = inferType(v.value, v.typeHint);
      this.sharedVarTypes[v.name] = dartType;
      const dartValue = this.exprToDart(v.value);
      return this.withMarker(v, `shared:${v.name}`, `  ${dartType} ${v.name} = ${dartValue};`);
    }).join('\n');

    let code = `class SharedState extends ChangeNotifier {\n`;
    code += fields + '\n\n';
    code += `  void update(void Function() fn) {\n    fn();\n    notifyListeners();\n  }\n`;
    code += `}\n\n`;
    code += `final shared = SharedState();\n`;
    return code;
  }

  private marker(node: NodeBase | undefined, context: string): string {
    if (!this.emitLineMarkers || !node?.loc) return '';
    return `/*__IGNI_LINE__ ${node.loc.line}:${node.loc.column} ${context}*/`;
  }

  private withMarker(node: NodeBase | undefined, context: string, code: string): string {
    const marker = this.marker(node, context);
    return marker ? `${marker}\n${code}` : code;
  }

  private stripLineMarkers(code: string): GeneratedOutput {
    const lines = code.split('\n');
    const stripped: string[] = [];
    const lineMap: GeneratedLineMapEntry[] = [];
    const markerPattern = /\/\*__IGNI_LINE__ (\d+):(\d+) (.+?)\*\//;
    let current:
      | { sourceLine: number; sourceColumn: number; context: string }
      | null = null;

    for (const line of lines) {
      const match = line.match(markerPattern);
      if (match) {
        current = {
          sourceLine: Number(match[1]),
          sourceColumn: Number(match[2]),
          context: match[3],
        };
        const strippedLine = line.replace(markerPattern, '');
        if (strippedLine.length === 0) {
          continue;
        }
        stripped.push(strippedLine);
        lineMap.push({
          dartLine: stripped.length,
          sourceLine: current.sourceLine,
          sourceColumn: current.sourceColumn,
          context: current.context,
        });
        continue;
      }

      stripped.push(line);
      if (current) {
        lineMap.push({
          dartLine: stripped.length,
          sourceLine: current.sourceLine,
          sourceColumn: current.sourceColumn,
          context: current.context,
        });
      }
    }

    return { dart: stripped.join('\n'), lineMap };
  }

  // v0.11.0 builtin: `here = locate()` reuses the fetch loading/error machinery
  // but calls Geolocator.getCurrentPosition() instead of http.get(). All failure
  // modes — denied permission, services disabled, hardware error — collapse to
  // `is error` per the spec (no separate `is denied` state). Result is stored
  // as a Map<String, double> with `latitude`/`longitude` keys so the existing
  // FieldAccess codegen works without special-casing.
  private genLocateMethod(fv: { name: string }): string {
    // v0.20.3: helper-var names mangled with `_igni_` prefix to avoid
    // collisions with user-declared Igni variables. Same root-cause class
    // as the fetch `response` collision (sub-shape 4 of doc 127); applied
    // preventively here for the locate lowering's locals (serviceEnabled,
    // permission, pos) before any real-app surfaces a collision.
    const methodName = `_locate${fv.name[0].toUpperCase() + fv.name.slice(1)}`;
    let code = `  Future<void> ${methodName}() async {\n`;
    code += `    try {\n`;
    code += `      bool _igni_serviceEnabled = await Geolocator.isLocationServiceEnabled();\n`;
    code += `      if (!_igni_serviceEnabled) {\n`;
    code += `        setState(() { _${fv.name}Error = true; _${fv.name}Loading = false; });\n`;
    code += `        return;\n`;
    code += `      }\n`;
    code += `      LocationPermission _igni_permission = await Geolocator.checkPermission();\n`;
    code += `      if (_igni_permission == LocationPermission.denied) {\n`;
    code += `        _igni_permission = await Geolocator.requestPermission();\n`;
    code += `        if (_igni_permission == LocationPermission.denied) {\n`;
    code += `          setState(() { _${fv.name}Error = true; _${fv.name}Loading = false; });\n`;
    code += `          return;\n`;
    code += `        }\n`;
    code += `      }\n`;
    code += `      if (_igni_permission == LocationPermission.deniedForever) {\n`;
    code += `        setState(() { _${fv.name}Error = true; _${fv.name}Loading = false; });\n`;
    code += `        return;\n`;
    code += `      }\n`;
    code += `      Position _igni_pos = await Geolocator.getCurrentPosition();\n`;
    code += `      setState(() {\n`;
    code += `        ${fv.name} = {'latitude': _igni_pos.latitude, 'longitude': _igni_pos.longitude};\n`;
    code += `        _${fv.name}Loading = false;\n`;
    code += `      });\n`;
    code += `    } catch (e) {\n`;
    code += `      setState(() { _${fv.name}Error = true; _${fv.name}Loading = false; });\n`;
    code += `    }\n`;
    code += `  }`;
    return code;
  }

  private genFetchMethod(fv: { name: string; url: string; method?: string; body?: string }): string {
    const methodName = `_fetch${fv.name[0].toUpperCase() + fv.name.slice(1)}`;
    let code = `  Future<void> ${methodName}() async {\n`;
    code += `    try {\n`;

    // Determine HTTP method
    const httpMethod = fv.method
      ? fv.method.replace(/'/g, '').toLowerCase()
      : 'get';
    const dartMethod = httpMethod === 'delete' ? 'delete'
      : httpMethod === 'patch' ? 'patch'
      : httpMethod === 'put' ? 'put'
      : httpMethod === 'post' ? 'post'
      : 'get';

    // v0.20.3: helper-var name `response` mangled to `_igni_response` to
    // avoid collision with user-declared Igni variables of the same name.
    // E.g. `response = fetch(url, method: "POST", body: {...})` is the
    // canonical fetch shape per cheatsheet §Async; pre-v0.20.3 codegen
    // emitted `final response = await http.post(...)` here, which shadowed
    // the user's `response` field and caused `Can't assign to final
    // variable 'response'` at Flutter compile (card-sender app 3 build
    // session 3, 2026-04-30; see docs/private/127).
    if (this.testMode) {
      // v0.18: route every fetch through the test-scope wrapper so `mock
      // fetch:` blocks can intercept. v0.18 only mocks GET; non-GET methods
      // still hit the wrapper (which throws if no mock is set).
      code += `      final _igni_response = await _igniHttpGet(${fv.url});\n`;
    } else if (fv.body && dartMethod !== 'get') {
      code += `      final _igni_response = await http.${dartMethod}(\n`;
      code += `        Uri.parse(${fv.url}),\n`;
      code += `        headers: {'Content-Type': 'application/json'},\n`;
      code += `        body: jsonEncode(${fv.body}),\n`;
      code += `      );\n`;
    } else {
      code += `      final _igni_response = await http.${dartMethod}(Uri.parse(${fv.url}));\n`;
    }

    code += `      if (_igni_response.statusCode == 200) {\n`;
    code += `        setState(() {\n`;
    code += `          ${fv.name} = jsonDecode(_igni_response.body);\n`;
    code += `          _${fv.name}Loading = false;\n`;
    code += `        });\n`;
    code += `      } else {\n`;
    code += `        setState(() {\n`;
    code += `          _${fv.name}Error = true;\n`;
    code += `          _${fv.name}Loading = false;\n`;
    code += `        });\n`;
    code += `      }\n`;
    code += `    } catch (e) {\n`;
    code += `      setState(() {\n`;
    code += `        _${fv.name}Error = true;\n`;
    code += `        _${fv.name}Loading = false;\n`;
    code += `      });\n`;
    code += `    }\n`;
    code += `  }`;
    return code;
  }

  private isUserDeclaredName(name: string): boolean {
    return this.functionParams.includes(name)
      || this.ctx.screenParams.includes(name)
      || this.ctx.stateVars.includes(name)
      || this.declaredLocals.has(name);
  }

  private isBuiltinStyleValue(expr: Expr): boolean {
    return expr.type === 'Ident' && isStyleValueName(expr.name) && !this.isUserDeclaredName(expr.name);
  }

  private genColorValue(expr: Expr): string {
    // v0.15.0: inline hex codes outside theme: blocks are rejected.
    if (expr.type === 'StringLit' && expr.value.startsWith('#')) {
      throw new TranspileError(
        `Inline hex colours are not supported. Use a token from \`theme: color:\` ` +
        `or one of the 12 built-in tokens (brand, subtle, danger, green, red, blue, ` +
        `white, black, yellow, orange, purple, teal). ` +
        `Define a theme: color: token (e.g. \`my_red: "${expr.value}"\`) and reference it by name.`,
        expr.loc?.line ?? 1,
        expr.loc?.column ?? 1,
      );
    }
    if (expr.type === 'Ident' && expr.name === 'card' && !this.isUserDeclaredName(expr.name)) {
      throw new TranspileError('`card` is background-only. Use it with `background:`, not `color:`.', expr.loc?.line ?? 1, expr.loc?.column ?? 1);
    }
    // v0.15.0: user-defined theme tokens are valid Idents in colour positions.
    if (expr.type === 'Ident' && expr.name in this.themeColors) {
      return resolveColor(expr, this.themeColors, this.themeDarkColors ?? undefined);
    }
    if (this.isBuiltinStyleValue(expr) && expr.type === 'Ident' && isColorTokenName(expr.name)) {
      return resolveColor(expr, this.themeColors, this.themeDarkColors ?? undefined);
    }
    this.needsStyleResolvers = true;
    return `_igniColorValue(context, ${this.exprToDart(expr)})`;
  }

  private genBackgroundValue(expr: Expr): string {
    // v0.15.0: inline hex codes outside theme: blocks are rejected. (Image-
    // string backgrounds — e.g. `background: "sunset.jpg"` — stay valid;
    // only `#`-prefixed strings hit this rejection.)
    if (expr.type === 'StringLit' && expr.value.startsWith('#')) {
      throw new TranspileError(
        `Inline hex colours are not supported. Use a token from \`theme: color:\` ` +
        `or one of the 12 built-in tokens, or the background-only token \`card\`. ` +
        `Define a theme: color: token (e.g. \`my_bg: "${expr.value}"\`) and reference it by name.`,
        expr.loc?.line ?? 1,
        expr.loc?.column ?? 1,
      );
    }
    // v0.15.0: user-defined theme tokens are valid Idents in background positions.
    if (expr.type === 'Ident' && expr.name in this.themeColors) {
      return resolveBackground(expr, this.themeColors, this.themeDarkColors ?? undefined);
    }
    if (this.isBuiltinStyleValue(expr)) {
      return resolveBackground(expr, this.themeColors, this.themeDarkColors ?? undefined);
    }
    this.needsStyleResolvers = true;
    return `_igniBackgroundValue(context, ${this.exprToDart(expr)})`;
  }

  // v0.17.0: width side of `border:`. Mirrors genColorValue: resolve literal
  // tokens at compile time, emit a runtime helper for everything else (function
  // calls, field access). Numeric/string literals are rejected — border weight
  // is a token vocabulary (thin/medium/thick), not a pixel scale.
  private genBorderWidth(expr: Expr): string {
    if (expr.type === 'NumberLit') {
      throw new TranspileError(
        `border: takes width tokens — thin / medium / thick. Got numeric value ${expr.value}. ` +
        `Border weight is cosmetic, not spatial — pixel tokens fit padding/gap because ` +
        `spacing is geometry, but border thickness is visual emphasis. Use \`border: thin\` (or medium/thick).`,
        expr.loc?.line ?? 1,
        expr.loc?.column ?? 1,
      );
    }
    if (expr.type === 'StringLit') {
      throw new TranspileError(
        `border: takes width tokens — thin / medium / thick. Got string literal "${expr.value}". ` +
        `Don't quote width tokens — write \`border: thin\` (unquoted), not \`border: "thin"\`.`,
        expr.loc?.line ?? 1,
        expr.loc?.column ?? 1,
      );
    }
    // Literal token Ident (thin / medium / thick) → compile-time resolve.
    if (expr.type === 'Ident' && isBorderWidthTokenName(expr.name) && !this.isUserDeclaredName(expr.name)) {
      const px = resolveBorderWidthToken(expr)!;
      return `${px}.0`;
    }
    // Anything else (function call, field access, conditional, user-shadowed
    // name) → runtime resolution. The function returns a token string at
    // runtime; _igniBorderWidth maps it to a pixel value.
    this.needsBorderWidthResolver = true;
    return `_igniBorderWidth(${this.exprToDart(expr)})`;
  }

  private screenHasDarkBackground(screen: Screen): boolean {
    const screenBg = findProp(screen.properties, 'background')?.value;
    if (!screenBg) return false;
    const vars = new Map<string, Expr>();
    for (const item of screen.body) {
      if (item.type === 'VariableDecl') vars.set(item.name, item.value);
    }
    const visit = (expr: Expr, seen = new Set<string>()): boolean => {
      if (isDarkBackgroundExpr(expr)) return true;
      if (expr.type !== 'Ident') return false;
      if (seen.has(expr.name)) return false;
      const value = vars.get(expr.name);
      if (!value) return false;
      seen.add(expr.name);
      return visit(value, seen);
    };
    return visit(screenBg);
  }

  // Emit a single `testWidgets("name", (tester) async { ... })` block from a
  // parsed `test "name":` AST node. Per doc 112, body statements include
  // render, event-sims (tap/change/submit/toggle), and assertions including
  // predicate forms (seen/on) and general boolean expressions over screen
  // v0.19 Session 3: recursively check a test body for SnapshotStmt usage.
  // Walks into FreezeTimeBlock bodies; mock blocks don't contain test stmts.
  private testBodyHasSnapshot(body: TestStatement[]): boolean {
    for (const stmt of body) {
      if (stmt.type === 'SnapshotStmt') return true;
      if (stmt.type === 'FreezeTimeBlock' && this.testBodyHasSnapshot(stmt.body)) return true;
    }
    return false;
  }

  // v0.19 Session 3: emit the _igniSerializeTree Dart helper as a string
  // template. Per doc 113 §Methodology note + Stage 2 lock, captures node
  // identity, branch/list structure, bound layout properties, transition
  // active-branch, and spring target value (Q4c deterministic-by-construction
  // via Tween.end, not the in-flight interpolated frame).
  private generateSnapshotSerializer(): string {
    return [
      `String _igniSerializeTree(WidgetTester tester) {`,
      `  final apps = find.byType(MaterialApp).evaluate().toList();`,
      `  if (apps.isEmpty) return '(empty)';`,
      `  Element? home;`,
      `  apps.first.visitChildElements((e) { home ??= e; });`,
      `  if (home == null) return '(empty)';`,
      `  final buf = StringBuffer();`,
      `  _igniSerializeNode(home!, buf, 0);`,
      `  return buf.toString().trimRight();`,
      `}`,
      ``,
      `void _igniSerializeNode(Element element, StringBuffer buf, int depth) {`,
      `  final w = element.widget;`,
      `  final indent = '  ' * depth;`,
      `  // Outer-shell unwrap: Igni's emit chain is Scaffold > SafeArea >`,
      `  // SingleChildScrollView > Padding > (Center >) Column. Pass-through.`,
      `  if (w is Scaffold || w is SafeArea || w is SingleChildScrollView ||`,
      `      w is ListenableBuilder || w is KeyedSubtree) {`,
      `    element.visitChildElements((c) => _igniSerializeNode(c, buf, depth));`,
      `    return;`,
      `  }`,
      `  // Padding > [Center >] Column/Row → fold padding (+ align=center) into the layout.`,
      `  if (w is Padding) {`,
      `    final pad = w.padding;`,
      `    final padN = pad is EdgeInsets ? pad.left.toInt() : 0;`,
      `    Element? inner;`,
      `    element.visitChildElements((e) { inner ??= e; });`,
      `    final iw = inner?.widget;`,
      `    if (iw is Center) {`,
      `      Element? innerInner;`,
      `      inner!.visitChildElements((e) { innerInner ??= e; });`,
      `      final iiw = innerInner?.widget;`,
      `      if (iiw is Column || iiw is Row) {`,
      `        final dir = iiw is Column ? 'vertical' : 'horizontal';`,
      `        buf.writeln('\${indent}(layout \${dir} padding=\${padN} align=center');`,
      `        innerInner!.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));`,
      `        buf.writeln('\${indent})');`,
      `        return;`,
      `      }`,
      `    }`,
      `    if (iw is Column || iw is Row) {`,
      `      final dir = iw is Column ? 'vertical' : 'horizontal';`,
      `      buf.writeln('\${indent}(layout \${dir} padding=\${padN}');`,
      `      inner!.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));`,
      `      buf.writeln('\${indent})');`,
      `      return;`,
      `    }`,
      `    // Plain padding wrap.`,
      `    buf.writeln('\${indent}(padding \${padN}');`,
      `    element.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));`,
      `    buf.writeln('\${indent})');`,
      `    return;`,
      `  }`,
      `  // Standalone Column/Row (no Padding wrapper).`,
      `  if (w is Column || w is Row) {`,
      `    final dir = w is Column ? 'vertical' : 'horizontal';`,
      `    buf.writeln('\${indent}(layout \${dir}');`,
      `    element.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));`,
      `    buf.writeln('\${indent})');`,
      `    return;`,
      `  }`,
      `  // Center standalone (not folded by Padding case).`,
      `  if (w is Center) {`,
      `    buf.writeln('\${indent}(center');`,
      `    element.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));`,
      `    buf.writeln('\${indent})');`,
      `    return;`,
      `  }`,
      `  // Container — fold decoration tokens.`,
      `  if (w is Container) {`,
      `    final dec = w.decoration;`,
      `    final props = <String>[];`,
      `    if (dec is BoxDecoration) {`,
      `      if (dec.color != null) {`,
      `        final v = dec.color!.value.toRadixString(16).padLeft(8, '0').substring(2);`,
      `        props.add('background=#\${v}');`,
      `      }`,
      `      if (dec.borderRadius is BorderRadius) {`,
      `        final br = dec.borderRadius as BorderRadius;`,
      `        if (br.topLeft.x > 0) props.add('rounded=\${br.topLeft.x.toInt()}');`,
      `      }`,
      `      if (dec.border != null) props.add('border=true');`,
      `    }`,
      `    final ps = props.isEmpty ? '' : ' \${props.join(' ')}';`,
      `    buf.writeln('\${indent}(container\${ps}');`,
      `    element.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));`,
      `    buf.writeln('\${indent})');`,
      `    return;`,
      `  }`,
      `  // Text → label.`,
      `  if (w is Text) {`,
      `    final text = (w.data ?? '').replaceAll('\\\\', '\\\\\\\\').replaceAll('"', '\\\\"');`,
      `    final styled = w.style != null ? ' style=themed' : '';`,
      `    buf.writeln('\${indent}(label "\${text}"\${styled})');`,
      `    return;`,
      `  }`,
      `  // ElevatedButton → button.`,
      `  if (w is ElevatedButton) {`,
      `    var label = '';`,
      `    final c = w.child;`,
      `    if (c is Text) label = c.data ?? '';`,
      `    label = label.replaceAll('\\\\', '\\\\\\\\').replaceAll('"', '\\\\"');`,
      `    buf.writeln('\${indent}(button "\${label}")');`,
      `    return;`,
      `  }`,
      `  // SizedBox spacers — skip (Igni emits between layout children to`,
      `  // realise gap:; the structural shape is captured by the parent layout).`,
      `  if (w is SizedBox) return;`,
      `  // TweenAnimationBuilder<double> → spring (Q4c target capture).`,
      `  if (w is TweenAnimationBuilder<double>) {`,
      `    final end = w.tween.end ?? 0.0;`,
      `    buf.writeln('\${indent}(spring target=\${end})');`,
      `    return;`,
      `  }`,
      `  // AnimatedSwitcher → transition with active-branch identity (Q4d).`,
      `  if (w is AnimatedSwitcher) {`,
      `    String branch = '?';`,
      `    Element? child;`,
      `    element.visitChildElements((e) { child ??= e; });`,
      `    if (child != null && child!.widget is KeyedSubtree) {`,
      `      final ks = child!.widget as KeyedSubtree;`,
      `      if (ks.key is ValueKey) branch = (ks.key as ValueKey).value.toString();`,
      `    }`,
      `    buf.writeln('\${indent}(transition active-branch=\${branch}');`,
      `    if (child != null) {`,
      `      child!.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));`,
      `    }`,
      `    buf.writeln('\${indent})');`,
      `    return;`,
      `  }`,
      `  // Spinner.`,
      `  if (w is CircularProgressIndicator) { buf.writeln('\${indent}(spinner)'); return; }`,
      `  // Fallback — unknown widget type. Diff-noisy but doesn't crash.`,
      `  buf.writeln('\${indent}(\${w.runtimeType})');`,
      `  element.visitChildElements((c) => _igniSerializeNode(c, buf, depth + 1));`,
      `}`,
      ``,
    ].join('\n');
  }

  // state. Mock blocks (`mock fetch:`, `mock every:`) are also handled here.
  private genTestBlock(test: TestBlock, igniTheme: string): string {
    // Cache the theme string on `this` so genTestStmt's nested freeze_time:
    // body emission can call genRenderStmt without threading the parameter
    // through every call site.
    this.cachedIgniTheme = igniTheme;
    // v0.19 Session 3: cache a slug of the test name for SnapshotStmt to
    // build the golden file path. Slug rule: lowercase, replace each
    // non-alphanumeric run with a single underscore, trim leading/trailing.
    this.cachedTestSlug = test.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const escName = JSON.stringify(test.name);
    // Track which screen we last rendered so state-var access can cast to its
    // private state class (`_<Name>ScreenState`). Tests live in the same Dart
    // library as the screens they render (the `igni test` CLI bundles them),
    // so the underscore-prefixed state class is in scope.
    let renderedScreen: string | null = null;
    let body = '';
    // Reset shared mock + request log between tests so cross-test state
    // doesn't leak. Cheap and explicit beats a tearDown() helper.
    if (this.hasFetch) {
      body += `    _igniMockFetch = null;\n`;
      body += `    _igniRequests.clear();\n`;
    }
    // v0.19: reset the mocked-now timestamp between tests too.
    body += `    _igniMockedNow = null;\n`;
    for (const stmt of test.body) {
      if (stmt.type === 'RenderStmt') {
        renderedScreen = stmt.screenName;
        body += this.genRenderStmt(stmt, igniTheme);
        continue;
      }
      // Mock blocks set up state before render and don't need a renderedScreen.
      // v0.19: MockNowStmt + FreezeTimeBlock join the same no-render-required
      // category. FreezeTimeBlock's *body* may contain renders; codegen for
      // FreezeTimeBlock handles inner-scope render tracking.
      if (
        stmt.type === 'MockFetchBlock' ||
        stmt.type === 'MockEveryBlock' ||
        stmt.type === 'MockNowStmt' ||
        stmt.type === 'FreezeTimeBlock'
      ) {
        body += this.genTestStmt(stmt, renderedScreen ?? '');
        // If a FreezeTimeBlock body contains a render, propagate that screen
        // to subsequent outer-scope statements. (The freeze block doesn't
        // unmount — Flutter's tree stays whatever was last rendered.)
        if (stmt.type === 'FreezeTimeBlock') {
          for (const inner of stmt.body) {
            if (inner.type === 'RenderStmt') renderedScreen = inner.screenName;
          }
        }
        continue;
      }
      if (!renderedScreen) {
        // Parser already enforces this, but defensive.
        throw new Error(`Test statement ${stmt.type} reached codegen without a prior RenderStmt.`);
      }
      body += this.genTestStmt(stmt, renderedScreen);
    }
    return `  testWidgets(${escName}, (tester) async {\n${body}  });\n`;
  }

  private genRenderStmt(stmt: RenderStmt, igniTheme: string): string {
    // Find the screen so we can detect shared-state usage and cast the State
    // class. Components-as-render-target are deferred to v0.19.
    const screen = this.allScreens.find(s => s.name === stmt.screenName);
    const widget = `${stmt.screenName}Screen()`;
    let pump: string;
    if (this.hasShared) {
      pump =
        `    await tester.pumpWidget(ListenableBuilder(\n` +
        `      listenable: shared,\n` +
        `      builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, ${igniTheme}, home: ${widget}),\n` +
        `    ));\n`;
    } else {
      pump = `    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, ${igniTheme}, home: ${widget}));\n`;
    }
    let extra = '    await tester.pump();\n';
    // shared.X: value pre-set args. Apply before the pump so the first build
    // sees the seeded state. Production-state args (non-shared) are applied
    // post-pump via the cached state object.
    for (const arg of stmt.args) {
      if (arg.name.startsWith('shared.')) {
        const subName = arg.name.slice('shared.'.length);
        const valueDart = this.exprToDart(arg.value);
        // Emit before the pump
        pump = `    shared.${subName} = ${valueDart};\n` + pump;
      }
    }
    return pump + extra;
  }

  private genTestStmt(stmt: TestStatement, renderedScreen: string): string {
    if (stmt.type === 'TapStmt') {
      const escLabel = JSON.stringify(stmt.label);
      return (
        `    await tester.tap(find.text(${escLabel}));\n` +
        `    await tester.pumpAndSettle();\n`
      );
    }
    if (stmt.type === 'ChangeStmt') {
      const escId = JSON.stringify(stmt.varName);
      const valueDart = this.exprToDart(stmt.value);
      return (
        `    await tester.enterText(find.byKey(const ValueKey(${escId})), ${valueDart});\n` +
        `    await tester.pumpAndSettle();\n`
      );
    }
    if (stmt.type === 'SubmitStmt') {
      const escId = JSON.stringify(stmt.varName);
      return (
        `    await tester.testTextInput.receiveAction(TextInputAction.done);\n` +
        `    await tester.pumpAndSettle();\n` +
        `    // submit ${escId}\n`
      );
    }
    if (stmt.type === 'ToggleStmt') {
      const escId = JSON.stringify(stmt.varName);
      return (
        `    await tester.tap(find.byKey(const ValueKey(${escId})));\n` +
        `    await tester.pumpAndSettle();\n`
      );
    }
    if (stmt.type === 'SlideStmt') {
      // Sliders need precise programmatic value setting; use the widget's
      // onChanged callback grabbed from the rendered Slider.
      const escId = JSON.stringify(stmt.varName);
      const valueDart = this.exprToDart(stmt.value);
      return (
        `    {\n` +
        `      final slider = tester.widget<Slider>(find.byKey(const ValueKey(${escId})));\n` +
        `      slider.onChanged?.call(${valueDart}.toDouble());\n` +
        `      await tester.pumpAndSettle();\n` +
        `    }\n`
      );
    }
    if (stmt.type === 'ExpectStmt') {
      return this.genExpectStmt(stmt, renderedScreen);
    }
    if (stmt.type === 'MockFetchBlock') {
      // Build a Map<String, dynamic> from the entries, then assign to
      // `_igniMockFetch`. Reactive re-fires hit the same map fresh per call.
      const lines: string[] = [];
      lines.push('    _igniMockFetch = {');
      for (const e of stmt.entries) {
        const escUrl = JSON.stringify(e.url);
        if (e.response.kind === 'error') {
          lines.push(`      ${escUrl}: Exception(${JSON.stringify(e.response.message)}),`);
        } else {
          lines.push(`      ${escUrl}: ${this.exprToDart(e.response.value)},`);
        }
      }
      lines.push('    };');
      return lines.join('\n') + '\n';
    }
    if (stmt.type === 'MockEveryBlock') {
      // Each `advance <duration>` jumps the test clock forward. WidgetTester's
      // `pump(<duration>)` advances the FakeAsync timer; for tests that need
      // multi-tick timer firing, FakeAsync.elapse pumps each `every` block's
      // periodic timer.
      // v0.19 Q4b: when `_igniMockedNow` is set (via `mock now:` or
      // `freeze_time:`), advance also moves the frozen `now()` value forward
      // by the same amount, so both clocks advance together. Sub-second
      // advances bump now() by zero whole seconds (integer division), which
      // preserves now()'s integer-seconds semantics.
      const lines: string[] = [];
      for (const adv of stmt.advances) {
        lines.push(`    await tester.pump(const Duration(milliseconds: ${adv.milliseconds}));`);
        lines.push(`    if (_igniMockedNow != null) _igniMockedNow = _igniMockedNow! + (${adv.milliseconds} ~/ 1000);`);
        lines.push(`    await tester.pump();`);
      }
      return lines.join('\n') + '\n';
    }
    if (stmt.type === 'MockNowStmt') {
      // v0.19 — ambient-scope `mock now: "<iso>"`. Sets the test-scope
      // override for `now()` to the parsed timestamp's seconds-since-epoch.
      // Applies for the rest of the test body (or enclosing freeze block).
      const escIso = JSON.stringify(stmt.iso8601);
      return `    _igniMockedNow = DateTime.parse(${escIso}).toUtc().millisecondsSinceEpoch ~/ 1000;\n`;
    }
    if (stmt.type === 'FreezeTimeBlock') {
      // v0.19 — block-form `freeze_time: "<iso>":`. Saves the previous
      // `_igniMockedNow`, sets it to the frozen timestamp, runs the body,
      // then restores. Q6 lock: block-extent — freeze ends at dedent.
      // Inner renders update an inner renderedScreen so subsequent body
      // statements (snapshot, expect, event-sims) bind to the right state.
      const escIso = JSON.stringify(stmt.iso8601);
      const lines: string[] = [];
      let innerRenderedScreen = renderedScreen;
      lines.push(`    {`);
      lines.push(`      final _prevMockedNow = _igniMockedNow;`);
      lines.push(`      _igniMockedNow = DateTime.parse(${escIso}).toUtc().millisecondsSinceEpoch ~/ 1000;`);
      for (const inner of stmt.body) {
        if (inner.type === 'RenderStmt') {
          innerRenderedScreen = inner.screenName;
          lines.push(this.genRenderStmt(inner, this.cachedIgniTheme).trimEnd());
        } else {
          lines.push(this.genTestStmt(inner, innerRenderedScreen).trimEnd());
        }
      }
      lines.push(`      _igniMockedNow = _prevMockedNow;`);
      lines.push(`    }`);
      return lines.join('\n') + '\n';
    }
    if (stmt.type === 'SnapshotStmt') {
      // v0.19 Session 3: real codegen. Serialize the rendered widget tree
      // via _igniSerializeTree, then either compare against a stored golden
      // (default) or write the new value (when IGNI_UPDATE_SNAPSHOTS=1 env
      // var is set, or when the golden file doesn't yet exist on disk).
      // Path: ../__snapshots__/<test-slug>__<snap-name>.txt — relative to
      // the cwd `flutter test` runs in (the .igni/ scaffold dir for user
      // projects), so the goldens live in the user's project root.
      const snapSlug = stmt.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const escSnapName = JSON.stringify(stmt.name);
      const goldenPath = `../__snapshots__/${this.cachedTestSlug}__${snapSlug}.txt`;
      const escGoldenPath = JSON.stringify(goldenPath);
      const lines: string[] = [];
      lines.push(`    // snapshot ${escSnapName}`);
      lines.push(`    {`);
      lines.push(`      final _igniSnapTree = _igniSerializeTree(tester);`);
      lines.push(`      final _igniSnapFile = File(${escGoldenPath});`);
      lines.push(`      final _igniShouldUpdate = Platform.environment['IGNI_UPDATE_SNAPSHOTS'] == '1';`);
      lines.push(`      if (_igniShouldUpdate || !_igniSnapFile.existsSync()) {`);
      lines.push(`        _igniSnapFile.parent.createSync(recursive: true);`);
      lines.push(`        _igniSnapFile.writeAsStringSync(_igniSnapTree);`);
      lines.push(`      } else {`);
      lines.push(`        expect(_igniSnapTree, equals(_igniSnapFile.readAsStringSync()));`);
      lines.push(`      }`);
      lines.push(`    }`);
      return lines.join('\n') + '\n';
    }
    throw new Error(`Unknown test statement type: ${(stmt as { type: string }).type}`);
  }

  private genExpectStmt(stmt: ExpectStmt, renderedScreen: string): string {
    // Predicate-form short-circuits — cleaner Dart than a generic isTrue cast.
    if (stmt.expr.type === 'SeenPredicate') {
      const escText = JSON.stringify(stmt.expr.text);
      return `    expect(find.text(${escText}), findsAtLeastNWidgets(1));\n`;
    }
    if (stmt.expr.type === 'UnaryExpr' && stmt.expr.op === 'not' && stmt.expr.operand.type === 'SeenPredicate') {
      const escText = JSON.stringify(stmt.expr.operand.text);
      return `    expect(find.text(${escText}), findsNothing);\n`;
    }
    if (stmt.expr.type === 'OnPredicate') {
      return `    expect(find.byType(${stmt.expr.screenName}Screen), findsOneWidget);\n`;
    }
    if (stmt.expr.type === 'UnaryExpr' && stmt.expr.op === 'not' && stmt.expr.operand.type === 'OnPredicate') {
      return `    expect(find.byType(${stmt.expr.operand.screenName}Screen), findsNothing);\n`;
    }
    // Generic `expect <bool-expression>` — translate state-var refs through
    // the rendered screen's state object.
    const dart = this.testExprToDart(stmt.expr, renderedScreen);
    return `    expect(${dart}, isTrue);\n`;
  }

  // Translate an expression in test scope. State-var references (Idents
  // matching the rendered screen's stateVars) are rewritten as
  // `(tester.state(find.byType(<Name>Screen)) as _<Name>ScreenState).<var>`.
  // Test-scope builtins (`value_of`, `requested`, `request_count`) are
  // special-cased.
  private testExprToDart(expr: Expr, renderedScreen: string): string {
    const screen = this.allScreens.find(s => s.name === renderedScreen);
    const stateVars = new Set<string>();
    if (screen) {
      for (const item of screen.body) {
        if (item.type === 'VariableDecl') stateVars.add(item.name);
      }
    }
    const stateAccess = `(tester.state(find.byType(${renderedScreen}Screen)) as _${renderedScreen}ScreenState)`;
    const walk = (e: Expr): string => {
      switch (e.type) {
        case 'NumberLit': return `${e.value}`;
        case 'StringLit': return `'${e.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$')}'`;
        case 'Ident':
          if (stateVars.has(e.name)) return `${stateAccess}.${e.name}`;
          if (e.name === 'true' || e.name === 'false') return e.name;
          return e.name;
        case 'FieldAccess': {
          const obj = walk(e.object);
          if (e.object.type === 'Ident' && e.object.name === 'shared') {
            return `shared.${e.field}`;
          }
          // Dart-builtin properties on Lists / Strings / Maps. Use dot access;
          // bracket access (`['length']`) would be a map-key lookup, not the
          // builtin property.
          const dartProps = new Set(['length', 'isEmpty', 'isNotEmpty', 'first', 'last']);
          if (dartProps.has(e.field)) {
            return `${obj}.${e.field}`;
          }
          return `${obj}['${e.field}']`;
        }
        case 'IndexAccess': {
          const list = walk(e.object);
          const idx = walk(e.index);
          return `(${idx} >= 0 && ${idx} < ${list}.length ? ${list}[${idx}] : null)`;
        }
        case 'BinaryExpr':
          return `${walk(e.left)} ${e.op} ${walk(e.right)}`;
        case 'EqualityExpr':
          return `${walk(e.left)} ${e.negated ? '!=' : '=='} ${walk(e.right)}`;
        case 'IsExpr': {
          // `x is empty` / `x is null` / `x is loading` / `x is error`
          const t = walk(e.target);
          switch (e.check) {
            case 'empty': return `${t}.isEmpty`;
            case 'not empty': return `${t}.isNotEmpty`;
            case 'null': return `${t} == null`;
            case 'not null': return `${t} != null`;
            case 'loading': return `${t} == null`;
            case 'error': return `${t} is Exception`;
          }
          return t;
        }
        case 'InExpr':
          return `${e.negated ? '!' : ''}${walk(e.list)}.contains(${walk(e.target)})`;
        case 'UnaryExpr':
          return `!(${walk(e.operand)})`;
        case 'FunctionCall': {
          if (e.name === 'value_of') {
            // value_of(<id>) → state-var access (lexical-reactivity makes the
            // bound var the canonical input value).
            if (e.args.length !== 1 || e.args[0].type !== 'Ident') {
              throw new Error('value_of() expects one identifier argument');
            }
            const idName = (e.args[0] as Ident).name;
            return `${stateAccess}.${idName}`;
          }
          if (e.name === 'requested') {
            if (e.args.length !== 1) throw new Error('requested() expects one URL argument');
            return `_igniRequests.contains(${walk(e.args[0])})`;
          }
          if (e.name === 'request_count') {
            if (e.args.length !== 1) throw new Error('request_count() expects one URL argument');
            return `_igniRequests.where((u) => u == ${walk(e.args[0])}).length`;
          }
          // Screen-internal function call: `total_with_tax(100, 0.2)` →
          // `(state).total_with_tax(100, 0.2)`. Per Q13: `render` puts
          // screen-internal functions in test scope.
          const args = e.args.map(walk).join(', ');
          if (screen) {
            const fnDef = screen.body.find(it => it.type === 'FunctionDef' && (it as { name: string }).name === e.name);
            if (fnDef) {
              return `${stateAccess}.${e.name}(${args})`;
            }
          }
          return `${e.name}(${args})`;
        }
        case 'ListLit':
          if (e.elements.length === 0) return '[]';
          return `[${e.elements.map(walk).join(', ')}]`;
        case 'ObjectLit':
          return `{${e.entries.map(en => `'${en.key}': ${walk(en.value)}`).join(', ')}}`;
        case 'ObjectUpdate':
          return `{...${walk(e.base)}, ${e.updates.map(u => `'${u.key}': ${walk(u.value)}`).join(', ')}}`;
        case 'LambdaExpr':
          return `(${e.param}) => ${walk(e.body)}`;
        case 'SeenPredicate':
        case 'OnPredicate':
          // Predicate forms should only appear at the top level of an expect
          // statement; reaching them inside nested expressions is a parser
          // bug.
          throw new Error(`Internal error: ${e.type} reached testExprToDart inner walk.`);
      }
    };
    return walk(expr);
  }

  private genScreen(screen: Screen): string {
    this.ctx = { stateVars: [], stateVarTypes: {}, boundInputVars: [], screenParams: screen.params, isComponent: false, springAliases: {} };
    // v0.19: collect spring-aliased variables (`x = spring(target)`). These
    // don't get emitted as state fields; reads of `x` substitute to `target`,
    // and `label x` (or any consumer that supports spring) lowers to a
    // TweenAnimationBuilder. Pre-pass before the main body walk.
    for (const item of screen.body) {
      if (
        item.type === 'VariableDecl' &&
        item.value.type === 'FunctionCall' &&
        item.value.name === 'spring' &&
        item.value.args.length === 1
      ) {
        this.ctx.springAliases[item.name] = item.value.args[0];
      }
    }
    const stateDecls: string[] = [];
    const uiNodes: UINode[] = [];
    const funcDefs: FunctionDef[] = [];
    const everyBlocks: EveryNode[] = [];

    this.fetchVars = [];
    const buildLocals: string[] = [];
    const buildLocalVars = new Set<string>();

    // First pass: collect variable names targeted by conditional assignment
    let hasConditionalAssignment = false;
    for (const item of screen.body) {
      if (item.type === 'If' && this.ifContainsAssignments(item)) {
        hasConditionalAssignment = true;
        this.collectAssignmentTargets(item, buildLocalVars);
      }
    }

    // Second pass: expand build locals backwards through the dependency chain.
    // If variable A is a build local and its initializer references variable B,
    // then B must also be a build local — UNLESS B has a simple literal initializer
    // (strings, numbers, booleans are real state, not derived values).
    const allDecls = screen.body.filter(i => i.type === 'VariableDecl') as VariableDecl[];
    const allDeclNames = new Set<string>(allDecls.map(d => d.name));
    const isSimpleLiteral = (v: VariableDecl) => {
      const t = v.value.type;
      return t === 'StringLit'
        || t === 'NumberLit'
        || (v.value.type === 'Ident' && (v.value.name === 'true' || v.value.name === 'false'))
        || isStyleValueExpr(v.value)
        || t === 'ListLit';
    };

    if (hasConditionalAssignment) {
      const scanned = new Set<string>();
      let changed = true;
      while (changed) {
        changed = false;
        for (const decl of allDecls) {
          if (buildLocalVars.has(decl.name) && !scanned.has(decl.name)) {
            scanned.add(decl.name);
            for (const other of allDecls) {
              if (!buildLocalVars.has(other.name) && !isSimpleLiteral(other) && this.exprRefsAny(decl.value, new Set([other.name]))) {
                buildLocalVars.add(other.name);
                changed = true;
              }
            }
          }
        }
      }
    }

    // Third pass: promote derived variables to build locals.
    // Dart forbids instance-field initializers from referencing other instance
    // fields, so any screen-body variable whose initializer references another
    // screen-body variable must live inside build() — where it also re-evaluates
    // each rebuild, matching Igni's lexical reactivity semantics.
    let changedDerived = true;
    while (changedDerived) {
      changedDerived = false;
      for (const decl of allDecls) {
        if (buildLocalVars.has(decl.name)) continue;
        // fetch calls become stream/future state, handled separately — skip.
        if (decl.value.type === 'FunctionCall' && decl.value.name === 'fetch') continue;
        // v0.19 spring aliases don't get emitted at all; reads substitute to the target.
        if (this.ctx.springAliases[decl.name]) continue;
        if (this.exprRefsAny(decl.value, allDeclNames)) {
          buildLocalVars.add(decl.name);
          changedDerived = true;
        }
      }
    }

    let inBuildLocals = false;
    for (const item of screen.body) {
      if (item.type === 'VariableDecl') {
        // v0.19: spring-aliased vars don't emit fields. Reads of the alias
        // name substitute to the spring's target argument; consumption by
        // `label` lowers to TweenAnimationBuilder<double>.
        if (this.ctx.springAliases[item.name]) {
          continue;
        }
        // Detect fetch variables
        if (item.value.type === 'FunctionCall' && item.value.name === 'fetch') {
          const url = item.value.args[0];
          const methodArg = item.value.namedArgs?.find(a => a.name === 'method');
          const bodyArg = item.value.namedArgs?.find(a => a.name === 'body');
          const stateNames = new Set(this.ctx.stateVars);
          const reactive = this.exprRefsAny(url, stateNames);
          this.fetchVars.push({
            name: item.name,
            url: this.exprToDart(url),
            urlExpr: url,
            method: methodArg ? this.exprToDart(methodArg.value) : undefined,
            body: bodyArg ? this.exprToDart(bodyArg.value) : undefined,
            reactive,
            kind: 'fetch',
          });
          this.ctx.stateVars.push(item.name);
          this.ctx.stateVarTypes[item.name] = 'dynamic';
        } else if (item.value.type === 'FunctionCall' && item.value.name === 'locate') {
          // `locate()` is a no-arg async builtin that reuses the fetch
          // loading/error machinery. v0.11.0 spec: the loaded value is a
          // {latitude, longitude} map so the existing FieldAccess codegen
          // (`here.latitude` → `here['latitude']`) Just Works.
          this.fetchVars.push({
            name: item.name,
            url: '',
            urlExpr: item.value,
            reactive: false,
            kind: 'locate',
          });
          this.ctx.stateVars.push(item.name);
          this.ctx.stateVarTypes[item.name] = 'dynamic';
        } else if (buildLocalVars.has(item.name) || inBuildLocals) {
          // Variable is conditionally reassigned or follows one — build() local
          inBuildLocals = true;
          this.ctx.stateVars.push(item.name);
          this.ctx.stateVarTypes[item.name] = inferType(item.value, item.typeHint);
          const alreadyDeclared = buildLocals.some(l => l.includes(`var ${item.name} `));
          buildLocals.push(this.withMarker(item, `local:${item.name}`, alreadyDeclared
            ? `    ${item.name} = ${this.exprToDart(item.value)};`
            : `    var ${item.name} = ${this.exprToDart(item.value)};`));
        } else {
          this.ctx.stateVars.push(item.name);
          this.ctx.stateVarTypes[item.name] = inferType(item.value, item.typeHint);
          stateDecls.push(this.genStateVar(item));
        }
      } else if (item.type === 'FunctionDef') {
        funcDefs.push(item);
      } else if (item.type === 'Every') {
        everyBlocks.push(item);
      } else if (item.type === 'Comment') {
        if (inBuildLocals) {
          buildLocals.push(`    // ${item.text}`);
        } else if (uiNodes.length === 0 && funcDefs.length === 0) {
          stateDecls.push(`  // ${item.text}`);
        } else {
          uiNodes.push(item);
        }
      } else if (item.type === 'If' && this.ifContainsAssignments(item)) {
        inBuildLocals = true;
        buildLocals.push(this.genImperativeIf(item));
      } else {
        uiNodes.push(item);
      }
    }

    this.collectBoundInputs(uiNodes);

    for (const bound of this.ctx.boundInputVars) {
      if (buildLocalVars.has(bound)) {
        const decl = allDecls.find(d => d.name === bound);
        const loc = decl?.loc ?? { line: 1, column: 1 };
        throw new TranspileError(
          `\`${bound}\` is bound by an \`input\` but also conditionally reassigned in this screen — input controllers need a stable State field, so the bound variable must be initialised unconditionally at screen body level. Move the conditional logic into a function or pre-compute the initial value, then use \`on change:\` to write back.`,
          loc.line,
          loc.column,
        );
      }
    }


    const name = screen.name;
    const hasParams = screen.params.length > 0;
    const hasState = stateDecls.length > 0;
    let bodyWidget: string;
    if (uiNodes.length === 0) {
      bodyWidget = 'const SizedBox()';
    } else if (uiNodes.length === 1 && !this.emitsSpread(uiNodes[0])) {
      bodyWidget = this.genUINode(uiNodes[0], 3);
      // `fill: true` on the screen's root layout wraps it in Expanded, but
      // Expanded must live inside a Flex widget — as a Scaffold body it throws
      // at render time. Strip the outer wrapper; the Scaffold body already
      // fills available space.
      bodyWidget = this.unwrapScreenRootExpanded(bodyWidget);
    } else {
      // Implicit vertical layout — multiple children, or a single If/Each
      // whose collection-spread output requires list context.
      const children = uiNodes.map(n => n.type === 'Comment' ? this.genUINode(n, 4) : this.genUINode(n, 4) + ',').join('\n');
      bodyWidget = `      Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n${children}\n        ],\n      )`;
    }

    // Default 16px padding for zero-config screens — labels and widgets at
    // screen body level would otherwise hug the viewport edge. Skip when the
    // root is an explicit layout (user is in control of padding already).
    if (uiNodes.length > 0 && !this.rootOwnsLayout(uiNodes)) {
      bodyWidget = `      Padding(\n        padding: const EdgeInsets.all(16),\n        child: ${bodyWidget.trimStart()},\n      )`;
    }

    const hasControllers = this.ctx.boundInputVars.length > 0;

    // Widget class
    let widgetClass = `class ${name}Screen extends StatefulWidget {\n`;
    if (hasParams) {
      for (const p of screen.params) {
        widgetClass += `  final dynamic ${p};\n`;
      }
    }
    const constPrefix = hasParams ? '' : 'const ';
    const paramList = hasParams
      ? `{super.key, ${screen.params.map(p => `required this.${p}`).join(', ')}}`
      : '{super.key}';
    widgetClass += `  ${constPrefix}${name}Screen(${paramList});\n\n`;
    widgetClass += `  @override\n  State<${name}Screen> createState() => _${name}ScreenState();\n`;
    widgetClass += `}\n`;

    const hasFetchVars = this.fetchVars.length > 0;

    // State class
    let preBuild = '';
    if (hasState) {
      preBuild = stateDecls.map(d => `  ${d}`).join('\n');
    }

    // Fetch variable fields
    if (hasFetchVars) {
      const fetchDecls = this.fetchVars.map(f => {
        let decl = `  dynamic ${f.name};\n  bool _${f.name}Loading = true;\n  bool _${f.name}Error = false;`;
        if (f.reactive) {
          decl += `\n  String? _last${f.name[0].toUpperCase() + f.name.slice(1)}Url;`;
        }
        return decl;
      }).join('\n');
      preBuild += (preBuild ? '\n' : '') + fetchDecls;
    }

    if (hasControllers) {
      const controllerDecls = this.ctx.boundInputVars
        .map(v => `  late final TextEditingController _${v}Controller;`)
        .join('\n');
      preBuild += (preBuild ? '\n' : '') + controllerDecls;
    }

    // Audio player field
    const screenUsesAudio = this.detectBuiltinInScreen(screen, 'play');
    if (screenUsesAudio) {
      preBuild += (preBuild ? '\n' : '') + '  final _audioPlayer = AudioPlayer();';
    }

    // v0.14: `every <duration>:` block fields. Each block gets its own
    // Timer.periodic instance, started in initState and cancelled in dispose.
    // Multi-block per screen → each indexed by parse order. `Timer?` so
    // dispose can null-check before cancelling.
    const hasEveryBlocks = everyBlocks.length > 0;
    if (hasEveryBlocks) {
      const everyDecls = everyBlocks
        .map((_, i) => `  Timer? _everyTimer${i};`)
        .join('\n');
      preBuild += (preBuild ? '\n' : '') + everyDecls;
    }

    // initState (controllers + fetch calls + every-block timers)
    const needsInitState = hasControllers || hasFetchVars || hasEveryBlocks;
    if (needsInitState) {
      const initLines: string[] = [];
      for (const v of this.ctx.boundInputVars) {
        initLines.push(`    _${v}Controller = TextEditingController(text: ${v});`);
      }
      for (const f of this.fetchVars) {
        const prefix = f.kind === 'locate' ? '_locate' : '_fetch';
        initLines.push(`    ${prefix}${f.name[0].toUpperCase() + f.name.slice(1)}();`);
      }
      for (let i = 0; i < everyBlocks.length; i++) {
        const block = everyBlocks[i];
        // Body uses the screen's stateVars / declaredLocals, just like a
        // function body. genStmt wraps state-var assignments in setState
        // automatically — no additional wrapping needed here.
        this.declaredLocals = new Set();
        const body = this.genStmtBlock(block.body, 3).trimEnd();
        initLines.push(
          `    _everyTimer${i} = Timer.periodic(const Duration(milliseconds: ${block.milliseconds}), (_) {\n${body}\n    });`
        );
      }
      preBuild += `\n\n  @override\n  void initState() {\n    super.initState();\n${initLines.join('\n')}\n  }`;
    }

    // dispose (controllers + every-block timers)
    const needsDispose = hasControllers || hasEveryBlocks;
    if (needsDispose) {
      const disposalLines: string[] = [];
      for (const v of this.ctx.boundInputVars) {
        disposalLines.push(`    _${v}Controller.dispose();`);
      }
      for (let i = 0; i < everyBlocks.length; i++) {
        disposalLines.push(`    _everyTimer${i}?.cancel();`);
      }
      preBuild += `\n\n  @override\n  void dispose() {\n${disposalLines.join('\n')}\n    super.dispose();\n  }`;
    }

    // Fetch methods
    for (const f of this.fetchVars) {
      preBuild += '\n\n' + (f.kind === 'locate' ? this.genLocateMethod(f) : this.genFetchMethod(f));
    }

    for (const func of funcDefs) {
      preBuild += (preBuild ? '\n\n' : '') + this.genFunctionDef(func);
    }

    let stateClass = `class _${name}ScreenState extends State<${name}Screen> {\n`;
    if (preBuild) {
      stateClass += preBuild + '\n\n';
    }
    // Screen-level properties
    const titleProp = findProp(screen.properties, 'title');
    const screenBgProp = findProp(screen.properties, 'background');
    const hasImageBg = screenBgProp ? isImageBackground(screenBgProp.value) : false;
    let scaffoldBg = (screenBgProp && !hasImageBg) ? this.genBackgroundValue(screenBgProp.value) : '';

    // Bug 6 (doc 116 #5): when the root layout declares both `fill: true` and
    // `background:`, the user expects the background to extend to scaffold
    // edges (and through the AppBar in dark mode). The Scaffold body wraps in
    // SafeArea + SingleChildScrollView, so a Container painted by the inner
    // layout sizes to its child and leaves scaffoldBackgroundColor visible
    // around it. Hoist the layout background up to scaffoldBg + AppBar bg so
    // the whole viewport renders the chosen colour. Skip when the screen
    // already has its own `background:` (user expressed two distinct intents).
    if (!scaffoldBg && !hasImageBg && uiNodes.length === 1 && uiNodes[0].type === 'Layout') {
      const root = uiNodes[0];
      const rootFill = findProp(root.properties, 'fill');
      const isFillTrue = rootFill && rootFill.value.type === 'Ident' && rootFill.value.name === 'true';
      const rootBg = findProp(root.properties, 'background');
      if (isFillTrue && rootBg && !isImageBackground(rootBg.value)) {
        scaffoldBg = this.genBackgroundValue(rootBg.value);
      }
    }

    stateClass += `  @override\n  Widget build(BuildContext context) {\n`;
    if (buildLocals.length > 0) {
      stateClass += buildLocals.join('\n') + '\n';
    }

    // Reactive re-fetch: check if URL changed since last fetch
    for (const f of this.fetchVars) {
      if (f.reactive) {
        const capName = f.name[0].toUpperCase() + f.name.slice(1);
        stateClass += `    final _current${capName}Url = ${f.url};\n`;
        stateClass += `    if (_current${capName}Url != _last${capName}Url) {\n`;
        stateClass += `      _last${capName}Url = _current${capName}Url;\n`;
        stateClass += `      _${f.name}Loading = true;\n`;
        stateClass += `      _${f.name}Error = false;\n`;
        stateClass += `      _fetch${capName}();\n`;
        stateClass += `    }\n`;
      }
    }

    // Build Scaffold parts
    const scaffoldParts: string[] = [];
    if (hasImageBg) {
      scaffoldParts.push(`      extendBodyBehindAppBar: true`);
    }
    if (titleProp) {
      const titleStr = this.exprToDart(titleProp.value);
      if (hasImageBg) {
        scaffoldParts.push(`      appBar: AppBar(title: Text(${titleStr}), backgroundColor: Colors.transparent, foregroundColor: Colors.white, elevation: 0)`);
      } else {
        const appBarBg = scaffoldBg ? `, backgroundColor: ${scaffoldBg}, foregroundColor: Colors.white` : '';
        scaffoldParts.push(`      appBar: AppBar(title: Text(${titleStr})${appBarBg})`);
      }
    }
    if (scaffoldBg) {
      scaffoldParts.push(`      backgroundColor: ${scaffoldBg}`);
    }
    // Wrap body in SafeArea when there's no AppBar (title:) and no image
    // background — both of those already handle the top safe-area inset.
    // Without this, screens with a root label or non-layout content clip
    // behind the iOS Dynamic Island / status bar on devices with notches.
    // (Mobile smoke test 2026-04-21; docs/private/68 Finding A.)
    const needsSafeArea = !titleProp && !hasImageBg;
    if (hasImageBg) {
      const imgSrc = this.exprToDart(screenBgProp!.value);
      scaffoldParts.push(`      body: Container(\n        width: double.infinity,\n        height: double.infinity,\n        decoration: const BoxDecoration(\n          image: DecorationImage(\n            image: AssetImage('assets/' + ${imgSrc}),\n            fit: BoxFit.cover,\n          ),\n        ),\n        child: SafeArea(\n          child: ${bodyWidget.trimStart()},\n        ),\n      )`);
    } else if (titleProp || scaffoldBg || this.containsPaginateEach(uiNodes)) {
      const inner = bodyWidget.trimStart();
      scaffoldParts.push(`      body: ${needsSafeArea ? `SafeArea(\n        child: ${inner},\n      )` : inner}`);
    } else {
      scaffoldParts.push(`      body: SafeArea(\n        child: SingleChildScrollView(\n          child: ${bodyWidget.trimStart()},\n        ),\n      )`);
    }
    // Dark theme (when any screen declares a dark background) is applied at
    // the MaterialApp level in generate() — per-screen Theme wrapping would
    // not work here because inline Theme.of(context) calls in this build
    // method use the State's own context, which sits above any wrap we emit.
    stateClass += `    return Scaffold(\n${scaffoldParts.join(',\n')},\n    );\n`;
    stateClass += `  }\n}\n`;

    return this.withMarker(screen, `screen:${name}`, widgetClass + '\n' + stateClass);
  }

  private exprRefsAny(expr: Expr, names: Set<string>): boolean {
    if (expr.type === 'Ident') return names.has(expr.name);
    if (expr.type === 'FieldAccess') return this.exprRefsAny(expr.object, names);
    if (expr.type === 'IndexAccess') return this.exprRefsAny(expr.object, names) || this.exprRefsAny(expr.index, names);
    if (expr.type === 'BinaryExpr') return this.exprRefsAny(expr.left, names) || this.exprRefsAny(expr.right, names);
    if (expr.type === 'UnaryExpr') return this.exprRefsAny(expr.operand, names);
    if (expr.type === 'FunctionCall') return expr.args.some(a => this.exprRefsAny(a, names));
    if (expr.type === 'LambdaExpr') return this.exprRefsAny(expr.body, names);
    if (expr.type === 'EqualityExpr') return this.exprRefsAny(expr.left, names) || this.exprRefsAny(expr.right, names);
    if (expr.type === 'IsExpr') return this.exprRefsAny(expr.target, names);
    if (expr.type === 'InExpr') return this.exprRefsAny(expr.target, names) || this.exprRefsAny(expr.list, names);
    return false;
  }

  private collectAssignmentTargets(node: IfNode, targets: Set<string>): void {
    const collect = (items: (UINode | VariableDecl)[]) => {
      for (const item of items) {
        if (item.type === 'VariableDecl') targets.add(item.name);
      }
    };
    collect(node.then);
    for (const branch of node.elseIfs) collect(branch.body);
    if (node.else_) collect(node.else_);
  }

  private ifContainsAssignments(node: IfNode): boolean {
    const check = (items: (UINode | VariableDecl)[]) => items.some(i => i.type === 'VariableDecl');
    if (check(node.then)) return true;
    for (const branch of node.elseIfs) {
      if (check(branch.body)) return true;
    }
    if (node.else_ && check(node.else_)) return true;
    return false;
  }

  private genImperativeIf(node: IfNode): string {
    const cond = this.exprToDart(node.condition);
    let code = `    if (${cond}) {\n`;
    for (const item of node.then) {
      if (item.type === 'VariableDecl') {
        code += `      ${item.name} = ${this.exprToDart(item.value)};\n`;
      }
    }
    code += `    }`;
    for (const branch of node.elseIfs) {
      code += ` else if (${this.exprToDart(branch.condition)}) {\n`;
      for (const item of branch.body) {
        if (item.type === 'VariableDecl') {
          code += `      ${item.name} = ${this.exprToDart(item.value)};\n`;
        }
      }
      code += `    }`;
    }
    if (node.else_) {
      code += ` else {\n`;
      for (const item of node.else_) {
        if (item.type === 'VariableDecl') {
          code += `      ${item.name} = ${this.exprToDart(item.value)};\n`;
        }
      }
      code += `    }`;
    }
    return this.withMarker(node, 'if', code);
  }

  private collectBoundInputs(nodes: (UINode | VariableDecl)[]): void {
    // Walk all UI containers — layouts, conditional branches, and each-bodies.
    // The previous implementation walked only Layout.children, missing input
    // bind: declarations nested inside if/else branches and each loops; this
    // surfaced as TextEditingController-getter-undefined errors at Flutter
    // compile when an input bind: lived inside a conditional render branch
    // (card-sender app 3 build session 2, 2026-04-30; see docs/private/127).
    for (const node of nodes) {
      if ((node as UINode).type === 'Input') {
        this.ctx.boundInputVars.push((node as InputNode).bind);
      } else if ((node as UINode).type === 'Layout') {
        this.collectBoundInputs((node as Layout).children);
      } else if ((node as UINode).type === 'If') {
        const ifNode = node as IfNode;
        this.collectBoundInputs(ifNode.then);
        for (const branch of ifNode.elseIfs) {
          this.collectBoundInputs(branch.body);
        }
        if (ifNode.else_) {
          this.collectBoundInputs(ifNode.else_);
        }
      } else if ((node as UINode).type === 'Each') {
        this.collectBoundInputs((node as EachNode).children);
      }
    }
  }


  private genStateVar(decl: VariableDecl): string {
    const dartType = inferType(decl.value, decl.typeHint);
    const dartValue = this.exprToDart(decl.value);
    const needsLate = this.exprRefsParams(decl.value);
    const code = needsLate ? `late ${dartType} ${decl.name} = ${dartValue};` : `${dartType} ${decl.name} = ${dartValue};`;
    return this.withMarker(decl, `state:${decl.name}`, code);
  }

  private exprRefsParams(expr: Expr): boolean {
    if (expr.type === 'Ident') return this.ctx.screenParams.includes(expr.name);
    if (expr.type === 'FieldAccess') return this.exprRefsParams(expr.object);
    if (expr.type === 'IndexAccess') return this.exprRefsParams(expr.object) || this.exprRefsParams(expr.index);
    if (expr.type === 'BinaryExpr') return this.exprRefsParams(expr.left) || this.exprRefsParams(expr.right);
    if (expr.type === 'UnaryExpr') return this.exprRefsParams(expr.operand);
    if (expr.type === 'FunctionCall') return expr.args.some(a => this.exprRefsParams(a));
    if (expr.type === 'LambdaExpr') return this.exprRefsParams(expr.body);
    if (expr.type === 'EqualityExpr') return this.exprRefsParams(expr.left) || this.exprRefsParams(expr.right);
    if (expr.type === 'IsExpr') return this.exprRefsParams(expr.target);
    if (expr.type === 'InExpr') return this.exprRefsParams(expr.target) || this.exprRefsParams(expr.list);
    return false;
  }

  // -- UI node generation --

  private genUINode(node: UINode, depth: number, inRow = false, parentGap?: { dim: 'width' | 'height'; px: number }): string {
    let code = '';
    switch (node.type) {
      case 'Layout': code = this.genLayout(node, depth); break;
      case 'Label':  code = this.genLabel(node, depth); break;
      case 'Button': code = this.genButton(node, depth, inRow); break;
      case 'Input':  code = this.genInput(node, depth, inRow); break;
      case 'Toggle': code = this.genToggle(node, depth); break;
      case 'If':     code = this.genIf(node, depth); break;
      case 'Each':   code = this.genEach(node, depth, parentGap); break;
      case 'Spinner': code = `${this.indent(depth)}const CircularProgressIndicator()`; break;
      case 'Divider': code = `${this.indent(depth)}const Divider()`; break;
      case 'Comment': code = `${this.indent(depth)}// ${node.text}`; break;
      case 'Icon':    code = this.genIcon(node, depth); break;
      case 'Image':   code = this.genImage(node, depth); break;
      case 'Slider':  code = this.genSlider(node, depth); break;
      case 'Checkbox': code = this.genCheckbox(node, depth); break;
      case 'Dropdown': code = this.genDropdown(node, depth); break;
      case 'Badge':   code = this.genBadge(node, depth); break;
      case 'Body':    code = `${this.indent(depth)}child`; break;
      case 'ComponentInvocation': code = this.genComponentInvocation(node, depth); break;
    }
    return this.withMarker(node, `ui:${node.type}`, code);
  }

  private genLayout(node: Layout, depth: number): string {
    const widget = node.direction === 'vertical' ? 'Column' : 'Row';
    const alignProp = findProp(node.properties, 'align');
    const gapProp = findProp(node.properties, 'gap');
    const paddingProp = findProp(node.properties, 'padding');
    const gapSize = gapProp ? resolveDesignToken(gapProp.value) : null;
    const gapDimension = node.direction === 'vertical' ? 'height' : 'width';
    const isCenter = alignProp && resolveIdentName(alignProp.value) === 'center';
    const hasPadding = paddingProp !== undefined;

    // Wrappers push the Column deeper
    let wrappers = 0;
    if (hasPadding) wrappers++;
    if (isCenter) wrappers++;
    const colDepth = depth + wrappers;
    const ind = this.indent(colDepth);

    // Build children with spacers. When the parent has a `gap:`, also pass
    // the gap context to each-loop children so they can self-space between
    // their own iterations (parent's gap-between-children logic only sees the
    // each-loop as a single spread-child slot).
    const isRow = node.direction === 'horizontal';
    const parentGap = gapSize !== null
      ? { dim: gapDimension as 'width' | 'height', px: gapSize }
      : undefined;
    const childLines: string[] = [];
    // v0.19: `transition: <token>` wraps the layout's single conditional /
    // each child in AnimatedSwitcher. Validator enforces single-IfNode-or-
    // EachNode shape; codegen here builds the wrapped Widget directly,
    // bypassing the standard children-loop spread emission.
    const transitionProp = findProp(node.properties, 'transition');
    if (transitionProp) {
      const onlyChild = node.children.find(c => c.type === 'If' || c.type === 'Each');
      if (onlyChild && (onlyChild.type === 'If' || onlyChild.type === 'Each')) {
        const tokenName = resolveIdentName(transitionProp.value) ?? 'fade';
        childLines.push(`${this.genTransitionWrap(onlyChild, tokenName, colDepth + 2)},`);
      }
    } else {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === 'Comment') {
          childLines.push(this.genUINode(child, colDepth + 2, isRow));
        } else {
          childLines.push(`${this.genUINode(child, colDepth + 2, isRow, parentGap)},`);
          if (gapSize !== null && i < node.children.length - 1 && node.children[i + 1].type !== 'Comment') {
            childLines.push(`${ind}    const SizedBox(${gapDimension}: ${gapSize}),`);
          }
        }
      }
    }

    // Empty layout: skip Column, just use Container for background/fill
    if (node.children.length === 0) {
      let code = 'const SizedBox()';
      const bgProp = findProp(node.properties, 'background');
      const roundedProp = findProp(node.properties, 'rounded');
      const borderProp = findProp(node.properties, 'border');
      if (bgProp || roundedProp || borderProp) {
        const decInd = this.indent(depth);
        const radius = roundedProp ? resolveDesignToken(roundedProp.value) : null;
        let dec = 'BoxDecoration(';
        const decParts: string[] = [];
        if (bgProp && isImageBackground(bgProp.value)) {
          decParts.push(`image: DecorationImage(image: AssetImage('assets/' + ${this.exprToDart(bgProp.value)}), fit: BoxFit.cover)`);
        } else if (bgProp) {
          decParts.push(`color: ${this.genBackgroundValue(bgProp.value)}`);
        }
        if (radius) decParts.push(`borderRadius: BorderRadius.circular(${radius})`);
        if (borderProp) {
          const widthDart = this.genBorderWidth(borderProp.value);
          const colorProp = findProp(node.properties, 'color');
          const subtleIdent: Expr = { type: 'Ident', name: 'subtle', loc: borderProp.value.loc };
          const colorDart = colorProp ? this.genColorValue(colorProp.value) : this.genColorValue(subtleIdent);
          decParts.push(`border: Border.all(color: ${colorDart}, width: ${widthDart})`);
        }
        dec += decParts.join(', ') + ')';
        code = `Container(\n${decInd}  decoration: ${dec},\n${decInd})`;
      }
      const maxWidthProp = findProp(node.properties, 'max_width');
      if (maxWidthProp) {
        const maxWidthPx = resolveMaxWidthToken(maxWidthProp.value);
        if (maxWidthPx !== null) {
          const mwInd = this.indent(depth);
          code = `ConstrainedBox(\n${mwInd}  constraints: const BoxConstraints(maxWidth: ${maxWidthPx}),\n${mwInd}  child: ${code},\n${mwInd})`;
        }
      }
      code = this.wrapWithGestures(code, node.events, depth);
      const fillProp = findProp(node.properties, 'fill');
      if (fillProp) {
        const fillInd = this.indent(depth);
        code = `Expanded(\n${fillInd}  child: ${code},\n${fillInd})`;
      }
      return this.indent(depth) + code;
    }

    let code = `${widget}(\n`;
    const spreadProp = findProp(node.properties, 'spread');
    const fillPropForSize = findProp(node.properties, 'fill');
    // A vertical layout with `fill: true` gets wrapped in `Expanded`. If the
    // Expanded lands inside a Row, its cross-axis (this Column's main axis)
    // is unbounded — so the Column must shrink-wrap. Setting MainAxisSize.min
    // is a no-op when Expanded lands inside a Column (tight main-axis wins),
    // so it's safe to always set when fill is present on a vertical layout.
    if (isCenter || (!isRow && fillPropForSize)) {
      code += `${ind}  mainAxisSize: MainAxisSize.min,\n`;
    } else if (spreadProp) {
      code += `${ind}  mainAxisAlignment: MainAxisAlignment.spaceBetween,\n`;
    } else if (alignProp) {
      const alignment = resolveAlign(alignProp.value);
      code += `${ind}  mainAxisAlignment: ${alignment},\n`;
    }
    // Stretch children to full width when parent is a vertical layout with
    // fill children (cross-axis = horizontal). For horizontal layouts the
    // cross-axis is vertical, and stretching Expanded(Column) children there
    // creates unbounded-constraint crashes because Row doesn't know its
    // height yet.
    const hasFillChildren = node.children.some(c => c.type === 'Layout' && findProp(c.properties, 'fill'));
    if (hasFillChildren && !isRow) {
      code += `${ind}  crossAxisAlignment: CrossAxisAlignment.stretch,\n`;
    }
    code += `${ind}  children: [\n`;
    code += childLines.join('\n') + '\n';
    code += `${ind}  ],\n`;
    code += `${ind})`;

    // Wrap: Center inside Padding
    if (isCenter) {
      const centerInd = this.indent(colDepth - 1);
      code = `Center(\n${centerInd}  child: ${code},\n${centerInd})`;
    }
    if (hasPadding) {
      const padSize = resolveDesignToken(paddingProp!.value);
      const padInd = this.indent(depth);
      code = `Padding(\n${padInd}  padding: const EdgeInsets.all(${padSize}),\n${padInd}  child: ${code},\n${padInd})`;
    }
    const bgProp = findProp(node.properties, 'background');
    const roundedProp = findProp(node.properties, 'rounded');
    const borderProp = findProp(node.properties, 'border');
    if (bgProp || roundedProp || borderProp) {
      const decInd = this.indent(depth);
      const radius = roundedProp ? resolveDesignToken(roundedProp.value) : null;
      let dec = 'BoxDecoration(';
      const decParts: string[] = [];
      if (bgProp && isImageBackground(bgProp.value)) {
        decParts.push(`image: DecorationImage(image: AssetImage('assets/' + ${this.exprToDart(bgProp.value)}), fit: BoxFit.cover)`);
      } else if (bgProp) {
        decParts.push(`color: ${this.genBackgroundValue(bgProp.value)}`);
      }
      if (radius) decParts.push(`borderRadius: BorderRadius.circular(${radius})`);
      if (borderProp) {
        const widthDart = this.genBorderWidth(borderProp.value);
        const colorProp = findProp(node.properties, 'color');
        const subtleIdent: Expr = { type: 'Ident', name: 'subtle', loc: borderProp.value.loc };
        const colorDart = colorProp ? this.genColorValue(colorProp.value) : this.genColorValue(subtleIdent);
        decParts.push(`border: Border.all(color: ${colorDart}, width: ${widthDart})`);
      }
      dec += decParts.join(', ') + ')';
      code = `Container(\n${decInd}  decoration: ${dec},\n${decInd}  child: ${code},\n${decInd})`;
    }
    const maxWidthProp = findProp(node.properties, 'max_width');
    if (maxWidthProp) {
      const maxWidthPx = resolveMaxWidthToken(maxWidthProp.value);
      if (maxWidthPx !== null) {
        const mwInd = this.indent(depth);
        code = `ConstrainedBox(\n${mwInd}  constraints: const BoxConstraints(maxWidth: ${maxWidthPx}),\n${mwInd}  child: ${code},\n${mwInd})`;
      }
    }
    code = this.wrapWithGestures(code, node.events, depth);
    const fillProp = findProp(node.properties, 'fill');
    if (fillProp) {
      const fillInd = this.indent(depth);
      code = `Expanded(\n${fillInd}  child: ${code},\n${fillInd})`;
    }
    return this.indent(depth) + code;
  }

  private genLabel(node: LabelNode, depth: number): string {
    const ind = this.indent(depth);
    const styleProp = findProp(node.properties, 'style');
    const colorProp = findProp(node.properties, 'color');

    // v0.19: spring detection — if the label's value is a spring(target) call
    // (direct use-site) or an Ident referencing a spring-aliased variable
    // (declaration-site), wrap a Text in TweenAnimationBuilder<double>.
    const springTarget = this.detectSpringTarget(node.value);
    if (springTarget) {
      return this.genSpringLabel(node, springTarget, depth);
    }

    const displayStr = this.exprToDisplayStr(node.value);

    const alignProp = findProp(node.properties, 'align');

    let code = `${ind}Text(\n`;
    code += `${ind}  ${displayStr},\n`;
    if (alignProp) {
      const alignName = resolveIdentName(alignProp.value);
      if (alignName === 'center') code += `${ind}  textAlign: TextAlign.center,\n`;
      else if (alignName === 'end') code += `${ind}  textAlign: TextAlign.end,\n`;
    }
    if (styleProp || colorProp) {
      const styleBase = styleProp ? resolveStyle(styleProp.value) : null;
      const colorStr = colorProp ? this.genColorValue(colorProp.value) : null;
      if (styleBase && colorStr) {
        code += `${ind}  style: ${styleBase}.copyWith(color: ${colorStr}),\n`;
      } else if (styleBase) {
        code += `${ind}  style: ${styleBase},\n`;
      } else if (colorStr) {
        code += `${ind}  style: TextStyle(color: ${colorStr}),\n`;
      }
    }
    code += `${ind})`;
    const tapEvent = node.events.find(e => e.event === 'tap');
    if (tapEvent) {
      const onTap = this.genOnPressed(tapEvent, depth + 1);
      code = `${ind}GestureDetector(\n${onTap.replace('onPressed', 'onTap')}${ind}  child: ${code.trimStart()},\n${ind})`;
    }
    return code;
  }

  // v0.19: detect spring consumption at a label's value position. Returns the
  // spring's target argument expression (post-alias resolution) or null. Spring
  // can appear two ways:
  //   - Use-site: `label spring(target)` — FunctionCall with name 'spring'.
  //   - Declaration-site: `displayed = spring(target)` followed by
  //     `label displayed` — Ident matching a name in ctx.springAliases.
  // Both lower to TweenAnimationBuilder<double> via genSpringLabel.
  private detectSpringTarget(expr: Expr): Expr | null {
    if (expr.type === 'FunctionCall' && expr.name === 'spring' && expr.args.length === 1) {
      return expr.args[0];
    }
    if (expr.type === 'Ident' && this.ctx.springAliases[expr.name]) {
      return this.ctx.springAliases[expr.name];
    }
    return null;
  }

  // v0.19 spring codegen — TweenAnimationBuilder<double> wrapping a Text.
  // System-default 400ms (matches SwiftUI .spring()); easeOutCubic curve as a
  // light approximation of spring physics without a SpringSimulation
  // controller. Duration collapses to zero under OS reduced-motion (Q2-a11y).
  // Tween's `begin` starts at 0; TweenAnimationBuilder remembers the previous
  // `end` across rebuilds so subsequent target changes animate from the prior
  // settled value, not from 0 every time.
  private genSpringLabel(node: LabelNode, target: Expr, depth: number): string {
    const ind = this.indent(depth);
    const styleProp = findProp(node.properties, 'style');
    const colorProp = findProp(node.properties, 'color');
    const targetDart = this.exprToDart(target);

    let styleClause = '';
    if (styleProp || colorProp) {
      const styleBase = styleProp ? resolveStyle(styleProp.value) : null;
      const colorStr = colorProp ? this.genColorValue(colorProp.value) : null;
      if (styleBase && colorStr) {
        styleClause = `, style: ${styleBase}.copyWith(color: ${colorStr})`;
      } else if (styleBase) {
        styleClause = `, style: ${styleBase}`;
      } else if (colorStr) {
        styleClause = `, style: TextStyle(color: ${colorStr})`;
      }
    }

    let code = `${ind}TweenAnimationBuilder<double>(\n`;
    code += `${ind}  tween: Tween<double>(begin: 0.0, end: (${targetDart}).toDouble()),\n`;
    code += `${ind}  duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 400),\n`;
    code += `${ind}  curve: Curves.easeOutCubic,\n`;
    code += `${ind}  builder: (context, value, _) => Text(value.toStringAsFixed(0)${styleClause}),\n`;
    code += `${ind})`;

    const tapEvent = node.events.find(e => e.event === 'tap');
    if (tapEvent) {
      const onTap = this.genOnPressed(tapEvent, depth + 1);
      code = `${ind}GestureDetector(\n${onTap.replace('onPressed', 'onTap')}${ind}  child: ${code.trimStart()},\n${ind})`;
    }
    return code;
  }

  // v0.19 transition: codegen — wraps a layout's IfNode/EachNode child in
  // AnimatedSwitcher with branch/list-identity keys. The standard genIf/genEach
  // emit list-spread syntax (`...[children]`) suitable for splatting into a
  // parent Column's children list. AnimatedSwitcher needs a single Widget
  // child, so this helper rebuilds the conditional/each as a single-Widget
  // expression with KeyedSubtree wrappers per branch (Q4d: keys represent
  // branch/item identity, not child type or text).
  private genTransitionWrap(child: IfNode | EachNode, token: string, depth: number): string {
    const ind = this.indent(depth);
    const switcherInd = this.indent(depth + 1);
    let switcherChild: string;

    if (child.type === 'If') {
      switcherChild = this.genTransitionIfChild(child, depth + 1);
    } else {
      // EachNode — wrap iteration in a Column with a list-length-keyed
      // KeyedSubtree. Add/remove fires the swap; reorder doesn't change the
      // length so it doesn't fire (documented v0.19 limitation per the
      // cheatsheet's "adds/removes items" promise).
      switcherChild = this.genTransitionEachChild(child, depth + 1);
    }

    let code = `${ind}AnimatedSwitcher(\n`;
    code += `${switcherInd}duration: const Duration(milliseconds: 300),\n`;
    if (token === 'slide') {
      // Slide-from-right default; future tokens (slide_left, slide_up) would
      // parameterize this. v0.19 ships horizontal-from-right only.
      code += `${switcherInd}transitionBuilder: (Widget child, Animation<double> animation) => SlideTransition(\n`;
      code += `${switcherInd}  position: Tween<Offset>(begin: const Offset(1.0, 0.0), end: Offset.zero).animate(animation),\n`;
      code += `${switcherInd}  child: child,\n`;
      code += `${switcherInd}),\n`;
    }
    code += `${switcherInd}child: ${switcherChild.trimStart()},\n`;
    code += `${ind})`;
    return code;
  }

  private genTransitionIfChild(node: IfNode, depth: number): string {
    const ind = this.indent(depth);
    const filterUI = (items: (UINode | VariableDecl)[]) => items.filter((c): c is UINode => c.type !== 'VariableDecl');
    // Build a chained ternary: cond1 ? branch0 : cond2 ? branch1 : ... : elseBranch.
    // Each branch wraps its body in a single Widget (SizedBox.shrink for empty,
    // direct child for one, Column for many) inside a KeyedSubtree with a
    // stable per-branch key.
    const buildBranch = (children: UINode[], branchKey: string): string => {
      const filtered = children.filter((c): c is UINode => c.type !== 'Comment');
      if (filtered.length === 0) {
        return `KeyedSubtree(key: const ValueKey('${branchKey}'), child: const SizedBox.shrink())`;
      }
      if (filtered.length === 1) {
        const inner = this.genUINode(filtered[0], depth + 2).trimStart();
        return `KeyedSubtree(key: const ValueKey('${branchKey}'), child: ${inner})`;
      }
      const innerInd = this.indent(depth + 2);
      const lines = filtered.map(c => this.genUINode(c, depth + 3) + ',').join('\n');
      const col = `Column(\n${innerInd}  mainAxisSize: MainAxisSize.min,\n${innerInd}  children: [\n${lines}\n${innerInd}  ],\n${innerInd})`;
      return `KeyedSubtree(key: const ValueKey('${branchKey}'), child: ${col})`;
    };

    const cond0 = this.exprToDart(node.condition);
    let result = buildBranch(filterUI(node.then), 'branch-0');

    let branchIdx = 1;
    const elseIfPieces: string[] = [];
    for (const branch of node.elseIfs) {
      const econd = this.exprToDart(branch.condition);
      const ebranch = buildBranch(filterUI(branch.body), `branch-${branchIdx}`);
      elseIfPieces.push(`${econd} ? ${ebranch}`);
      branchIdx++;
    }

    let elseBranch: string;
    if (node.else_) {
      elseBranch = buildBranch(filterUI(node.else_), `branch-${branchIdx}`);
    } else {
      elseBranch = `KeyedSubtree(key: const ValueKey('branch-${branchIdx}'), child: const SizedBox.shrink())`;
    }

    // Compose: cond0 ? result : <elseIfs chained> : elseBranch
    let chain = elseBranch;
    for (let i = elseIfPieces.length - 1; i >= 0; i--) {
      chain = `${elseIfPieces[i]} : ${chain}`;
    }
    return `${cond0} ? ${result} : ${chain}`;
  }

  private genTransitionEachChild(node: EachNode, depth: number): string {
    const ind = this.indent(depth);
    const innerInd = this.indent(depth + 1);
    const listExpr = this.exprToDart(node.list);
    // v0.20.3: track each-loop variable as a declared local during child
    // emission. Same lexical-scope discipline as genEach (doc 127 sub-shape 2).
    return this.withLoopVar(node.variable, () => {
    // Per-row content as a single Widget inside the iteration. Multiple
    // children per row → wrap in a per-row Column.
    let rowWidget: string;
    if (node.children.length === 1) {
      rowWidget = this.genUINode(node.children[0], depth + 3).trimStart();
    } else {
      const rowInd = this.indent(depth + 3);
      const lines = node.children.map(c => this.genUINode(c, depth + 4) + ',').join('\n');
      rowWidget = `Column(\n${rowInd}  mainAxisSize: MainAxisSize.min,\n${rowInd}  children: [\n${lines}\n${rowInd}  ],\n${rowInd})`;
    }
    // KeyedSubtree by list length so add/remove fires AnimatedSwitcher.
    // Reorder (same length, different order) doesn't fire — documented
    // v0.19 limitation matching the cheatsheet's "adds/removes items"
    // promise. Reorder animation is a v0.20+ candidate.
    let code = `KeyedSubtree(\n`;
    code += `${innerInd}key: ValueKey(${listExpr}.length),\n`;
    code += `${innerInd}child: Column(\n`;
    code += `${innerInd}  mainAxisSize: MainAxisSize.min,\n`;
    code += `${innerInd}  children: [\n`;
    code += `${innerInd}    for (final ${node.variable} in ${listExpr}) ${rowWidget},\n`;
    code += `${innerInd}  ],\n`;
    code += `${innerInd}),\n`;
    code += `${ind})`;
    return code;
    });
  }

  private genButton(node: ButtonNode, depth: number, inRow = false): string {
    const ind = this.indent(depth);
    const tapEvent = node.events.find(e => e.event === 'tap');
    const colorProp = findProp(node.properties, 'color');
    const shapeProp = findProp(node.properties, 'shape');
    const isCircle = shapeProp?.value.type === 'Ident' && shapeProp.value.name === 'circle';

    const styleParts: string[] = [];
    if (colorProp) {
      // When a button has an explicit background colour, force white
      // foreground so the text contrasts. Material derives `onPrimary`
      // appropriately for colorScheme.primary, but raw named colours like
      // `brand`/`danger`/`red` have no paired `onX`. Default ElevatedButton
      // foreground on a pink-ish button renders invisible-on-pink. White is
      // the right answer for every vivid Igni colour (brand, danger, red,
      // blue, orange, green, purple, teal, black).
      styleParts.push(`backgroundColor: ${this.genColorValue(colorProp.value)}`);
      styleParts.push(`foregroundColor: Colors.white`);
    }
    if (isCircle) {
      // `shape: circle` — compact fixed-size button for icon-style controls
      // like +/-. Keeps square aspect so the CircleBorder actually draws a
      // circle; a rectangular CircleBorder renders as a stadium shape.
      styleParts.push(`shape: const CircleBorder()`);
      styleParts.push(`padding: const EdgeInsets.all(16)`);
      styleParts.push(`minimumSize: const Size(48, 48)`);
    } else {
      styleParts.push(`shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))`);
    }

    const isConstText = node.text.type === 'StringLit';
    const textStr = isConstText ? this.exprToConstStr(node.text) : this.exprToDisplayStr(node.text);
    const textChild = `${isConstText ? 'const ' : ''}Text(${textStr})`;

    // Buttons size to their content by default. Full-width stretch becomes
    // opt-in via a future `fill: true` property; matching the natural button
    // aesthetic (content-sized tap target) is the right default.
    let code = `${ind}ElevatedButton(\n`;
    code += `${ind}  style: ElevatedButton.styleFrom(${styleParts.join(', ')}),\n`;
    if (tapEvent) {
      code += this.genOnPressed(tapEvent, depth + 1);
    }
    code += `${ind}  child: ${textChild},\n`;
    code += `${ind})`;
    return code;
  }

  private genInput(node: InputNode, depth: number, inRow = false): string {
    const ind = this.indent(depth);
    const placeholder = findProp(node.properties, 'placeholder');
    const changeEvent = node.events.find(e => e.event === 'change');

    let code = `${ind}TextField(\n`;
    code += `${ind}  key: const ValueKey(${JSON.stringify(node.bind)}),\n`;
    code += `${ind}  controller: _${node.bind}Controller,\n`;
    code += `${ind}  onChanged: (value) {\n`;
    code += this.genBindWrite(node.bind, 'value', ind);
    if (changeEvent) {
      code += this.genChangeActionBody(changeEvent, depth + 2);
    }
    code += `${ind}  },\n`;
    if (placeholder) {
      const hint = this.exprToConstStr(placeholder.value);
      code += `${ind}  decoration: InputDecoration(\n`;
      code += `${ind}    border: const OutlineInputBorder(),\n`;
      code += `${ind}    hintText: ${hint},\n`;
      code += `${ind}  ),\n`;
    } else {
      code += `${ind}  decoration: const InputDecoration(\n`;
      code += `${ind}    border: OutlineInputBorder(),\n`;
      code += `${ind}  ),\n`;
    }
    code += `${ind})`;
    if (inRow) {
      // Row-context inputs take remaining space via Expanded — max-width cap
      // would fight the Row's intended flex behaviour.
      code = `${ind}Expanded(\n${ind}  child: ${code.trimStart()},\n${ind})`;
    } else {
      // Standalone inputs cap at 320px — comfortable single-field width that
      // doesn't stretch to kilometre-wide on desktop viewports and still fills
      // naturally on mobile. Multi-field forms use horizontal layouts where
      // inputs take Expanded width instead.
      code = `${ind}ConstrainedBox(\n${ind}  constraints: const BoxConstraints(maxWidth: 320),\n${ind}  child: ${code.trimStart()},\n${ind})`;
    }
    return code;
  }

  private genToggle(node: ToggleNode, depth: number): string {
    const ind = this.indent(depth);
    const labelProp = findProp(node.properties, 'label');
    const labelStr = labelProp ? this.exprToDart(labelProp.value) : null;
    const changeEvent = node.events.find(e => e.event === 'change');

    if (labelStr) {
      let code = `${ind}SwitchListTile(\n`;
      code += `${ind}  key: const ValueKey(${JSON.stringify(node.bind)}),\n`;
      code += `${ind}  value: ${node.bind},\n`;
      code += `${ind}  title: Text(${labelStr}),\n`;
      code += `${ind}  onChanged: (value) {\n`;
      code += this.genBindWrite(node.bind, 'value', ind);
      if (changeEvent) {
        code += this.genChangeActionBody(changeEvent, depth + 2);
      }
      code += `${ind}  },\n`;
      code += `${ind})`;
      return code;
    }

    let code = `${ind}Switch(\n`;
    code += `${ind}  key: const ValueKey(${JSON.stringify(node.bind)}),\n`;
    code += `${ind}  value: ${node.bind},\n`;
    code += `${ind}  onChanged: (value) {\n`;
    code += this.genBindWrite(node.bind, 'value', ind);
    if (changeEvent) {
      code += this.genChangeActionBody(changeEvent, depth + 2);
    }
    code += `${ind}  },\n`;
    code += `${ind})`;
    return code;
  }

  private genIcon(node: IconNode, depth: number): string {
    const ind = this.indent(depth);
    const nameStr = this.exprToDart(node.name);
    const sizeProp = findProp(node.properties, 'size');
    const colorProp = findProp(node.properties, 'color');
    const tapEvent = node.events.find(e => e.event === 'tap');

    let iconName: string;
    if (node.name.type === 'StringLit') {
      iconName = mapIconName(node.name.value);
    } else {
      this.needsIconLookup = true;
      iconName = `_iconFromName(${nameStr})`;
    }
    const parts: string[] = [`${ind}Icon(\n${ind}  ${iconName}`];
    if (sizeProp) parts.push(`size: ${resolveDesignToken(sizeProp.value)}`);
    if (colorProp) parts.push(`color: ${this.genColorValue(colorProp.value)}`);

    let code = parts[0];
    for (let i = 1; i < parts.length; i++) {
      code += `,\n${ind}  ${parts[i]}`;
    }
    code += `,\n${ind})`;

    if (tapEvent) {
      const onTap = this.genOnPressed(tapEvent, depth + 1);
      code = `${ind}GestureDetector(\n${onTap.replace('onPressed', 'onTap')}${ind}  child: ${code.trimStart()},\n${ind})`;
    }
    return code;
  }

  private isNetworkImage(expr: Expr): boolean {
    if (expr.type === 'StringLit') return expr.value.startsWith('http');
    if (expr.type === 'BinaryExpr' && expr.op === '+') return this.isNetworkImage(expr.left);
    return false;
  }

  private genImage(node: ImageNode, depth: number): string {
    const ind = this.indent(depth);
    const sizeProp = findProp(node.properties, 'size');
    const roundProp = findProp(node.properties, 'round');
    const size = sizeProp ? resolveDesignToken(sizeProp.value) : 48;
    const isRound = roundProp !== undefined;

    const isNetwork = this.isNetworkImage(node.url);
    let src: string;
    if (isNetwork) {
      src = this.exprToDart(node.url);
    } else if (node.url.type === 'StringLit') {
      src = `'assets/${node.url.value}'`;
    } else {
      src = `'assets/' + ${this.exprToDart(node.url)}`;
    }

    const imageType = isNetwork ? 'Image.network' : 'Image.asset';
    let code = `${ind}${imageType}(\n${ind}  ${src},\n${ind}  width: ${size},\n${ind}  height: ${size},\n${ind}  fit: BoxFit.cover,\n${ind})`;
    if (isRound) {
      code = `${ind}ClipOval(\n${ind}  child: ${code.trimStart()},\n${ind})`;
    }
    const tapEvent = node.events.find(e => e.event === 'tap');
    if (tapEvent) {
      const onTap = this.genOnPressed(tapEvent, depth + 1);
      code = `${ind}GestureDetector(\n${onTap.replace('onPressed', 'onTap')}${ind}  child: ${code.trimStart()},\n${ind})`;
    }
    return code;
  }

  private genSlider(node: SliderNode, depth: number): string {
    const ind = this.indent(depth);
    const minProp = findProp(node.properties, 'min');
    const maxProp = findProp(node.properties, 'max');
    const min = minProp ? this.exprToDart(minProp.value) : '0';
    const max = maxProp ? this.exprToDart(maxProp.value) : '100';
    const changeEvent = node.events.find(e => e.event === 'change');

    let code = `${ind}Slider(\n`;
    code += `${ind}  key: const ValueKey(${JSON.stringify(node.bind)}),\n`;
    code += `${ind}  value: ${node.bind}.toDouble(),\n`;
    code += `${ind}  min: ${min}.toDouble(),\n`;
    code += `${ind}  max: ${max}.toDouble(),\n`;
    code += `${ind}  onChanged: (value) {\n`;
    code += this.genBindWrite(node.bind, 'value.round()', ind);
    if (changeEvent) {
      code += this.genChangeActionBody(changeEvent, depth + 2);
    }
    code += `${ind}  },\n`;
    code += `${ind})`;
    const tapEventS = node.events.find(e => e.event === 'tap');
    if (tapEventS) {
      const onTap = this.genOnPressed(tapEventS, depth + 1);
      code = `${ind}GestureDetector(\n${onTap.replace('onPressed', 'onTap')}${ind}  child: ${code.trimStart()},\n${ind})`;
    }
    return code;
  }

  private genCheckbox(node: CheckboxNode, depth: number): string {
    const ind = this.indent(depth);
    const labelProp = findProp(node.properties, 'label');
    const labelStr = labelProp ? this.exprToDart(labelProp.value) : null;
    const changeEvent = node.events.find(e => e.event === 'change');

    if (labelStr) {
      let code = `${ind}CheckboxListTile(\n`;
      code += `${ind}  value: ${node.bind},\n`;
      code += `${ind}  title: Text(${labelStr}),\n`;
      code += `${ind}  onChanged: (value) {\n`;
      code += this.genBindWrite(node.bind, 'value ?? false', ind);
      if (changeEvent) {
        code += this.genChangeActionBody(changeEvent, depth + 2);
      }
      code += `${ind}  },\n`;
      code += `${ind})`;
      const tapEventCL = node.events.find(e => e.event === 'tap');
      if (tapEventCL) {
        const onTap = this.genOnPressed(tapEventCL, depth + 1);
        code = `${ind}GestureDetector(\n${onTap.replace('onPressed', 'onTap')}${ind}  child: ${code.trimStart()},\n${ind})`;
      }
      return code;
    }

    let code = `${ind}Checkbox(\n`;
    code += `${ind}  value: ${node.bind},\n`;
    code += `${ind}  onChanged: (value) {\n`;
    code += this.genBindWrite(node.bind, 'value ?? false', ind);
    if (changeEvent) {
      code += this.genChangeActionBody(changeEvent, depth + 2);
    }
    code += `${ind}  },\n`;
    code += `${ind})`;
    const tapEventC = node.events.find(e => e.event === 'tap');
    if (tapEventC) {
      const onTap = this.genOnPressed(tapEventC, depth + 1);
      code = `${ind}GestureDetector(\n${onTap.replace('onPressed', 'onTap')}${ind}  child: ${code.trimStart()},\n${ind})`;
    }
    return code;
  }

  private genDropdown(node: DropdownNode, depth: number): string {
    const ind = this.indent(depth);
    const optionsProp = findProp(node.properties, 'options');
    const optionsExpr = optionsProp ? this.exprToDart(optionsProp.value) : '[]';
    const changeEvent = node.events.find(e => e.event === 'change');

    let code = `${ind}DropdownButton<dynamic>(\n`;
    code += `${ind}  value: ${node.bind},\n`;
    code += `${ind}  items: (${optionsExpr} as List).map((e) => DropdownMenuItem<dynamic>(value: e, child: Text(e.toString()))).toList(),\n`;
    code += `${ind}  onChanged: (value) {\n`;
    code += this.genBindWrite(node.bind, 'value', ind);
    if (changeEvent) {
      code += this.genChangeActionBody(changeEvent, depth + 2);
    }
    code += `${ind}  },\n`;
    code += `${ind})`;
    const tapEventD = node.events.find(e => e.event === 'tap');
    if (tapEventD) {
      const onTap = this.genOnPressed(tapEventD, depth + 1);
      code = `${ind}GestureDetector(\n${onTap.replace('onPressed', 'onTap')}${ind}  child: ${code.trimStart()},\n${ind})`;
    }
    return code;
  }

  private genBadge(node: BadgeNode, depth: number): string {
    const ind = this.indent(depth);
    const textStr = this.exprToDisplayStr(node.text);
    const colorProp = findProp(node.properties, 'color');
    const colorStr = colorProp ? this.genColorValue(colorProp.value) : null;

    let code = `${ind}Chip(\n`;
    code += `${ind}  label: Text(${textStr}),\n`;
    if (colorStr) {
      code += `${ind}  backgroundColor: ${colorStr},\n`;
    }
    code += `${ind})`;
    const tapEventB = node.events.find(e => e.event === 'tap');
    if (tapEventB) {
      const onTap = this.genOnPressed(tapEventB, depth + 1);
      code = `${ind}GestureDetector(\n${onTap.replace('onPressed', 'onTap')}${ind}  child: ${code.trimStart()},\n${ind})`;
    }
    return code;
  }

  private genIf(node: IfNode, depth: number): string {
    const ind = this.indent(depth);
    const cond = this.exprToDart(node.condition);
    const filterUI = (items: (UINode | VariableDecl)[]) => items.filter((child): child is UINode => child.type !== 'VariableDecl');

    let code = `${ind}if (${cond}) ...[`;
    for (const child of filterUI(node.then)) {
      code += '\n' + this.genUINode(child, depth + 1) + ',';
    }

    for (const branch of node.elseIfs) {
      code += `\n${ind}] else if (${this.exprToDart(branch.condition)}) ...[`;
      for (const child of filterUI(branch.body)) {
        code += '\n' + this.genUINode(child, depth + 1) + ',';
      }
    }

    if (node.else_) {
      code += `\n${ind}] else ...[`;
      for (const child of filterUI(node.else_)) {
        code += '\n' + this.genUINode(child, depth + 1) + ',';
      }
    }

    code += `\n${ind}]`;
    return code;
  }

  private genEach(node: EachNode, depth: number, parentGap?: { dim: 'width' | 'height'; px: number }): string {
    const ind = this.indent(depth);
    const listExpr = this.exprToDart(node.list);

    // v0.20.3: track each-loop variable as a declared local during child
    // emission so identifier-resolution at the Ident-emission site (line
    // ~4053) finds the loop var BEFORE falling back to theme-token /
    // style-value resolution. Pre-v0.20.3 codegen treated `card` (loop var)
    // shadowed by `card` (theme token) as the theme token, emitting string
    // literal `'card'` instead of the loop var name. Card-sender app 3
    // build session 1 (2026-04-30; doc 127 sub-shape 2). The push/pop is
    // wrapped in try/finally to restore declaredLocals even if codegen
    // throws mid-emission.
    return this.withLoopVar(node.variable, () => {
      if (node.paginate !== undefined) {
        // `paginate:` renders a scrollable, lazily-built list via ListView.builder
        // wrapped in Expanded so it can claim remaining space inside its parent
        // Column/Flex. v1 scope: page size is accepted as a hint; auto-load-more
        // on scroll is not yet implemented (would require async integration).
        const ind1 = this.indent(depth + 1);
        const ind2 = this.indent(depth + 2);
        const ind3 = this.indent(depth + 3);

        let childCode: string;
        if (node.children.length === 1) {
          childCode = this.genUINode(node.children[0], depth + 3).trimStart();
        } else {
          const childLines = node.children
            .map(c => this.genUINode(c, depth + 5) + ',')
            .join('\n');
          childCode =
            `Column(\n` +
            `${ind3}  mainAxisSize: MainAxisSize.min,\n` +
            `${ind3}  children: [\n` +
            `${childLines}\n` +
            `${ind3}  ],\n` +
            `${ind3})`;
        }

        return [
          `${ind}Expanded(`,
          `${ind1}child: ListView.builder(`,
          `${ind2}itemCount: ${listExpr}.length,`,
          `${ind2}itemBuilder: (context, index) {`,
          `${ind3}final ${node.variable} = ${listExpr}[index];`,
          `${ind3}return ${childCode};`,
          `${ind2}},`,
          `${ind1}),`,
          `${ind})`,
        ].join('\n');
      }

      // When the parent layout has a `gap:`, emit a SizedBox spacer between
      // iterations using the indexed-for form so duplicate elements in the list
      // don't break the "is last" check (`x != xs.last` would mis-classify
      // earlier duplicates of the last value).
      if (parentGap) {
        let code = `${ind}for (final (_i, ${node.variable}) in ${listExpr}.indexed) ...[`;
        for (const child of node.children) {
          code += '\n' + this.genUINode(child, depth + 1) + ',';
        }
        code += `\n${this.indent(depth + 1)}if (_i < ${listExpr}.length - 1) const SizedBox(${parentGap.dim}: ${parentGap.px}),`;
        code += `\n${ind}]`;
        return code;
      }

      let code = `${ind}for (final ${node.variable} in ${listExpr}) ...[`;
      for (const child of node.children) {
        code += '\n' + this.genUINode(child, depth + 1) + ',';
      }
      code += `\n${ind}]`;
      return code;
    });
  }

  // v0.20.3: scoped tracking of each-loop variables in declaredLocals.
  // Push the loop var on entry; restore the prior set membership on exit
  // (try/finally to survive exceptions). Used by genEach + genTransitionEachChild.
  private withLoopVar<T>(name: string, fn: () => T): T {
    const had = this.declaredLocals.has(name);
    this.declaredLocals.add(name);
    try {
      return fn();
    } finally {
      if (!had) this.declaredLocals.delete(name);
    }
  }

  private genComponentDef(comp: ComponentDef): string {
    const prevCtx = this.ctx;
    this.ctx = { ...this.ctx, screenParams: comp.params, isComponent: true };

    const name = comp.name;
    const hasBody = this.componentHasBody(comp.body);
    const paramFields = comp.params.map(p => `  final dynamic ${p};`).join('\n');
    const ctorParams = comp.params.map(p => `required this.${p}`).join(', ');

    // Discover custom event channels: walk the component body looking for
    // `emit <name> [<arg>]`. Each unique event becomes an optional callback
    // field on the widget, wired by the parent at invocation time.
    const emits = this.collectEmits(comp.body);

    let code = `class ${name} extends StatelessWidget {\n`;
    if (comp.params.length > 0) {
      code += paramFields + '\n';
    }
    if (hasBody) {
      code += `  final Widget child;\n`;
    }
    for (const ev of emits) {
      const cbName = this.emitCallbackName(ev.event);
      const sig = ev.argName ? `void Function(dynamic)?` : `void Function()?`;
      code += `  final ${sig} ${cbName};\n`;
    }
    const allCtorParams: string[] = [];
    if (comp.params.length > 0) allCtorParams.push(ctorParams);
    if (hasBody) allCtorParams.push('required this.child');
    for (const ev of emits) {
      allCtorParams.push(`this.${this.emitCallbackName(ev.event)}`);
    }
    code += `  const ${name}({super.key${allCtorParams.length > 0 ? ', ' + allCtorParams.join(', ') : ''}});\n\n`;
    code += `  @override\n  Widget build(BuildContext context) {\n`;
    // Identify variables targeted by conditional reassignment inside if blocks.
    const reassignedVars = new Set<string>();
    for (const item of comp.body) {
      if (item.type === 'If' && this.ifContainsAssignments(item)) {
        this.collectAssignmentTargets(item, reassignedVars);
      }
    }
    // Component-body derived locals: emit at the top of build().
    // Use `var` for variables that are reassigned by if blocks,
    // `final dynamic` for pure-derived values.
    const derivedLocals = comp.body.filter((n): n is VariableDecl => n.type === 'VariableDecl');
    for (const decl of derivedLocals) {
      const keyword = reassignedVars.has(decl.name) ? 'var' : 'final dynamic';
      code += `    ${keyword} ${decl.name} = ${this.exprToDart(decl.value)};\n`;
    }
    // Emit assignment-only if blocks as imperative code.
    for (const item of comp.body) {
      if (item.type === 'If' && this.ifContainsAssignments(item)) {
        code += this.genImperativeIf(item) + '\n';
      }
    }
    // Filter out assignment-only if blocks before emitting the return.
    const returnBody = comp.body.filter(item =>
      !(item.type === 'If' && this.ifContainsAssignments(item))
    );
    code += this.genComponentBodyReturn(returnBody, 2);
    code += `  }\n}\n`;

    this.ctx = prevCtx;
    return this.withMarker(comp, `component:${name}`, code);
  }

  private emitCallbackName(event: string): string {
    return `on${event[0].toUpperCase()}${event.slice(1)}`;
  }

  // Emit the body of a callback wired into a component invocation event handler.
  // The action runs in the parent's scope — `genStmt` already routes state-var
  // assignments through setState because `stateVars` reflects the parent's
  // context at the call site.
  private genCallbackBody(action: Statement, depth: number): string {
    return this.genStmt(action, depth);
  }

  // `emit` is only valid as the action of an event handler. Walk the program
  // and reject any EmitStmt found in a function body, in a screen-body imperative
  // if/each, or anywhere else. Spec rule: standalone `emit X` is a parse-time
  // error — caught here because the parser doesn't track context.
  private validateEmitPlacement(program: Program): void {
    const checkStmt = (s: Statement) => {
      if (s.type === 'EmitStmt') {
        throw new TranspileError(
          `\`emit ${s.event}\` is only valid as the action of an \`on tap:\`, \`on touch:\`, or \`on change:\` handler. Standalone use is not allowed.`,
          s.loc?.line ?? 1, s.loc?.column ?? 1
        );
      }
      if (s.type === 'IfStmt') {
        s.then.forEach(checkStmt);
        if (s.else_) s.else_.forEach(checkStmt);
      }
      if (s.type === 'EachStmt') s.body.forEach(checkStmt);
    };
    const checkUI = (nodes: UINode[]) => {
      for (const n of nodes) {
        if (n.type === 'Layout') checkUI(n.children);
        else if (n.type === 'If') {
          const filterUI = (items: (UINode | VariableDecl)[]) =>
            items.filter((x): x is UINode => x.type !== 'VariableDecl');
          checkUI(filterUI(n.then));
          for (const ei of n.elseIfs) checkUI(filterUI(ei.body));
          if (n.else_) checkUI(filterUI(n.else_));
        } else if (n.type === 'Each') checkUI(n.children);
      }
    };
    for (const screen of program.screens) {
      // Function bodies inside screens — `emit` is never valid here.
      for (const item of screen.body) {
        if (item.type === 'FunctionDef') item.body.forEach(checkStmt);
      }
      const uiNodes = screen.body.filter((i): i is UINode => i.type !== 'VariableDecl' && i.type !== 'FunctionDef' && i.type !== 'Every');
      checkUI(uiNodes);
    }
    for (const comp of program.components) {
      const uiNodes = comp.body.filter((i): i is UINode => i.type !== 'VariableDecl');
      checkUI(uiNodes);
    }
  }

  // A `fetch` URL whose reactive dependency chain reaches a variable bound to
  // an `input` re-fires on every keystroke. Spec v0.9.0 turns this from prose
  // guidance into an enforced rule. Narrow detection: fetch("..." + bound_var)
  // only — string-concatenation chains. Wider detection (derived dependencies,
  // non-input bind primitives) can land later if cold-test data justifies it.
  private validateAsyncReactivity(program: Program): void {
    for (const screen of program.screens) {
      const boundInputs = this.collectInputBindTargets(screen);
      const locateVars = this.collectLocateVars(screen);
      if (boundInputs.size === 0 && locateVars.size === 0) continue;
      for (const item of screen.body) {
        if (item.type !== 'VariableDecl') continue;
        if (item.value.type !== 'FunctionCall' || item.value.name !== 'fetch') continue;
        const urlArg = item.value.args[0];
        if (!urlArg) continue;
        const inputOffender = this.findReactiveDepOnInput(urlArg, boundInputs);
        if (inputOffender) {
          throw new TranspileError(
            `\`fetch\` URL reactively depends on \`${inputOffender.name}\`, which is bound to an input. ` +
            `This re-fires the fetch on every keystroke. Use a trigger variable: bind the input to ` +
            `\`${inputOffender.name}\`, then set a separate variable from a button or \`on change:\` handler, ` +
            `and fetch from that variable instead.`,
            inputOffender.loc?.line ?? 1,
            inputOffender.loc?.column ?? 1
          );
        }
        // v0.11.0: extension of v0.9.0 footgun rule. Concatenating
        // `here.latitude` / `.longitude` from a `locate()` result into a
        // fetch URL re-issues the fetch every time the screen re-evaluates
        // `locate()` (e.g. after navigating back) — same "no magic"
        // violation as the bound-input case. Use the trigger-variable
        // pattern: capture coordinates into a separate variable from an
        // `on tap:` handler.
        const locateOffender = this.findReactiveDepOnLocate(urlArg, locateVars);
        if (locateOffender) {
          throw new TranspileError(
            `\`fetch\` URL reactively depends on \`${locateOffender.varName}.${locateOffender.field}\`, ` +
            `where \`${locateOffender.varName} = locate()\`. The location can change between renders, ` +
            `which would silently re-fire the fetch with no visible cause in the source. Use a trigger ` +
            `variable: capture \`${locateOffender.varName}.latitude\` and \`.longitude\` into a separate ` +
            `variable from an \`on tap:\` handler, and fetch from that variable instead.`,
            locateOffender.loc?.line ?? 1,
            locateOffender.loc?.column ?? 1
          );
        }
      }
    }
  }

  private collectLocateVars(screen: Screen): Set<string> {
    const targets = new Set<string>();
    for (const item of screen.body) {
      if (item.type === 'VariableDecl' &&
          item.value.type === 'FunctionCall' &&
          item.value.name === 'locate') {
        targets.add(item.name);
      }
    }
    return targets;
  }

  private findReactiveDepOnLocate(
    expr: Expr,
    targets: Set<string>
  ): { varName: string; field: string; loc?: SourceLocation } | null {
    if (expr.type === 'FieldAccess' &&
        expr.object.type === 'Ident' &&
        targets.has(expr.object.name) &&
        (expr.field === 'latitude' || expr.field === 'longitude')) {
      return { varName: expr.object.name, field: expr.field, loc: expr.loc };
    }
    if (expr.type === 'BinaryExpr' && expr.op === '+') {
      return this.findReactiveDepOnLocate(expr.left, targets)
          ?? this.findReactiveDepOnLocate(expr.right, targets);
    }
    return null;
  }

  private collectInputBindTargets(screen: Screen): Set<string> {
    const targets = new Set<string>();
    const filterUI = (items: (UINode | VariableDecl)[]) =>
      items.filter((x): x is UINode => x.type !== 'VariableDecl');
    const walk = (nodes: UINode[]) => {
      for (const n of nodes) {
        if (n.type === 'Input') targets.add(n.bind);
        else if (n.type === 'Layout') walk(n.children);
        else if (n.type === 'If') {
          walk(filterUI(n.then));
          for (const ei of n.elseIfs) walk(filterUI(ei.body));
          if (n.else_) walk(filterUI(n.else_));
        } else if (n.type === 'Each') walk(n.children);
      }
    };
    const uiNodes = screen.body.filter(
      (i): i is UINode => i.type !== 'VariableDecl' && i.type !== 'FunctionDef' && i.type !== 'Every'
    );
    walk(uiNodes);
    return targets;
  }

  private findReactiveDepOnInput(expr: Expr, targets: Set<string>): Ident | null {
    if (expr.type === 'Ident' && targets.has(expr.name)) return expr;
    if (expr.type === 'BinaryExpr' && expr.op === '+') {
      return this.findReactiveDepOnInput(expr.left, targets)
        ?? this.findReactiveDepOnInput(expr.right, targets);
    }
    return null;
  }

  // Shared state must always be accessed via the `shared.` prefix (spec v0.5+).
  // Bare access (reads or writes) to a name declared in the `shared:` block is
  // a transpile error — matches the "no magic, no hidden globals" principle.
  // Silent acceptance was shipping broken Dart: `dynamic hold = hold + [...]`
  // self-referencing locals inside functions, unbound identifiers inside screen
  // build methods. Caught after Opus Spaceship Cargo round (v0.10 domain-swap).
  private validateSharedPrefix(program: Program): void {
    if (program.shared.length === 0) return;
    const sharedNames = new Set(program.shared.map(v => v.name));

    const flag = (name: string, loc: SourceLocation | undefined): never => {
      throw new TranspileError(
        `\`${name}\` is declared in the \`shared:\` block. Access it as \`shared.${name}\`, not bare \`${name}\`. ` +
        `Spec rule: shared state must use the visible \`shared.\` prefix — it is the coupling marker that makes cross-screen mutations visible.`,
        loc?.line ?? 1, loc?.column ?? 1
      );
    };

    const walkExpr = (e: Expr): void => {
      switch (e.type) {
        case 'NumberLit':
        case 'StringLit':
          return;
        case 'Ident':
          if (sharedNames.has(e.name)) flag(e.name, e.loc);
          return;
        case 'BinaryExpr':
        case 'EqualityExpr':
          walkExpr(e.left); walkExpr(e.right); return;
        case 'UnaryExpr':
          walkExpr(e.operand); return;
        case 'IsExpr':
          walkExpr(e.target); return;
        case 'InExpr':
          walkExpr(e.target); walkExpr(e.list); return;
        case 'LambdaExpr':
          walkExpr(e.body); return;
        case 'ListLit':
          e.elements.forEach(walkExpr); return;
        case 'ObjectLit':
          e.entries.forEach(entry => walkExpr(entry.value)); return;
        case 'ObjectUpdate':
          walkExpr(e.base); e.updates.forEach(u => walkExpr(u.value)); return;
        case 'FieldAccess':
          // `shared.X` is the canonical form — don't recurse into `shared` as an Ident.
          if (e.object.type === 'Ident' && e.object.name === 'shared') return;
          walkExpr(e.object); return;
        case 'IndexAccess':
          walkExpr(e.object); walkExpr(e.index); return;
        case 'FunctionCall':
          e.args.forEach(walkExpr);
          if (e.namedArgs) e.namedArgs.forEach(a => walkExpr(a.value));
          return;
      }
    };

    const walkStmt = (s: Statement): void => {
      switch (s.type) {
        case 'Assignment': {
          // Bare assignment target: `hold = ...`. Parser keeps the `shared.`
          // prefix verbatim for qualified assignments, so an unqualified match
          // is always a bare write to a shared name.
          if (sharedNames.has(s.target)) flag(s.target, s.loc);
          walkExpr(s.value);
          return;
        }
        case 'FunctionCall':
          s.args.forEach(walkExpr);
          if (s.namedArgs) s.namedArgs.forEach(a => walkExpr(a.value));
          return;
        case 'NavigateTo':
          s.args.forEach(walkExpr); return;
        case 'NavigateBack':
          return;
        case 'Return':
          if (s.value) walkExpr(s.value); return;
        case 'IfStmt':
          walkExpr(s.condition);
          s.then.forEach(walkStmt);
          if (s.else_) s.else_.forEach(walkStmt);
          return;
        case 'EachStmt':
          walkExpr(s.list);
          s.body.forEach(walkStmt);
          return;
        case 'EmitStmt':
          if (s.arg) walkExpr(s.arg);
          return;
      }
    };

    const walkProps = (props: Property[]): void => {
      for (const p of props) walkExpr(p.value);
    };
    const walkEvents = (events: EventHandler[] | undefined): void => {
      if (!events) return;
      for (const ev of events) walkStmt(ev.action);
    };

    const walkUI = (nodes: UINode[]): void => {
      for (const n of nodes) {
        if ('properties' in n && n.properties) walkProps(n.properties);
        if ('events' in n) walkEvents(n.events);
        switch (n.type) {
          case 'Layout':
            walkUI(n.children); break;
          case 'Label':
            walkExpr(n.value); break;
          case 'Badge':
            walkExpr(n.text); break;
          case 'Button':
            walkExpr(n.text); break;
          case 'Icon':
            walkExpr(n.name); break;
          case 'Image':
            walkExpr(n.url); break;
          case 'If': {
            walkExpr(n.condition);
            const branch = (items: (UINode | VariableDecl)[]) => {
              for (const item of items) {
                if (item.type === 'VariableDecl') walkExpr(item.value);
                else walkUI([item]);
              }
            };
            branch(n.then);
            for (const ei of n.elseIfs) { walkExpr(ei.condition); branch(ei.body); }
            if (n.else_) branch(n.else_);
            break;
          }
          case 'Each':
            walkExpr(n.list);
            walkUI(n.children); break;
          case 'ComponentInvocation':
            n.args.forEach(walkExpr);
            walkUI(n.children); break;
          // Input/Toggle/Slider/Checkbox/Dropdown: `bind:` is a name string, not an Expr.
          // Spinner/Divider/Comment/Body: no sub-exprs.
        }
      }
    };

    for (const screen of program.screens) {
      walkProps(screen.properties);
      for (const item of screen.body) {
        if (item.type === 'VariableDecl') walkExpr(item.value);
        else if (item.type === 'FunctionDef') item.body.forEach(walkStmt);
      }
      const uiNodes = screen.body.filter(
        (i): i is UINode => i.type !== 'VariableDecl' && i.type !== 'FunctionDef' && i.type !== 'Every'
      );
      walkUI(uiNodes);
    }

    for (const comp of program.components) {
      for (const item of comp.body) {
        if (item.type === 'VariableDecl') walkExpr(item.value);
      }
      const uiNodes = comp.body.filter((i): i is UINode => i.type !== 'VariableDecl');
      walkUI(uiNodes);
    }
  }

  // `count(list, value)` counts identity matches against a value; it does not
  // accept a predicate lambda. The spec's canonical field-based counting idiom
  // (v0.11.3+) is `length(filter(list, predicate))`. A lambda passed as the
  // second arg would codegen to syntactically invalid Dart (`e == (t) => t.x`),
  // so we reject it here with a fix-it pointing at the canonical form.
  private validateCountLambda(program: Program): void {
    const flag = (loc: SourceLocation | undefined): never => {
      throw new TranspileError(
        '`count()` takes a list and a value, not a predicate lambda. For field-based counting use `length(filter(list, predicate))` — e.g. `length(filter(tasks, t => t.done))` — which is the canonical idiom as of spec v0.11.3.',
        loc?.line ?? 1, loc?.column ?? 1
      );
    };

    const walkExpr = (e: Expr): void => {
      switch (e.type) {
        case 'NumberLit':
        case 'StringLit':
        case 'Ident':
          return;
        case 'BinaryExpr':
        case 'EqualityExpr':
          walkExpr(e.left); walkExpr(e.right); return;
        case 'UnaryExpr':
          walkExpr(e.operand); return;
        case 'IsExpr':
          walkExpr(e.target); return;
        case 'InExpr':
          walkExpr(e.target); walkExpr(e.list); return;
        case 'LambdaExpr':
          walkExpr(e.body); return;
        case 'ListLit':
          e.elements.forEach(walkExpr); return;
        case 'ObjectLit':
          e.entries.forEach(entry => walkExpr(entry.value)); return;
        case 'ObjectUpdate':
          walkExpr(e.base); e.updates.forEach(u => walkExpr(u.value)); return;
        case 'FieldAccess':
          walkExpr(e.object); return;
        case 'IndexAccess':
          walkExpr(e.object); walkExpr(e.index); return;
        case 'FunctionCall':
          if (e.name === 'count' && e.args.length === 2 && e.args[1].type === 'LambdaExpr') {
            flag(e.loc);
          }
          e.args.forEach(walkExpr);
          if (e.namedArgs) e.namedArgs.forEach(a => walkExpr(a.value));
          return;
      }
    };

    const walkStmt = (s: Statement): void => {
      switch (s.type) {
        case 'Assignment':
          walkExpr(s.value); return;
        case 'FunctionCall':
          if (s.name === 'count' && s.args.length === 2 && s.args[1].type === 'LambdaExpr') {
            flag(s.loc);
          }
          s.args.forEach(walkExpr);
          if (s.namedArgs) s.namedArgs.forEach(a => walkExpr(a.value));
          return;
        case 'NavigateTo':
          s.args.forEach(walkExpr); return;
        case 'NavigateBack':
          return;
        case 'Return':
          if (s.value) walkExpr(s.value); return;
        case 'IfStmt':
          walkExpr(s.condition);
          s.then.forEach(walkStmt);
          if (s.else_) s.else_.forEach(walkStmt);
          return;
        case 'EachStmt':
          walkExpr(s.list);
          s.body.forEach(walkStmt);
          return;
        case 'EmitStmt':
          if (s.arg) walkExpr(s.arg);
          return;
      }
    };

    const walkProps = (props: Property[]): void => {
      for (const p of props) walkExpr(p.value);
    };
    const walkEvents = (events: EventHandler[] | undefined): void => {
      if (!events) return;
      for (const ev of events) walkStmt(ev.action);
    };

    const walkUI = (nodes: UINode[]): void => {
      for (const n of nodes) {
        if ('properties' in n && n.properties) walkProps(n.properties);
        if ('events' in n) walkEvents(n.events);
        switch (n.type) {
          case 'Layout':
            walkUI(n.children); break;
          case 'Label':
            walkExpr(n.value); break;
          case 'Badge':
            walkExpr(n.text); break;
          case 'Button':
            walkExpr(n.text); break;
          case 'Icon':
            walkExpr(n.name); break;
          case 'Image':
            walkExpr(n.url); break;
          case 'If': {
            walkExpr(n.condition);
            const branch = (items: (UINode | VariableDecl)[]) => {
              for (const item of items) {
                if (item.type === 'VariableDecl') walkExpr(item.value);
                else walkUI([item]);
              }
            };
            branch(n.then);
            for (const ei of n.elseIfs) { walkExpr(ei.condition); branch(ei.body); }
            if (n.else_) branch(n.else_);
            break;
          }
          case 'Each':
            walkExpr(n.list);
            walkUI(n.children); break;
          case 'ComponentInvocation':
            n.args.forEach(walkExpr);
            walkUI(n.children); break;
        }
      }
    };

    for (const v of program.shared) walkExpr(v.value);

    for (const screen of program.screens) {
      walkProps(screen.properties);
      for (const item of screen.body) {
        if (item.type === 'VariableDecl') walkExpr(item.value);
        else if (item.type === 'FunctionDef') item.body.forEach(walkStmt);
      }
      const uiNodes = screen.body.filter(
        (i): i is UINode => i.type !== 'VariableDecl' && i.type !== 'FunctionDef' && i.type !== 'Every'
      );
      walkUI(uiNodes);
    }

    for (const comp of program.components) {
      for (const item of comp.body) {
        if (item.type === 'VariableDecl') walkExpr(item.value);
      }
      const uiNodes = comp.body.filter((i): i is UINode => i.type !== 'VariableDecl');
      walkUI(uiNodes);
    }
  }

  // Button-level validations run before codegen: (1) `button` with no `on tap:`
  // is dead UI (surfaced by tutorial rerun 2026-04-24); (2) v0.17.0 `border:` is
  // a layout property, rejected on `button` because button is a styled primitive
  // (theme tokens drive its appearance) and `border:` is a layout property
  // (composes with `rounded:`/`background:`). Wrap the button in a bordered
  // layout for outlined-button needs — see Patch 2 in the v0.17 cheatsheet.
  private validateButtons(program: Program): void {
    const walkUI = (nodes: UINode[]): void => {
      for (const n of nodes) {
        switch (n.type) {
          case 'Button':
            if (n.properties.some(p => p.name === 'border')) {
              throw new TranspileError(
                '`border:` applies to layouts, not to `button`. For an outlined button, ' +
                'wrap it in a bordered layout: `layout vertical, rounded: medium, border: thin: ' +
                'button "X", on tap: ...`. `button` is a styled primitive whose appearance comes ' +
                'from theme tokens (`color: brand`/`subtle`/`danger`); `border:` is a layout ' +
                'property that composes with `rounded:`, `background:`, and the layout\'s bounds.',
                n.loc?.line ?? 1, n.loc?.column ?? 1,
              );
            }
            if (!n.events.some(e => e.event === 'tap')) {
              throw new TranspileError(
                '`button` requires an `on tap:` handler — say what the button should do, e.g. `, on tap: count = count + 1`. A button with no action renders as dead UI; the language refuses to emit one.',
                n.loc?.line ?? 1, n.loc?.column ?? 1,
              );
            }
            break;
          case 'Layout':
            walkUI(n.children); break;
          case 'If': {
            const branch = (items: (UINode | VariableDecl)[]) => {
              for (const item of items) {
                if (item.type !== 'VariableDecl') walkUI([item]);
              }
            };
            branch(n.then);
            for (const ei of n.elseIfs) branch(ei.body);
            if (n.else_) branch(n.else_);
            break;
          }
          case 'Each':
            walkUI(n.children); break;
          case 'ComponentInvocation':
            walkUI(n.children); break;
        }
      }
    };

    for (const screen of program.screens) {
      const uiNodes = screen.body.filter(
        (i): i is UINode => i.type !== 'VariableDecl' && i.type !== 'FunctionDef' && i.type !== 'Every'
      );
      walkUI(uiNodes);
    }
    for (const comp of program.components) {
      const uiNodes = comp.body.filter((i): i is UINode => i.type !== 'VariableDecl');
      walkUI(uiNodes);
    }
  }

  // v0.19 — `transition: <token>` only applies to layouts whose immediate
  // child set changes through `if`/`else if`/`else` swap or `each` add/remove.
  // Token-only (Q5): `fade` and `slide` are the entire vocabulary; per-call
  // duration arguments (`transition: fade 200ms`) are rejected. Cross-pointing
  // error message (Q3-tighten): misuse on a value-changing layout points at
  // `spring(value)` as the right primitive.
  private validateTransition(program: Program): void {
    const TRANSITION_TOKENS = new Set(['fade', 'slide']);
    const walkUI = (nodes: UINode[]): void => {
      for (const n of nodes) {
        if (n.type === 'Layout') {
          const transitionProp = findProp(n.properties, 'transition');
          if (transitionProp) {
            // Token validation — must be `Ident('fade')` or `Ident('slide')`.
            if (transitionProp.value.type !== 'Ident' || !TRANSITION_TOKENS.has(transitionProp.value.name)) {
              throw new TranspileError(
                '`transition:` takes one of two layout-swap tokens — `fade` or `slide`. ' +
                'Per-call duration arguments (`transition: fade 200ms`) and other tokens are rejected; ' +
                'the surface is intentionally narrow per the v0.17 width-token discipline.',
                transitionProp.value.loc?.line ?? n.loc?.line ?? 1,
                transitionProp.value.loc?.column ?? n.loc?.column ?? 1,
              );
            }
            // Child-shape validation — exactly one IfNode or EachNode child.
            // Comments are allowed as siblings (they don't render).
            const renderableChildren = n.children.filter(c => c.type !== 'Comment');
            if (renderableChildren.length !== 1 || (renderableChildren[0].type !== 'If' && renderableChildren[0].type !== 'Each')) {
              throw new TranspileError(
                'Use `spring(value)` for changing values; `transition:` only animates child replacement. ' +
                'A layout with `transition:` must have exactly one child that is an `if`/`else` block ' +
                'or an `each` loop. For per-row or value-by-value animation, use `spring(value)` consumed by `label`.',
                n.loc?.line ?? 1, n.loc?.column ?? 1,
              );
            }
          }
          walkUI(n.children);
        } else if (n.type === 'If') {
          const branch = (items: (UINode | VariableDecl)[]) => {
            for (const item of items) {
              if (item.type !== 'VariableDecl') walkUI([item]);
            }
          };
          branch(n.then);
          for (const ei of n.elseIfs) branch(ei.body);
          if (n.else_) branch(n.else_);
        } else if (n.type === 'Each') {
          walkUI(n.children);
        } else if (n.type === 'ComponentInvocation') {
          walkUI(n.children);
        }
      }
    };

    for (const screen of program.screens) {
      const uiNodes = screen.body.filter(
        (i): i is UINode => i.type !== 'VariableDecl' && i.type !== 'FunctionDef' && i.type !== 'Every'
      );
      walkUI(uiNodes);
    }
    for (const comp of program.components) {
      const uiNodes = comp.body.filter((i): i is UINode => i.type !== 'VariableDecl');
      walkUI(uiNodes);
    }
  }

  // v0.19 — `spring(value)` accepts a single numeric argument. Reject string
  // literals, list/object literals, and known non-numeric idents (style-value
  // names like `red`/`brand`). The error points at `transition:` as the right
  // primitive for non-interpolatable changes (Q3-tighten symmetric).
  private validateSpringTypes(program: Program): void {
    const checkExpr = (e: Expr): void => {
      if (e.type === 'FunctionCall' && e.name === 'spring') {
        if (e.args.length !== 1) {
          throw new TranspileError(
            '`spring()` takes exactly one numeric argument — got ' + e.args.length + '. ' +
            'Use `spring(target_value)` to animate a value smoothly toward `target_value`.',
            e.loc?.line ?? 1, e.loc?.column ?? 1,
          );
        }
        const arg = e.args[0];
        // Reject obvious non-numerics. Idents and binary-exprs are accepted —
        // their numeric-ness can't be statically proven without full type
        // inference, and over-rejecting blocks legitimate cases like
        // `spring(item.recency * 100)`.
        if (arg.type === 'StringLit') {
          throw new TranspileError(
            'Use `transition: fade` on a conditional render instead. ' +
            '`spring()` only animates numeric values; got a string literal.',
            e.loc?.line ?? 1, e.loc?.column ?? 1,
          );
        }
        if (arg.type === 'ListLit' || arg.type === 'ObjectLit' || arg.type === 'ObjectUpdate') {
          throw new TranspileError(
            'Use `transition: fade` on a conditional render instead. ' +
            '`spring()` only animates numeric values; lists and objects are not interpolatable.',
            e.loc?.line ?? 1, e.loc?.column ?? 1,
          );
        }
      }
      // Recurse into composite expressions.
      if (e.type === 'BinaryExpr') { checkExpr(e.left); checkExpr(e.right); }
      if (e.type === 'UnaryExpr') { checkExpr(e.operand); }
      if (e.type === 'IsExpr') { checkExpr(e.target); }
      if (e.type === 'EqualityExpr') { checkExpr(e.left); checkExpr(e.right); }
      if (e.type === 'InExpr') { checkExpr(e.target); checkExpr(e.list); }
      if (e.type === 'LambdaExpr') { checkExpr(e.body); }
      if (e.type === 'FunctionCall') {
        for (const a of e.args) checkExpr(a);
        if (e.namedArgs) for (const na of e.namedArgs) checkExpr(na.value);
      }
      if (e.type === 'ListLit') { for (const item of e.elements) checkExpr(item); }
      if (e.type === 'ObjectLit') { for (const entry of e.entries) checkExpr(entry.value); }
      if (e.type === 'ObjectUpdate') {
        checkExpr(e.base);
        for (const update of e.updates) checkExpr(update.value);
      }
      if (e.type === 'FieldAccess') { checkExpr(e.object); }
      if (e.type === 'IndexAccess') { checkExpr(e.object); checkExpr(e.index); }
    };
    const checkUI = (nodes: UINode[]): void => {
      for (const n of nodes) {
        if (n.type === 'Label') checkExpr(n.value);
        if (n.type === 'Button' && n.text) checkExpr(n.text);
        for (const p of ('properties' in n ? n.properties : [])) checkExpr(p.value);
        if (n.type === 'Layout') checkUI(n.children);
        if (n.type === 'If') {
          for (const item of n.then) if (item.type !== 'VariableDecl') checkUI([item]);
          for (const ei of n.elseIfs) for (const item of ei.body) if (item.type !== 'VariableDecl') checkUI([item]);
          if (n.else_) for (const item of n.else_) if (item.type !== 'VariableDecl') checkUI([item]);
        }
        if (n.type === 'Each') { checkExpr(n.list); checkUI(n.children); }
        if (n.type === 'ComponentInvocation') checkUI(n.children);
      }
    };
    const checkStmts = (stmts: Statement[]): void => {
      for (const s of stmts) {
        if (s.type === 'Assignment') checkExpr(s.value);
        if (s.type === 'IfStmt') { checkExpr(s.condition); checkStmts(s.then); if (s.else_) checkStmts(s.else_); }
        if (s.type === 'EachStmt') { checkExpr(s.list); checkStmts(s.body); }
        if (s.type === 'FunctionCall') for (const a of s.args) checkExpr(a);
      }
    };
    for (const screen of program.screens) {
      const uiNodes = screen.body.filter(
        (i): i is UINode => i.type !== 'VariableDecl' && i.type !== 'FunctionDef' && i.type !== 'Every'
      );
      checkUI(uiNodes);
      for (const item of screen.body) {
        if (item.type === 'VariableDecl') checkExpr(item.value);
        if (item.type === 'FunctionDef') checkStmts(item.body);
        if (item.type === 'Every') checkStmts(item.body);
      }
    }
    for (const comp of program.components) {
      const uiNodes = comp.body.filter((i): i is UINode => i.type !== 'VariableDecl');
      checkUI(uiNodes);
      for (const item of comp.body) {
        if (item.type === 'VariableDecl') checkExpr(item.value);
      }
    }
  }

  // Walk a UI body collecting (event, argName?) pairs from every `emit` action
  // inside an event handler. Multiple emits of the same event must agree on
  // their argument shape — different arg names is a TranspileError.
  private collectEmits(body: ReadonlyArray<ComponentItem | UINode>): { event: string; argName: string | null }[] {
    const found = new Map<string, string | null>();
    const argNames = new Map<string, string | null>();
    const visitStmt = (s: Statement) => {
      if (s.type === 'EmitStmt') {
        const argName = s.arg && s.arg.type === 'Ident' ? s.arg.name : (s.arg ? '_value' : null);
        if (found.has(s.event)) {
          const prev = argNames.get(s.event);
          if ((prev === null) !== (argName === null)) {
            throw new TranspileError(
              `Event "${s.event}" emits both with and without an argument. Pick one shape.`,
              s.loc?.line ?? 1,
              s.loc?.column ?? 1
            );
          }
        }
        found.set(s.event, argName);
        argNames.set(s.event, argName);
      } else if (s.type === 'IfStmt') {
        s.then.forEach(visitStmt);
        if (s.else_) s.else_.forEach(visitStmt);
      } else if (s.type === 'EachStmt') {
        s.body.forEach(visitStmt);
      }
    };
    const visitEvents = (events: EventHandler[] | undefined) => {
      if (!events) return;
      for (const e of events) visitStmt(e.action);
    };
    const visit = (nodes: UINode[]) => {
      for (const n of nodes) {
        if ('events' in n) visitEvents(n.events);
        if (n.type === 'Layout') visit(n.children);
        else if (n.type === 'If') {
          const filterUI = (items: (UINode | VariableDecl)[]) =>
            items.filter((x): x is UINode => x.type !== 'VariableDecl');
          visit(filterUI(n.then));
          for (const ei of n.elseIfs) visit(filterUI(ei.body));
          if (n.else_) visit(filterUI(n.else_));
        } else if (n.type === 'Each') visit(n.children);
        else if (n.type === 'ComponentInvocation') {
          // Custom event handlers attached at invocation may themselves
          // contain `emit` calls (re-emit pattern from a wrapper component).
          for (const e of n.events) visitStmt(e.action);
        }
      }
    };
    visit(body.filter((n): n is UINode => n.type !== 'VariableDecl'));
    return Array.from(found, ([event, argName]) => ({ event, argName }));
  }

  // Emit the component's build() body. Most components have a single root UINode
  // (typically a Layout) — for those we emit `return Widget;`. If the root is an
  // If node we can't use the spread-if pattern (it's only valid inside list
  // literals), so we emit sequential conditional `return` statements instead.
  private genComponentBodyReturn(body: ReadonlyArray<ComponentItem | UINode>, depth: number): string {
    const ind = this.indent(depth);
    const uiNodes = body.filter((n): n is UINode => n.type !== 'VariableDecl');
    if (uiNodes.length === 0) {
      return `${ind}return const SizedBox();\n`;
    }
    const root = uiNodes[0];
    if (root.type === 'If') {
      return this.genRootConditionalReturn(root, depth);
    }
    const widget = this.genUINode(root, depth);
    return `${ind}return ${widget.trimStart()};\n`;
  }

  private genRootConditionalReturn(node: IfNode, depth: number): string {
    const ind = this.indent(depth);
    let code = '';
    code += `${ind}if (${this.exprToDart(node.condition)}) {\n`;
    code += this.genBranchReturn(node.then, depth + 1);
    code += `${ind}}\n`;
    for (const branch of node.elseIfs) {
      code += `${ind}if (${this.exprToDart(branch.condition)}) {\n`;
      code += this.genBranchReturn(branch.body, depth + 1);
      code += `${ind}}\n`;
    }
    if (node.else_) {
      code += this.genBranchReturn(node.else_, depth);
    } else {
      code += `${ind}return const SizedBox();\n`;
    }
    return code;
  }

  private genBranchReturn(body: (UINode | VariableDecl)[], depth: number): string {
    const ind = this.indent(depth);
    const uiNodes = body.filter((n): n is UINode => n.type !== 'VariableDecl');
    if (uiNodes.length === 0) {
      return `${ind}return const SizedBox();\n`;
    }
    if (uiNodes.length === 1) {
      const widget = this.genUINode(uiNodes[0], depth);
      return `${ind}return ${widget.trimStart()};\n`;
    }
    let code = `${ind}return Column(\n`;
    code += `${ind}  mainAxisSize: MainAxisSize.min,\n`;
    code += `${ind}  children: [\n`;
    for (const child of uiNodes) {
      code += this.genUINode(child, depth + 2) + ',\n';
    }
    code += `${ind}  ],\n`;
    code += `${ind});\n`;
    return code;
  }

  private componentHasBody(nodes: ReadonlyArray<ComponentItem | UINode>): boolean {
    for (const node of nodes) {
      if (node.type === 'VariableDecl') continue;
      if (node.type === 'Body') return true;
      if (node.type === 'Layout' && this.componentHasBody(node.children)) return true;
      if (node.type === 'If') {
        if (this.componentHasBody(node.then)) return true;
        if (node.else_ && this.componentHasBody(node.else_)) return true;
      }
    }
    return false;
  }

  private genComponentInvocation(node: ComponentInvocation, depth: number): string {
    const ind = this.indent(depth);
    const comp = this.allComponents.find(c => c.name === node.name);
    const paramNames = comp?.params ?? [];

    const namedArgs: string[] = [];
    for (let i = 0; i < node.args.length && i < paramNames.length; i++) {
      namedArgs.push(`${paramNames[i]}: ${this.exprToDart(node.args[i])}`);
    }
    for (const prop of node.properties) {
      namedArgs.push(`${prop.name}: ${this.exprToDart(prop.value)}`);
    }

    // Custom event handlers (`on increment:`, etc.) at the invocation site
    // wire to the component's `on<Event>` callback param. Built-in events
    // (`tap`, `touch`) are still handled below by wrapWithGestures.
    const builtInEvents = new Set(['tap', 'touch', 'change']);
    const customEvents = node.events.filter(e => !builtInEvents.has(e.event));
    if (customEvents.length > 0) {
      const compEmits = comp ? this.collectEmits(comp.body) : [];
      for (const ev of customEvents) {
        const cbName = this.emitCallbackName(ev.event);
        const decl = compEmits.find(e => e.event === ev.event);
        const childHasPayload = !!(decl && decl.argName);
        const parentHasParam = !!ev.parameter;

        // v0.16 static validation: parent handler signature must match child's emit signature.
        if (childHasPayload && !parentHasParam) {
          throw new TranspileError(
            `event "${ev.event}" carries a value.\n  → name a parameter: on ${ev.event}(name):\n  → discard explicitly: on ${ev.event}(_):`,
            ev.loc?.line ?? 1,
            ev.loc?.column ?? 1
          );
        }
        if (!childHasPayload && parentHasParam) {
          throw new TranspileError(
            `event "${ev.event}" is payload-less; remove the "(${ev.parameter})" parameter. Component \`${node.name}\` declares \`emit ${ev.event}\` with no value.`,
            ev.loc?.line ?? 1,
            ev.loc?.column ?? 1
          );
        }

        // Parent's chosen name binds the closure parameter (Shape A — explicit naming).
        // The child still passes the value via cb?.call(arg); the parent's parameter receives it.
        const sig = parentHasParam ? `(${ev.parameter})` : `()`;
        const paramName = parentHasParam && ev.parameter && ev.parameter !== '_' ? ev.parameter : null;
        if (paramName) this.dynamicParamsInScope.add(paramName);
        const body = this.genCallbackBody(ev.action, depth + 1);
        if (paramName) this.dynamicParamsInScope.delete(paramName);
        namedArgs.push(`${cbName}: ${sig} {\n${body}${ind}  }`);
      }
    }

    // Wrapper invocation: the `body` slot renders exactly one widget (spec
    // v0.6.8). Pass the caller's single child directly — no implicit Column
    // wrapper. If the caller passed multiple children, reject with a clear
    // message pointing them at `layout vertical:` / `layout horizontal:`.
    const renderableChildren = node.children.filter(c => c.type !== 'Comment');
    if (renderableChildren.length > 1) {
      throw new TranspileError(
        `Wrapper component \`${node.name}\` received ${renderableChildren.length} children. ` +
        `The \`body\` slot renders exactly one widget — wrap multiple children in \`layout vertical:\` or \`layout horizontal:\`.`,
        node.loc?.line ?? 1,
        node.loc?.column ?? 1
      );
    }
    let code: string;
    if (renderableChildren.length === 1) {
      const childWidget = this.genUINode(renderableChildren[0], depth + 1).trimStart();
      namedArgs.push(`child: ${childWidget}`);
      code = `${ind}${node.name}(\n${ind}  ${namedArgs.join(`,\n${ind}  `)},\n${ind})`;
    } else {
      code = `${ind}${node.name}(${namedArgs.join(', ')})`;
    }

    // Events attached to the invocation (e.g. `GenderCard ... on tap: ...`)
    // wrap the rendered component in a GestureDetector. Without this the
    // event is silently dropped — a real bug caught by hands-on testing
    // rather than diff or transpiler validation.
    return this.wrapWithGestures(code, node.events, depth);
  }

  private genFunctionDef(func: FunctionDef): string {
    this.functionParams = func.params;
    this.declaredLocals = new Set();
    const hasReturn = func.body.some(s => this.stmtHasReturn(s));
    const paramStr = func.params.map(p => `dynamic ${p}`).join(', ');
    const returnType = hasReturn ? 'dynamic' : 'void';

    let code = `  ${returnType} ${func.name}(${paramStr}) {\n`;
    code += this.genStmtBlock(func.body, 2);
    code += `  }`;
    this.functionParams = [];
    this.declaredLocals = new Set();
    return this.withMarker(func, `function:${func.name}`, code);
  }

  // `If` and `Each` codegen produces Dart collection-spread (`if (c) ...[]` /
  // `for (x in xs) ...[]`), which is only valid inside a list literal. When
  // one of these sits alone at screen body level, wrap it in an implicit
  // Column so the spread lands in `children: [...]` instead of bare.
  private emitsSpread(node: UINode): boolean {
    if (node.type === 'Each' && node.paginate !== undefined) return false;
    return node.type === 'If' || node.type === 'Each';
  }

  // When a screen's root is an explicit `layout` the user is in control of
  // spacing — suppress the default 16px padding to avoid double-padding
  // cases like `layout vertical, padding: large:`.
  private rootOwnsLayout(uiNodes: UINode[]): boolean {
    return uiNodes.length === 1 && uiNodes[0].type === 'Layout';
  }

  // `each ... paginate:` emits `Expanded(child: ListView.builder(...))`, which
  // needs a bounded-height parent. The default `SingleChildScrollView` wrap
  // gives its child unbounded height, so Expanded would crash at layout time.
  // When a screen body contains any paginate each, skip the scroll wrap — the
  // ListView handles its own scrolling.
  private containsPaginateEach(nodes: UINode[]): boolean {
    for (const n of nodes) {
      if (n.type === 'Each' && n.paginate !== undefined) return true;
      if (n.type === 'Layout' && this.containsPaginateEach(n.children)) return true;
      if (n.type === 'Each' && this.containsPaginateEach(n.children)) return true;
      if (n.type === 'If') {
        const thenUI = n.then.filter(c => c.type !== 'VariableDecl') as UINode[];
        if (this.containsPaginateEach(thenUI)) return true;
        for (const b of n.elseIfs) {
          const branchUI = b.body.filter(c => c.type !== 'VariableDecl') as UINode[];
          if (this.containsPaginateEach(branchUI)) return true;
        }
        if (n.else_) {
          const elseUI = n.else_.filter(c => c.type !== 'VariableDecl') as UINode[];
          if (this.containsPaginateEach(elseUI)) return true;
        }
      }
    }
    return false;
  }

  // If `gen` output is an `Expanded(child: X)` at its outermost level, return
  // the inner `X` with matching indentation. Used on the screen root because
  // `Expanded` can't be a Scaffold body (must be in a Flex parent). Looks for
  // the well-known shape produced by `genLayout` when `fill: true` is set.
  private unwrapScreenRootExpanded(code: string): string {
    const trimmed = code.trimStart();
    const leadingWs = code.slice(0, code.length - trimmed.length);
    if (!trimmed.startsWith('Expanded(')) return code;
    const childMarker = 'child: ';
    const childStart = trimmed.indexOf(childMarker);
    if (childStart === -1) return code;
    const inner = trimmed.slice(childStart + childMarker.length);
    // Strip the trailing `,\n...)` that closes the Expanded wrapper.
    const closeMatch = inner.match(/,\s*\)\s*$/);
    if (!closeMatch) return code;
    const innerBody = inner.slice(0, inner.length - closeMatch[0].length);
    return leadingWs + innerBody;
  }

  // Builds the constructor argument list for `navigate to Screen a, b, c` —
  // pairs each positional arg with the target screen's parameter name so the
  // generated Dart uses named args: `ScreenName(p1: a, p2: b, p3: c)`.
  private genNavigateCtorArgs(screenName: string, args: Expr[]): string {
    if (args.length === 0) return '';
    const targetScreen = this.allScreens.find(sc => sc.name === screenName);
    const params = targetScreen?.params ?? [];
    return args.map((a, i) => {
      const paramName = params[i];
      const argStr = this.exprToDart(a);
      return paramName ? `${paramName}: ${argStr}` : argStr;
    }).join(', ');
  }

  private stmtHasReturn(s: Statement): boolean {
    if (s.type === 'Return') return true;
    if (s.type === 'IfStmt') {
      return s.then.some(st => this.stmtHasReturn(st)) ||
        (s.else_?.some(st => this.stmtHasReturn(st)) ?? false);
    }
    return false;
  }

  private genStmtBlock(stmts: Statement[], depth: number): string {
    const ind = this.indent(depth);
    let code = '';
    for (const s of stmts) {
      code += this.genStmt(s, depth);
    }
    return code;
  }

  // Recurse into the RHS of an assignment looking for `/` (which always
  // returns a fractional number in Dart). Returns the loc of the first `/`
  // found, or null. Skips into floor/ceil/round arg lists since those
  // builtins collapse double → int. Surfaces the int-divide trap (mum's
  // HELP.md 2026-04-26) at the Igni level instead of leaking a Dart type
  // error.
  private findFloatDivision(expr: Expr): { line: number; column: number } | null {
    if (expr.type === 'BinaryExpr') {
      if (expr.op === '/') {
        return expr.loc ? { line: expr.loc.line, column: expr.loc.column } : { line: 0, column: 0 };
      }
      return this.findFloatDivision(expr.left) ?? this.findFloatDivision(expr.right);
    }
    if (expr.type === 'FunctionCall') {
      if (expr.name === 'floor' || expr.name === 'ceil' || expr.name === 'round') {
        return null;
      }
      for (const a of expr.args) {
        const r = this.findFloatDivision(a);
        if (r) return r;
      }
      return null;
    }
    if (expr.type === 'UnaryExpr') return this.findFloatDivision(expr.operand);
    if (expr.type === 'FieldAccess') return this.findFloatDivision(expr.object);
    if (expr.type === 'IndexAccess') {
      return this.findFloatDivision(expr.object) ?? this.findFloatDivision(expr.index);
    }
    return null;
  }

  // Called wherever an int-typed state variable is reassigned (genStmt
  // Assignment case + genOnPressed Assignment branch). Throws an Igni-level
  // error pointing at the `/` if the RHS contains float division.
  private checkIntDivideAssignment(target: string, value: Expr): void {
    if (this.ctx.stateVarTypes[target] !== 'int') return;
    const divLoc = this.findFloatDivision(value);
    if (!divLoc) return;
    throw new TranspileError(
      `\`${target}\` is a whole number, but \`/\` returns a fractional one (\`5 / 2\` is \`2.5\`). Wrap the expression with \`floor(...)\` to round down — e.g. \`${target} = floor(${target} / 2)\`.`,
      divLoc.line,
      divLoc.column,
    );
  }

  // True if `expr` references any of `names` anywhere in its sub-tree.
  // Used to detect when an emit-payload param flows into an int-typed
  // assignment RHS so the codegen can post-wrap with `.toInt()`.
  private exprReferencesAny(expr: Expr, names: Set<string>): boolean {
    if (names.size === 0) return false;
    if (expr.type === 'Ident') return names.has(expr.name);
    if (expr.type === 'BinaryExpr') return this.exprReferencesAny(expr.left, names) || this.exprReferencesAny(expr.right, names);
    if (expr.type === 'UnaryExpr') return this.exprReferencesAny(expr.operand, names);
    if (expr.type === 'EqualityExpr') return this.exprReferencesAny(expr.left, names) || this.exprReferencesAny(expr.right, names);
    if (expr.type === 'IsExpr') return this.exprReferencesAny(expr.target, names);
    if (expr.type === 'InExpr') return this.exprReferencesAny(expr.target, names) || this.exprReferencesAny(expr.list, names);
    if (expr.type === 'FieldAccess') return this.exprReferencesAny(expr.object, names);
    if (expr.type === 'IndexAccess') return this.exprReferencesAny(expr.object, names) || this.exprReferencesAny(expr.index, names);
    if (expr.type === 'FunctionCall') return expr.args.some(a => this.exprReferencesAny(a, names));
    if (expr.type === 'ListLit') return expr.elements.some(e => this.exprReferencesAny(e, names));
    if (expr.type === 'ObjectLit') return expr.entries.some(e => this.exprReferencesAny(e.value, names));
    if (expr.type === 'ObjectUpdate') return this.exprReferencesAny(expr.base, names) || expr.updates.some(u => this.exprReferencesAny(u.value, names));
    return false;
  }

  // Wrap RHS expression in `.toInt()` if the assignment target is int-typed
  // AND the RHS references an in-scope dynamic-payload param. Dart's static
  // type system rejects `int = (int + dynamic)` because `int + dynamic`
  // resolves to `num`. The wrap forces conversion at the closure boundary
  // without narrowing the param type (which the spec leaves unconstrained:
  // `emit X v` accepts any positional value).
  private maybeWrapDynPayloadInt(targetType: string | undefined, rhsDart: string, value: Expr): string {
    if (targetType !== 'int') return rhsDart;
    if (!this.exprReferencesAny(value, this.dynamicParamsInScope)) return rhsDart;
    return `(${rhsDart}).toInt()`;
  }

  private genStmt(s: Statement, depth: number): string {
    const ind = this.indent(depth);
    let code = '';
    switch (s.type) {
      case 'Assignment': {
        if (s.target.startsWith('shared.')) {
          const sharedField = s.target.slice('shared.'.length);
          const sharedFieldType = this.sharedVarTypes[sharedField];
          const rhs = this.maybeWrapDynPayloadInt(sharedFieldType, this.exprToDart(s.value), s.value);
          code = `${ind}shared.update(() {\n${ind}  ${s.target} = ${rhs};\n${ind}});\n`;
          break;
        }
        const isStateVar = this.ctx.stateVars.includes(s.target);
        if (isStateVar) {
          this.checkIntDivideAssignment(s.target, s.value);
          const rhs = this.maybeWrapDynPayloadInt(this.ctx.stateVarTypes[s.target], this.exprToDart(s.value), s.value);
          code = `${ind}setState(() {\n${ind}  ${s.target} = ${rhs};\n${ind}});\n`;
          if (this.ctx.boundInputVars.includes(s.target)) {
            code += `${ind}_${s.target}Controller.text = ${s.target};\n`;
          }
          break;
        }
        // Local variable
        const prefix = this.declaredLocals.has(s.target) ? '' : 'dynamic ';
        this.declaredLocals.add(s.target);
        code = `${ind}${prefix}${s.target} = ${this.exprToDart(s.value)};\n`;
        break;
      }
      case 'FunctionCall': {
        if (s.name === 'play' && s.args.length === 1) {
          const src = this.exprToDart(s.args[0]);
          code = `${ind}_audioPlayer.play(AssetSource(${src}));\n`;
          break;
        }
        const args = s.args.map(a => this.exprToDart(a)).join(', ');
        code = `${ind}${s.name}(${args});\n`;
        break;
      }
      case 'NavigateBack':
        code = `${ind}Navigator.pop(context);\n`;
        break;
      case 'NavigateTo': {
        const ctorArgs = this.genNavigateCtorArgs(s.screen, s.args);
        code = `${ind}Navigator.push(context, MaterialPageRoute(builder: (context) => ${s.screen}Screen(${ctorArgs})));\n`;
        break;
      }
      case 'Return':
        if (s.value) {
          code = `${ind}return ${this.exprToDart(s.value)};\n`;
          break;
        }
        code = `${ind}return;\n`;
        break;
      case 'IfStmt': {
        code = `${ind}if (${this.exprToDart(s.condition)}) {\n`;
        code += this.genStmtBlock(s.then, depth + 1);
        if (s.else_) {
          code += `${ind}} else {\n`;
          code += this.genStmtBlock(s.else_, depth + 1);
        }
        code += `${ind}}\n`;
        break;
      }
      case 'EachStmt': {
        // Save declaredLocals at entry, restore at exit. Inside the loop we
        // see variables from the enclosing scope (so accumulator patterns like
        // `t = 0` then `each: t = t + ...` keep working as bare reassignments).
        // On exit we revert: any variable first-declared inside the loop body
        // is removed from the tracking, so a sibling `each` with the same
        // variable name re-declares it inside its own for-body — matching
        // Dart's actual scoping where each `for (...) { ... }` is its own scope.
        const savedLocals = new Set(this.declaredLocals);
        code = `${ind}for (final ${s.variable} in ${this.exprToDart(s.list)}) {\n`;
        code += this.genStmtBlock(s.body, depth + 1);
        code += `${ind}}\n`;
        this.declaredLocals = savedLocals;
        break;
      }
      case 'EmitStmt': {
        const cb = this.emitCallbackName(s.event);
        const arg = s.arg ? this.exprToDart(s.arg) : '';
        code = `${ind}${cb}?.call(${arg});\n`;
        break;
      }
    }
    return this.withMarker(s, `stmt:${s.type}`, code);
  }

  private genOnPressed(event: EventHandler, depth: number): string {
    const ind = this.indent(depth);
    const action = event.action;

    if (action.type === 'NavigateBack') {
      let code = `${ind}onPressed: () {\n`;
      code += `${ind}  Navigator.pop(context);\n`;
      code += `${ind}},\n`;
      return code;
    }

    if (action.type === 'NavigateTo') {
      const ctorArgs = this.genNavigateCtorArgs(action.screen, action.args);
      let code = `${ind}onPressed: () {\n`;
      code += `${ind}  Navigator.push(context, MaterialPageRoute(builder: (context) => ${action.screen}Screen(${ctorArgs})));\n`;
      code += `${ind}},\n`;
      return code;
    }

    if (action.type === 'FunctionCall') {
      let code = `${ind}onPressed: () {\n`;
      if (action.name === 'play' && action.args.length === 1) {
        const src = this.exprToDart(action.args[0]);
        code += `${ind}  _audioPlayer.play(AssetSource(${src}));\n`;
      } else {
        const args = action.args.map(a => this.exprToDart(a)).join(', ');
        code += `${ind}  ${action.name}(${args});\n`;
      }
      code += `${ind}},\n`;
      return code;
    }

    if (action.type === 'EmitStmt') {
      const cb = this.emitCallbackName(action.event);
      const arg = action.arg ? this.exprToDart(action.arg) : '';
      let code = `${ind}onPressed: () {\n`;
      code += `${ind}  ${cb}?.call(${arg});\n`;
      code += `${ind}},\n`;
      return code;
    }

    if (action.type !== 'Assignment') {
      throw new TranspileError(`Unsupported event handler action type: ${action.type}`, action.loc?.line ?? 1, action.loc?.column ?? 1);
    }

    if (this.ctx.stateVars.includes(action.target)) {
      this.checkIntDivideAssignment(action.target, action.value);
    }
    const dartExpr = this.exprToDart(action.value);

    if (action.target.startsWith('shared.')) {
      // `on tap: shared.X = ...` must wrap in shared.update() so the
      // ChangeNotifier fires and the app-root ListenableBuilder rebuilds.
      // Without this the assignment happens but no widget sees it. v0.14.1
      // patched the `bind:` path; this is the symmetric `on tap:` patch
      // (surfaced 2026-04-27 by BMI's tappable GenderCard not switching).
      let code = `${ind}onPressed: () {\n`;
      code += `${ind}  shared.update(() {\n`;
      code += `${ind}    ${action.target} = ${dartExpr};\n`;
      code += `${ind}  });\n`;
      code += `${ind}},\n`;
      return code;
    }

    if (this.ctx.stateVars.includes(action.target)) {
      let code = `${ind}onPressed: () {\n`;
      code += `${ind}  setState(() {\n`;
      code += `${ind}    ${action.target} = ${dartExpr};\n`;
      code += `${ind}  });\n`;
      code += `${ind}},\n`;
      return code;
    }

    let code = `${ind}onPressed: () {\n`;
    code += `${ind}  ${action.target} = ${dartExpr};\n`;
    code += `${ind}},\n`;
    return code;
  }

  private genChangeActionBody(event: EventHandler, depth: number): string {
    const ind = this.indent(depth);
    const action = event.action;

    if (action.type === 'NavigateBack') {
      return `${ind}Navigator.pop(context);\n`;
    }
    if (action.type === 'NavigateTo') {
      const ctorArgs = this.genNavigateCtorArgs(action.screen, action.args);
      return `${ind}Navigator.push(context, MaterialPageRoute(builder: (context) => ${action.screen}Screen(${ctorArgs})));\n`;
    }
    if (action.type === 'FunctionCall') {
      if (action.name === 'play' && action.args.length === 1) {
        const src = this.exprToDart(action.args[0]);
        return `${ind}_audioPlayer.play(AssetSource(${src}));\n`;
      }
      const args = action.args.map(a => this.exprToDart(a)).join(', ');
      return `${ind}${action.name}(${args});\n`;
    }

    if (action.type === 'EmitStmt') {
      const cb = this.emitCallbackName(action.event);
      const arg = action.arg ? this.exprToDart(action.arg) : '';
      return `${ind}${cb}?.call(${arg});\n`;
    }

    if (action.type !== 'Assignment') {
      throw new TranspileError(`Unsupported event handler action type: ${action.type}`, action.loc?.line ?? 1, action.loc?.column ?? 1);
    }

    const dartExpr = this.exprToDart(action.value);
    if (action.target.startsWith('shared.')) {
      // Same patch as genOnPressed — `on change: shared.X = ...` needs
      // shared.update() to fire notifyListeners.
      let code = `${ind}shared.update(() {\n`;
      code += `${ind}  ${action.target} = ${dartExpr};\n`;
      code += `${ind}});\n`;
      return code;
    }
    if (this.ctx.stateVars.includes(action.target)) {
      let code = `${ind}setState(() {\n`;
      code += `${ind}  ${action.target} = ${dartExpr};\n`;
      code += `${ind}});\n`;
      return code;
    }
    return `${ind}${action.target} = ${dartExpr};\n`;
  }

  private wrapWithGestures(code: string, events: EventHandler[], depth: number): string {
    const tapEvent = events.find(e => e.event === 'tap');
    const touchEvent = events.find(e => e.event === 'touch');
    if (!tapEvent && !touchEvent) return code;
    const ind = this.indent(depth);
    const props: string[] = [];
    // HitTestBehavior.opaque so the whole bounds of the wrapped widget catch
    // taps, regardless of children. Default (deferToChild) silently misses
    // taps on layout regions where children don't claim the hit — e.g. a
    // tappable card whose Container uses `decoration:` (no explicit `color:`
    // prop) doesn't propagate hits to GestureDetector. Surfaced 2026-04-27 by
    // BMI's GenderCard: tapping FEMALE didn't switch from MALE.
    props.push(`${ind}  behavior: HitTestBehavior.opaque,\n`);
    if (tapEvent) {
      props.push(this.genOnPressed(tapEvent, depth + 1).replace('onPressed', 'onTap'));
    }
    if (touchEvent) {
      props.push(this.genOnPressed(touchEvent, depth + 1).replace('onPressed: ()', 'onTapDown: (_)'));
    }
    return `${ind}GestureDetector(\n${props.join('')}${ind}  child: ${code.trimStart()},\n${ind})`;
  }

  // -- Expression rendering --

  private exprToDart(expr: Expr): string {
    switch (expr.type) {
      case 'NumberLit': return `${expr.value}`;
      case 'StringLit': return `'${expr.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$')}'`;
      case 'Ident':
        // v0.19: spring-aliased variable reads substitute to the spring's target.
        // Non-label consumers (conditions, arithmetic) see the logical value,
        // not the animated frame; label consumers are detected pre-substitution
        // in genLabel and emit TweenAnimationBuilder.
        if (this.ctx.springAliases[expr.name]) {
          return this.exprToDart(this.ctx.springAliases[expr.name]);
        }
        if (this.declaredLocals.has(expr.name)) return expr.name;
        if (this.functionParams.includes(expr.name)) return expr.name;
        if (this.ctx.stateVars.includes(expr.name)) return expr.name;
        if (this.ctx.screenParams.includes(expr.name)) return this.ctx.isComponent ? expr.name : `widget.${expr.name}`;
        if (isStyleValueName(expr.name)) return `'${expr.name}'`;
        return expr.name;
      case 'BinaryExpr': {
        // Preserve grouping through Dart's left-to-right evaluation. Without
        // this, `a / (b * c)` emits `a / b * c` (which Dart reads as
        // `(a / b) * c`). Paren only when precedence requires it, so simple
        // left-associative chains like `a + b + c` stay clean.
        const prec = (e: Expr): number => {
          if (e.type !== 'BinaryExpr') return 100;
          if (e.op === 'or') return 1;
          if (e.op === 'and') return 2;
          if (e.op === '+' || e.op === '-') return 3;
          if (e.op === '*' || e.op === '/') return 4;
          return 100;
        };
        const myPrec = prec(expr);
        const nonAssocRight = expr.op === '-' || expr.op === '/';
        const leftStr = prec(expr.left) < myPrec
          ? `(${this.exprToDart(expr.left)})`
          : this.exprToDart(expr.left);
        const rightNeedsParen = prec(expr.right) < myPrec
          || (prec(expr.right) === myPrec && nonAssocRight);
        const rightStr = rightNeedsParen
          ? `(${this.exprToDart(expr.right)})`
          : this.exprToDart(expr.right);
        if (expr.op === '+' && isStringExpr(expr)) {
          // Mum's `HELP.md` 2026-04-26: hot-reload on Flutter Web can leave a
          // previously-defined reference as JS undefined; `.toString()` on
          // undefined throws. Wrap operands that could be undefined in
          // `((x) as dynamic)?.toString() ?? ''`. Skip the wrap for literals
          // and nested string-concat results — those are guaranteed non-null.
          const isSafe = (e: Expr): boolean =>
            e.type === 'StringLit' ||
            e.type === 'NumberLit' ||
            (e.type === 'BinaryExpr' && e.op === '+');
          const guard = (s: string, e: Expr) =>
            isSafe(e) ? `${s}.toString()` : `(((${s}) as dynamic)?.toString() ?? '')`;
          return `${guard(leftStr, expr.left)} + ${guard(rightStr, expr.right)}`;
        }
        if (expr.op === 'and') return `${leftStr} && ${rightStr}`;
        if (expr.op === 'or') return `${leftStr} || ${rightStr}`;
        return `${leftStr} ${expr.op} ${rightStr}`;
      }
      case 'UnaryExpr':
        return `!${this.exprToDart(expr.operand)}`;
      case 'IsExpr':
        if (expr.check === 'empty') return `${this.exprToDart(expr.target)}.isEmpty`;
        if (expr.check === 'not empty') return `${this.exprToDart(expr.target)}.isNotEmpty`;
        if (expr.check === 'null') return `${this.exprToDart(expr.target)} == null`;
        if (expr.check === 'not null') return `${this.exprToDart(expr.target)} != null`;
        if (expr.check === 'loading') {
          const varName = expr.target.type === 'Ident' ? expr.target.name : '';
          return `_${varName}Loading`;
        }
        if (expr.check === 'error') {
          const varName = expr.target.type === 'Ident' ? expr.target.name : '';
          return `_${varName}Error`;
        }
        return `${this.exprToDart(expr.target)}.isEmpty`;
      case 'LambdaExpr':
        return `(${expr.param}) => ${this.exprToDart(expr.body)}`;
      case 'EqualityExpr':
        return `${this.exprToDart(expr.left)} ${expr.negated ? '!=' : '=='} ${this.exprToDart(expr.right)}`;
      case 'InExpr':
        return `${expr.negated ? '!' : ''}${this.exprToDart(expr.list)}.contains(${this.exprToDart(expr.target)})`;
      case 'ListLit':
        if (expr.elements.length === 0) return '<dynamic>[]';
        return `<dynamic>[${expr.elements.map(e => this.exprToDart(e)).join(', ')}]`;
      case 'ObjectLit':
        return `{${expr.entries.map(e => `'${e.key}': ${this.exprToDart(e.value)}`).join(', ')}}`;
      case 'ObjectUpdate': {
        const baseDart = this.exprToDart(expr.base);
        const overrides = expr.updates.map(u => `'${u.key}': ${this.exprToDart(u.value)}`).join(', ');
        return `{...${baseDart}, ${overrides}}`;
      }
      case 'FieldAccess':
        if (expr.object.type === 'Ident' && expr.object.name === 'shared') {
          return `shared.${expr.field}`;
        }
        return `${this.exprToDart(expr.object)}['${expr.field}']`;
      case 'IndexAccess': {
        const list = this.exprToDart(expr.object);
        const idx = this.exprToDart(expr.index);
        return `(${idx} >= 0 && ${idx} < ${list}.length ? ${list}[${idx}] : null)`;
      }
      case 'FunctionCall':
        return this.genFunctionCallExpr(expr);
      case 'SeenPredicate':
      case 'OnPredicate':
        // Test-scope predicate forms are translated by genTestExpr (test
        // bodies). Reaching them here means a parser bug let one leak into
        // production codegen.
        throw new Error(`Internal error: ${expr.type} reached production exprToDart.`);
    }
  }

  private genFunctionCallExpr(call: { name: string; args: Expr[] }): string {
    const args = call.args.map(a => this.exprToDart(a));
    if (call.name === 'round' && args.length === 2) {
      // `round(value, places)` returns a string with `places` decimals —
      // Dart's toStringAsFixed uses standard rounding and works on both int
      // and double. Added in v0.6.9 as a targeted fix to the "BMI displays
      // 21.456734..." gap flagged by 4/4 cold-test models.
      return `${args[0]}.toStringAsFixed(${args[1]})`;
    }
    if (call.name === 'floor' && args.length === 1) {
      // `floor(x)` returns the largest int <= x. Added in v0.14.3 — needed
      // for time formatting (`m = floor(s / 60)` extracts integer minutes
      // from a float-divided value). Surfaced 2026-04-26 by pomodonut
      // browser-test: format_time(s) couldn't display correct MM:SS without
      // integer extraction since Igni's `/` is always float division.
      return `(${args[0]}).floor()`;
    }
    if (call.name === 'without' && args.length === 2) {
      return `${args[0]}.where((e) => e != ${args[1]}).toList()`;
    }
    if (call.name === 'replace' && args.length === 3) {
      return `${args[0]}.map((e) => e == ${args[1]} ? ${args[2]} : e).toList()`;
    }
    if (call.name === 'filter' && args.length === 2) {
      if (call.args[1].type === 'LambdaExpr') {
        const lambda = call.args[1] as LambdaExpr;
        const body = this.exprToDart(lambda.body);
        return `${args[0]}.where((${lambda.param}) => (${body}) == true).toList()`;
      }
      return `${args[0]}.where(${args[1]}).toList()`;
    }
    if (call.name === 'find' && args.length === 2 && call.args[1].type === 'LambdaExpr') {
      return `${args[0]}.cast<dynamic>().firstWhere(${args[1]}, orElse: () => null)`;
    }
    if (call.name === 'map' && args.length === 2 && call.args[1].type === 'LambdaExpr') {
      const lambda = call.args[1] as LambdaExpr;
      const body = this.exprToDart(lambda.body);
      return `${args[0]}.map((${lambda.param}) => ${body}).toList()`;
    }
    if (call.name === 'reversed' && args.length === 1) {
      return `${args[0]}.reversed.toList()`;
    }
    if (call.name === 'sorted' && args.length === 2 && call.args[1].type === 'LambdaExpr') {
      const lambda = call.args[1] as LambdaExpr;
      const keyA = this.exprToDart(substituteLambdaParam(lambda.body, lambda.param, 'a'));
      const keyB = this.exprToDart(substituteLambdaParam(lambda.body, lambda.param, 'b'));
      return `(List.from(${args[0]})..sort((a, b) => (${keyA} as Comparable).compareTo(${keyB})))`;
    }
    if (call.name === 'length' && args.length === 1) {
      return `${args[0]}.length`;
    }
    if (call.name === 'count' && args.length === 2) {
      return `${args[0]}.where((e) => e == ${args[1]}).length`;
    }
    if (call.name === 'contains' && args.length === 2) {
      return `${args[0]}.toString().toLowerCase().contains(${args[1]}.toString().toLowerCase())`;
    }
    if (call.name === 'upper' && args.length === 1) {
      return `${args[0]}.toString().toUpperCase()`;
    }
    if (call.name === 'lower' && args.length === 1) {
      return `${args[0]}.toString().toLowerCase()`;
    }
    if (call.name === 'random' && args.length === 2) {
      return `(Random().nextInt(${args[1]} - ${args[0]} + 1) + ${args[0]})`;
    }
    if (call.name === 'now' && args.length === 0) {
      // v0.14: integer seconds since 1970-01-01 UTC. Non-reactive — bare
      // calls are evaluated at the moment of the call, no caching, no
      // reactivity hookup. Captured timestamps live in regular state vars.
      // v0.19: in test mode, `now()` reads from `_igniMockedNow` first if set
      // by `mock now:` or `freeze_time:`. Falls back to wall clock otherwise.
      if (this.testMode) {
        return `(_igniMockedNow ?? (DateTime.now().millisecondsSinceEpoch ~/ 1000))`;
      }
      return `(DateTime.now().millisecondsSinceEpoch ~/ 1000)`;
    }
    if (call.name === 'spring' && args.length === 1) {
      // v0.19: spring(value) consumed by `label` is intercepted in genLabel
      // and lowered to TweenAnimationBuilder<double>. Reaching this fallback
      // means the spring is at a non-label position (condition, arithmetic,
      // layout property, etc.) — the validator rejects those, but for any
      // path that reaches here we degrade to the target value (no animation).
      return args[0];
    }
    if (call.name === 'locate') {
      // `locate()` is screen-body only — handled in the VariableDecl path
      // above. Reaching this point means it was used as a sub-expression
      // (e.g. `if locate() is loading:` or `coords = locate().latitude`),
      // which the spec doesn't permit.
      throw new TranspileError(
        '`locate()` is only valid as a top-level screen-body assignment ' +
        '(e.g. `here = locate()`). It cannot be used as a sub-expression.',
        1, 1
      );
    }
    return `${call.name}(${args.join(', ')})`;
  }

  private exprToDisplayStr(expr: Expr): string {
    switch (expr.type) {
      case 'StringLit': return `'${expr.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
      case 'NumberLit': return `'${expr.value}'`;
      case 'Ident':     return "'" + '$' + expr.name + "'";
      case 'BinaryExpr':
        return this.exprToDart(expr);
      case 'UnaryExpr':
      case 'IsExpr':
      case 'ListLit':
      case 'ObjectLit':
      case 'ObjectUpdate':
        return "'" + '${' + this.exprToDart(expr) + "}'";
      case 'FieldAccess':
      case 'IndexAccess':
      case 'FunctionCall':
        // Null-safe coercion: hot reload on Flutter Web can leave a previously-
        // valid reference as JS undefined while old widget state is still
        // mounted (mum's `HELP.md` 2026-04-26: `Cannot read properties of
        // undefined (reading 'Symbol(dartx.toString)')`). `?.toString() ?? ''`
        // returns '' for null/undefined; the outer parens keep `??` from
        // grabbing the `+` neighbours in concatenated label strings.
        return '(((' + this.exprToDart(expr) + ') as dynamic)?.toString() ?? \'\')';
      case 'LambdaExpr':
      case 'EqualityExpr':
      case 'InExpr':
        return "'" + '${' + this.exprToDart(expr) + "}'";
      case 'SeenPredicate':
      case 'OnPredicate':
        throw new Error(`Internal error: ${expr.type} reached production exprToDisplayStr.`);
    }
  }

  private exprToConstStr(expr: Expr): string {
    switch (expr.type) {
      case 'StringLit': return `'${expr.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
      default: return this.exprToDisplayStr(expr);
    }
  }

  // -- Property helpers --

  private detectBuiltin(program: Program, name: string): boolean {
    const filterUI = (items: (UINode | VariableDecl)[]) => items.filter((item): item is UINode => item.type !== 'VariableDecl');
    const checkEvent = (n: UINode): boolean => {
      if (!('events' in n)) return false;
      return n.events.some(e => e.action.type === 'FunctionCall' && e.action.name === name);
    };
    const check = (nodes: UINode[]): boolean => {
      for (const n of nodes) {
        if (checkEvent(n)) return true;
        if (n.type === 'Layout' && (check(n.children) || checkEvent(n))) return true;
        if (n.type === 'If' && (check(filterUI(n.then)) || (n.else_ ? check(filterUI(n.else_)) : false))) return true;
        if (n.type === 'Each' && check(n.children)) return true;
      }
      return false;
    };
    const checkExpr = (e: Expr): boolean => {
      if (e.type === 'FunctionCall' && e.name === name) return true;
      if (e.type === 'BinaryExpr') return checkExpr(e.left) || checkExpr(e.right);
      return false;
    };
    const checkStmts = (stmts: Statement[]): boolean => {
      for (const s of stmts) {
        if (s.type === 'FunctionCall' && s.name === name) return true;
        if (s.type === 'Assignment' && checkExpr(s.value)) return true;
        if (s.type === 'IfStmt' && (checkStmts(s.then) || (s.else_ ? checkStmts(s.else_) : false))) return true;
        if (s.type === 'EachStmt' && checkStmts(s.body)) return true;
      }
      return false;
    };
    for (const screen of program.screens) {
      const uiNodes = screen.body.filter(i => i.type !== 'VariableDecl' && i.type !== 'FunctionDef' && i.type !== 'Every') as UINode[];
      if (check(uiNodes)) return true;
      for (const item of screen.body) {
        if (item.type === 'FunctionDef' && checkStmts(item.body)) return true;
        if (item.type === 'VariableDecl' && checkExpr(item.value)) return true;
        // v0.14.2: `every` blocks also count toward the program-level builtin
        // detection (used to gate imports). Without this, a `play()` /
        // `random()` / etc. called only inside an `every` block emits the
        // field initialiser (detectBuiltinInScreen catches it) but skips
        // the corresponding import (detectBuiltin missed it). Caught
        // 2026-04-26 during pomodonut browser-test.
        if (item.type === 'Every' && checkStmts(item.body)) return true;
      }
    }
    return false;
  }

  private detectBuiltinInScreen(screen: Screen, name: string): boolean {
    const checkEvent = (n: UINode): boolean => {
      if (!('events' in n)) return false;
      return n.events.some(e => e.action.type === 'FunctionCall' && e.action.name === name);
    };
    const filterUI = (items: (UINode | VariableDecl)[]) => items.filter((item): item is UINode => item.type !== 'VariableDecl');
    const checkNodes = (nodes: UINode[]): boolean => {
      for (const n of nodes) {
        if (checkEvent(n)) return true;
        if (n.type === 'Layout' && checkNodes(n.children)) return true;
        if (n.type === 'If' && (checkNodes(filterUI(n.then)) || (n.else_ ? checkNodes(filterUI(n.else_)) : false))) return true;
        if (n.type === 'Each' && checkNodes(n.children)) return true;
      }
      return false;
    };
    const checkStmts = (stmts: Statement[]): boolean => {
      for (const s of stmts) {
        if (s.type === 'FunctionCall' && s.name === name) return true;
        if (s.type === 'IfStmt' && (checkStmts(s.then) || (s.else_ ? checkStmts(s.else_) : false))) return true;
        if (s.type === 'EachStmt' && checkStmts(s.body)) return true;
      }
      return false;
    };
    for (const item of screen.body) {
      if (item.type === 'FunctionDef' && checkStmts(item.body)) return true;
      if (item.type === 'Every' && checkStmts(item.body)) return true;
      if (item.type !== 'VariableDecl' && item.type !== 'FunctionDef' && item.type !== 'Every') {
        if (checkNodes([item])) return true;
      }
    }
    return false;
  }

}
