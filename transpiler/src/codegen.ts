import {
  Program, Screen, ScreenItem, VariableDecl,
  UINode, Layout, LabelNode, ButtonNode, InputNode, ToggleNode, IfNode, EachNode,
  ComponentDef, ComponentItem, ComponentInvocation,
  Property, EventHandler, FunctionDef, Statement, Expr, Ident, IsExpr, NodeBase,
  LambdaExpr, EqualityExpr, IconNode, ImageNode, SliderNode, CheckboxNode, DropdownNode, BadgeNode,
  SourceLocation,
} from './ast.js';
import {
  findProp, resolveIdentName, resolveDesignToken, resolveStyle,
  resolveAlign, resolveBackground, resolveColor, mapIconName,
  inferType, isStringExpr, substituteLambdaParam, isImageBackground,
  generateIconLookupHelper, isDarkBackgroundExpr, generateStyleValueResolvers,
  isColorTokenName, isStyleValueName, isStyleValueExpr,
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
  boundInputVars: string[];
  screenParams: readonly string[];
  isComponent: boolean;
}

function newScreenContext(): ScreenContext {
  return { stateVars: [], boundInputVars: [], screenParams: [], isComponent: false };
}

export class CodeGenerator {
  private ctx: ScreenContext = newScreenContext();
  private functionParams: string[] = [];
  private declaredLocals: Set<string> = new Set();

  private indent(depth: number): string {
    return '  '.repeat(depth);
  }
  private allScreens: Screen[] = [];

  private allComponents: ComponentDef[] = [];
  private fetchVars: { name: string; url: string; urlExpr: Expr; method?: string; body?: string; reactive: boolean }[] = [];

  private hasShared = false;
  private hasFetch = false;
  private needsIconLookup = false;
  private needsStyleResolvers = false;
  private emitLineMarkers = false;

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
    this.validateEmitPlacement(program);
    this.validateAsyncReactivity(program);
    this.validateSharedPrefix(program);
    const firstName = program.screens[0].name;

    // Detect if any screen uses fetch
    this.hasFetch = program.screens.some(s =>
      s.body.some(item => item.type === 'VariableDecl' && item.value.type === 'FunctionCall' && item.value.name === 'fetch')
    );

