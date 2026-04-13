import {
  Program, Screen, ScreenItem, VariableDecl,
  UINode, Layout, LabelNode, ButtonNode, InputNode, ToggleNode, IfNode, EachNode,
  ComponentDef, ComponentInvocation,
  Property, EventHandler, FunctionDef, Statement, Expr, IsExpr,
  LambdaExpr, EqualityExpr,
} from './ast.js';

const DESIGN_TOKENS: Record<string, number> = {
  small: 8,
  medium: 16,
  large: 24,
};

const STYLE_MAP: Record<string, string> = {
  heading: 'Theme.of(context).textTheme.headlineLarge!',
  'heading.small': 'Theme.of(context).textTheme.headlineSmall!',
  body: 'Theme.of(context).textTheme.bodyLarge!',
  caption: 'Theme.of(context).textTheme.bodySmall!',
};

const COLOR_MAP: Record<string, string> = {
  brand: 'Theme.of(context).colorScheme.primary',
  subtle: 'Colors.grey',
  danger: 'Colors.red',
  green: 'Colors.green',
  red: 'Colors.red',
  blue: 'Colors.blue',
  white: 'Colors.white',
  black: 'Colors.black',
  yellow: 'Colors.yellow',
  orange: 'Colors.orange',
  purple: 'Colors.purple',
};

const ALIGN_MAP: Record<string, string> = {
  start: 'MainAxisAlignment.start',
  center: 'MainAxisAlignment.center',
  end: 'MainAxisAlignment.end',
};

export class CodeGenerator {
  private stateVars: string[] = [];
  private boundInputVars: string[] = [];
  private screenParams: string[] = [];
  private isComponent = false;
  private functionParams: string[] = [];
  private declaredLocals: Set<string> = new Set();
  private allScreens: Screen[] = [];

  private allComponents: ComponentDef[] = [];
  private fetchVars: { name: string; url: string }[] = [];

  private hasShared = false;
  private hasFetch = false;

  generate(program: Program): string {
    this.allScreens = program.screens;
    this.allComponents = program.components;
    this.hasShared = program.shared.length > 0;
    const firstName = program.screens[0].name;

    // Detect if any screen uses fetch
    this.hasFetch = program.screens.some(s =>
      s.body.some(item => item.type === 'VariableDecl' && item.value.type === 'FunctionCall' && item.value.name === 'fetch')
    );

    // Detect random usage by checking if any generated code will use Random()
    const hasRandom = this.detectBuiltin(program, 'random');

    let code = `import 'package:flutter/material.dart';\n`;
    if (this.hasFetch) {
      code += `import 'package:http/http.dart' as http;\n`;
      code += `import 'dart:convert';\n`;
    }
    if (hasRandom) {
      code += `import 'dart:math';\n`;
    }
    code += '\n';

    if (this.hasShared) {
      code += this.genSharedState(program.shared) + '\n';
      code += `void main() {\n  runApp(ListenableBuilder(\n    listenable: shared,\n    builder: (context, child) => MaterialApp(home: ${firstName}Screen()),\n  ));\n}\n`;
    } else {
      code += `void main() {\n  runApp(const MaterialApp(home: ${firstName}Screen()));\n}\n`;
    }

    for (const comp of program.components) {
      code += '\n' + this.genComponentDef(comp);
    }

    for (const screen of program.screens) {
      code += '\n' + this.genScreen(screen);
    }

    return code;
  }

  private genSharedState(vars: VariableDecl[]): string {
    const fields = vars.map(v => {
      const dartType = this.inferType(v.value, v.typeHint);
      const dartValue = this.exprToDart(v.value);
      return `  ${dartType} ${v.name} = ${dartValue};`;
    }).join('\n');

    let code = `class SharedState extends ChangeNotifier {\n`;
    code += fields + '\n\n';
    code += `  void update(void Function() fn) {\n    fn();\n    notifyListeners();\n  }\n`;
    code += `}\n\n`;
    code += `final shared = SharedState();\n`;
    return code;
  }

  private genFetchMethod(varName: string, url: string): string {
    const methodName = `_fetch${varName[0].toUpperCase() + varName.slice(1)}`;
    let code = `  Future<void> ${methodName}() async {\n`;
    code += `    try {\n`;
    code += `      final response = await http.get(Uri.parse(${url}));\n`;
    code += `      if (response.statusCode == 200) {\n`;
    code += `        setState(() {\n`;
    code += `          ${varName} = jsonDecode(response.body);\n`;
    code += `          _${varName}Loading = false;\n`;
    code += `        });\n`;
    code += `      } else {\n`;
    code += `        setState(() {\n`;
    code += `          _${varName}Error = true;\n`;
    code += `          _${varName}Loading = false;\n`;
    code += `        });\n`;
    code += `      }\n`;
    code += `    } catch (e) {\n`;
    code += `      setState(() {\n`;
    code += `        _${varName}Error = true;\n`;
    code += `        _${varName}Loading = false;\n`;
    code += `      });\n`;
    code += `    }\n`;
    code += `  }`;
    return code;
  }

