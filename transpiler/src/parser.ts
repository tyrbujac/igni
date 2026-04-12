import { Token, TokenType } from './tokens.js';
import {
  Program, Screen, ScreenItem, VariableDecl, UINode,
  Layout, LabelNode, ButtonNode, InputNode, ToggleNode, IfNode,
  Property, EventHandler, FunctionDef, FunctionCall, Statement, EachNode,
  NavigateTo, NavigateBack, ComponentDef, ComponentInvocation,
  Assignment, Expr, IsExpr, BinaryExpr, NumberLit, StringLit, Ident,
  ListLit, ObjectLit, FieldAccess,
} from './ast.js';

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const screens: Screen[] = [];
    const components: ComponentDef[] = [];
    const shared: VariableDecl[] = [];
    while (!this.check(TokenType.EOF)) {
      if (this.check(TokenType.Component)) {
        components.push(this.parseComponentDef());
      } else if (this.check(TokenType.Shared)) {
        shared.push(...this.parseSharedBlock());
      } else {
        screens.push(this.parseScreen());
      }
    }
    return { type: 'Program', screens, components, shared };
  }

  private parseSharedBlock(): VariableDecl[] {
    this.consume(TokenType.Shared, 'Expected "shared"');
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const vars: VariableDecl[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      vars.push(this.parseVariableDecl());
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return vars;
  }

  // -- Top-level --

  private parseScreen(): Screen {
    this.consume(TokenType.Screen, 'Expected "screen"');
    const name = this.consume(TokenType.Identifier, 'Expected screen name').value;
    const params: string[] = [];
    if (this.check(TokenType.LParen)) {
      this.advance();
      if (!this.check(TokenType.RParen)) {
        params.push(this.consume(TokenType.Identifier, 'Expected parameter name').value);
        while (this.check(TokenType.Comma)) {
          this.advance();
          params.push(this.consume(TokenType.Identifier, 'Expected parameter name').value);
        }
      }
      this.consume(TokenType.RParen, 'Expected ")"');
    }
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const body = this.parseScreenBody();
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'Screen', name, params, body };
  }

  private parseScreenBody(): ScreenItem[] {
    const items: ScreenItem[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      if (
        this.check(TokenType.Identifier) &&
        this.peek(1)?.type === TokenType.Equals
      ) {
        items.push(this.parseVariableDecl());
      } else if (
        this.check(TokenType.Identifier) &&
        this.peek(1)?.type === TokenType.LParen
      ) {
        items.push(this.parseFunctionDef());
      } else {
        items.push(this.parseUINode());
      }
    }
    return items;
  }

  // -- Variable declarations --

  private parseVariableDecl(): VariableDecl {
    const name = this.consume(TokenType.Identifier, 'Expected variable name').value;
    this.consume(TokenType.Equals, 'Expected "="');
    const value = this.parseExpr();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'VariableDecl', name, value };
  }

  // -- UI nodes --

  private parseUINode(): UINode {
    const token = this.current();
    switch (token.type) {
      case TokenType.Layout: return this.parseLayout();
      case TokenType.Label:  return this.parseLabel();
      case TokenType.Button: return this.parseButton();
      case TokenType.Input:  return this.parseInput();
      case TokenType.Toggle: return this.parseToggle();
      case TokenType.If:     return this.parseIf();
      case TokenType.Each:   return this.parseEach();
      case TokenType.Spinner:
        this.advance();
        this.consume(TokenType.Newline, 'Expected newline');
        return { type: 'Spinner' };
      case TokenType.Identifier:
        if (token.value[0] >= 'A' && token.value[0] <= 'Z') {
          return this.parseComponentInvocation();
        }
        return this.error(`Unexpected token "${token.value}" — expected a UI element`);
      default:
        return this.error(`Unexpected token "${token.value}" — expected a UI element`);
    }
  }

  private parseLayout(): Layout {
    this.consume(TokenType.Layout, 'Expected "layout"');
    const dirToken = this.consume(TokenType.Identifier, 'Expected direction (vertical/horizontal)');
    const direction = dirToken.value as 'vertical' | 'horizontal';
    const { properties } = this.parseArgs();
    this.consume(TokenType.Colon, 'Expected ":" to open block');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const children: UINode[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      children.push(this.parseUINode());
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'Layout', direction, properties, children };
  }

  private parseLabel(): LabelNode {
    this.consume(TokenType.Label, 'Expected "label"');
    const value = this.parseExpr();
    const { properties } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Label', value, properties };
  }

  private parseButton(): ButtonNode {
    this.consume(TokenType.Button, 'Expected "button"');
    const text = this.parseExpr();
    const { properties, events } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Button', text, properties, events };
  }

  private parseInput(): InputNode {
    this.consume(TokenType.Input, 'Expected "input"');
    const allProps = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp || bindProp.value.type !== 'Ident') {
      return this.error('input requires bind: <variable>');
    }
    return {
      type: 'Input',
      bind: bindProp.value.name,
      properties: allProps.filter(p => p.name !== 'bind'),
    };
  }

  private parseToggle(): ToggleNode {
    this.consume(TokenType.Toggle, 'Expected "toggle"');
    const allProps = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp || bindProp.value.type !== 'Ident') {
      return this.error('toggle requires bind: <variable>');
    }
    return {
      type: 'Toggle',
      bind: bindProp.value.name,
      properties: allProps.filter(p => p.name !== 'bind'),
    };
  }

  private parsePropsNoPositional(): Property[] {
    const props = [this.parseProperty()];
    while (this.check(TokenType.Comma)) {
      this.advance();
      props.push(this.parseProperty());
    }
    return props;
  }

  private parseEach(): EachNode {
    this.consume(TokenType.Each, 'Expected "each"');
    const variable = this.consume(TokenType.Identifier, 'Expected iteration variable').value;
    this.consume(TokenType.In, 'Expected "in"');
    const list = this.parseExpr();
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const children: UINode[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      children.push(this.parseUINode());
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'Each', variable, list, children };
  }

  private parseComponentDef(): ComponentDef {
    this.consume(TokenType.Component, 'Expected "component"');
    const name = this.consume(TokenType.Identifier, 'Expected component name').value;
    this.consume(TokenType.LParen, 'Expected "("');
    const params: string[] = [];
    if (!this.check(TokenType.RParen)) {
      params.push(this.consume(TokenType.Identifier, 'Expected parameter name').value);
      while (this.check(TokenType.Comma)) {
        this.advance();
        params.push(this.consume(TokenType.Identifier, 'Expected parameter name').value);
      }
    }
    this.consume(TokenType.RParen, 'Expected ")"');
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const body: UINode[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      body.push(this.parseUINode());
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'ComponentDef', name, params, body };
  }

  private parseComponentInvocation(): ComponentInvocation {
    const name = this.consume(TokenType.Identifier, 'Expected component name').value;
    const args: Expr[] = [];
    const properties: Property[] = [];
    const events: EventHandler[] = [];

    // First positional arg
    if (!this.check(TokenType.Newline) && !this.check(TokenType.Comma)) {
      args.push(this.parseExpr());
    }

    // Rest: positional args, named props, or events
    while (this.check(TokenType.Comma)) {
      this.advance();
      if (this.check(TokenType.On)) {
        events.push(this.parseEventHandler());
      } else if (
        this.check(TokenType.Identifier) &&
        this.peek(1)?.type === TokenType.Colon
      ) {
        properties.push(this.parseProperty());
      } else {
        args.push(this.parseExpr());
      }
    }

    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'ComponentInvocation', name, args, properties, events };
  }

  private parseIf(): IfNode {
    this.consume(TokenType.If, 'Expected "if"');
    const condition = this.parseExpr();
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const then: UINode[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      then.push(this.parseUINode());
    }
    this.consume(TokenType.Dedent, 'Expected dedent');

    const elseIfs: { condition: Expr; body: UINode[] }[] = [];
    let else_: UINode[] | null = null;

    while (this.check(TokenType.Else)) {
      this.advance(); // consume else
      if (this.check(TokenType.If)) {
        this.advance(); // consume if
        const cond = this.parseExpr();
        this.consume(TokenType.Colon, 'Expected ":"');
        this.consume(TokenType.Newline, 'Expected newline');
        this.consume(TokenType.Indent, 'Expected indent');
        const body: UINode[] = [];
        while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
          body.push(this.parseUINode());
        }
        this.consume(TokenType.Dedent, 'Expected dedent');
        elseIfs.push({ condition: cond, body });
      } else {
        this.consume(TokenType.Colon, 'Expected ":"');
        this.consume(TokenType.Newline, 'Expected newline');
        this.consume(TokenType.Indent, 'Expected indent');
        else_ = [];
        while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
          else_.push(this.parseUINode());
        }
        this.consume(TokenType.Dedent, 'Expected dedent');
        break;
      }
    }

    return { type: 'If', condition, then, elseIfs, else_ };
  }

  // -- Arguments: comma-separated properties and events --

  private parseArgs(): { properties: Property[]; events: EventHandler[] } {
    const properties: Property[] = [];
    const events: EventHandler[] = [];
    while (this.check(TokenType.Comma)) {
      this.advance(); // consume comma
      if (this.check(TokenType.On)) {
        events.push(this.parseEventHandler());
      } else {
        properties.push(this.parseProperty());
      }
    }
    return { properties, events };
  }

  private parseProperty(): Property {
    const name = this.consume(TokenType.Identifier, 'Expected property name').value;
    this.consume(TokenType.Colon, 'Expected ":"');
    const value = this.parseExpr();
    return { name, value };
  }

  private parseEventHandler(): EventHandler {
    this.consume(TokenType.On, 'Expected "on"');
    const event = this.consume(TokenType.Identifier, 'Expected event name').value;
    this.consume(TokenType.Colon, 'Expected ":"');
    const action = this.parseStatement();
    return { event, action };
  }

  private parseStatement(): Statement {
    if (this.check(TokenType.Navigate)) {
      return this.parseNavigate();
    }
    if (this.check(TokenType.Shared)) {
      return this.parseSharedAssignment();
    }
    if (this.check(TokenType.Identifier) && this.peek(1)?.type === TokenType.LParen) {
      return this.parseFunctionCall();
    }
    return this.parseAssignment();
  }

  private parseSharedAssignment(): Assignment {
    this.consume(TokenType.Shared, 'Expected "shared"');
    this.consume(TokenType.Dot, 'Expected "."');
    const field = this.consume(TokenType.Identifier, 'Expected field name').value;
    this.consume(TokenType.Equals, 'Expected "="');
    const value = this.parseExpr();
    return { type: 'Assignment', target: 'shared.' + field, value };
  }

  private parseNavigate(): NavigateTo | NavigateBack {
    this.consume(TokenType.Navigate, 'Expected "navigate"');
    const direction = this.consume(TokenType.Identifier, 'Expected "to" or "back"').value;
    if (direction === 'back') {
      return { type: 'NavigateBack' };
    }
    if (direction === 'to') {
      const screen = this.consume(TokenType.Identifier, 'Expected screen name').value;
      let arg: Expr | null = null;
      // Check if there's an argument (not newline, not comma, not colon)
      if (
        !this.check(TokenType.Newline) &&
        !this.check(TokenType.Comma) &&
        !this.check(TokenType.EOF)
      ) {
        arg = this.parseExpr();
      }
      return { type: 'NavigateTo', screen, arg };
    }
    return this.error(`Expected "to" or "back" after "navigate", got "${direction}"`);
  }

  private parseAssignment(): Assignment {
    const target = this.consume(TokenType.Identifier, 'Expected variable name').value;
    this.consume(TokenType.Equals, 'Expected "="');
    const value = this.parseExpr();
    return { type: 'Assignment', target, value };
  }

  private parseFunctionCall(): FunctionCall {
    const name = this.consume(TokenType.Identifier, 'Expected function name').value;
    this.consume(TokenType.LParen, 'Expected "("');
    const args: Expr[] = [];
    if (!this.check(TokenType.RParen)) {
      args.push(this.parseExpr());
      while (this.check(TokenType.Comma)) {
        this.advance();
        args.push(this.parseExpr());
      }
    }
    this.consume(TokenType.RParen, 'Expected ")"');
    return { type: 'FunctionCall', name, args };
  }

  private parseFunctionDef(): FunctionDef {
    const name = this.consume(TokenType.Identifier, 'Expected function name').value;
    this.consume(TokenType.LParen, 'Expected "("');
    const params: string[] = [];
    if (!this.check(TokenType.RParen)) {
      params.push(this.consume(TokenType.Identifier, 'Expected parameter name').value);
      while (this.check(TokenType.Comma)) {
        this.advance();
        params.push(this.consume(TokenType.Identifier, 'Expected parameter name').value);
      }
    }
    this.consume(TokenType.RParen, 'Expected ")"');
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const body: Statement[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      body.push(this.parseStatement());
      this.consume(TokenType.Newline, 'Expected newline');
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'FunctionDef', name, params, body };
  }

  // -- Expressions (with operator precedence) --

  private parseExpr(): Expr {
    return this.parseComparison();
  }

  private parseComparison(): Expr {
    const left = this.parseAdditive();
    if (this.check(TokenType.Is)) {
      this.advance(); // consume 'is'
      const negated = this.check(TokenType.Not);
      if (negated) this.advance(); // consume 'not'
      const word = this.consume(TokenType.Identifier, 'Expected "empty" or "null"').value;
      if (word === 'empty') {
        return { type: 'IsExpr', target: left, check: negated ? 'not empty' : 'empty' } as IsExpr;
      }
      if (word === 'loading') {
        return { type: 'IsExpr', target: left, check: 'loading' } as IsExpr;
      }
      if (word === 'error') {
        return { type: 'IsExpr', target: left, check: 'error' } as IsExpr;
      }
      return this.error(`Unsupported "is" check: ${word}`);
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.check(TokenType.Plus) || this.check(TokenType.Minus)) {
      const op = this.advance().value as '+' | '-';
      const right = this.parseMultiplicative();
      left = { type: 'BinaryExpr', left, op, right } as BinaryExpr;
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parsePrimary();
    while (this.check(TokenType.Star) || this.check(TokenType.Slash)) {
      const op = this.advance().value as '*' | '/';
      const right = this.parsePrimary();
      left = { type: 'BinaryExpr', left, op, right } as BinaryExpr;
    }
    return left;
  }

  private parsePrimary(): Expr {
    if (this.check(TokenType.Not)) {
      this.advance();
      const operand = this.parsePrimary();
      return { type: 'UnaryExpr', op: 'not', operand };
    }
    if (this.check(TokenType.Number)) {
      const tok = this.advance();
      return this.parsePostfix({ type: 'NumberLit', value: parseInt(tok.value, 10) });
    }
    if (this.check(TokenType.String)) {
      const tok = this.advance();
      return this.parsePostfix({ type: 'StringLit', value: tok.value });
    }
    if (this.check(TokenType.Identifier) && this.peek(1)?.type === TokenType.LParen) {
      const call = this.parseFunctionCall();
      return this.parsePostfix(call);
    }
    if (this.check(TokenType.Shared)) {
      this.advance();
      return this.parsePostfix({ type: 'Ident', name: 'shared' });
    }
    if (this.check(TokenType.Identifier)) {
      const tok = this.advance();
      return this.parsePostfix({ type: 'Ident', name: tok.value });
    }
    if (this.check(TokenType.LParen)) {
      this.advance();
      const expr = this.parseExpr();
      this.consume(TokenType.RParen, 'Expected ")"');
      return this.parsePostfix(expr);
    }
    if (this.check(TokenType.LBracket)) {
      return this.parseListLit();
    }
    if (this.check(TokenType.LBrace)) {
      return this.parseObjectLit();
    }
    return this.error(`Unexpected token: "${this.current().value}"`);
  }

  private parsePostfix(expr: Expr): Expr {
    while (this.check(TokenType.Dot)) {
      this.advance(); // consume .
      const field = this.consume(TokenType.Identifier, 'Expected field name').value;
      expr = { type: 'FieldAccess', object: expr, field } as FieldAccess;
    }
    return expr;
  }

  private parseListLit(): ListLit {
    this.consume(TokenType.LBracket, 'Expected "["');
    const elements: Expr[] = [];
    if (!this.check(TokenType.RBracket)) {
      elements.push(this.parseExpr());
      while (this.check(TokenType.Comma)) {
        this.advance();
        if (this.check(TokenType.RBracket)) break; // trailing comma
        elements.push(this.parseExpr());
      }
    }
    this.consume(TokenType.RBracket, 'Expected "]"');
    return { type: 'ListLit', elements };
  }

  private parseObjectLit(): ObjectLit {
    this.consume(TokenType.LBrace, 'Expected "{"');
    const entries: { key: string; value: Expr }[] = [];
    if (!this.check(TokenType.RBrace)) {
      const key = this.consume(TokenType.Identifier, 'Expected key').value;
      this.consume(TokenType.Colon, 'Expected ":"');
      const value = this.parseExpr();
      entries.push({ key, value });
      while (this.check(TokenType.Comma)) {
        this.advance();
        if (this.check(TokenType.RBrace)) break;
        const k = this.consume(TokenType.Identifier, 'Expected key').value;
        this.consume(TokenType.Colon, 'Expected ":"');
        const v = this.parseExpr();
        entries.push({ key: k, value: v });
      }
    }
    this.consume(TokenType.RBrace, 'Expected "}"');
    return { type: 'ObjectLit', entries };
  }

  // -- Helpers --

  private current(): Token {
    return this.tokens[this.pos];
  }

  private peek(offset: number): Token | undefined {
    return this.tokens[this.pos + offset];
  }

  private check(type: TokenType): boolean {
    return this.current().type === type;
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.current().type === type) {
      return this.advance();
    }
    return this.error(`${message} (got "${this.current().value}" [${TokenType[this.current().type]}] at line ${this.current().line})`);
  }

  private error(message: string): never {
    const tok = this.current();
    throw new Error(`Parse error: ${message} at line ${tok.line}, column ${tok.column}`);
  }
}
