export interface SourceLocation {
  line: number;
  column: number;
}

export interface NodeBase {
  loc?: SourceLocation;
}

// -- Expressions --

export interface NumberLit extends NodeBase {
  type: 'NumberLit';
  value: number;
  isFloat: boolean;
}

export interface StringLit extends NodeBase {
  type: 'StringLit';
  value: string;
}

export interface Ident extends NodeBase {
  type: 'Ident';
  name: string;
}

export interface BinaryExpr extends NodeBase {
  type: 'BinaryExpr';
  left: Expr;
  op: '+' | '-' | '*' | '/' | '>' | '<' | '>=' | '<=' | 'and' | 'or';
  right: Expr;
}

export interface UnaryExpr extends NodeBase {
  type: 'UnaryExpr';
  op: 'not';
  operand: Expr;
}

export interface IsExpr extends NodeBase {
  type: 'IsExpr';
  target: Expr;
  check: 'empty' | 'not empty' | 'null' | 'not null' | 'loading' | 'error';
}

export interface ListLit extends NodeBase {
  type: 'ListLit';
  elements: Expr[];
}

export interface ObjectLit extends NodeBase {
  type: 'ObjectLit';
  entries: { key: string; value: Expr }[];
}

export interface ObjectUpdate extends NodeBase {
  type: 'ObjectUpdate';
  base: Ident | FieldAccess;
  updates: { key: string; value: Expr }[];
}

export interface FieldAccess extends NodeBase {
  type: 'FieldAccess';
  object: Expr;
  field: string;
}

export interface IndexAccess extends NodeBase {
  type: 'IndexAccess';
  object: Expr;
  index: Expr;
}

export interface LambdaExpr extends NodeBase {
  type: 'LambdaExpr';
  param: string;
  body: Expr;
}

export interface EqualityExpr extends NodeBase {
  type: 'EqualityExpr';
  left: Expr;
  right: Expr;
  negated: boolean;
}

export interface InExpr extends NodeBase {
  type: 'InExpr';
  target: Expr;
  list: Expr;
  negated: boolean;
}

export type Expr = NumberLit | StringLit | Ident | BinaryExpr | UnaryExpr | IsExpr | LambdaExpr | EqualityExpr | InExpr | ListLit | ObjectLit | ObjectUpdate | FieldAccess | IndexAccess | FunctionCall | SeenPredicate | OnPredicate;

// -- Properties and events --

export interface Property extends NodeBase {
  name: string;
  value: Expr;
}

export interface EventHandler extends NodeBase {
  event: string;
  /**
   * Optional parameter name from the parent's handler signature: `on X(name):` → `parameter = "name"`.
   * `null`/`undefined` = bare `on X:` (no parameter). `"_"` = explicit-discard `on X(_):`.
   * Per v0.16.0: when the child emits a value, parent must either name a parameter or discard with `_`;
   * static validation rejects mismatch (bare-on-payloaded, parameterised-on-payloadless).
   */
  parameter?: string | null;
  action: Statement;
}

// -- Statements --

export interface VariableDecl extends NodeBase {
  type: 'VariableDecl';
  name: string;
  value: Expr;
  typeHint?: string;
}

export interface Assignment extends NodeBase {
  type: 'Assignment';
  target: string;
  value: Expr;
}

export interface FunctionCall extends NodeBase {
  type: 'FunctionCall';
  name: string;
  args: Expr[];
  namedArgs?: { name: string; value: Expr }[];
}

export interface NavigateTo extends NodeBase {
  type: 'NavigateTo';
  screen: string;
  args: Expr[];
}

export interface NavigateBack extends NodeBase {
  type: 'NavigateBack';
}

export interface ReturnStmt extends NodeBase {
  type: 'Return';
  value: Expr | null;
}

export interface IfStmt extends NodeBase {
  type: 'IfStmt';
  condition: Expr;
  then: Statement[];
  else_: Statement[] | null;
}

export interface EachStmt extends NodeBase {
  type: 'EachStmt';
  variable: string;
  list: Expr;
  body: Statement[];
}

export interface EmitStmt extends NodeBase {
  type: 'EmitStmt';
  event: string;
  arg: Expr | null;
}

export type Statement = Assignment | FunctionCall | NavigateTo | NavigateBack | ReturnStmt | IfStmt | EachStmt | EmitStmt;

export interface FunctionDef extends NodeBase {
  type: 'FunctionDef';
  name: string;
  params: string[];
  body: Statement[];
}

export interface EveryNode extends NodeBase {
  type: 'Every';
  milliseconds: number;
  body: Statement[];
}

// -- UI nodes --

export interface Layout extends NodeBase {
  type: 'Layout';
  direction: 'vertical' | 'horizontal';
  properties: Property[];
  events: EventHandler[];
  children: UINode[];
}