  private genScreen(screen: Screen): string {
    this.stateVars = [];
    this.boundInputVars = [];
    this.screenParams = screen.params;
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
    if (hasConditionalAssignment) {
      const allDecls = screen.body.filter(i => i.type === 'VariableDecl') as VariableDecl[];
      const isSimpleLiteral = (v: VariableDecl) => {
        const t = v.value.type;
        return t === 'StringLit' || t === 'NumberLit' || (t === 'Ident' && (v.value as any).name === 'true' || (v.value as any).name === 'false') || t === 'ListLit';
      };
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

    let inBuildLocals = false;
    for (const item of screen.body) {
      if (item.type === 'VariableDecl') {
        // Detect fetch variables
        if (item.value.type === 'FunctionCall' && item.value.name === 'fetch') {
          const url = item.value.args[0];
          this.fetchVars.push({ name: item.name, url: this.exprToDart(url) });
          this.stateVars.push(item.name);
        } else if (buildLocalVars.has(item.name) || inBuildLocals) {
          // Variable is conditionally reassigned or follows one — build() local
          inBuildLocals = true;
          this.stateVars.push(item.name);
          const alreadyDeclared = buildLocals.some(l => l.includes(`var ${item.name} `));
          buildLocals.push(alreadyDeclared
            ? `    ${item.name} = ${this.exprToDart(item.value)};`
            : `    var ${item.name} = ${this.exprToDart(item.value)};`);
        } else {
          this.stateVars.push(item.name);
          stateDecls.push(this.genStateVar(item));
        }
      } else if (item.type === 'FunctionDef') {
        funcDefs.push(item);
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
    } else {
      // Implicit vertical layout — multiple children without explicit layout wrapper
      const children = uiNodes.map(n => this.genUINode(n, 4) + ',').join('\n');
      bodyWidget = `      Column(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n${children}\n        ],\n      )`;
    }
    const hasControllers = this.boundInputVars.length > 0;

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
      const fetchDecls = this.fetchVars.map(f =>
        `  dynamic ${f.name};\n  bool _${f.name}Loading = true;\n  bool _${f.name}Error = false;`
      ).join('\n');
      preBuild += (preBuild ? '\n' : '') + fetchDecls;
    }

    if (hasControllers) {
      const controllerDecls = this.boundInputVars
        .map(v => `  late final TextEditingController _${v}Controller;`)
        .join('\n');
      preBuild += (preBuild ? '\n' : '') + controllerDecls;
    }

    // initState (controllers + fetch calls)
    const needsInitState = hasControllers || hasFetchVars;
    if (needsInitState) {
      const initLines: string[] = [];
      for (const v of this.boundInputVars) {
        initLines.push(`    _${v}Controller = TextEditingController(text: ${v});`);
      }
      for (const f of this.fetchVars) {
        initLines.push(`    _fetch${f.name[0].toUpperCase() + f.name.slice(1)}();`);
      }
      preBuild += `\n\n  @override\n  void initState() {\n    super.initState();\n${initLines.join('\n')}\n  }`;
    }

    // dispose (controllers only)
    if (hasControllers) {
      const disposals = this.boundInputVars
        .map(v => `    _${v}Controller.dispose();`)
        .join('\n');
      preBuild += `\n\n  @override\n  void dispose() {\n${disposals}\n    super.dispose();\n  }`;
    }

    // Fetch methods
    for (const f of this.fetchVars) {
      preBuild += '\n\n' + this.genFetchMethod(f.name, f.url);
    }

    for (const func of funcDefs) {
      preBuild += (preBuild ? '\n\n' : '') + this.genFunctionDef(func);
    }

    let stateClass = `class _${name}ScreenState extends State<${name}Screen> {\n`;
    if (preBuild) {
      stateClass += preBuild + '\n\n';
    }
    // Screen-level properties
    const titleProp = this.findProp(screen.properties, 'title');
    const screenBgProp = this.findProp(screen.properties, 'background');
    const scaffoldBg = screenBgProp ? this.resolveBackground(screenBgProp.value) : '';

    stateClass += `  @override\n  Widget build(BuildContext context) {\n`;
    if (buildLocals.length > 0) {
      stateClass += buildLocals.join('\n') + '\n';
    }

    // Build Scaffold parts
    const scaffoldParts: string[] = [];
    if (titleProp) {
      const titleStr = this.exprToDart(titleProp.value);
      const appBarBg = scaffoldBg ? `, backgroundColor: ${scaffoldBg}, foregroundColor: Colors.white` : '';
      scaffoldParts.push(`      appBar: AppBar(title: Text(${titleStr})${appBarBg})`);
    }
    if (scaffoldBg) {
      scaffoldParts.push(`      backgroundColor: ${scaffoldBg}`);
    }
    if (titleProp || scaffoldBg) {
      scaffoldParts.push(`      body: ${bodyWidget.trimStart()}`);
    } else {
      scaffoldParts.push(`      body: SingleChildScrollView(\n        child: ${bodyWidget.trimStart()},\n      )`);
    }
    stateClass += `    return Scaffold(\n${scaffoldParts.join(',\n')},\n    );\n`;
    stateClass += `  }\n}\n`;

    return widgetClass + '\n' + stateClass;
  }

  private exprRefsAny(expr: Expr, names: Set<string>): boolean {
    if (expr.type === 'Ident') return names.has(expr.name);
    if (expr.type === 'FieldAccess') return this.exprRefsAny(expr.object, names);
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
    return code;
  }

  private collectBoundInputs(nodes: UINode[]): void {
    for (const node of nodes) {
      if (node.type === 'Input') {
        this.boundInputVars.push(node.bind);
      } else if (node.type === 'Layout') {
        this.collectBoundInputs(node.children);
      }
    }
  }

  private genStateVar(decl: VariableDecl): string {
    const dartType = this.inferType(decl.value, decl.typeHint);
    const dartValue = this.exprToDart(decl.value);
    const needsLate = this.exprRefsParams(decl.value);
    return needsLate ? `late ${dartType} ${decl.name} = ${dartValue};` : `${dartType} ${decl.name} = ${dartValue};`;
  }

  private exprRefsParams(expr: Expr): boolean {
    if (expr.type === 'Ident') return this.screenParams.includes(expr.name);
    if (expr.type === 'FieldAccess') return this.exprRefsParams(expr.object);
    if (expr.type === 'BinaryExpr') return this.exprRefsParams(expr.left) || this.exprRefsParams(expr.right);
    if (expr.type === 'UnaryExpr') return this.exprRefsParams(expr.operand);
    if (expr.type === 'FunctionCall') return expr.args.some(a => this.exprRefsParams(a));
    if (expr.type === 'LambdaExpr') return this.exprRefsParams(expr.body);
    if (expr.type === 'EqualityExpr') return this.exprRefsParams(expr.left) || this.exprRefsParams(expr.right);
    if (expr.type === 'IsExpr') return this.exprRefsParams(expr.target);
    if (expr.type === 'InExpr') return this.exprRefsParams(expr.target) || this.exprRefsParams(expr.list);
    return false;
  }

  private inferType(expr: Expr, typeHint?: string): string {
    if (typeHint) {
      if (typeHint.startsWith('[') && typeHint.endsWith(']')) {
        return `List<${typeHint.slice(1, -1)}>`;
      }
      return typeHint;
    }
    switch (expr.type) {
      case 'NumberLit': return expr.isFloat ? 'double' : 'int';
      case 'StringLit': return 'String';
      case 'Ident':
        if (expr.name === 'true' || expr.name === 'false') return 'bool';
        return 'var';
      case 'ListLit': return 'List<dynamic>';
      default: return 'var';
    }
  }

  // -- UI node generation --

  private genUINode(node: UINode, depth: number): string {
    switch (node.type) {
      case 'Layout': return this.genLayout(node, depth);
      case 'Label':  return this.genLabel(node, depth);
      case 'Button': return this.genButton(node, depth);
      case 'Input':  return this.genInput(node, depth);
      case 'Toggle': return this.genToggle(node, depth);
      case 'If':     return this.genIf(node, depth);
      case 'Each':   return this.genEach(node, depth);
      case 'Spinner': return `${'  '.repeat(depth)}const CircularProgressIndicator()`;
      case 'Divider': return `${'  '.repeat(depth)}const Divider()`;
      case 'Icon':    return this.genIcon(node, depth);
      case 'Image':   return this.genImage(node, depth);
      case 'Slider':  return this.genSlider(node, depth);
      case 'Checkbox': return this.genCheckbox(node, depth);
      case 'Dropdown': return this.genDropdown(node, depth);
      case 'Badge':   return this.genBadge(node, depth);
      case 'Body':    return `${'  '.repeat(depth)}child`;
      case 'ComponentInvocation': return this.genComponentInvocation(node, depth);
    }
  }

  private genLayout(node: Layout, depth: number): string {
    const widget = node.direction === 'vertical' ? 'Column' : 'Row';
    const alignProp = this.findProp(node.properties, 'align');
    const gapProp = this.findProp(node.properties, 'gap');
    const paddingProp = this.findProp(node.properties, 'padding');
    const gapSize = gapProp ? this.resolveDesignToken(gapProp.value) : null;
    const gapDimension = node.direction === 'vertical' ? 'height' : 'width';
    const isCenter = alignProp && this.resolveIdentName(alignProp.value) === 'center';
    const hasPadding = paddingProp !== undefined;

    // Wrappers push the Column deeper
    let wrappers = 0;
    if (hasPadding) wrappers++;
    if (isCenter) wrappers++;
    const colDepth = depth + wrappers;
    const ind = '  '.repeat(colDepth);

    // Build children with spacers
    const childLines: string[] = [];
    for (let i = 0; i < node.children.length; i++) {
      childLines.push(`${this.genUINode(node.children[i], colDepth + 2)},`);
      if (gapSize !== null && i < node.children.length - 1) {
        childLines.push(`${ind}    const SizedBox(${gapDimension}: ${gapSize}),`);
      }
    }

    let code = `${widget}(\n`;
    const spreadProp = this.findProp(node.properties, 'spread');
    if (isCenter) {
      code += `${ind}  mainAxisSize: MainAxisSize.min,\n`;
    } else if (spreadProp) {
      code += `${ind}  mainAxisAlignment: MainAxisAlignment.spaceBetween,\n`;
    } else if (alignProp) {
      const alignment = this.resolveAlign(alignProp.value);
      code += `${ind}  mainAxisAlignment: ${alignment},\n`;
    }
    code += `${ind}  children: [\n`;
    code += childLines.join('\n') + '\n';
    code += `${ind}  ],\n`;
    code += `${ind})`;

    // Wrap: Center inside Padding
    if (isCenter) {
      const centerInd = '  '.repeat(colDepth - 1);
      code = `Center(\n${centerInd}  child: ${code},\n${centerInd})`;
    }
    if (hasPadding) {
      const padSize = this.resolveDesignToken(paddingProp!.value);
      const padInd = '  '.repeat(depth);
      code = `Padding(\n${padInd}  padding: const EdgeInsets.all(${padSize}),\n${padInd}  child: ${code},\n${padInd})`;
    }
    const bgProp = this.findProp(node.properties, 'background');
    const roundedProp = this.findProp(node.properties, 'rounded');
    if (bgProp || roundedProp) {
      const decInd = '  '.repeat(depth);
      const bgColor = bgProp ? this.resolveBackground(bgProp.value) : null;
      const radius = roundedProp ? this.resolveDesignToken(roundedProp.value) : null;
      let dec = 'BoxDecoration(';
      const decParts: string[] = [];
      if (bgColor) decParts.push(`color: ${bgColor}`);
      if (radius) decParts.push(`borderRadius: BorderRadius.circular(${radius})`);
      dec += decParts.join(', ') + ')';
      code = `Container(\n${decInd}  decoration: ${dec},\n${decInd}  child: ${code},\n${decInd})`;
    }
    const tapEvent = node.events.find(e => e.event === 'tap');
    if (tapEvent) {
      const gestInd = '  '.repeat(depth);
      const onTap = this.genOnPressed(tapEvent, depth + 1);
      code = `GestureDetector(\n${onTap.replace('onPressed', 'onTap')}${gestInd}  child: ${code},\n${gestInd})`;
    }
    const fillProp = this.findProp(node.properties, 'fill');
    if (fillProp) {
      const fillInd = '  '.repeat(depth);
      code = `Expanded(\n${fillInd}  child: ${code},\n${fillInd})`;
    }
    return '  '.repeat(depth) + code;
  }

  private genLabel(node: LabelNode, depth: number): string {
    const ind = '  '.repeat(depth);
    const styleProp = this.findProp(node.properties, 'style');
    const colorProp = this.findProp(node.properties, 'color');

    const displayStr = this.exprToDisplayStr(node.value);

    let code = `${ind}Text(\n`;
    code += `${ind}  ${displayStr},\n`;
    if (styleProp || colorProp) {
      const styleBase = styleProp ? this.resolveStyle(styleProp.value) : null;
      const colorStr = colorProp ? this.resolveColor(colorProp.value) : null;
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

  private genButton(node: ButtonNode, depth: number): string {
    const ind = '  '.repeat(depth);
    const tapEvent = node.events.find(e => e.event === 'tap');
    const colorProp = this.findProp(node.properties, 'color');

    let code = `${ind}ElevatedButton(\n`;
    if (colorProp) {
      const colorStr = this.resolveColor(colorProp.value);
      code += `${ind}  style: ElevatedButton.styleFrom(backgroundColor: ${colorStr}),\n`;
    }
    if (tapEvent) {
      code += this.genOnPressed(tapEvent, depth + 1);
    }
    const isConstText = node.text.type === 'StringLit';
    const textStr = isConstText ? this.exprToConstStr(node.text) : this.exprToDisplayStr(node.text);
    code += `${ind}  child: ${isConstText ? 'const ' : ''}Text(${textStr}),\n`;
    code += `${ind})`;
    return code;
  }

  private genInput(node: InputNode, depth: number): string {
    const ind = '  '.repeat(depth);
    const placeholder = this.findProp(node.properties, 'placeholder');

    let code = `${ind}TextField(\n`;
    code += `${ind}  controller: _${node.bind}Controller,\n`;
    code += `${ind}  onChanged: (value) {\n`;
    code += `${ind}    setState(() {\n`;
    code += `${ind}      ${node.bind} = value;\n`;
    code += `${ind}    });\n`;
    code += `${ind}  },\n`;
    if (placeholder) {
      const hint = this.exprToConstStr(placeholder.value);
      code += `${ind}  decoration: const InputDecoration(hintText: ${hint}),\n`;
    }
    code += `${ind})`;
    return code;
  }

  private genToggle(node: ToggleNode, depth: number): string {
    const ind = '  '.repeat(depth);
    const labelProp = this.findProp(node.properties, 'label');
    const labelStr = labelProp ? this.exprToDart(labelProp.value) : null;

    if (labelStr) {
      let code = `${ind}SwitchListTile(\n`;
      code += `${ind}  value: ${node.bind},\n`;
      code += `${ind}  title: Text(${labelStr}),\n`;
      code += `${ind}  onChanged: (value) {\n`;
      code += `${ind}    setState(() {\n`;
      code += `${ind}      ${node.bind} = value;\n`;
      code += `${ind}    });\n`;
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
    code += `${ind}  },\n`;
    code += `${ind})`;
    return code;
  }

  private genIcon(node: IconNode, depth: number): string {
    const ind = '  '.repeat(depth);
    const nameStr = this.exprToDart(node.name);
    const sizeProp = this.findProp(node.properties, 'size');
    const colorProp = this.findProp(node.properties, 'color');
    const tapEvent = node.events.find(e => e.event === 'tap');

    const iconName = node.name.type === 'StringLit' ? this.mapIconName(node.name.value) : nameStr;
    const parts: string[] = [`${ind}Icon(\n${ind}  ${iconName}`];
    if (sizeProp) parts.push(`size: ${this.resolveDesignToken(sizeProp.value)}`);
    if (colorProp) parts.push(`color: ${this.resolveColor(colorProp.value)}`);

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

  private mapIconName(name: string): string {
    const map: Record<string, string> = {
      play: 'Icons.play_arrow', pause: 'Icons.pause', stop: 'Icons.stop',
      skip: 'Icons.skip_next', back: 'Icons.arrow_back', close: 'Icons.close',
      search: 'Icons.search', settings: 'Icons.settings', plus: 'Icons.add',
      trash: 'Icons.delete', edit: 'Icons.edit', phone: 'Icons.phone',
      cart: 'Icons.shopping_cart', 'shopping-cart': 'Icons.shopping_cart',
      heart: 'Icons.favorite', star: 'Icons.star', check: 'Icons.check',
      user: 'Icons.person', person: 'Icons.person', home: 'Icons.home', mail: 'Icons.mail',
    };
    return map[name] ?? `Icons.${name.replace(/-/g, '_')}`;
  }

  private isNetworkImage(expr: Expr): boolean {
    if (expr.type === 'StringLit') return expr.value.startsWith('http');
    if (expr.type === 'BinaryExpr' && expr.op === '+') return this.isNetworkImage(expr.left);
    return false;
  }

  private genImage(node: ImageNode, depth: number): string {
    const ind = '  '.repeat(depth);
    const sizeProp = this.findProp(node.properties, 'size');
    const roundProp = this.findProp(node.properties, 'round');
    const size = sizeProp ? this.resolveDesignToken(sizeProp.value) : 48;
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
    const ind = '  '.repeat(depth);
    const minProp = this.findProp(node.properties, 'min');
    const maxProp = this.findProp(node.properties, 'max');
    const min = minProp ? this.exprToDart(minProp.value) : '0';
    const max = maxProp ? this.exprToDart(maxProp.value) : '100';

    let code = `${ind}Slider(\n`;
    code += `${ind}  value: ${node.bind}.toDouble(),\n`;
    code += `${ind}  min: ${min}.toDouble(),\n`;
    code += `${ind}  max: ${max}.toDouble(),\n`;
    code += `${ind}  onChanged: (value) {\n`;
    code += `${ind}    setState(() {\n`;
    code += `${ind}      ${node.bind} = value.round();\n`;
    code += `${ind}    });\n`;
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
    const ind = '  '.repeat(depth);
    const labelProp = this.findProp(node.properties, 'label');
    const labelStr = labelProp ? this.exprToDart(labelProp.value) : null;

    if (labelStr) {
      let code = `${ind}CheckboxListTile(\n`;
      code += `${ind}  value: ${node.bind},\n`;
      code += `${ind}  title: Text(${labelStr}),\n`;
      code += `${ind}  onChanged: (value) {\n`;
      code += `${ind}    setState(() {\n`;
      code += `${ind}      ${node.bind} = value ?? false;\n`;
      code += `${ind}    });\n`;
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
    const ind = '  '.repeat(depth);
    const optionsProp = this.findProp(node.properties, 'options');
    const optionsExpr = optionsProp ? this.exprToDart(optionsProp.value) : '[]';

    let code = `${ind}DropdownButton<dynamic>(\n`;
    code += `${ind}  value: ${node.bind},\n`;
    code += `${ind}  items: (${optionsExpr} as List).map((e) => DropdownMenuItem<dynamic>(value: e, child: Text(e.toString()))).toList(),\n`;
    code += `${ind}  onChanged: (value) {\n`;
    code += `${ind}    setState(() {\n`;
    code += `${ind}      ${node.bind} = value;\n`;
    code += `${ind}    });\n`;
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
    const ind = '  '.repeat(depth);
    const textStr = this.exprToDisplayStr(node.text);
    const colorProp = this.findProp(node.properties, 'color');
    const colorStr = colorProp ? this.resolveColor(colorProp.value) : null;

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
    const ind = '  '.repeat(depth);
    const cond = this.exprToDart(node.condition);

    let code = `${ind}if (${cond}) ...[`;
    for (const child of node.then) {
      code += '\n' + this.genUINode(child, depth + 1) + ',';
    }

    for (const branch of node.elseIfs) {
      code += `\n${ind}] else if (${this.exprToDart(branch.condition)}) ...[`;
      for (const child of branch.body) {
        code += '\n' + this.genUINode(child, depth + 1) + ',';
      }
    }

    if (node.else_) {
      code += `\n${ind}] else ...[`;
      for (const child of node.else_) {
        code += '\n' + this.genUINode(child, depth + 1) + ',';
      }
    }

    code += `\n${ind}]`;
    return code;
  }

  private genEach(node: EachNode, depth: number): string {
    const ind = '  '.repeat(depth);
    const listExpr = this.exprToDart(node.list);

    let code = `${ind}for (final ${node.variable} in ${listExpr}) ...[`;
    for (const child of node.children) {
      code += '\n' + this.genUINode(child, depth + 1) + ',';
    }
    code += `\n${ind}]`;
    return code;
  }

  private genComponentDef(comp: ComponentDef): string {
    const prevParams = this.screenParams;
    const prevIsComponent = this.isComponent;
    this.screenParams = comp.params;
    this.isComponent = true;

    const name = comp.name;
    const hasBody = this.componentHasBody(comp.body);
    const paramFields = comp.params.map(p => `  final dynamic ${p};`).join('\n');
    const ctorParams = comp.params.map(p => `required this.${p}`).join(', ');
    const bodyWidget = comp.body.length > 0 ? this.genUINode(comp.body[0], 2) : '    const SizedBox()';

    let code = `class ${name} extends StatelessWidget {\n`;
    if (comp.params.length > 0) {
      code += paramFields + '\n';
    }
    if (hasBody) {
      code += `  final Widget child;\n`;
    }
    const allCtorParams: string[] = [];
    if (comp.params.length > 0) allCtorParams.push(ctorParams);
    if (hasBody) allCtorParams.push('required this.child');
    code += `  const ${name}({super.key${allCtorParams.length > 0 ? ', ' + allCtorParams.join(', ') : ''}});\n\n`;
    code += `  @override\n  Widget build(BuildContext context) {\n`;
    code += `    return ${bodyWidget.trimStart()};\n`;
    code += `  }\n}\n`;

    this.screenParams = prevParams;
    this.isComponent = prevIsComponent;
    return code;
  }

  private componentHasBody(nodes: UINode[]): boolean {
    for (const node of nodes) {
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
    const ind = '  '.repeat(depth);
    const comp = this.allComponents.find(c => c.name === node.name);
    const paramNames = comp?.params ?? [];

    const namedArgs: string[] = [];
    for (let i = 0; i < node.args.length && i < paramNames.length; i++) {
      namedArgs.push(`${paramNames[i]}: ${this.exprToDart(node.args[i])}`);
    }
    for (const prop of node.properties) {
      namedArgs.push(`${prop.name}: ${this.exprToDart(prop.value)}`);
    }

    // Wrapper invocation: wrap children in Column and pass as child
    if (node.children.length > 0) {
      const childLines = node.children.map(c => this.genUINode(c, depth + 2) + ',').join('\n');
      const childWidget = `Column(\n${ind}    crossAxisAlignment: CrossAxisAlignment.start,\n${ind}    children: [\n${childLines}\n${ind}    ],\n${ind}  )`;
      namedArgs.push(`child: ${childWidget}`);
      return `${ind}${node.name}(\n${ind}  ${namedArgs.join(`,\n${ind}  `)},\n${ind})`;
    }

    return `${ind}${node.name}(${namedArgs.join(', ')})`;
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
    return code;
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
    const ind = '  '.repeat(depth);
    let code = '';
    for (const s of stmts) {
      code += this.genStmt(s, depth);
    }
    return code;
  }

  private genStmt(s: Statement, depth: number): string {
    const ind = '  '.repeat(depth);
    switch (s.type) {
      case 'Assignment': {
        if (s.target.startsWith('shared.')) {
          return `${ind}shared.update(() {\n${ind}  ${s.target} = ${this.exprToDart(s.value)};\n${ind}});\n`;
        }
        const isStateVar = this.stateVars.includes(s.target);
        if (isStateVar) {
          let code = `${ind}setState(() {\n${ind}  ${s.target} = ${this.exprToDart(s.value)};\n${ind}});\n`;
          if (this.boundInputVars.includes(s.target)) {
            code += `${ind}_${s.target}Controller.text = ${s.target};\n`;
          }
          return code;
        }
        // Local variable
        const prefix = this.declaredLocals.has(s.target) ? '' : 'dynamic ';
        this.declaredLocals.add(s.target);
        return `${ind}${prefix}${s.target} = ${this.exprToDart(s.value)};\n`;
      }
      case 'FunctionCall': {
        const args = s.args.map(a => this.exprToDart(a)).join(', ');
        return `${ind}${s.name}(${args});\n`;
      }
      case 'NavigateBack':
        return `${ind}Navigator.pop(context);\n`;
      case 'NavigateTo': {
        const targetScreen = this.allScreens.find(sc => sc.name === s.screen);
        const argStr = s.arg ? this.exprToDart(s.arg) : null;
        const paramName = targetScreen?.params[0];
        const ctorArgs = paramName && argStr ? `${paramName}: ${argStr}` : '';
        return `${ind}Navigator.push(context, MaterialPageRoute(builder: (context) => ${s.screen}Screen(${ctorArgs})));\n`;
      }
      case 'Return':
        if (s.value) {
          return `${ind}return ${this.exprToDart(s.value)};\n`;
        }
        return `${ind}return;\n`;
      case 'IfStmt': {
        let code = `${ind}if (${this.exprToDart(s.condition)}) {\n`;
        code += this.genStmtBlock(s.then, depth + 1);
        if (s.else_) {
          code += `${ind}} else {\n`;
          code += this.genStmtBlock(s.else_, depth + 1);
        }
        code += `${ind}}\n`;
        return code;
      }
      case 'EachStmt': {
        let code = `${ind}for (final ${s.variable} in ${this.exprToDart(s.list)}) {\n`;
        code += this.genStmtBlock(s.body, depth + 1);
        code += `${ind}}\n`;
        return code;
      }
    }
  }

  private genOnPressed(event: EventHandler, depth: number): string {
    const ind = '  '.repeat(depth);
    const action = event.action;

    if (action.type === 'NavigateBack') {
      let code = `${ind}onPressed: () {\n`;
      code += `${ind}  Navigator.pop(context);\n`;
      code += `${ind}},\n`;
      return code;
    }

    if (action.type === 'NavigateTo') {
      const targetScreen = this.allScreens.find(s => s.name === action.screen);
      const argStr = action.arg ? this.exprToDart(action.arg) : null;
      const paramName = targetScreen?.params[0];
      const ctorArgs = paramName && argStr ? `${paramName}: ${argStr}` : '';
      let code = `${ind}onPressed: () {\n`;
      code += `${ind}  Navigator.push(context, MaterialPageRoute(builder: (context) => ${action.screen}Screen(${ctorArgs})));\n`;
      code += `${ind}},\n`;
      return code;
    }

    if (action.type === 'FunctionCall') {
      const args = action.args.map(a => this.exprToDart(a)).join(', ');
      let code = `${ind}onPressed: () {\n`;
      code += `${ind}  ${action.name}(${args});\n`;
      code += `${ind}},\n`;
      return code;
    }

    const dartExpr = this.exprToDart(action.value);

    if (this.stateVars.includes(action.target)) {
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

  // -- Expression rendering --

  private exprToDart(expr: Expr): string {
    switch (expr.type) {
      case 'NumberLit': return `${expr.value}`;
      case 'StringLit': return `'${expr.value.replace(/\$/g, '\\$')}'`;
      case 'Ident':
        if (this.functionParams.includes(expr.name)) return expr.name;
        if (this.screenParams.includes(expr.name)) return this.isComponent ? expr.name : `widget.${expr.name}`;
        return expr.name;
      case 'BinaryExpr':
        if (expr.op === '+' && this.isStringExpr(expr)) {
          return `${this.exprToDart(expr.left)}.toString() + ${this.exprToDart(expr.right)}.toString()`;
        }
        if (expr.op === 'and') return `${this.exprToDart(expr.left)} && ${this.exprToDart(expr.right)}`;
        if (expr.op === 'or') return `${this.exprToDart(expr.left)} || ${this.exprToDart(expr.right)}`;
        return `${this.exprToDart(expr.left)} ${expr.op} ${this.exprToDart(expr.right)}`;
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
      case 'FieldAccess':
        if (expr.object.type === 'Ident' && expr.object.name === 'shared') {
          return `shared.${expr.field}`;
        }
        return `${this.exprToDart(expr.object)}['${expr.field}']`;
      case 'FunctionCall':
        return this.genFunctionCallExpr(expr);
    }
  }

  private genFunctionCallExpr(call: { name: string; args: Expr[] }): string {
    const args = call.args.map(a => this.exprToDart(a));
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
      const keyA = this.exprToDart(this.substituteLambdaParam(lambda.body, lambda.param, 'a'));
      const keyB = this.exprToDart(this.substituteLambdaParam(lambda.body, lambda.param, 'b'));
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
    if (call.name === 'random' && args.length === 2) {
      return `(Random().nextInt(${args[1]} - ${args[0]} + 1) + ${args[0]})`;
    }
    return `${call.name}(${args.join(', ')})`;
  }

  private substituteLambdaParam(expr: Expr, param: string, replacement: string): Expr {
    switch (expr.type) {
      case 'Ident':
        if (expr.name === param) return { type: 'Ident', name: replacement };
        return expr;
      case 'FieldAccess':
        return { type: 'FieldAccess', object: this.substituteLambdaParam(expr.object, param, replacement), field: expr.field };
      case 'BinaryExpr':
        return { type: 'BinaryExpr', left: this.substituteLambdaParam(expr.left, param, replacement), op: expr.op, right: this.substituteLambdaParam(expr.right, param, replacement) };
      case 'EqualityExpr':
        return { type: 'EqualityExpr', left: this.substituteLambdaParam(expr.left, param, replacement), right: this.substituteLambdaParam(expr.right, param, replacement), negated: expr.negated };
      case 'IsExpr':
        return { type: 'IsExpr', target: this.substituteLambdaParam(expr.target, param, replacement), check: expr.check };
      case 'UnaryExpr':
        return { type: 'UnaryExpr', op: expr.op, operand: this.substituteLambdaParam(expr.operand, param, replacement) };
      default:
        return expr;
    }
  }

  private exprToDisplayStr(expr: Expr): string {
    switch (expr.type) {
      case 'StringLit': return `'${expr.value}'`;
      case 'NumberLit': return `'${expr.value}'`;
      case 'Ident':     return "'" + '$' + expr.name + "'";
      case 'BinaryExpr':
        return this.exprToDart(expr);
      case 'UnaryExpr':
      case 'IsExpr':
      case 'ListLit':
      case 'ObjectLit':
        return "'" + '${' + this.exprToDart(expr) + "}'";
      case 'FieldAccess':
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
      case 'StringLit': return `'${expr.value}'`;
      default: return this.exprToDisplayStr(expr);
    }
  }

  // -- Property helpers --

  private detectBuiltin(program: Program, name: string): boolean {
    const check = (nodes: UINode[]): boolean => {
      for (const n of nodes) {
        if (n.type === 'Layout' && check(n.children)) return true;
        if (n.type === 'If' && (check(n.then) || (n.else_ ? check(n.else_) : false))) return true;
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
        if (s.type === 'Assignment' && checkExpr(s.value)) return true;
        if (s.type === 'IfStmt' && (checkStmts(s.then) || (s.else_ ? checkStmts(s.else_) : false))) return true;
        if (s.type === 'EachStmt' && checkStmts(s.body)) return true;
      }
      return false;
    };
    for (const screen of program.screens) {
      for (const item of screen.body) {
        if (item.type === 'FunctionDef' && checkStmts(item.body)) return true;
        if (item.type === 'VariableDecl' && checkExpr(item.value)) return true;
      }
    }
    return false;
  }

  private isStringExpr(expr: Expr): boolean {
    if (expr.type === 'StringLit') return true;
    if (expr.type === 'BinaryExpr' && expr.op === '+') {
      return this.isStringExpr(expr.left) || this.isStringExpr(expr.right);
    }
    return false;
  }

  private resolveIdentName(expr: Expr): string | null {
    return expr.type === 'Ident' ? expr.name : null;
  }

  private findProp(props: Property[], name: string): Property | undefined {
    return props.find(p => p.name === name);
  }

  private resolveDesignToken(expr: Expr): number {
    if (expr.type === 'Ident' && expr.name in DESIGN_TOKENS) {
      return DESIGN_TOKENS[expr.name];
    }
    if (expr.type === 'NumberLit') {
      return expr.value;
    }
    return 16; // fallback
  }

  private resolveStyle(expr: Expr): string {
    if (expr.type === 'Ident' && expr.name in STYLE_MAP) {
      return STYLE_MAP[expr.name];
    }
    // Handle dotted styles like heading.small
    if (expr.type === 'FieldAccess' && expr.object.type === 'Ident') {
      const key = `${expr.object.name}.${expr.field}`;
      if (key in STYLE_MAP) return STYLE_MAP[key];
    }
    return `Theme.of(context).textTheme.bodyLarge`; // fallback
  }

  private resolveAlign(expr: Expr): string {
    if (expr.type === 'Ident' && expr.name in ALIGN_MAP) {
      return ALIGN_MAP[expr.name];
    }
    return 'MainAxisAlignment.start'; // fallback
  }

  private resolveBackground(expr: Expr): string {
    if (expr.type === 'Ident') {
      if (expr.name === 'card') return 'Theme.of(context).cardColor';
      if (expr.name === 'overlay') return 'Colors.black54';
      if (expr.name in COLOR_MAP) return COLOR_MAP[expr.name];
    }
    return 'Theme.of(context).cardColor'; // fallback
  }

  private resolveColor(expr: Expr): string {
    if (expr.type === 'Ident' && expr.name in COLOR_MAP) {
      return COLOR_MAP[expr.name];
    }
    return 'Colors.grey'; // fallback
  }
}
