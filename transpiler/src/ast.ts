// -- Expressions --

export interface NumberLit {
  type: 'NumberLit';
  value: number;
  isFloat: boolean;
}

export interface StringLit {
  type: 'StringLit';
  value: string;
}

export interface Ident {
  type: 'Ident';
  name: string;
}

export interface BinaryExpr {
  type: 'BinaryExpr';
  left: Expr;
  op: '+' | '-' | '*' | '/' | '>' | '<' | '>=' | '<=' | 'and' | 'or';
  right: Expr;
}

export interface UnaryExpr {
  type: 'UnaryExpr';
  op: 'not';
  operand: Expr;
}

export interface IsExpr {
  type: 'IsExpr';
  target: Expr;
  check: 'empty' | 'not empty' | 'null' | 'not null' | 'loading' | 'error';
}

export interface ListLit {
  type: 'ListLit';
  elements: Expr[];
}

export interface ObjectLit {
  type: 'ObjectLit';
  entries: { key: string; value: Expr }[];
}

export interface FieldAccess {
  type: 'FieldAccess';
  object: Expr;
  field: string;
}

export interface LambdaExpr {
  type: 'LambdaExpr';
  param: string;
  body: Expr;
}

export interface EqualityExpr {
  type: 'EqualityExpr';
  left: Expr;
  right: Expr;
  negated: boolean;
}

export interface InExpr {
  type: 'InExpr';
  target: Expr;
  list: Expr;
  negated: boolean;
}

export type Expr = NumberLit | StringLit | Ident | BinaryExpr | UnaryExpr | IsExpr | LambdaExpr | EqualityExpr | InExpr | ListLit | ObjectLit | FieldAccess | FunctionCall;

// -- Properties and events --

export interface Property {
  name: string;
  value: Expr;
}

export interface EventHandler {
  event: string;
  action: Statement;
}

// -- Statements --

export interface VariableDecl {
  type: 'VariableDecl';
  name: string;
  value: Expr;
  typeHint?: string;
}

export interface Assignment {
  type: 'Assignment';
  target: string;
  value: Expr;
}

export interface FunctionCall {
  type: 'FunctionCall';
  name: string;
  args: Expr[];
}

export interface NavigateTo {
  type: 'NavigateTo';
  screen: string;
  arg: Expr | null;
}

export interface NavigateBack {
  type: 'NavigateBack';
}

export interface ReturnStmt {
  type: 'Return';
  value: Expr | null;
}

export interface IfStmt {
  type: 'IfStmt';
  condition: Expr;
  then: Statement[];
  else_: Statement[] | null;
}

export interface EachStmt {
  type: 'EachStmt';
  variable: string;
  list: Expr;
  body: Statement[];
}

export type Statement = Assignment | FunctionCall | NavigateTo | NavigateBack | ReturnStmt | IfStmt | EachStmt;

export interface FunctionDef {
  type: 'FunctionDef';
  name: string;
  params: string[];
  body: Statement[];
}

// -- UI nodes --

export interface Layout {
  type: 'Layout';
  direction: 'vertical' | 'horizontal';
  properties: Property[];
  events: EventHandler[];
  children: UINode[];
}

export interface LabelNode {
  type: 'Label';
  value: Expr;
  properties: Property[];
  events: EventHandler[];
}

export interface ButtonNode {
  type: 'Button';
  text: Expr;
  properties: Property[];
  events: EventHandler[];
}

export interface InputNode {
  type: 'Input';
  bind: string;
  properties: Property[];
}

export interface ToggleNode {
  type: 'Toggle';
  bind: string;
  properties: Property[];
}

export interface IfNode {
  type: 'If';
  condition: Expr;
  then: (UINode | VariableDecl)[];
  elseIfs: { condition: Expr; body: (UINode | VariableDecl)[] }[];
  else_: (UINode | VariableDecl)[] | null;
}

export interface EachNode {
  type: 'Each';
  variable: string;
  list: Expr;
  children: UINode[];
}

export interface SpinnerNode {
  type: 'Spinner';
}

export interface DividerNode {
  type: 'Divider';
}

export interface IconNode {
  type: 'Icon';
  name: Expr;
  properties: Property[];
  events: EventHandler[];
}

export interface ImageNode {
  type: 'Image';
  url: Expr;
  properties: Property[];
  events: EventHandler[];
}

export interface SliderNode {
  type: 'Slider';
  bind: string;
  properties: Property[];
  events: EventHandler[];
}

export interface CheckboxNode {
  type: 'Checkbox';
  bind: string;
  properties: Property[];
  events: EventHandler[];
}

export interface DropdownNode {
  type: 'Dropdown';
  bind: string;
  properties: Property[];
  events: EventHandler[];
}

export interface BadgeNode {
  type: 'Badge';
  text: Expr;
  properties: Property[];
  events: EventHandler[];
}

export interface BodyNode {
  type: 'Body';
}

export interface ComponentInvocation {
  type: 'ComponentInvocation';
  name: string;
  args: Expr[];
  properties: Property[];
  events: EventHandler[];
  children: UINode[];
}

export type UINode = Layout | LabelNode | ButtonNode | InputNode | ToggleNode | IfNode | EachNode | SpinnerNode | DividerNode | IconNode | ImageNode | SliderNode | CheckboxNode | DropdownNode | BadgeNode | BodyNode | ComponentInvocation;

// -- Top-level --

export type ScreenItem = VariableDecl | UINode | FunctionDef;

export interface Screen {
  type: 'Screen';
  name: string;
  params: string[];
  body: ScreenItem[];
}

export interface ComponentDef {
  type: 'ComponentDef';
  name: string;
  params: string[];
  body: UINode[];
}

export interface Program {
  type: 'Program';
  screens: Screen[];
  components: ComponentDef[];
  shared: VariableDecl[];
}
