import { Expr, Property } from './ast.js';
import { TranspileError } from './errors.js';

export const DESIGN_TOKENS: Record<string, number> = {
  // Word tokens — semantic shortcuts (pre-v0.20)
  small: 8,
  medium: 16,
  large: 24,

  // v0.20: numeric scale `spacing/N` — multiply N by 4 for pixels.
  // small = spacing/2, medium = spacing/4, large = spacing/6.
  // The slash is tokenised as part of the identifier by lexer.ts's
  // scanIdentifier — see the spacing-token special-case there.
  'spacing/1': 4,
  'spacing/2': 8,
  'spacing/3': 12,
  'spacing/4': 16,
  'spacing/5': 20,
  'spacing/6': 24,
  'spacing/8': 32,
};

export const MAX_WIDTH_TOKENS: Record<string, number> = {
  phone: 480,
  tablet: 768,
  desktop: 1200,
};

// v0.17.0: border width tokens. Cosmetic-not-spatial — these don't compose with
// the spacing scale (gap/padding use DESIGN_TOKENS in pixels because spacing is
// geometry; border weight is visual emphasis). Keep the map small and named.
export const BORDER_WIDTH_TOKENS: Record<string, number> = {
  thin: 1,
  medium: 2,
  thick: 4,
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

export const BACKGROUND_ONLY_TOKENS = new Set<string>(['card']);

export const ALIGN_MAP: Record<string, string> = {
  start: 'MainAxisAlignment.start',
  center: 'MainAxisAlignment.center',
  end: 'MainAxisAlignment.end',
};

// Curated v0.12.1 font bundle. Igni-side tokens are snake_case; values are the
// exact family names baked into the bundled TTF `name` tables — codegen emits
// these as `fontFamily: 'Pacifico'` and syncFonts() registers them under the
// same string in the generated `pubspec.yaml`. Flutter's font resolution is
// strict: the three strings (map value, pubspec `family:`, TTF `name` table)
// must match byte-for-byte, otherwise Flutter silently falls back to sans.
// Extending the bundle requires a spec change — see
// docs/private/81_theme_block.md §Non-goals and docs/private/84_v0121_font_token_rename.md.
export const FONT_MAP: Record<string, string> = {
  pacifico: 'Pacifico',
  inter: 'Inter',
  source_sans: 'Source Sans 3',
  merriweather: 'Merriweather',
  lora: 'Lora',
  fira_code: 'Fira Code',
};

export function resolveFontToken(token: string): string {
  const family = FONT_MAP[token];
  if (!family) throw new Error(`resolveFontToken: unknown token "${token}" — parser should have rejected this.`);
  return family;
}

export function findProp(props: Property[], name: string): Property | undefined {
  return props.find(p => p.name === name);
}

export function resolveIdentName(expr: Expr): string | null {
  return expr.type === 'Ident' ? expr.name : null;
}

export function isColorTokenName(name: string): boolean {
  return name in COLOR_MAP;
}

export function isBackgroundOnlyTokenName(name: string): boolean {
  return BACKGROUND_ONLY_TOKENS.has(name);
}

export function isStyleValueName(name: string): boolean {
  return isColorTokenName(name) || isBackgroundOnlyTokenName(name);
}

export function isStyleValueExpr(expr: Expr): boolean {
  return expr.type === 'Ident' && isStyleValueName(expr.name);
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

export function resolveMaxWidthToken(expr: Expr): number | null {
  if (expr.type === 'Ident' && expr.name in MAX_WIDTH_TOKENS) {
    return MAX_WIDTH_TOKENS[expr.name];
  }
  return null;
}

export function isBorderWidthTokenName(name: string): boolean {
  return name in BORDER_WIDTH_TOKENS;
}

// v0.17.0: returns the pixel value for a literal width token, or null if the
// expression isn't a literal token (caller emits a runtime resolver call).
// Numeric/string literals are rejected upstream — this helper is the pixel
// lookup, not the validator.
export function resolveBorderWidthToken(expr: Expr): number | null {
  if (expr.type === 'Ident' && expr.name in BORDER_WIDTH_TOKENS) {
    return BORDER_WIDTH_TOKENS[expr.name];
  }
  return null;
}

// v0.17.0: runtime helper for `border:` width when the expression isn't a
// literal token (e.g. `border: width_for(method)` where width_for returns a
// width-token name at runtime). Mirrors `_igniColorValue` shape — emitted only
// when the program uses dynamic width resolution.
export function generateBorderWidthResolver(): string {
  return `double _igniBorderWidth(dynamic value) {
  if (value is num) return value.toDouble();
  switch (value) {
    case 'thin': return 1.0;
    case 'medium': return 2.0;
    case 'thick': return 4.0;
    default: return 1.0;
  }
}`;
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
  const loc = expr.loc;
  if (expr.type === 'Ident') {
    if (expr.name === 'right') {
      throw new TranspileError(
        `align takes start, center, or end (RTL-safe vocabulary). Got "right". ` +
        `Use "end" — in a left-to-right layout, "end" means right; in right-to-left, it means left.`,
        loc?.line ?? 0,
        loc?.column ?? 0,
      );
    }
    if (expr.name === 'left') {
      throw new TranspileError(
        `align takes start, center, or end (RTL-safe vocabulary). Got "left". ` +
        `Use "start" — in a left-to-right layout, "start" means left; in right-to-left, it means right.`,
        loc?.line ?? 0,
        loc?.column ?? 0,
      );
    }
    throw new TranspileError(
      `align takes start, center, or end (RTL-safe vocabulary). Got "${expr.name}".`,
      loc?.line ?? 0,
      loc?.column ?? 0,
    );
  }
  throw new TranspileError(
    `align expects an identifier — start, center, or end.`,
    loc?.line ?? 0,
    loc?.column ?? 0,
  );
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

export function resolveBackground(expr: Expr, themeColors?: Record<string, string>): string {
  // v0.15.0: inline hex codes outside theme: blocks are rejected. (Image-string
  // backgrounds — e.g. `background: "sunset.jpg"` — are still valid; only `#`-
  // prefixed strings are treated as inline-hex attempts.)
  if (expr.type === 'StringLit' && expr.value.startsWith('#')) {
    const loc = expr.loc;
    throw new TranspileError(
      `Inline hex colours are not supported. Use a token from \`theme: color:\` ` +
      `or one of the 12 built-in tokens. ` +
      `Define a theme: color: token (e.g. \`my_red: "${expr.value}"\`) and reference it by name.`,
      loc?.line ?? 0,
      loc?.column ?? 0,
    );
  }
  if (expr.type === 'Ident') {
    if (themeColors && expr.name in themeColors) return hexToDartColor(themeColors[expr.name]);
    if (expr.name === 'card') return 'Theme.of(context).cardColor';
    if (expr.name === 'overlay') return 'Colors.black54';
    if (expr.name in COLOR_MAP) return COLOR_MAP[expr.name];
  }
  return 'Theme.of(context).cardColor';
}

// v0.15.0: convert "#RRGGBB" hex to Dart Color literal. Parser enforces
// 6-digit form only — shorthand "#RGB" is a parse error per spec §theme: color:.
export function hexToDartColor(hex: string): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return `const Color(0xFF${h.toUpperCase()})`;
}

export function resolveColor(expr: Expr, themeColors?: Record<string, string>): string {
  // v0.15.0: inline hex codes outside theme: blocks are rejected.
  if (expr.type === 'StringLit' && expr.value.startsWith('#')) {
    const loc = expr.loc;
    throw new TranspileError(
      `Inline hex colours are not supported. Use a token from \`theme: color:\` ` +
      `or one of the 12 built-in tokens (brand, subtle, danger, green, red, blue, ` +
      `white, black, yellow, orange, purple, teal). ` +
      `Define a theme: color: token (e.g. \`my_red: "${expr.value}"\`) and reference it by name.`,
      loc?.line ?? 0,
      loc?.column ?? 0,
    );
  }
  if (expr.type === 'Ident') {
    if (themeColors && expr.name in themeColors) {
      return hexToDartColor(themeColors[expr.name]);
    }
    if (expr.name in COLOR_MAP) {
      return COLOR_MAP[expr.name];
    }
  }
  return 'Colors.grey';
}

export function generateStyleValueResolvers(themeColors: Record<string, string> = {}): string {
  // v0.15.0: theme.color overrides built-in token resolution; user-defined
  // tokens add new cases. Iterate themeColors *first* and skip those names
  // when emitting COLOR_MAP cases, so overrides win without duplicate cases.
  const themeCases = Object.entries(themeColors)
    .map(([name, hex]) => `    case '${name}': return ${hexToDartColor(hex)};`)
    .join('\n');
  const colorCases = [
    themeCases,
    Object.entries(COLOR_MAP)
      .filter(([name]) => !(name in themeColors))
      .map(([name, color]) => `    case '${name}': return ${color};`)
      .join('\n'),
  ].filter(s => s).join('\n');
  // Skip the default `card → Theme.cardColor` case when the user overrides
  // `card` via `theme: color: card:`, otherwise the override is dead-coded
  // behind the default and backgrounds silently render the M3 default
  // surface colour. Surfaced 2026-04-27 by BMI: `card: "#1D1E33"` was
  // dropped on the floor; gender card invisible against scaffold.
  const cardOverridden = 'card' in themeColors;
  const backgroundCases = [
    cardOverridden ? '' : `    case 'card': return Theme.of(context).cardColor;`,
    themeCases,
    Object.entries(COLOR_MAP)
      .filter(([name]) => !(name in themeColors))
      .map(([name, color]) => `    case '${name}': return ${color};`)
      .join('\n'),
  ].filter(s => s).join('\n');
  return `Color _igniColorValue(BuildContext context, dynamic value) {
  if (value is Color) return value;
  switch (value) {
${colorCases}
    case 'card':
      throw FlutterError('Igni: \`card\` is background-only. Use it with \`background:\`, not \`color:\`.');
    default:
      return Colors.grey;
  }
}

Color _igniBackgroundValue(BuildContext context, dynamic value) {
  if (value is Color) return value;
  switch (value) {
${backgroundCases}
    default:
      return Theme.of(context).cardColor;
  }
}`;
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
      if (isStyleValueName(expr.name)) return 'String';
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
      return { type: 'IndexAccess', object: substituteLambdaParam(expr.object, param, replacement), index: substituteLambdaParam(expr.index, param, replacement) };
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
