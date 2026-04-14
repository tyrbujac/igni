import { Expr, Property } from './ast.js';

export const DESIGN_TOKENS: Record<string, number> = {
  small: 8,
  medium: 16,
  large: 24,
};

export const STYLE_MAP: Record<string, string> = {
  heading: 'Theme.of(context).textTheme.headlineLarge!',
  'heading.small': 'Theme.of(context).textTheme.headlineSmall!',
  body: 'Theme.of(context).textTheme.bodyLarge!',
  caption: 'Theme.of(context).textTheme.bodySmall!',
};

export const COLOR_MAP: Record<string, string> = {
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
  teal: 'Colors.teal',
};

export const ALIGN_MAP: Record<string, string> = {
  start: 'MainAxisAlignment.start',
  center: 'MainAxisAlignment.center',
  end: 'MainAxisAlignment.end',
};

export function findProp(props: Property[], name: string): Property | undefined {
  return props.find(p => p.name === name);
}

export function resolveIdentName(expr: Expr): string | null {
  return expr.type === 'Ident' ? expr.name : null;
}

export function resolveDesignToken(expr: Expr): number {
  if (expr.type === 'Ident' && expr.name in DESIGN_TOKENS) {
    return DESIGN_TOKENS[expr.name];
  }
  if (expr.type === 'NumberLit') {
    return expr.value;
  }
  return 16;
}

export function resolveStyle(expr: Expr): string {
  if (expr.type === 'Ident' && expr.name in STYLE_MAP) {
    return STYLE_MAP[expr.name];
  }
  if (expr.type === 'FieldAccess' && expr.object.type === 'Ident') {
    const key = `${expr.object.name}.${expr.field}`;
    if (key in STYLE_MAP) return STYLE_MAP[key];
  }
  return `Theme.of(context).textTheme.bodyLarge`;
}

export function resolveAlign(expr: Expr): string {
  if (expr.type === 'Ident' && expr.name in ALIGN_MAP) {
    return ALIGN_MAP[expr.name];
  }
  return 'MainAxisAlignment.start';
}

export function isImageBackground(expr: Expr): boolean {
  return expr.type === 'StringLit';
}

// Color names that, when used as a screen's `background:`, should flip the
// screen into a dark Material theme so that theme-derived tokens (cardColor,
// default text colour, etc.) render correctly over a dark surface. Initially
// just `black`; extend here when new dark-leaning named colours are added.
const DARK_BACKGROUND_NAMES = new Set<string>(['black']);

export function isDarkBackgroundExpr(expr: Expr | undefined): boolean {
  if (!expr) return false;
  if (expr.type !== 'Ident') return false;
  return DARK_BACKGROUND_NAMES.has(expr.name);
}

export function resolveBackground(expr: Expr): string {
  if (expr.type === 'Ident') {
    if (expr.name === 'card') return 'Theme.of(context).cardColor';
    if (expr.name === 'overlay') return 'Colors.black54';
    if (expr.name in COLOR_MAP) return COLOR_MAP[expr.name];
  }
  return 'Theme.of(context).cardColor';
}

export function resolveColor(expr: Expr): string {
  if (expr.type === 'Ident' && expr.name in COLOR_MAP) {
    return COLOR_MAP[expr.name];
  }
  return 'Colors.grey';
}

const ICON_MAP: Record<string, string> = {
  play: 'Icons.play_arrow', pause: 'Icons.pause', stop: 'Icons.stop',
  skip: 'Icons.skip_next', back: 'Icons.arrow_back', close: 'Icons.close',
  search: 'Icons.search', settings: 'Icons.settings', plus: 'Icons.add',
  minus: 'Icons.remove', add: 'Icons.add', remove: 'Icons.remove',
  trash: 'Icons.delete', edit: 'Icons.edit', phone: 'Icons.phone',
  cart: 'Icons.shopping_cart', 'shopping-cart': 'Icons.shopping_cart',
  heart: 'Icons.favorite', star: 'Icons.star', check: 'Icons.check',
  user: 'Icons.person', person: 'Icons.person', home: 'Icons.home', mail: 'Icons.mail',
  male: 'Icons.male', female: 'Icons.female',
};

export function mapIconName(name: string): string {
  return ICON_MAP[name] ?? `Icons.${name.replace(/-/g, '_')}`;
}

// Generates a Dart helper that resolves an icon name (or IconData) at runtime.
// Emitted only when a program uses an icon whose name comes from a variable
// (e.g. `icon icon_name` where `icon_name` is a component parameter). Literal
// names are resolved at compile time via mapIconName.
export function generateIconLookupHelper(): string {
  const cases = Object.entries(ICON_MAP)
    .map(([name, icon]) => `    case '${name}': return ${icon};`)
    .join('\n');
  return `IconData _iconFromName(dynamic name) {
  if (name is IconData) return name;
  switch (name as String) {
${cases}
    default: return Icons.help_outline;
  }
}`;
}

export function inferType(expr: Expr, typeHint?: string): string {
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

export function isStringExpr(expr: Expr): boolean {
  if (expr.type === 'StringLit') return true;
  if (expr.type === 'BinaryExpr' && expr.op === '+') {
    return isStringExpr(expr.left) || isStringExpr(expr.right);
  }
  return false;
}

export function substituteLambdaParam(expr: Expr, param: string, replacement: string): Expr {
  switch (expr.type) {
    case 'Ident':
      if (expr.name === param) return { type: 'Ident', name: replacement };
      return expr;
    case 'FieldAccess':
      return { type: 'FieldAccess', object: substituteLambdaParam(expr.object, param, replacement), field: expr.field };
    case 'IndexAccess':
      return { type: 'IndexAccess', object: substituteLambdaParam(expr.object, param, replacement), index: substituteLambdaParam((expr as any).index, param, replacement) } as any;
    case 'BinaryExpr':
      return { type: 'BinaryExpr', left: substituteLambdaParam(expr.left, param, replacement), op: expr.op, right: substituteLambdaParam(expr.right, param, replacement) };
    case 'EqualityExpr':
      return { type: 'EqualityExpr', left: substituteLambdaParam(expr.left, param, replacement), right: substituteLambdaParam(expr.right, param, replacement), negated: expr.negated };
    case 'IsExpr':
      return { type: 'IsExpr', target: substituteLambdaParam(expr.target, param, replacement), check: expr.check };
    case 'UnaryExpr':
      return { type: 'UnaryExpr', op: expr.op, operand: substituteLambdaParam(expr.operand, param, replacement) };
    default:
      return expr;
  }
}
