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
  heading: 'Theme.of(context).textTheme.headlineLarge',
  'heading.small': 'Theme.of(context).textTheme.headlineSmall',
  body: 'Theme.of(context).textTheme.bodyLarge',
  caption: 'Theme.of(context).textTheme.bodySmall',
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

    let code = `import 'package:flutter/material.dart';\n`;
    if (this.hasFetch) {
      code += `import 'package:http/http.dart' as http;\n`;
      code += `import 'dart:convert';\n`;
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
      const dartType = this.inferType(v.value);
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

    for (const item of screen.body) {
      if (item.type === 'VariableDecl') {
        // Detect fetch variables
        if (item.value.type === 'FunctionCall' && item.value.name === 'fetch') {
          const url = item.value.args[0];
          this.fetchVars.push({ name: item.name, url: this.exprToDart(url) });
          this.stateVars.push(item.name);
        } else {
          this.stateVars.push(item.name);
          stateDecls.push(this.genStateVar(item));
        }
      } else if (item.type === 'FunctionDef') {
        funcDefs.push(item);
      } else {
        uiNodes.push(item);
      }
    }

    this.collectBoundInputs(uiNodes);

    const name = screen.name;
    const hasParams = screen.params.length > 0;
    const hasState = stateDecls.length > 0;
    const bodyWidget = uiNodes.length > 0 ? this.genUINode(uiNodes[0], 3) : 'const SizedBox()';
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
    stateClass += `  @override\n  Widget build(BuildContext context) {\n`;
    stateClass += `    return Scaffold(\n      body: ${bodyWidget.trimStart()},\n    );\n`;
    stateClass += `  }\n}\n`;

    return widgetClass + '\n' + stateClass;
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
    const dartType = this.inferType(decl.value);
    const dartValue = this.exprToDart(decl.value);
    return `${dartType} ${decl.name} = ${dartValue};`;
  }

  private inferType(expr: Expr): string {
    switch (expr.type) {
      case 'NumberLit': return 'int';
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
    if (isCenter) {
      code += `${ind}  mainAxisSize: MainAxisSize.min,\n`;
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
    return '  '.repeat(depth) + code;
  }

  private genLabel(node: LabelNode, depth: number): string {
    const ind = '  '.repeat(depth);
    const styleProp = this.findProp(node.properties, 'style');

    const displayStr = this.exprToDisplayStr(node.value);

    let code = `${ind}Text(\n`;
    code += `${ind}  ${displayStr},\n`;
    if (styleProp) {
      const styleStr = this.resolveStyle(styleProp.value);
      code += `${ind}  style: ${styleStr},\n`;
    }
    code += `${ind})`;
    return code;
  }

  private genButton(node: ButtonNode, depth: number): string {
    const ind = '  '.repeat(depth);
    const tapEvent = node.events.find(e => e.event === 'tap');

    let code = `${ind}ElevatedButton(\n`;
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
    // Save/restore screen-level state
    const prevParams = this.screenParams;
    this.screenParams = comp.params;

    const name = comp.name;
    const paramFields = comp.params.map(p => `  final dynamic ${p};`).join('\n');
    const ctorParams = comp.params.map(p => `required this.${p}`).join(', ');
    const bodyWidget = comp.body.length > 0 ? this.genUINode(comp.body[0], 2) : '    const SizedBox()';

    let code = `class ${name} extends StatelessWidget {\n`;
    if (comp.params.length > 0) {
      code += paramFields + '\n';
    }
    code += `  const ${name}({super.key${comp.params.length > 0 ? ', ' + ctorParams : ''}});\n\n`;
    code += `  @override\n  Widget build(BuildContext context) {\n`;
    code += `    return ${bodyWidget.trimStart()};\n`;
    code += `  }\n}\n`;

    this.screenParams = prevParams;
    return code;
  }

  private genComponentInvocation(node: ComponentInvocation, depth: number): string {
    const ind = '  '.repeat(depth);
    const comp = this.allComponents.find(c => c.name === node.name);
    const paramNames = comp?.params ?? [];

    // Map positional args to named params
    const namedArgs: string[] = [];
    for (let i = 0; i < node.args.length && i < paramNames.length; i++) {
      namedArgs.push(`${paramNames[i]}: ${this.exprToDart(node.args[i])}`);
    }
    // Add named properties
    for (const prop of node.properties) {
      namedArgs.push(`${prop.name}: ${this.exprToDart(prop.value)}`);
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
        if (this.screenParams.includes(expr.name)) return `widget.${expr.name}`;
        return expr.name;
      case 'BinaryExpr':
        if (expr.op === '+' && this.isStringExpr(expr)) {
          return `${this.exprToDart(expr.left)}.toString() + ${this.exprToDart(expr.right)}.toString()`;
        }
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
      return `${args[0]}.where(${args[1]}).toList()`;
    }
    if (call.name === 'find' && args.length === 2 && call.args[1].type === 'LambdaExpr') {
      return `${args[0]}.cast<dynamic>().firstWhere(${args[1]}, orElse: () => null)`;
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
    return `Theme.of(context).textTheme.bodyLarge`; // fallback
  }

  private resolveAlign(expr: Expr): string {
    if (expr.type === 'Ident' && expr.name in ALIGN_MAP) {
      return ALIGN_MAP[expr.name];
    }
    return 'MainAxisAlignment.start'; // fallback
  }
}
