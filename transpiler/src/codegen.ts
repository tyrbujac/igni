import {
  Program, Screen, ScreenItem, VariableDecl,
  UINode, Layout, LabelNode, ButtonNode, InputNode, ToggleNode, IfNode, EachNode,
  ComponentDef, ComponentItem, ComponentInvocation,
  Property, EventHandler, FunctionDef, EveryNode, Statement, Expr, Ident, IsExpr, NodeBase,
  LambdaExpr, EqualityExpr, IconNode, ImageNode, SliderNode, CheckboxNode, DropdownNode, BadgeNode,
  SourceLocation,
  ThemeBlock, ThemeTextTokenName,
} from './ast.js';
import {
  findProp, resolveIdentName, resolveDesignToken, resolveMaxWidthToken, resolveStyle,
  resolveAlign, resolveBackground, resolveColor, mapIconName,
  inferType, isStringExpr, substituteLambdaParam, isImageBackground,
  generateIconLookupHelper, isDarkBackgroundExpr, generateStyleValueResolvers,
  isColorTokenName, isStyleValueName, isStyleValueExpr,
  resolveFontToken,
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
}

function newScreenContext(): ScreenContext {
  return { stateVars: [], stateVarTypes: {}, boundInputVars: [], screenParams: [], isComponent: false };
}

export class CodeGenerator {
  private ctx: ScreenContext = newScreenContext();
  private functionParams: string[] = [];
  private declaredLocals: Set<string> = new Set();

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
  private hasFetch = false;
  private needsIconLookup = false;
  private needsStyleResolvers = false;
  private emitLineMarkers = false;
  // v0.15.0: theme: color: <token>: "<hex>" overrides + user-defined tokens.
  // Populated from program.theme.color at build start; consulted by
  // resolveColor / resolveBackground / _igniColorValue runtime resolver.
  private themeColors: Record<string, string> = {};

  generate(program: Program): string {
    return this.build(program, false).dart;
  }

  generateWithSourceMap(program: Program): GeneratedOutput {
    return this.build(program, true);
  }