    // Detect random usage by checking if any generated code will use Random()
    const hasRandom = this.detectBuiltin(program, 'random');
    const hasAudio = this.detectBuiltin(program, 'play');

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
    const igniTheme = `theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFEB1555)${brightness}))`;
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
      code += '\n' + generateStyleValueResolvers() + '\n';
    }

    if (!emitLineMarkers) {
      return { dart: code, lineMap: [] };
    }
    return this.stripLineMarkers(code);
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
    if (expr.type === 'Ident' && expr.name === 'card' && !this.isUserDeclaredName(expr.name)) {
      throw new TranspileError('`card` is background-only. Use it with `background:`, not `color:`.', expr.loc?.line ?? 1, expr.loc?.column ?? 1);
    }
    if (this.isBuiltinStyleValue(expr) && expr.type === 'Ident' && isColorTokenName(expr.name)) {
      return resolveColor(expr);
    }
    this.needsStyleResolvers = true;
    return `_igniColorValue(context, ${this.exprToDart(expr)})`;
  }

  private genBackgroundValue(expr: Expr): string {
    if (this.isBuiltinStyleValue(expr)) {
      return resolveBackground(expr);
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
    this.ctx = { stateVars: [], boundInputVars: [], screenParams: screen.params, isComponent: false };
    const stateDecls: string[] = [];
    const uiNodes: UINode[] = [];
    const funcDefs: FunctionDef[] = [];

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
          });
          this.ctx.stateVars.push(item.name);
        } else if (buildLocalVars.has(item.name) || inBuildLocals) {
          // Variable is conditionally reassigned or follows one — build() local
          inBuildLocals = true;
          this.ctx.stateVars.push(item.name);
          const alreadyDeclared = buildLocals.some(l => l.includes(`var ${item.name} `));
          buildLocals.push(this.withMarker(item, `local:${item.name}`, alreadyDeclared
            ? `    ${item.name} = ${this.exprToDart(item.value)};`
            : `    var ${item.name} = ${this.exprToDart(item.value)};`));
        } else {
          this.ctx.stateVars.push(item.name);
          stateDecls.push(this.genStateVar(item));
        }
      } else if (item.type === 'FunctionDef') {
        funcDefs.push(item);
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
    } else if (uiNodes.length === 1) {
      bodyWidget = this.genUINode(uiNodes[0], 3);
      // `fill: true` on the screen's root layout wraps it in Expanded, but
      // Expanded must live inside a Flex widget — as a Scaffold body it throws
      // at render time. Strip the outer wrapper; the Scaffold body already
      // fills available space.
      bodyWidget = this.unwrapScreenRootExpanded(bodyWidget);
    } else {
      // Implicit vertical layout — multiple children without explicit layout wrapper
      const children = uiNodes.map(n => n.type === 'Comment' ? this.genUINode(n, 4) : this.genUINode(n, 4) + ',').join('\n');
      bodyWidget = `      Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n${children}\n        ],\n      )`;
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

    // initState (controllers + fetch calls)
    const needsInitState = hasControllers || hasFetchVars;
    if (needsInitState) {
      const initLines: string[] = [];
      for (const v of this.ctx.boundInputVars) {
        initLines.push(`    _${v}Controller = TextEditingController(text: ${v});`);
      }
      for (const f of this.fetchVars) {
        initLines.push(`    _fetch${f.name[0].toUpperCase() + f.name.slice(1)}();`);
      }
      preBuild += `\n\n  @override\n  void initState() {\n    super.initState();\n${initLines.join('\n')}\n  }`;
    }

    // dispose (controllers only)
    if (hasControllers) {
      const disposals = this.ctx.boundInputVars
        .map(v => `    _${v}Controller.dispose();`)
        .join('\n');
      preBuild += `\n\n  @override\n  void dispose() {\n${disposals}\n    super.dispose();\n  }`;
    }

    // Fetch methods
    for (const f of this.fetchVars) {
      preBuild += '\n\n' + this.genFetchMethod(f);
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
    if (hasImageBg) {
      const imgSrc = this.exprToDart(screenBgProp!.value);
      scaffoldParts.push(`      body: Container(\n        width: double.infinity,\n        height: double.infinity,\n        decoration: const BoxDecoration(\n          image: DecorationImage(\n            image: AssetImage('assets/' + ${imgSrc}),\n            fit: BoxFit.cover,\n          ),\n        ),\n        child: SafeArea(\n          child: ${bodyWidget.trimStart()},\n        ),\n      )`);
    } else if (titleProp || scaffoldBg) {
      scaffoldParts.push(`      body: ${bodyWidget.trimStart()}`);
    } else {
      scaffoldParts.push(`      body: SingleChildScrollView(\n        child: ${bodyWidget.trimStart()},\n      )`);
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

  private genUINode(node: UINode, depth: number, inRow = false): string {
    let code = '';
    switch (node.type) {
      case 'Layout': code = this.genLayout(node, depth); break;
      case 'Label':  code = this.genLabel(node, depth); break;
      case 'Button': code = this.genButton(node, depth, inRow); break;
      case 'Input':  code = this.genInput(node, depth, inRow); break;
      case 'Toggle': code = this.genToggle(node, depth); break;
      case 'If':     code = this.genIf(node, depth); break;
      case 'Each':   code = this.genEach(node, depth); break;
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

    // Build children with spacers
    const isRow = node.direction === 'horizontal';
    const childLines: string[] = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.type === 'Comment') {
        childLines.push(this.genUINode(child, colDepth + 2, isRow));
      } else {
        childLines.push(`${this.genUINode(child, colDepth + 2, isRow)},`);
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

    // Circle buttons never stretch to full width — their whole point is being
    // a compact tap target. Row context already skipped the SizedBox wrap;
    // circle extends that to the column case.
    const compact = inRow || isCircle;
    let code: string;
    if (compact) {
      code = `${ind}ElevatedButton(\n`;
      code += `${ind}  style: ElevatedButton.styleFrom(${styleParts.join(', ')}),\n`;
      if (tapEvent) {
        code += this.genOnPressed(tapEvent, depth + 1);
      }
      code += `${ind}  child: ${textChild},\n`;
      code += `${ind})`;
    } else {
      code = `${ind}SizedBox(\n${ind}  width: double.infinity,\n${ind}  child: ElevatedButton(\n`;
      code += `${ind}    style: ElevatedButton.styleFrom(${styleParts.join(', ')}),\n`;
      if (tapEvent) {
        code += this.genOnPressed(tapEvent, depth + 2);
      }
      code += `${ind}    child: ${textChild},\n`;
      code += `${ind}  ),\n`;
      code += `${ind})`;
    }
    return code;
  }

  private genInput(node: InputNode, depth: number, inRow = false): string {
    const ind = this.indent(depth);
    const placeholder = findProp(node.properties, 'placeholder');
    const changeEvent = node.events.find(e => e.event === 'change');

    let code = `${ind}TextField(\n`;
    code += `${ind}  controller: _${node.bind}Controller,\n`;
    code += `${ind}  onChanged: (value) {\n`;
    code += `${ind}    setState(() {\n`;
    code += `${ind}      ${node.bind} = value;\n`;
    code += `${ind}    });\n`;
    if (changeEvent) {
      code += this.genChangeActionBody(changeEvent, depth + 2);
    }
    code += `${ind}  },\n`;
    if (placeholder) {
      const hint = this.exprToConstStr(placeholder.value);
      code += `${ind}  decoration: const InputDecoration(hintText: ${hint}),\n`;
    }
    code += `${ind})`;
    if (inRow) {
      code = `${ind}Expanded(\n${ind}  child: ${code.trimStart()},\n${ind})`;
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
      code += `${ind}    setState(() {\n`;
      code += `${ind}      ${node.bind} = value;\n`;
      code += `${ind}    });\n`;
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
    code += `${ind}    setState(() {\n`;
    code += `${ind}      ${node.bind} = value;\n`;
    code += `${ind}    });\n`;
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
    code += `${ind}    setState(() {\n`;
    code += `${ind}      ${node.bind} = value.round();\n`;
    code += `${ind}    });\n`;
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
      code += `${ind}    setState(() {\n`;
      code += `${ind}      ${node.bind} = value ?? false;\n`;
      code += `${ind}    });\n`;
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
    code += `${ind}    setState(() {\n`;
    code += `${ind}      ${node.bind} = value ?? false;\n`;
    code += `${ind}    });\n`;
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
    code += `${ind}    setState(() {\n`;
    code += `${ind}      ${node.bind} = value;\n`;
    code += `${ind}    });\n`;
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

  private genEach(node: EachNode, depth: number): string {
    const ind = this.indent(depth);
    const listExpr = this.exprToDart(node.list);

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
      const uiNodes = screen.body.filter((i): i is UINode => i.type !== 'VariableDecl' && i.type !== 'FunctionDef');
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
      if (boundInputs.size === 0) continue;
      for (const item of screen.body) {
        if (item.type !== 'VariableDecl') continue;
        if (item.value.type !== 'FunctionCall' || item.value.name !== 'fetch') continue;
        const urlArg = item.value.args[0];
        if (!urlArg) continue;
        const offender = this.findReactiveDepOnInput(urlArg, boundInputs);
        if (offender) {
          throw new TranspileError(
            `\`fetch\` URL reactively depends on \`${offender.name}\`, which is bound to an input. ` +
            `This re-fires the fetch on every keystroke. Use a trigger variable: bind the input to ` +
            `\`${offender.name}\`, then set a separate variable from a button or \`on change:\` handler, ` +
            `and fetch from that variable instead.`,
            offender.loc?.line ?? 1,
            offender.loc?.column ?? 1
          );
        }
      }
    }
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
      (i): i is UINode => i.type !== 'VariableDecl' && i.type !== 'FunctionDef'
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
        (i): i is UINode => i.type !== 'VariableDecl' && i.type !== 'FunctionDef'
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
        const paramName = decl?.argName ?? null;
        const sig = paramName ? `(${paramName})` : `()`;
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
        code = `${ind}for (final ${s.variable} in ${this.exprToDart(s.list)}) {\n`;
        code += this.genStmtBlock(s.body, depth + 1);
        code += `${ind}}\n`;
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
          return `${leftStr}.toString() + ${rightStr}.toString()`;
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
        return this.exprToDart(expr) + '.toString()';
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
      const uiNodes = screen.body.filter(i => i.type !== 'VariableDecl' && i.type !== 'FunctionDef') as UINode[];
      if (check(uiNodes)) return true;
      for (const item of screen.body) {
        if (item.type === 'FunctionDef' && checkStmts(item.body)) return true;
        if (item.type === 'VariableDecl' && checkExpr(item.value)) return true;
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
      if (item.type !== 'VariableDecl' && item.type !== 'FunctionDef') {
        if (checkNodes([item])) return true;
      }
    }
    return false;
  }

}
