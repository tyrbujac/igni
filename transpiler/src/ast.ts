// -- Expressions --

export interface NumberLit {
  type: 'NumberLit';
  value: number;
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
  op: '+' | '-' | '*' | '/';
  right: Expr;
}

export interface UnaryExpr {
  type: 'UnaryExpr';
  op: 'not';
  operand: Expr;
}

export type Expr = NumberLit | StringLit | Ident | BinaryExpr | UnaryExpr;

// -- Properties and events --

export interface Property {
  name: string;
  value: Expr;
}

export interface EventHandler {
  event: string;
  action: Assignment;
}

// -- Statements --

export interface VariableDecl {
  type: 'VariableDecl';
  name: string;
  value: Expr;
}

export interface Assignment {
  type: 'Assignment';
  target: string;
  value: Expr;
}

// -- UI nodes --

export interface Layout {
  type: 'Layout';
  direction: 'vertical' | 'horizontal';
  properties: Property[];
  children: UINode[];
}

export interface LabelNode {
  type: 'Label';
  value: Expr;
  properties: Property[];
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
  then: UINode[];
  elseIfs: { condition: Expr; body: UINode[] }[];
  else_: UINode[] | null;
}

export type UINode = Layout | LabelNode | ButtonNode | InputNode | ToggleNode | IfNode;

// -- Top-level --

export type ScreenItem = VariableDecl | UINode;

export interface Screen {
  type: 'Screen';
  name: string;
  body: ScreenItem[];
}

export interface Program {
  type: 'Program';
  screens: Screen[];
}
