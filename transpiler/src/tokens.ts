export enum TokenType {
  // Literals
  Number,
  String,

  // Identifiers and keywords
  Identifier,
  Screen,
  Layout,
  Label,
  Button,
  Input,
  Toggle,
  On,
  If,
  Else,
  Not,
  Is,
  Return,
  Each,
  In,
  Navigate,
  Component,
  Shared,
  Spinner,
  Divider,
  Icon,
  Image,
  Slider,
  Checkbox,
  Dropdown,
  Badge,
  Body,
  Emit,
  And,
  Or,
  With,

  // Operators
  Arrow,
  Equals,
  GreaterThan,
  GreaterEqual,
  LessThan,
  LessEqual,
  Plus,
  Minus,
  Star,
  Slash,

  // Punctuation
  Colon,
  Comma,
  Dot,
  LParen,
  RParen,
  LBracket,
  RBracket,
  LBrace,
  RBrace,

  // Structure
  Newline,
  Indent,
  Dedent,
  EOF,
  Comment,
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  screen: TokenType.Screen,
  layout: TokenType.Layout,
  label: TokenType.Label,
  button: TokenType.Button,
  input: TokenType.Input,
  toggle: TokenType.Toggle,
  on: TokenType.On,
  if: TokenType.If,
  else: TokenType.Else,
  not: TokenType.Not,
  is: TokenType.Is,
  return: TokenType.Return,
  each: TokenType.Each,
  in: TokenType.In,
  navigate: TokenType.Navigate,
  component: TokenType.Component,
  shared: TokenType.Shared,
  spinner: TokenType.Spinner,
  divider: TokenType.Divider,
  icon: TokenType.Icon,
  image: TokenType.Image,
  slider: TokenType.Slider,
  checkbox: TokenType.Checkbox,
  dropdown: TokenType.Dropdown,
  badge: TokenType.Badge,
  emit: TokenType.Emit,
  and: TokenType.And,
  or: TokenType.Or,
  with: TokenType.With,
};