  private build(program: Program, emitLineMarkers: boolean): GeneratedOutput {
    this.emitLineMarkers = emitLineMarkers;
    this.allScreens = program.screens;
    this.allComponents = program.components;
    this.hasShared = program.shared.length > 0;
    // v0.15.0: load theme.color overrides + user-defined tokens.
    this.themeColors = {};
    if (program.theme) {
      for (const t of program.theme.color) {
        this.themeColors[t.name] = t.hex;
      }
    }
    this.validateEmitPlacement(program);
    this.validateAsyncReactivity(program);
    this.validateSharedPrefix(program);
    this.validateCountLambda(program);
    this.validateButtonTap(program);

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

    let code = `import 'package:flutter/material.dart';\n`;
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
    const brightness = anyDarkScreen ? ', brightness: Brightness.dark' : '';
    // Dark-screen apps keep Material's dark surface; light-screen apps get an
    // explicit neutral off-white so the pink-seeded surface doesn't tint the
    // viewport. Brand colour stays as ColorScheme.primary for ElevatedButton.
    const scaffoldBg = anyDarkScreen ? '' : ', scaffoldBackgroundColor: const Color(0xFFFAFAFA)';
    const textTheme = this.buildTextTheme(program.theme);
    // v0.15.0: theme: color: brand: "#X" overrides the MaterialApp seed.
    const seedHex = this.themeColors['brand']
      ? `0xFF${this.themeColors['brand'].slice(1).toUpperCase().padStart(6, '0')}`
      : '0xFFEB1555';
    const igniTheme = `theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(${seedHex})${brightness})${scaffoldBg}, textTheme: ${textTheme})`;
    if (this.hasShared) {
      code += this.genSharedState(program.shared) + '\n';
      code += `void main() {\n  runApp(ListenableBuilder(\n    listenable: shared,\n    builder: (context, child) => MaterialApp(debugShowCheckedModeBanner: false, ${igniTheme}, home: ${firstName}Screen()),\n  ));\n}\n`;
    } else {
      code += `void main() {\n  runApp(MaterialApp(debugShowCheckedModeBanner: false, ${igniTheme}, home: ${firstName}Screen()));\n}\n`;
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
    if (this.needsStyleResolvers) {
      code += '\n' + generateStyleValueResolvers(this.themeColors) + '\n';
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
  //   heading  → headlineLarge + mirror to headlineSmall (so `heading.small` inherits)
  //   body     → bodyLarge + bodyMedium (bodyMedium is the default unstyled label)
  //   caption  → bodySmall
  //
  // The family string (e.g. 'Pacifico') must match one of the entries that
  // syncFonts() registers under `flutter.fonts:` in pubspec.yaml. Both trace
  // back to FONT_MAP in codegen-helpers.ts, which is the single source of
  // truth for the six curated v0.12.1 tokens. TTFs live in assets/fonts/ at
  // the repo root and are copied into .igni/assets/fonts/ on every run
  // (offline-first, no runtime CDN fetch — see docs/private/87).
  private buildTextTheme(theme?: ThemeBlock): string {
    const baseBodyMedium = 'bodyMedium: TextStyle(fontSize: 17, height: 1.5)';
    if (!theme || !theme.text.some(t => t.font)) {
      return `const TextTheme(${baseBodyMedium})`;
    }
    const fontOf = (name: ThemeTextTokenName): string | undefined =>
      theme.text.find(t => t.token === name)?.font;
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
    const methodName = `_locate${fv.name[0].toUpperCase() + fv.name.slice(1)}`;
    let code = `  Future<void> ${methodName}() async {\n`;
    code += `    try {\n`;
    code += `      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();\n`;
    code += `      if (!serviceEnabled) {\n`;
    code += `        setState(() { _${fv.name}Error = true; _${fv.name}Loading = false; });\n`;
    code += `        return;\n`;
    code += `      }\n`;
    code += `      LocationPermission permission = await Geolocator.checkPermission();\n`;
    code += `      if (permission == LocationPermission.denied) {\n`;
    code += `        permission = await Geolocator.requestPermission();\n`;
    code += `        if (permission == LocationPermission.denied) {\n`;
    code += `          setState(() { _${fv.name}Error = true; _${fv.name}Loading = false; });\n`;
    code += `          return;\n`;
    code += `        }\n`;
    code += `      }\n`;
    code += `      if (permission == LocationPermission.deniedForever) {\n`;
    code += `        setState(() { _${fv.name}Error = true; _${fv.name}Loading = false; });\n`;
    code += `        return;\n`;
    code += `      }\n`;
    code += `      Position pos = await Geolocator.getCurrentPosition();\n`;
    code += `      setState(() {\n`;
    code += `        ${fv.name} = {'latitude': pos.latitude, 'longitude': pos.longitude};\n`;
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

    if (fv.body && dartMethod !== 'get') {
      code += `      final response = await http.${dartMethod}(\n`;
      code += `        Uri.parse(${fv.url}),\n`;
      code += `        headers: {'Content-Type': 'application/json'},\n`;
      code += `        body: jsonEncode(${fv.body}),\n`;
      code += `      );\n`;
    } else {
      code += `      final response = await http.${dartMethod}(Uri.parse(${fv.url}));\n`;
    }

    code += `      if (response.statusCode == 200) {\n`;
    code += `        setState(() {\n`;
    code += `          ${fv.name} = jsonDecode(response.body);\n`;
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
      return resolveColor(expr, this.themeColors);
    }
    if (this.isBuiltinStyleValue(expr) && expr.type === 'Ident' && isColorTokenName(expr.name)) {
      return resolveColor(expr, this.themeColors);
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
      return resolveBackground(expr, this.themeColors);
    }
    if (this.isBuiltinStyleValue(expr)) {
      return resolveBackground(expr, this.themeColors);
    }
    this.needsStyleResolvers = true;
    return `_igniBackgroundValue(context, ${this.exprToDart(expr)})`;
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

  private genScreen(screen: Screen): string {
    this.ctx = { stateVars: [], stateVarTypes: {}, boundInputVars: [], screenParams: screen.params, isComponent: false };
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
        if (this.exprRefsAny(decl.value, allDeclNames)) {
          buildLocalVars.add(decl.name);
          changedDerived = true;
        }
      }
    }

    let inBuildLocals = false;
    for (const item of screen.body) {
      if (item.type === 'VariableDecl') {
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
          `    _everyTimer${i} = Timer.periodic(const Duration(seconds: ${block.seconds}), (_) {\n${body}\n    });`
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
    const scaffoldBg = (screenBgProp && !hasImageBg) ? this.genBackgroundValue(screenBgProp.value) : '';

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

  private collectBoundInputs(nodes: UINode[]): void {
    for (const node of nodes) {
      if (node.type === 'Input') {
        this.ctx.boundInputVars.push(node.bind);
      } else if (node.type === 'Layout') {
        this.collectBoundInputs(node.children);
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

    // Empty layout: skip Column, just use Container for background/fill
    if (node.children.length === 0) {
      let code = 'const SizedBox()';
      const bgProp = findProp(node.properties, 'background');
      const roundedProp = findProp(node.properties, 'rounded');
      if (bgProp || roundedProp) {
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
    if (bgProp || roundedProp) {
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

  // A `button` with no `on tap:` modifier codegens to an ElevatedButton with
  // no `onPressed` — dead UI the user can't interact with. The tutorial rerun
  // on 2026-04-24 surfaced this as a real beginner footgun (an empty button
  // appears pressable but does nothing). Reject at codegen with a fix-it.
  private validateButtonTap(program: Program): void {
    const walkUI = (nodes: UINode[]): void => {
      for (const n of nodes) {
        switch (n.type) {
          case 'Button':
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
        const body = this.genCallbackBody(ev.action, depth + 1);
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

  private genStmt(s: Statement, depth: number): string {
    const ind = this.indent(depth);
    let code = '';
    switch (s.type) {
      case 'Assignment': {
        if (s.target.startsWith('shared.')) {
          code = `${ind}shared.update(() {\n${ind}  ${s.target} = ${this.exprToDart(s.value)};\n${ind}});\n`;
          break;
        }
        const isStateVar = this.ctx.stateVars.includes(s.target);
        if (isStateVar) {
          this.checkIntDivideAssignment(s.target, s.value);
          code = `${ind}setState(() {\n${ind}  ${s.target} = ${this.exprToDart(s.value)};\n${ind}});\n`;
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
        if (expr.elements.length === 0) return '[]';
        return `[${expr.elements.map(e => this.exprToDart(e)).join(', ')}]`;
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
      return `(DateTime.now().millisecondsSinceEpoch ~/ 1000)`;
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
