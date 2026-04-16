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

export type Expr = NumberLit | StringLit | Ident | BinaryExpr | UnaryExpr | IsExpr | LambdaExpr | EqualityExpr | InExpr | ListLit | ObjectLit | FieldAccess | IndexAccess | FunctionCall;

// -- Properties and events --

export interface Property extends NodeBase {
  name: string;
  value: Expr;
}

export interface EventHandler extends NodeBase {
  event: string;
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

export type ScreenItem = VariableDecl | UINode | FunctionDef;

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

export interface Program extends NodeBase {
  type: 'Program';
  screens: Screen[];
  components: ComponentDef[];
  shared: VariableDecl[];
}
