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

  // Operators
  Equals,
  Plus,
  Minus,
  Star,
  Slash,

  // Punctuation
  Colon,
  Comma,
  LParen,
  RParen,

  // Structure
  Newline,
  Indent,
  Dedent,
  EOF,
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
};
