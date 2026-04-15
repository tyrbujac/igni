import { Token, TokenType } from './tokens.js';
import { TranspileError } from './errors.js';
import {
  Program, Screen, ScreenItem, VariableDecl, UINode,
  Layout, LabelNode, ButtonNode, InputNode, ToggleNode, IfNode,
  Property, EventHandler, FunctionDef, FunctionCall, Statement, EachNode,
  NavigateTo, NavigateBack, ComponentDef, ComponentItem, ComponentInvocation,
  LambdaExpr, EqualityExpr, InExpr, ReturnStmt, IfStmt, EachStmt, EmitStmt,
  IconNode, ImageNode, SliderNode, CheckboxNode, DropdownNode, BadgeNode,
  Assignment, Expr, IsExpr, BinaryExpr, NumberLit, StringLit, Ident,
  ListLit, ObjectLit, FieldAccess,
} from './ast.js';

export class Parser {
  private tokens: Token[];
  private pos = 0;
  private pendingComments: string[] = [];

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
    const properties: Property[] = [];
    while (this.check(TokenType.Comma)) {
      this.advance();
      properties.push(this.parseProperty());
    }
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const body = this.parseScreenBody();
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'Screen', name, params, properties, body };
  }

  private parseScreenBody(): ScreenItem[] {
    const items: ScreenItem[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      this.drainComments(items);
      if (this.check(TokenType.Dedent) || this.check(TokenType.EOF)) break;
      if (this.isVariableDecl()) {
        items.push(this.parseVariableDecl());
      } else if (
        this.check(TokenType.Identifier) &&
        this.peek(1)?.type === TokenType.LParen
      ) {
        items.push(this.parseFunctionDef());
      } else if (this.check(TokenType.If)) {
        items.push(this.parseIf(true));
      } else {
        items.push(this.parseUINode());
      }
    }
    return items;
  }

  // -- Variable declarations --

  private isVariableDecl(): boolean {
    if (!this.check(TokenType.Identifier)) return false;
    // name = value
    if (this.peek(1)?.type === TokenType.Equals) return true;
    // name: Type = value
    if (this.peek(1)?.type === TokenType.Colon && this.peek(2)?.type === TokenType.Identifier && this.peek(3)?.type === TokenType.Equals) return true;
    // name: [Type] = value
    if (this.peek(1)?.type === TokenType.Colon && this.peek(2)?.type === TokenType.LBracket && this.peek(3)?.type === TokenType.Identifier && this.peek(4)?.type === TokenType.RBracket && this.peek(5)?.type === TokenType.Equals) return true;
    return false;
  }

  private parseVariableDecl(): VariableDecl {
    const name = this.consume(TokenType.Identifier, 'Expected variable name').value;
    let typeHint: string | undefined;
    if (this.check(TokenType.Colon)) {
      this.advance(); // consume :
      if (this.check(TokenType.LBracket)) {
        this.advance(); // consume [
        const innerType = this.consume(TokenType.Identifier, 'Expected type name').value;
        this.consume(TokenType.RBracket, 'Expected "]"');
        typeHint = `[${innerType}]`;
      } else {
        typeHint = this.consume(TokenType.Identifier, 'Expected type name').value;
      }
    }
    this.consume(TokenType.Equals, 'Expected "="');
    const value = this.parseExpr();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'VariableDecl', name, value, typeHint };
  }

  // -- UI nodes --

  private parseUINode(): UINode {
    const token = this.current();
    switch (token.type) {
      case TokenType.Comment:
        this.advance();
        return { type: 'Comment', text: token.value };
      case TokenType.Layout: return this.parseLayout();
      case TokenType.Label:  return this.parseLabel();
      case TokenType.Button: return this.parseButton();
      case TokenType.Input:  return this.parseInput();
      case TokenType.Toggle: return this.parseToggle();
      case TokenType.If:     return this.parseIf(false);
      case TokenType.Each:   return this.parseEach();
      case TokenType.Spinner:
        this.advance();
        this.consume(TokenType.Newline, 'Expected newline');
        return { type: 'Spinner' };
      case TokenType.Divider:
        this.advance();
        this.consume(TokenType.Newline, 'Expected newline');
        return { type: 'Divider' };
      case TokenType.Icon:    return this.parseIcon();
      case TokenType.Image:   return this.parseImage();
      case TokenType.Slider:  return this.parseSlider();
      case TokenType.Checkbox: return this.parseCheckbox();
      case TokenType.Dropdown: return this.parseDropdown();
      case TokenType.Badge:   return this.parseBadge();
      case TokenType.Emit:
        return this.error(`\`emit\` is only valid as the action of an \`on tap:\`, \`on touch:\`, or \`on change:\` handler. Standalone use is not allowed.`);
      case TokenType.Identifier:
        if (token.value === 'body') {
          this.advance();
          this.consume(TokenType.Newline, 'Expected newline');
          return { type: 'Body' };
        }
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
    const { properties, events } = this.parseArgs();
    const children: UINode[] = [];
    if (this.check(TokenType.Colon)) {
      this.advance(); // consume :
      this.consume(TokenType.Newline, 'Expected newline');
      if (this.check(TokenType.Indent)) {
        this.advance();
        while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
          this.drainComments(children);
          if (this.check(TokenType.Dedent) || this.check(TokenType.EOF)) break;
          children.push(this.parseUINode());
        }
        this.drainComments(children);
        this.consume(TokenType.Dedent, 'Expected dedent');
      }
    } else {
      this.consume(TokenType.Newline, 'Expected newline');
    }
    return { type: 'Layout', direction, properties, events, children };
  }

  private parseLabel(): LabelNode {
    this.consume(TokenType.Label, 'Expected "label"');
    const value = this.parseExpr();
    const { properties, events } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Label', value, properties, events };
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
    const { properties: allProps, events } = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp || bindProp.value.type !== 'Ident') {
      return this.error('input requires bind: <variable>');
    }
    return {
      type: 'Input',
      bind: bindProp.value.name,
      properties: allProps.filter(p => p.name !== 'bind'),
      events,
    };
  }

  private parseToggle(): ToggleNode {
    this.consume(TokenType.Toggle, 'Expected "toggle"');
    const { properties: allProps, events } = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp || bindProp.value.type !== 'Ident') {
      return this.error('toggle requires bind: <variable>');
    }
    return {
      type: 'Toggle',
      bind: bindProp.value.name,
      properties: allProps.filter(p => p.name !== 'bind'),
      events,
    };
  }

  private parsePropsNoPositional(): { properties: Property[]; events: EventHandler[] } {
    const properties: Property[] = [];
    const events: EventHandler[] = [];
    if (this.check(TokenType.On)) {
      events.push(this.parseEventHandler());
    } else {
      properties.push(this.parseProperty());
    }
    while (this.check(TokenType.Comma)) {
      this.advance();
      if (this.check(TokenType.On)) {
        events.push(this.parseEventHandler());
      } else {
        properties.push(this.parseProperty());
      }
    }
    return { properties, events };
  }

  private parseIcon(): IconNode {
    this.consume(TokenType.Icon, 'Expected "icon"');
    const name = this.parseExpr();
    const { properties, events } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Icon', name, properties, events };
  }

  private parseImage(): ImageNode {
    this.consume(TokenType.Image, 'Expected "image"');
    const url = this.parseExpr();
    const { properties, events } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Image', url, properties, events };
  }

  private parseSlider(): SliderNode {
    this.consume(TokenType.Slider, 'Expected "slider"');
    const { properties: allProps, events } = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp || bindProp.value.type !== 'Ident') return this.error('slider requires bind:');
    return { type: 'Slider', bind: bindProp.value.name, properties: allProps.filter(p => p.name !== 'bind'), events };
  }

  private parseCheckbox(): CheckboxNode {
    this.consume(TokenType.Checkbox, 'Expected "checkbox"');
    const { properties: allProps, events } = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp || bindProp.value.type !== 'Ident') return this.error('checkbox requires bind:');
    return { type: 'Checkbox', bind: bindProp.value.name, properties: allProps.filter(p => p.name !== 'bind'), events };
  }

  private parseDropdown(): DropdownNode {
    this.consume(TokenType.Dropdown, 'Expected "dropdown"');
    const { properties: allProps, events } = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp || bindProp.value.type !== 'Ident') return this.error('dropdown requires bind:');
    return { type: 'Dropdown', bind: bindProp.value.name, properties: allProps.filter(p => p.name !== 'bind'), events };
  }

  private parseBadge(): BadgeNode {
    this.consume(TokenType.Badge, 'Expected "badge"');
    const text = this.parseExpr();
    const { properties, events } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Badge', text, properties, events };
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
    const body: ComponentItem[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      if (this.isVariableDecl()) {
        body.push(this.parseVariableDecl());
      } else {
        body.push(this.parseUINode());
      }
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

    // Rest: positional args, named props, or events.
    // Disambiguation: `identifier:` followed by a value is a named arg
    // (`value: weight`), but `identifier:` followed immediately by a newline
    // is a positional arg (`weight`) plus the body-opening colon — so the
    // trailing `:` belongs to the body, not a named arg without its value.
    while (this.check(TokenType.Comma)) {
      this.advance();
      if (this.check(TokenType.On)) {
        events.push(this.parseEventHandler());
      } else if (
        this.check(TokenType.Identifier) &&
        this.peek(1)?.type === TokenType.Colon &&
        this.peek(2)?.type !== TokenType.Newline
      ) {
        properties.push(this.parseProperty());
      } else {
        args.push(this.parseExpr());
      }
    }

    // Wrapper invocation: trailing colon + indented children
    const children: UINode[] = [];
    if (this.check(TokenType.Colon)) {
      this.advance(); // consume :
      this.consume(TokenType.Newline, 'Expected newline');
      this.consume(TokenType.Indent, 'Expected indent');
      while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
        children.push(this.parseUINode());
      }
      this.consume(TokenType.Dedent, 'Expected dedent');
    } else {
      this.consume(TokenType.Newline, 'Expected newline');
    }
    return { type: 'ComponentInvocation', name, args, properties, events, children };
  }

  private parseIfBodyItem(allowAssignments: boolean): UINode | VariableDecl {
    if (allowAssignments && this.isVariableDecl()) {
      return this.parseVariableDecl();
    }
    return this.parseUINode();
  }

  private parseIf(allowAssignments: boolean): IfNode {
    this.consume(TokenType.If, 'Expected "if"');
    const condition = this.parseExpr();
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const then: (UINode | VariableDecl)[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      then.push(this.parseIfBodyItem(allowAssignments));
    }
    this.consume(TokenType.Dedent, 'Expected dedent');

    const elseIfs: { condition: Expr; body: (UINode | VariableDecl)[] }[] = [];
    let else_: (UINode | VariableDecl)[] | null = null;

    while (this.check(TokenType.Else)) {
      this.advance(); // consume else
      if (this.check(TokenType.If)) {
        this.advance(); // consume if
        const cond = this.parseExpr();
        this.consume(TokenType.Colon, 'Expected ":"');
        this.consume(TokenType.Newline, 'Expected newline');
        this.consume(TokenType.Indent, 'Expected indent');
        const body: (UINode | VariableDecl)[] = [];
        while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
          body.push(this.parseIfBodyItem(allowAssignments));
        }
        this.consume(TokenType.Dedent, 'Expected dedent');
        elseIfs.push({ condition: cond, body });
      } else {
        this.consume(TokenType.Colon, 'Expected ":"');
        this.consume(TokenType.Newline, 'Expected newline');
        this.consume(TokenType.Indent, 'Expected indent');
        else_ = [];
        while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
          else_.push(this.parseIfBodyItem(allowAssignments));
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
    // Accept keywords as property names (e.g. label: on checkbox/toggle)
    const tok = this.current();
    if (tok.type === TokenType.Identifier || tok.type === TokenType.Label || tok.type === TokenType.Image || tok.type === TokenType.Icon) {
      this.advance();
    } else {
      this.consume(TokenType.Identifier, 'Expected property name');
    }
    const name = tok.value;
    this.consume(TokenType.Colon, 'Expected ":"');
    const value = this.parseExpr();
    return { name, value };
  }

  private parseEventHandler(): EventHandler {
    this.consume(TokenType.On, 'Expected "on"');
    const event = this.consumeEventName('Expected event name').value;
    this.consume(TokenType.Colon, 'Expected ":"');
    const action = this.parseStatement();
    return { event, action };
  }

  // Accept either an Identifier or a UI-primitive keyword as an event name.
  // Custom events often mirror a primitive (`emit toggle`, `on toggle:`); the
  // spec's only reserved event names are `tap` / `change` / `touch`, which are
  // already lexed as Identifiers.
  private consumeEventName(msg: string): Token {
    const PRIMITIVE_EVENT_NAMES: TokenType[] = [
      TokenType.Label, TokenType.Button, TokenType.Input, TokenType.Toggle,
      TokenType.Spinner, TokenType.Divider, TokenType.Icon, TokenType.Image,
      TokenType.Slider, TokenType.Checkbox, TokenType.Dropdown, TokenType.Badge,
    ];
    const tok = this.peek(0);
    if (tok && (tok.type === TokenType.Identifier || PRIMITIVE_EVENT_NAMES.includes(tok.type))) {
      return this.advance();
    }
    return this.consume(TokenType.Identifier, msg);
  }

  private parseStatement(): Statement {
    if (this.check(TokenType.Navigate)) {
      return this.parseNavigate();
    }
    if (this.check(TokenType.Shared)) {
      return this.parseSharedAssignment();
    }
    if (this.check(TokenType.Return)) {
      return this.parseReturn();
    }
    if (this.check(TokenType.If)) {
      return this.parseIfStmt();
    }
    if (this.check(TokenType.Each)) {
      return this.parseEachStmt();
    }
    if (this.check(TokenType.Emit)) {
      return this.parseEmit();
    }
    if (this.check(TokenType.Identifier) && this.peek(1)?.type === TokenType.LParen) {
      return this.parseFunctionCall();
    }
    return this.parseAssignment();
  }

  private parseEmit(): EmitStmt {
    this.consume(TokenType.Emit, 'Expected "emit"');
    const eventTok = this.consumeEventName('Expected event name after "emit"');
    const event = eventTok.value;
    if (event === 'tap' || event === 'change' || event === 'touch') {
      this.error(`"${event}" is a built-in event name, choose a different name for your custom event`);
    }
    let arg: Expr | null = null;
    if (!this.check(TokenType.Newline) && !this.check(TokenType.Comma) && !this.check(TokenType.RParen) && !this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      arg = this.parseExpr();
    }
    return { type: 'EmitStmt', event, arg };
  }

  private parseReturn(): ReturnStmt {
    this.consume(TokenType.Return, 'Expected "return"');
    let value: Expr | null = null;
    if (!this.check(TokenType.Newline)) {
      value = this.parseExpr();
    }
    return { type: 'Return', value };
  }

  private parseIfStmt(): IfStmt {
    this.consume(TokenType.If, 'Expected "if"');
    const condition = this.parseExpr();
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const then: Statement[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      then.push(this.parseStatement());
      if (this.check(TokenType.Newline)) this.advance();
    }
    this.consume(TokenType.Dedent, 'Expected dedent');

    let else_: Statement[] | null = null;
    if (this.check(TokenType.Else)) {
      this.advance();
      this.consume(TokenType.Colon, 'Expected ":"');
      this.consume(TokenType.Newline, 'Expected newline');
      this.consume(TokenType.Indent, 'Expected indent');
      else_ = [];
      while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
        else_.push(this.parseStatement());
        if (this.check(TokenType.Newline)) this.advance();
      }
      this.consume(TokenType.Dedent, 'Expected dedent');
    }

    return { type: 'IfStmt', condition, then, else_ };
  }

  private parseEachStmt(): EachStmt {
    this.consume(TokenType.Each, 'Expected "each"');
    const variable = this.consume(TokenType.Identifier, 'Expected variable').value;
    this.consume(TokenType.In, 'Expected "in"');
    const list = this.parseExpr();
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent');
    const body: Statement[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      body.push(this.parseStatement());
      if (this.check(TokenType.Newline)) this.advance();
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'EachStmt', variable, list, body };
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
      const args: Expr[] = [];
      // Read comma-separated arguments until newline/EOF
      if (
        !this.check(TokenType.Newline) &&
        !this.check(TokenType.EOF)
      ) {
        args.push(this.parseExpr());
        while (this.check(TokenType.Comma)) {
          this.advance();
          args.push(this.parseExpr());
        }
      }
      return { type: 'NavigateTo', screen, args };
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
    const namedArgs: { name: string; value: Expr }[] = [];
    if (!this.check(TokenType.RParen)) {
      // Check if first arg is named (identifier followed by colon)
      if (this.check(TokenType.Identifier) && this.peek(1)?.type === TokenType.Colon) {
        const argName = this.advance().value;
        this.advance(); // consume :
        namedArgs.push({ name: argName, value: this.parseExpr() });
      } else {
        args.push(this.parseExpr());
      }
      while (this.check(TokenType.Comma)) {
        this.advance();
        if (this.check(TokenType.Identifier) && this.peek(1)?.type === TokenType.Colon) {
          const argName = this.advance().value;
          this.advance(); // consume :
          namedArgs.push({ name: argName, value: this.parseExpr() });
        } else {
          args.push(this.parseExpr());
        }
      }
    }
    this.consume(TokenType.RParen, 'Expected ")"');
    return { type: 'FunctionCall', name, args, namedArgs: namedArgs.length > 0 ? namedArgs : undefined };
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
    const body: Statement[] = [];
    if (this.check(TokenType.Indent)) {
      this.advance();
      while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
        body.push(this.parseStatement());
        if (this.check(TokenType.Newline)) this.advance();
      }
      this.consume(TokenType.Dedent, 'Expected dedent');
    }
    return { type: 'FunctionDef', name, params, body };
  }

  // -- Expressions (with operator precedence) --

  private parseExpr(): Expr {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): Expr {
    let left = this.parseLogicalAnd();
    while (this.check(TokenType.Or)) {
      this.advance();
      const right = this.parseLogicalAnd();
      left = { type: 'BinaryExpr', left, op: 'or', right } as BinaryExpr;
    }
    return left;
  }

  private parseLogicalAnd(): Expr {
    let left = this.parseComparison();
    while (this.check(TokenType.And)) {
      this.advance();
      const right = this.parseComparison();
      left = { type: 'BinaryExpr', left, op: 'and', right } as BinaryExpr;
    }
    return left;
  }

  private parseComparison(): Expr {
    const left = this.parseAdditive();
    if (this.check(TokenType.Is)) {
      this.advance(); // consume 'is'
      const negated = this.check(TokenType.Not);
      if (negated) this.advance();

      // Keyword checks
      if (this.check(TokenType.Identifier)) {
        const word = this.current().value;
        if (word === 'empty') {
          this.advance();
          return { type: 'IsExpr', target: left, check: negated ? 'not empty' : 'empty' } as IsExpr;
        }
        if (word === 'null') {
          this.advance();
          return { type: 'IsExpr', target: left, check: negated ? 'not null' : 'null' } as IsExpr;
        }
        if (word === 'loading' && !negated) {
          this.advance();
          return { type: 'IsExpr', target: left, check: 'loading' } as IsExpr;
        }
        if (word === 'error' && !negated) {
          this.advance();
          return { type: 'IsExpr', target: left, check: 'error' } as IsExpr;
        }
      }

      // is in / is not in
      if (this.check(TokenType.In)) {
        this.advance();
        const list = this.parseAdditive();
        return { type: 'InExpr', target: left, list, negated } as InExpr;
      }

      // General equality: is <expr> / is not <expr>
      const right = this.parseAdditive();
      return { type: 'EqualityExpr', left, right, negated } as EqualityExpr;
    }
    // Comparison operators: >, <, >=, <=
    if (
      this.check(TokenType.GreaterThan) || this.check(TokenType.GreaterEqual) ||
      this.check(TokenType.LessThan) || this.check(TokenType.LessEqual)
    ) {
      const op = this.advance().value as '>' | '<' | '>=' | '<=';
      const right = this.parseAdditive();
      return { type: 'BinaryExpr', left, op, right };
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
      return this.parsePostfix({ type: 'NumberLit', value: parseFloat(tok.value), isFloat: tok.value.includes('.') });
    }
    if (this.check(TokenType.String)) {
      const tok = this.advance();
      return this.parsePostfix({ type: 'StringLit', value: tok.value });
    }
    if (this.check(TokenType.Identifier) && this.peek(1)?.type === TokenType.Arrow) {
      const param = this.advance().value;
      this.advance(); // consume =>
      const body = this.parseExpr();
      return { type: 'LambdaExpr', param, body } as LambdaExpr;
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
    while (this.check(TokenType.Dot) || this.check(TokenType.LBracket)) {
      if (this.check(TokenType.Dot)) {
        this.advance(); // consume .
        const field = this.consume(TokenType.Identifier, 'Expected field name').value;
        expr = { type: 'FieldAccess', object: expr, field } as FieldAccess;
      } else {
        this.advance(); // consume [
        const index = this.parseExpr();
        this.consume(TokenType.RBracket, 'Expected "]"');
        expr = { type: 'IndexAccess', object: expr, index } as any;
      }
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
    // Skip comments when checking for structural tokens
    if (type !== TokenType.Comment) {
      while (this.current().type === TokenType.Comment) {
        this.pendingComments.push(this.advance().value);
      }
    }
    return this.current().type === type;
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  private consume(type: TokenType, message: string): Token {
    this.skipComments();
    if (this.current().type === type) {
      return this.advance();
    }
    return this.error(`${message}, got "${this.current().value}"`);
  }

  private skipComments(): void {
    while (this.current().type === TokenType.Comment) {
      this.pendingComments.push(this.advance().value);
    }
  }

  private drainComments(items: any[]): void {
    for (const text of this.pendingComments) {
      items.push({ type: 'Comment', text });
    }
    this.pendingComments = [];
  }

  private error(message: string): never {
    const tok = this.current();
    throw new TranspileError(message, tok.line, tok.column);
  }
}