export interface LabelNode extends NodeBase {
  type: 'Label';
  value: Expr;
  properties: Property[];
  events: EventHandler[];
}

export interface ButtonNode extends NodeBase {
  type: 'Button';
  text: Expr;
  properties: Property[];
  events: EventHandler[];
}

export interface InputNode extends NodeBase {
  type: 'Input';
  bind: string;
  properties: Property[];
  events: EventHandler[];
}

export interface ToggleNode extends NodeBase {
  type: 'Toggle';
  bind: string;
  properties: Property[];
  events: EventHandler[];
}

export interface IfNode extends NodeBase {
  type: 'If';
  condition: Expr;
  then: (UINode | VariableDecl)[];
  elseIfs: { condition: Expr; body: (UINode | VariableDecl)[] }[];
  else_: (UINode | VariableDecl)[] | null;
}

export interface EachNode extends NodeBase {
  type: 'Each';
  variable: string;
  list: Expr;
  children: UINode[];
  paginate?: number;
}

export interface SpinnerNode extends NodeBase {
  type: 'Spinner';
}

export interface DividerNode extends NodeBase {
  type: 'Divider';
}

export interface CommentNode extends NodeBase {
  type: 'Comment';
  text: string;
}

export interface IconNode extends NodeBase {
  type: 'Icon';
  name: Expr;
  properties: Property[];
  events: EventHandler[];
}

export interface ImageNode extends NodeBase {
  type: 'Image';
  url: Expr;
  properties: Property[];
  events: EventHandler[];
}

export interface SliderNode extends NodeBase {
  type: 'Slider';
  bind: string;
  properties: Property[];
  events: EventHandler[];
}

export interface CheckboxNode extends NodeBase {
  type: 'Checkbox';
  bind: string;
  properties: Property[];
  events: EventHandler[];
}

export interface DropdownNode extends NodeBase {
  type: 'Dropdown';
  bind: string;
  properties: Property[];
  events: EventHandler[];
}

export interface BadgeNode extends NodeBase {
  type: 'Badge';
  text: Expr;
  properties: Property[];
  events: EventHandler[];
}

export interface BodyNode extends NodeBase {
  type: 'Body';
}

export interface ComponentInvocation extends NodeBase {
  type: 'ComponentInvocation';
  name: string;
  args: Expr[];
  properties: Property[];
  events: EventHandler[];
  children: UINode[];
}

export type UINode = Layout | LabelNode | ButtonNode | InputNode | ToggleNode | IfNode | EachNode | SpinnerNode | DividerNode | CommentNode | IconNode | ImageNode | SliderNode | CheckboxNode | DropdownNode | BadgeNode | BodyNode | ComponentInvocation;

// -- Top-level --

export type ScreenItem = VariableDecl | UINode | FunctionDef | EveryNode;

export interface Screen extends NodeBase {
  type: 'Screen';
  name: string;
  params: string[];
  properties: Property[];
  body: ScreenItem[];
}

export type ComponentItem = VariableDecl | UINode;

export interface ComponentDef extends NodeBase {
  type: 'ComponentDef';
  name: string;
  params: string[];
  body: ComponentItem[];
}

export type ThemeTextTokenName = 'heading' | 'body' | 'caption';

export interface ThemeTextToken extends NodeBase {
  type: 'ThemeTextToken';
  token: ThemeTextTokenName;
  font?: string;
}

// v0.15.0: theme: color: <token>: "<hex>"
// Either an override of a built-in colour token, or a user-defined token.
// `name` is post-flattening (Figma `brand/border/subtle` → `brand_border_subtle`).
export interface ThemeColorToken extends NodeBase {
  type: 'ThemeColorToken';
  name: string;
  hex: string;
}

// v0.20.0: structural-chrome sub-block. background/foreground are token
// references (Ident nodes resolving to colour tokens); inline hex rejected.
export interface ThemeChromeToken extends NodeBase {
  type: 'ThemeChromeToken';
  property: 'background' | 'foreground';
  ref: string;  // colour-token name (e.g. "surface" or "text")
}

export interface ThemeBlock extends NodeBase {
  type: 'ThemeBlock';
  // v0.20.0: variant qualifier — false (default) for `theme:`, true for `theme dark:`.
  // The parser produces 0-2 ThemeBlock entries per program; codegen merges them.
  dark: boolean;
  text: ThemeTextToken[];
  color: ThemeColorToken[];
  // v0.20.0: structural sub-blocks (scaffold:, appbar:). Empty arrays = sub-block
  // not declared. Each accepts background:; appbar: also accepts foreground:.
  scaffold: ThemeChromeToken[];
  appbar: ThemeChromeToken[];
}

export interface Program extends NodeBase {
  type: 'Program';
  screens: Screen[];
  components: ComponentDef[];
  shared: VariableDecl[];
  theme?: ThemeBlock;       // light variant (the default `theme:` block)
  themeDark?: ThemeBlock;   // v0.20: dark variant (the `theme dark:` block)
  tests: TestBlock[];
}

