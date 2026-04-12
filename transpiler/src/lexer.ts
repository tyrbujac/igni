import { Token, TokenType, KEYWORDS } from './tokens.js';

export class Lexer {
  private source: string;
  private pos = 0;
  private line = 1;
  private col = 1;
  private tokens: Token[] = [];
  private indentStack: number[] = [0];

  constructor(source: string) {
    // Normalize line endings
    this.source = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  tokenize(): Token[] {
    while (this.pos < this.source.length) {
      this.scanLine();
    }
    // Emit DEDENTs for remaining indentation levels
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.emit(TokenType.Dedent, '');
    }
    this.emit(TokenType.EOF, '');
    return this.tokens;
  }

  private scanLine(): void {
    // 1. Count leading spaces (indentation)
    let indent = 0;
    while (this.pos < this.source.length && this.source[this.pos] === ' ') {
      indent++;
      this.pos++;
    }

    // 2. Skip blank lines
    if (this.pos >= this.source.length || this.source[this.pos] === '\n') {
      if (this.pos < this.source.length) {
        this.pos++;
        this.line++;
        this.col = 1;
      }
      return;
    }

    // 3. Skip comment lines
    if (this.source[this.pos] === '#') {
      while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
        this.pos++;
      }
      if (this.pos < this.source.length) {
        this.pos++;
        this.line++;
        this.col = 1;
      }
      return;
    }

    // 4. Handle indentation changes
    this.col = indent + 1;
    const current = this.indentStack[this.indentStack.length - 1];

    if (indent > current) {
      this.indentStack.push(indent);
      this.emit(TokenType.Indent, '');
    } else if (indent < current) {
      while (
        this.indentStack.length > 1 &&
        this.indentStack[this.indentStack.length - 1] > indent
      ) {
        this.indentStack.pop();
        this.emit(TokenType.Dedent, '');
      }
      if (this.indentStack[this.indentStack.length - 1] !== indent) {
        this.error('Inconsistent indentation');
      }
    }

    // 5. Tokenize the rest of the line
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      this.skipSpaces();
      if (this.pos >= this.source.length || this.source[this.pos] === '\n') break;

      // Inline comment — skip rest of line
      if (this.source[this.pos] === '#') {
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          this.pos++;
        }
        break;
      }

      this.scanToken();
    }

    // 6. Emit NEWLINE
    this.emit(TokenType.Newline, '\\n');
    if (this.pos < this.source.length) {
      this.pos++; // consume '\n'
      this.line++;
      this.col = 1;
    }
  }

  private scanToken(): void {
    const ch = this.source[this.pos];

    // Numbers
    if (this.isDigit(ch)) {
      this.scanNumber();
      return;
    }

    // Strings
    if (ch === '"') {
      this.scanString();
      return;
    }

    // Identifiers and keywords
    if (this.isAlpha(ch)) {
      this.scanIdentifier();
      return;
    }

    // Single-character tokens
    const singles: Record<string, TokenType> = {
      ':': TokenType.Colon,
      ',': TokenType.Comma,
      '=': TokenType.Equals,
      '+': TokenType.Plus,
      '-': TokenType.Minus,
      '*': TokenType.Star,
      '/': TokenType.Slash,
      '(': TokenType.LParen,
      ')': TokenType.RParen,
    };

    if (ch in singles) {
      this.emit(singles[ch], ch);
      this.pos++;
      this.col++;
      return;
    }

    this.error(`Unexpected character: '${ch}'`);
  }

  private scanNumber(): void {
    const start = this.pos;
    while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
      this.pos++;
      this.col++;
    }
    this.emit(TokenType.Number, this.source.slice(start, this.pos));
  }

  private scanString(): void {
    this.pos++; // consume opening "
    this.col++;
    const start = this.pos;
    while (this.pos < this.source.length && this.source[this.pos] !== '"') {
      if (this.source[this.pos] === '\n') {
        this.error('Unterminated string');
      }
      this.pos++;
      this.col++;
    }
    if (this.pos >= this.source.length) {
      this.error('Unterminated string');
    }
    const value = this.source.slice(start, this.pos);
    this.pos++; // consume closing "
    this.col++;
    this.emit(TokenType.String, value);
  }

  private scanIdentifier(): void {
    const start = this.pos;
    while (
      this.pos < this.source.length &&
      this.isAlphaNumeric(this.source[this.pos])
    ) {
      this.pos++;
      this.col++;
    }
    const value = this.source.slice(start, this.pos);
    const type = KEYWORDS[value] ?? TokenType.Identifier;
    this.emit(type, value);
  }

  private skipSpaces(): void {
    while (this.pos < this.source.length && this.source[this.pos] === ' ') {
      this.pos++;
      this.col++;
    }
  }

  private emit(type: TokenType, value: string): void {
    this.tokens.push({ type, value, line: this.line, column: this.col });
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isAlpha(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
  }

  private isAlphaNumeric(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }

  private error(message: string): never {
    throw new Error(`Lexer error: ${message} at line ${this.line}, column ${this.col}`);
  }
}