// v0.18 testing infrastructure. Per `docs/private/112_v018_testing_infrastructure.md`.
// `test "name":` blocks live as siblings to screens/components in `*.test.igni`
// files. Each test body is a sequence of statements:
//   - render: `render <Screen>` or `render <Component>, arg: value`
//   - event sims: `tap "<label>"`, `change <id>: <value>`, `submit <id>`,
//     `toggle <id>`, `slide <id> to <value>`
//   - assertions: `expect <bool-expression>` (general form). Predicate forms
//     `seen "<text>"` and `on <Screen>` are special test-scope syntax that
//     parse without parens directly under `expect` / `expect not`.
//   - mocks: `mock fetch:` (URL→response map) and `mock every:` with
//     `advance <duration>` directives.
export interface TestBlock extends NodeBase {
  type: 'TestBlock';
  name: string;
  body: TestStatement[];
}

export type TestStatement =
  | RenderStmt
  | ExpectStmt
  | TapStmt
  | ChangeStmt
  | SubmitStmt
  | ToggleStmt
  | SlideStmt
  | MockFetchBlock
  | MockEveryBlock
  | SnapshotStmt
  | MockNowStmt
  | FreezeTimeBlock;

export interface RenderStmt extends NodeBase {
  type: 'RenderStmt';
  screenName: string;
  // Optional named args. Keys are param names (regular var name or
  // "shared.<name>"); values are arbitrary expressions.
  args: { name: string; value: Expr }[];
}

// `expect <expression>`. The expression may be:
//   - A general boolean expression evaluated against test scope (state vars,
//     screen-internal functions, `value_of(...)`, `requested(...)`,
//     `request_count(...)`).
//   - A predicate form (`SeenPredicate`, `OnPredicate`) wrapped in `Expression`.
//   - A `NotExpr` containing any of the above.
export interface ExpectStmt extends NodeBase {
  type: 'ExpectStmt';
  expr: Expr;
}

// Predicate forms expressible only inside `expect` / `expect not`. They look
// like keyword + argument (no parens) but are stored as Expression nodes so
// they can be negated and combined with the rest of the expression evaluator.
export interface SeenPredicate extends NodeBase {
  type: 'SeenPredicate';
  text: string;
}

export interface OnPredicate extends NodeBase {
  type: 'OnPredicate';
  screenName: string;
}

export interface TapStmt extends NodeBase {
  type: 'TapStmt';
  label: string;
}

export interface ChangeStmt extends NodeBase {
  type: 'ChangeStmt';
  varName: string;
  value: Expr;
}

export interface SubmitStmt extends NodeBase {
  type: 'SubmitStmt';
  varName: string;
}

export interface ToggleStmt extends NodeBase {
  type: 'ToggleStmt';
  varName: string;
}

export interface SlideStmt extends NodeBase {
  type: 'SlideStmt';
  varName: string;
  value: Expr;
}

export interface MockFetchBlock extends NodeBase {
  type: 'MockFetchBlock';
  entries: { url: string; response: MockFetchResponse }[];
}

export type MockFetchResponse =
  | { kind: 'ok'; value: Expr }
  | { kind: 'error'; message: string };

export interface MockEveryBlock extends NodeBase {
  type: 'MockEveryBlock';
  advances: { milliseconds: number }[];
}

// v0.19 — `snapshot "<name>"` test-scope verb. Captures the current rendered
// tree as a deterministic text representation, stored as a golden file. Q3
// lock: text-tree only; image/golden deferred to v0.20+.
// Q4c lock: snapshots capture the spring's target value, not intermediate
// frames (deterministic-by-construction). Q5-serializer: text-tree includes
// node identity + branch/list structure + component names + bound layout
// properties + transition/spring state — Session 2 ships a minimal
// visible-strings-only stub; Session 3 graduates to the full Q5 scope.
export interface SnapshotStmt extends NodeBase {
  type: 'SnapshotStmt';
  name: string;
}

// v0.19 — `mock now: <iso8601>` ambient-scope test-scope statement. Sets
// the test-scope override for `now()` to a fixed timestamp (Q4 + Q6
// scoping: ambient — applies for the rest of the test body or enclosing
// mock block).
export interface MockNowStmt extends NodeBase {
  type: 'MockNowStmt';
  iso8601: string;
}

// v0.19 — `freeze_time: <iso8601>:` block-form test-scope statement
// (Q6 lock: unambiguous block-extent; `:` opens an indented body, freeze
// ends at dedent). Q4b: `mock every: advance` inside a freeze advances
// both the every-block scheduler and the frozen `now()` value forward
// together — both clocks move with one consistent mental model.
export interface FreezeTimeBlock extends NodeBase {
  type: 'FreezeTimeBlock';
  iso8601: string;
  body: TestStatement[];
}
