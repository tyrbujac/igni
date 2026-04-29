import { Token, TokenType } from './tokens.js';
import { TranspileError, AggregateTranspileError } from './errors.js';
import {
  Program, Screen, ScreenItem, VariableDecl, UINode,
  Layout, LabelNode, ButtonNode, InputNode, ToggleNode, IfNode,
  Property, EventHandler, FunctionDef, FunctionCall, Statement, EachNode,
  NavigateTo, NavigateBack, ComponentDef, ComponentItem, ComponentInvocation,
  LambdaExpr, EqualityExpr, InExpr, ReturnStmt, IfStmt, EachStmt, EveryNode, EmitStmt,
  IconNode, ImageNode, SliderNode, CheckboxNode, DropdownNode, BadgeNode,
  Assignment, Expr, IsExpr, BinaryExpr, NumberLit, StringLit, Ident,
  ListLit, ObjectLit, ObjectUpdate, FieldAccess, IndexAccess,
  ThemeBlock, ThemeTextToken, ThemeTextTokenName, ThemeColorToken, ThemeChromeToken,
  TestBlock, TestStatement, RenderStmt, ExpectStmt,
  TapStmt, ChangeStmt, SubmitStmt, ToggleStmt, SlideStmt,
  MockFetchBlock, MockEveryBlock, MockFetchResponse,
  SnapshotStmt, MockNowStmt, FreezeTimeBlock,
  SeenPredicate, OnPredicate,
} from './ast.js';

const FONT_TOKENS = new Set([
  'pacifico', 'inter', 'source_sans', 'merriweather', 'lora', 'fira_code',
]);
const THEME_TEXT_TOKENS: Set<ThemeTextTokenName> = new Set(['heading', 'body', 'caption']);

export class Parser {
  private tokens: Token[];
  private pos = 0;
  private pendingComments: string[] = [];
  private errors: TranspileError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const start = this.current();
    const screens: Screen[] = [];
    const components: ComponentDef[] = [];
    const shared: VariableDecl[] = [];
    const tests: TestBlock[] = [];
    let theme: ThemeBlock | undefined;
    let themeDark: ThemeBlock | undefined;
    while (!this.check(TokenType.EOF)) {
      const posBefore = this.pos;
      try {
        if (this.check(TokenType.Component)) {
          components.push(this.parseComponentDef());
        } else if (this.check(TokenType.Shared)) {
          shared.push(...this.parseSharedBlock());
        } else if (this.check(TokenType.Theme)) {
          const next = this.parseThemeBlock();
          if (next.dark) {
            if (themeDark) {
              this.errors.push(new TranspileError(
                'Duplicate `theme dark:` block — only one dark-variant theme block is allowed per program.',
                next.loc!.line, next.loc!.column,
              ));
            } else {
              themeDark = next;
            }
          } else {
            if (theme) {
              this.errors.push(new TranspileError(
                'Duplicate `theme:` block — only one (light) theme block is allowed per program.',
                next.loc!.line, next.loc!.column,
              ));
            } else {
              theme = next;
            }
          }
        } else if (this.check(TokenType.Test)) {
          tests.push(this.parseTestBlock());
        } else {
          screens.push(this.parseScreen());
        }
      } catch (e) {
        if (e instanceof TranspileError) {
          this.errors.push(e);
          this.synchronizeTopLevel();
        } else {
          throw e;
        }
      }
      this.assertProgress(posBefore);
    }
    if (this.errors.length > 0) {
      throw new AggregateTranspileError(this.errors);
    }
    return { type: 'Program', screens, components, shared, theme, themeDark, tests, loc: this.loc(start) };
  }

  // v0.18 testing infrastructure. Per `docs/private/112_v018_testing_infrastructure.md`.
  // Parses `test "name":` blocks. Body statements include `render`, event-sim
  // verbs (tap/change/submit/toggle/slide), `expect <bool-expression>` (with
  // `seen` / `on` predicate forms), and `mock fetch:` / `mock every:` blocks.
  private parseTestBlock(): TestBlock {
    const start = this.current();
    this.consume(TokenType.Test, 'Expected "test"');
    const nameTok = this.consume(TokenType.String, 'Expected test name as a string literal — e.g. `test "counter starts at 0":`');
    const name = nameTok.value;
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint('test'));
    const body: TestStatement[] = [];
    let renderSeen = false;
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      const posBefore = this.pos;
      try {
        const stmt = this.parseTestStatement(renderSeen);
        if (stmt.type === 'RenderStmt') renderSeen = true;
        body.push(stmt);
      } catch (e) {
        if (e instanceof TranspileError) {
          this.errors.push(e);
          this.synchronizeLine();
        } else {
          throw e;
        }
      }
      this.assertProgress(posBefore);
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'TestBlock', name, body, loc: this.loc(start) };
  }

  private parseTestStatement(renderSeen: boolean): TestStatement {
    const start = this.current();
    if (!this.check(TokenType.Identifier)) {
      this.error(
        `Expected a test statement — \`render\`, \`tap\`, \`change\`, \`submit\`, \`toggle\`, \`slide\`, \`expect\`, \`snapshot\`, \`freeze_time\`, or \`mock\`. Got "${this.current().value}".`,
      );
    }
    const verb = this.current().value;
    // `mock` blocks (incl. `mock now:`) set up state BEFORE rendering — mocks
    // must be in place when the screen mounts so the initial fetch hits them.
    // `freeze_time:` similarly wraps render context. Everything else requires
    // a prior render: event-sims need a tree to act on; expect/snapshot need
    // widgets/state to assert against.
    const requiresRender = (verbName: string) =>
      ['tap', 'change', 'submit', 'toggle', 'slide', 'expect', 'snapshot'].includes(verbName);
    if (requiresRender(verb) && !renderSeen) {
      this.error(
        `\`${verb}\` requires a prior \`render <Screen>\` in the same test body — add \`render <Screen>\` before this line. ` +
        '(Per doc 112 Q3-locked rule: parse-time check, statically decidable.)',
      );
    }
    if (verb === 'render') {
      return this.parseRenderStmt(start);
    }
    if (verb === 'tap') {
      this.advance();
      const labelTok = this.consume(TokenType.String, 'Expected button label as a string literal — e.g. `tap "Add"`');
      this.consume(TokenType.Newline, 'Expected newline');
      return { type: 'TapStmt', label: labelTok.value, loc: this.loc(start) };
    }
    if (verb === 'change') {
      this.advance();
      const idTok = this.consume(TokenType.Identifier, 'Expected input id (the bound variable name) — e.g. `change draft: "buy milk"`');
      this.consume(TokenType.Colon, 'Expected ":" after input id — e.g. `change draft: "buy milk"`');
      const value = this.parseExpr();
      this.consume(TokenType.Newline, 'Expected newline');
      return { type: 'ChangeStmt', varName: idTok.value, value, loc: this.loc(start) };
    }
    if (verb === 'submit') {
      this.advance();
      const idTok = this.consume(TokenType.Identifier, 'Expected input id — e.g. `submit search`');
      this.consume(TokenType.Newline, 'Expected newline');
      return { type: 'SubmitStmt', varName: idTok.value, loc: this.loc(start) };
    }
    if (verb === 'toggle') {
      this.advance();
      const idTok = this.consume(TokenType.Identifier, 'Expected toggle id — e.g. `toggle dark_mode`');
      this.consume(TokenType.Newline, 'Expected newline');
      return { type: 'ToggleStmt', varName: idTok.value, loc: this.loc(start) };
    }
    if (verb === 'slide') {
      this.advance();
      const idTok = this.consume(TokenType.Identifier, 'Expected slider id — e.g. `slide volume to 0.7`');
      const toTok = this.current();
      if (toTok.type !== TokenType.Identifier || toTok.value !== 'to') {
        this.error(`Expected "to" after slider id — \`slide ${idTok.value} to <value>\`. Got "${toTok.value}".`);
      }
      this.advance();
      const value = this.parseExpr();
      this.consume(TokenType.Newline, 'Expected newline');
      return { type: 'SlideStmt', varName: idTok.value, value, loc: this.loc(start) };
    }
    if (verb === 'expect') {
      return this.parseExpectStmt(start);
    }
    if (verb === 'mock') {
      return this.parseMockBlock(start);
    }
    if (verb === 'snapshot') {
      this.advance();
      const nameTok = this.consume(TokenType.String, 'Expected snapshot name as a string literal — e.g. `snapshot "login_loaded"`');
      this.consume(TokenType.Newline, 'Expected newline');
      return { type: 'SnapshotStmt', name: nameTok.value, loc: this.loc(start) };
    }
    if (verb === 'freeze_time') {
      return this.parseFreezeTimeBlock(start, renderSeen);
    }
    this.error(
      `Unknown test statement verb "${verb}". Valid verbs: \`render\`, \`tap\`, \`change\`, \`submit\`, \`toggle\`, \`slide\`, \`expect\`, \`snapshot\`, \`freeze_time\`, \`mock\`.`,
    );
  }

  // v0.19 — `freeze_time: "<iso8601>":` block-form. The `:` separates the
  // keyword from its timestamp value; the indented body that follows opens
  // the block extent. now() is frozen for everything inside the body; on
  // dedent the freeze ends. Q4b lock: `mock every: advance` inside the body
  // advances both clocks together (codegen-side concern; parser preserves
  // body shape).
  private parseFreezeTimeBlock(start: Token, outerRenderSeen: boolean): FreezeTimeBlock {
    this.advance(); // consume `freeze_time`
    this.consume(TokenType.Colon, 'Expected ":" after `freeze_time`');
    const isoTok = this.consume(TokenType.String, 'Expected ISO 8601 timestamp string — e.g. `freeze_time: "2026-04-28T12:00:00Z"`');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint('freeze_time:'));
    const body: TestStatement[] = [];
    let renderSeen = outerRenderSeen;
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      const posBefore = this.pos;
      try {
        const stmt = this.parseTestStatement(renderSeen);
        if (stmt.type === 'RenderStmt') renderSeen = true;
        body.push(stmt);
      } catch (e) {
        if (e instanceof TranspileError) {
          this.errors.push(e);
          this.synchronizeLine();
        } else {
          throw e;
        }
      }
      this.assertProgress(posBefore);
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'FreezeTimeBlock', iso8601: isoTok.value, body, loc: this.loc(start) };
  }

  private parseRenderStmt(start: Token): RenderStmt {
    this.advance(); // consume `render`
    const screenTok = this.consume(TokenType.Identifier, 'Expected screen or component name after `render` — e.g. `render Counter`');
    const args: { name: string; value: Expr }[] = [];
    // Optional named args: `render Component, name: value, name: value`
    while (this.check(TokenType.Comma)) {
      this.advance();
      // arg name may be `shared.name` or a plain identifier
      let argName: string;
      const nameTok = this.consume(TokenType.Identifier, 'Expected argument name after "," — e.g. `render Profile, user: ada`');
      if (this.check(TokenType.Dot)) {
        this.advance();
        const subTok = this.consume(TokenType.Identifier, 'Expected sub-name after "." in render argument');
        argName = `${nameTok.value}.${subTok.value}`;
      } else {
        argName = nameTok.value;
      }
      this.consume(TokenType.Colon, 'Expected ":" after argument name in render');
      const value = this.parseExpr();
      args.push({ name: argName, value });
    }
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'RenderStmt', screenName: screenTok.value, args, loc: this.loc(start) };
  }

  private parseExpectStmt(start: Token): ExpectStmt {
    this.advance(); // consume `expect`
    // Predicate forms: `seen "<text>"` and `on <Screen>`. May be preceded by
    // `not` (UnaryExpr wrapping the predicate).
    let inverted = false;
    if (this.check(TokenType.Not)) {
      const nextTok = this.peek(1);
      if (nextTok && nextTok.type === TokenType.Identifier && (nextTok.value === 'seen' || nextTok.value === 'on')) {
        this.advance(); // consume `not`
        inverted = true;
      }
    }
    let expr: Expr;
    if (this.check(TokenType.Identifier) && this.current().value === 'seen') {
      const seenTok = this.advance();
      const textTok = this.consume(TokenType.String, 'Expected string literal — e.g. `expect seen "Hello"`');
      const predicate: SeenPredicate = { type: 'SeenPredicate', text: textTok.value, loc: this.loc(seenTok) };
      expr = inverted ? { type: 'UnaryExpr', op: 'not', operand: predicate, loc: this.loc(start) } : predicate;
    } else if (this.check(TokenType.Identifier) && this.current().value === 'on') {
      const onTok = this.advance();
      const screenTok = this.consume(TokenType.Identifier, 'Expected screen name — e.g. `expect on Dashboard`');
      const predicate: OnPredicate = { type: 'OnPredicate', screenName: screenTok.value, loc: this.loc(onTok) };
      expr = inverted ? { type: 'UnaryExpr', op: 'not', operand: predicate, loc: this.loc(start) } : predicate;
    } else {
      // Generic `expect <bool-expression>`
      expr = this.parseExpr();
    }
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'ExpectStmt', expr, loc: this.loc(start) };
  }

  private parseMockBlock(start: Token): MockFetchBlock | MockEveryBlock | MockNowStmt {
    this.advance(); // consume `mock`
    // `every` is a keyword token (TokenType.Every), not Identifier — accept
    // by string value rather than type. `fetch` and `now` are bare
    // Identifiers. Reject anything else by value.
    const kindTok = this.advance();
    if (kindTok.value !== 'fetch' && kindTok.value !== 'every' && kindTok.value !== 'now') {
      this.error(`Expected \`mock fetch:\`, \`mock every:\`, or \`mock now:\` after \`mock\`. Got "${kindTok.value || '<end of line>'}".`);
    }
    this.consume(TokenType.Colon, 'Expected ":"');
    // v0.19 — `mock now:` is single-statement form (ambient-scope, Q6 lock).
    // No indented body; just a string-literal timestamp on the same line.
    if (kindTok.value === 'now') {
      const isoTok = this.consume(TokenType.String, 'Expected ISO 8601 timestamp string — e.g. `mock now: "2026-04-28T12:00:00Z"`');
      this.consume(TokenType.Newline, 'Expected newline');
      return { type: 'MockNowStmt', iso8601: isoTok.value, loc: this.loc(start) };
    }
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint(`mock ${kindTok.value}:`));
    if (kindTok.value === 'fetch') {
      const entries: { url: string; response: MockFetchResponse }[] = [];
      while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
        const urlTok = this.consume(TokenType.String, 'Expected URL string literal — e.g. `"/api/users": { ... }`');
        this.consume(TokenType.Colon, 'Expected ":" after URL string');
        let response: MockFetchResponse;
        if (this.check(TokenType.Identifier) && this.current().value === 'error') {
          this.advance();
          const msgTok = this.consume(TokenType.String, 'Expected error message string — e.g. `error "network timeout"`');
          response = { kind: 'error', message: msgTok.value };
        } else {
          response = { kind: 'ok', value: this.parseExpr() };
        }
        entries.push({ url: urlTok.value, response });
        if (this.check(TokenType.Newline)) this.advance();
      }
      this.consume(TokenType.Dedent, 'Expected dedent');
      return { type: 'MockFetchBlock', entries, loc: this.loc(start) };
    }
    // mock every:
    const advances: { milliseconds: number }[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      if (!this.check(TokenType.Identifier) || this.current().value !== 'advance') {
        this.error(`Expected \`advance <duration>\` inside \`mock every:\`. Got "${this.current().value}".`);
      }
      this.advance();
      if (!this.check(TokenType.Number)) {
        this.error(`advance requires a duration token like "1s", "5s", or "30s"; got "${this.current().value}"`);
      }
      const numTok = this.advance();
      if (!this.check(TokenType.Identifier)) {
        this.error('advance duration must include a unit suffix (ms or s)');
      }
      const suffixTok = this.advance();
      const fullToken = numTok.value + suffixTok.value;
      const ms = this.parseAdvanceDuration(fullToken);
      advances.push({ milliseconds: ms });
      if (this.check(TokenType.Newline)) this.advance();
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'MockEveryBlock', advances, loc: this.loc(start) };
  }

  private parseAdvanceDuration(token: string): number {
    // `mock every: advance <duration>` accepts the same whitelist as
    // `every <duration>:` plus a few coarser tokens for quick fast-forwarding.
    const allowed: Record<string, number> = {
      '16ms': 16,
      '100ms': 100,
      '500ms': 500,
      '1s': 1000,
      '5s': 5000,
      '30s': 30000,
      '60s': 60000,
    };
    if (!(token in allowed)) {
      this.error(`advance duration "${token}" not supported — use "16ms", "100ms", "500ms", "1s", "5s", "30s", or "60s".`);
    }
    return allowed[token];
  }

  // Belt-and-braces: every catch loop that calls synchronizeTopLevel or
  // synchronizeLine must advance the cursor on each iteration. If it didn't,
  // the loop is spinning on the same token — which historically drove the
  // Clima OOM (see docs/private/53). Converts the infinite-loop failure mode
  // into a loud, debuggable error.
  private assertProgress(posBefore: number): void {
    if (this.pos === posBefore) {
      const tok = this.current();
      throw new Error(
        `Parser error-recovery made no progress at token ${tok.type} ` +
        `(line ${tok.line}:${tok.column}). This is a transpiler bug.`
      );
    }
  }

  // Advance past the current logical line: consume tokens until the next
  // Newline (which we also consume, landing at the start of the next
  // statement), or until we hit a structural boundary (Indent/Dedent/EOF)
  // which the caller's body-loop condition will handle.
  private synchronizeLine(): void {
    const startPos = this.pos;
    while (!this.check(TokenType.EOF)) {
      if (this.check(TokenType.Newline)) {
        this.advance();
        return;
      }
      if (this.check(TokenType.Dedent) || this.check(TokenType.Indent)) {
        // Only yield on a structural token after we've made forward progress.
        // Without this guard, a caller whose try/catch sits around a call that
        // cannot parse at the current token (e.g. parseScreenBody called with
        // an Indent on top after the previous statement threw) would loop:
        // parse throws → synchronize no-ops → loop retries → errors grow
        // unbounded → heap OOM. See tests/v0.10/outputs/claude-opus-4-7_cheatsheet_clima.md
        // post-mortem in docs/private/50_transpile_metric_audit.md.
        if (this.pos > startPos) return;
        this.advance();
        continue;
      }
      this.advance();
    }
  }

  // Skip ahead until we find the start of a new top-level declaration
  // (`screen`, `component`, `shared`, or `theme`) or EOF. Used to recover after a
  // header-level parse failure so remaining declarations can still be parsed.
  private synchronizeTopLevel(): void {
    while (!this.check(TokenType.EOF)) {
      if (
        this.check(TokenType.Screen) ||
        this.check(TokenType.Component) ||
        this.check(TokenType.Shared) ||
        this.check(TokenType.Theme)
      ) return;
      this.advance();
    }
  }

  private parseSharedBlock(): VariableDecl[] {
    this.consume(TokenType.Shared, 'Expected "shared"');
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint('shared:'));
    const vars: VariableDecl[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      const posBefore = this.pos;
      try {
        vars.push(this.parseVariableDecl());
      } catch (e) {
        if (e instanceof TranspileError) {
          this.errors.push(e);
          this.synchronizeLine();
        } else {
          throw e;
        }
      }
      this.assertProgress(posBefore);
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return vars;
  }

  private parseThemeBlock(): ThemeBlock {
    const start = this.current();
    this.consume(TokenType.Theme, 'Expected "theme"');
    // v0.20.0: optional `dark` qualifier — `theme dark:`. Lex'd as Identifier
    // here (not a reserved keyword); position-disambiguated immediately after
    // `theme` and before `:`.
    let dark = false;
    if (this.check(TokenType.Identifier) && this.current().value === 'dark') {
      this.advance();
      dark = true;
    }
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint(dark ? 'theme dark:' : 'theme:'));
    let typography: ThemeTextToken[] | undefined;
    let color: ThemeColorToken[] | undefined;
    let scaffold: ThemeChromeToken[] | undefined;
    let appbar: ThemeChromeToken[] | undefined;
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      const posBefore = this.pos;
      try {
        const sub = this.current();
        const subName = sub.value;
        if (sub.type !== TokenType.Identifier) {
          this.error(`Expected theme sub-block name, got "${subName}"`);
        }
        if (subName === 'typography') {
          if (typography !== undefined) this.error('Duplicate `typography:` sub-block in theme');
          typography = this.parseThemeTypographySubBlock();
        } else if (subName === 'text') {
          this.error(
            `theme sub-block \`text:\` was renamed to \`typography:\` in v0.20.1 ` +
            `to disambiguate from the \`color: text:\` token. Use \`theme: typography: heading: font: …\`.`
          );
        } else if (subName === 'color') {
          if (color !== undefined) this.error('Duplicate `color:` sub-block in theme');
          color = this.parseThemeColorSubBlock();
        } else if (subName === 'scaffold') {
          if (scaffold !== undefined) this.error('Duplicate `scaffold:` sub-block in theme');
          scaffold = this.parseThemeChromeSubBlock('scaffold', ['background']);
        } else if (subName === 'appbar') {
          if (appbar !== undefined) this.error('Duplicate `appbar:` sub-block in theme');
          appbar = this.parseThemeChromeSubBlock('appbar', ['background', 'foreground']);
        } else if (subName === 'spacing') {
          this.error(
            `theme \`spacing:\` sub-block is planned for v0.15.1 — not yet live. ` +
            `Currently supported: \`typography:\` (v0.20.1+), \`color:\` (v0.15.0+), \`scaffold:\` / \`appbar:\` (v0.20+).`
          );
        } else {
          this.error(`Unknown theme sub-block "${subName}" — supported: \`typography:\`, \`color:\`, \`scaffold:\`, \`appbar:\`.`);
        }
      } catch (e) {
        if (e instanceof TranspileError) {
          this.errors.push(e);
          this.synchronizeThemeLine();
        } else {
          throw e;
        }
      }
      this.assertProgress(posBefore);
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return {
      type: 'ThemeBlock',
      dark,
      typography: typography ?? [],
      color: color ?? [],
      scaffold: scaffold ?? [],
      appbar: appbar ?? [],
      loc: this.loc(start),
    };
  }

  // v0.20.0: parses `scaffold:` or `appbar:` sub-blocks. Each accepts
  // property: token-reference lines. Inline hex is rejected (same rule
  // as `theme: color:`'s hex-only-via-tokens). `scaffold:` accepts
  // `background:`; `appbar:` accepts `background:` + `foreground:`.
  private parseThemeChromeSubBlock(
    blockName: string,
    allowedProps: ReadonlyArray<'background' | 'foreground'>,
  ): ThemeChromeToken[] {
    this.consume(TokenType.Identifier, `Expected "${blockName}"`);
    this.consume(TokenType.Colon, `Expected ":" after "${blockName}"`);
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint(`theme: ${blockName}:`));
    const tokens: ThemeChromeToken[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      const propTok = this.current();
      if (propTok.type !== TokenType.Identifier) {
        this.error(`Expected property name in \`theme: ${blockName}:\` block, got "${propTok.value}"`);
      }
      const propName = propTok.value;
      if (!(allowedProps as ReadonlyArray<string>).includes(propName)) {
        this.error(
          `Unknown property "${propName}" in \`theme: ${blockName}:\` block. ` +
          `Supported: ${allowedProps.map(p => `\`${p}:\``).join(', ')}.`
        );
      }
      if (tokens.find(t => t.property === propName)) {
        this.error(`Duplicate "${propName}:" in \`theme: ${blockName}:\` block`);
      }
      this.advance();
      this.consume(TokenType.Colon, `Expected ":" after "${propName}"`);
      // Value must be a token reference (Identifier — colour-token name).
      // Inline hex strings rejected — use a `theme: color:` token.
      const valTok = this.current();
      if (valTok.type === TokenType.String) {
        this.error(
          `Inline hex codes are not supported in \`theme: ${blockName}:\` properties. ` +
          `Define a \`theme: color:\` token (e.g. \`my_chrome: "${valTok.value}"\`) and reference it by name here.`
        );
      }
      if (valTok.type !== TokenType.Identifier) {
        this.error(`Expected colour-token name (identifier) for \`${propName}:\`, got "${valTok.value}"`);
      }
      const ref = valTok.value;
      this.advance();
      this.consume(TokenType.Newline, 'Expected newline');
      tokens.push({
        type: 'ThemeChromeToken',
        property: propName as 'background' | 'foreground',
        ref,
        loc: this.loc(propTok),
      });
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return tokens;
  }

  // Recovery inside theme/typography sub-blocks: advance past the current line, then
  // — if the line opened a nested block — skip that block's body too. Does not
  // cross the outer block's Dedent (structural boundary); synchronizeLine would
  // happily walk past it and corrupt the outer position.
  private synchronizeThemeLine(): void {
    while (
      !this.check(TokenType.EOF) &&
      !this.check(TokenType.Dedent) &&
      !this.check(TokenType.Newline)
    ) {
      this.advance();
    }
    if (this.check(TokenType.Newline)) this.advance();
    if (this.check(TokenType.Indent)) {
      this.advance();
      let depth = 1;
      while (depth > 0 && !this.check(TokenType.EOF)) {
        if (this.check(TokenType.Indent)) depth++;
        else if (this.check(TokenType.Dedent)) depth--;
        if (depth > 0) this.advance();
        else { this.advance(); break; }
      }
    }
  }

  private parseThemeTypographySubBlock(): ThemeTextToken[] {
    this.consume(TokenType.Identifier, 'Expected "typography"'); // already verified by caller
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint('typography:'));
    const tokens: ThemeTextToken[] = [];
    const seen = new Set<string>();
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      const posBefore = this.pos;
      try {
        const nameTok = this.current();
        if (nameTok.type !== TokenType.Identifier) {
          this.error(`Expected typography token name, got "${nameTok.value}"`);
        }
        const name = nameTok.value;
        this.advance();
        if (this.check(TokenType.Dot)) {
          this.error(
            `typography token \`${name}.small\` is not a theme entry — \`heading.small\` is a size variant ` +
            `that inherits from \`heading\`. Only \`heading\`, \`body\`, \`caption\` belong in the theme.`
          );
        }
        if (!THEME_TEXT_TOKENS.has(name as ThemeTextTokenName)) {
          this.error(
            `Unknown typography token \`${name}\` — only \`heading\`, \`body\`, \`caption\` are supported.`
          );
        }
        if (seen.has(name)) {
          this.error(`Duplicate typography token \`${name}\`.`);
        }
        seen.add(name);
        this.consume(TokenType.Colon, 'Expected ":"');
        const props: Property[] = [this.parseProperty()];
        while (this.check(TokenType.Comma)) {
          this.advance();
          props.push(this.parseProperty());
        }
        this.consume(TokenType.Newline, 'Expected newline');

        let font: string | undefined;
        for (const p of props) {
          const pLoc = p.loc ?? this.loc(nameTok);
          if (p.name === 'font') {
            const vLoc = p.value.loc ?? pLoc;
            if (p.value.type !== 'Ident') {
              throw new TranspileError(
                `typography \`${name}\`: font value must be a bare token (e.g. \`pacifico\`), not a string or expression.`,
                vLoc.line, vLoc.column,
              );
            }
            const fontName = (p.value as Ident).name;
            if (!FONT_TOKENS.has(fontName)) {
              throw new TranspileError(
                `Unknown font \`${fontName}\` — v0.12.1 supports: pacifico, inter, source_sans, merriweather, lora, fira_code.`,
                vLoc.line, vLoc.column,
              );
            }
            font = fontName;
          } else if (p.name === 'size' || p.name === 'weight' || p.name === 'color') {
            throw new TranspileError(
              `typography \`${name}\`: \`${p.name}:\` is not live in v0.12.1 — only \`font:\` is supported.`,
              pLoc.line, pLoc.column,
            );
          } else {
            throw new TranspileError(
              `typography \`${name}\`: unknown property \`${p.name}:\`. Only \`font:\` is supported in v0.12.1.`,
              pLoc.line, pLoc.column,
            );
          }
        }
        tokens.push({
          type: 'ThemeTextToken',
          token: name as ThemeTextTokenName,
          font,
          loc: this.loc(nameTok),
        });
      } catch (e) {
        if (e instanceof TranspileError) {
          this.errors.push(e);
          this.synchronizeThemeLine();
        } else {
          throw e;
        }
      }
      this.assertProgress(posBefore);
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return tokens;
  }

  // v0.15.0: theme: color: <token>: "<hex>"
  // <token> accepts any lower-case identifier (underscores allowed). Built-in
  // names (brand/subtle/danger/etc.) are valid as overrides; other names are
  // user-defined tokens that codegen treats the same way.
  // <hex> is "#RRGGBB" or "#RGB". Anything else is a parse error.
  private parseThemeColorSubBlock(): ThemeColorToken[] {
    this.consume(TokenType.Identifier, 'Expected "color"');
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint('color:'));
    const tokens: ThemeColorToken[] = [];
    const seen = new Set<string>();
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      const posBefore = this.pos;
      try {
        const nameTok = this.current();
        if (nameTok.type !== TokenType.Identifier) {
          this.error(`Expected theme color token name, got "${nameTok.value}"`);
        }
        const name = nameTok.value;
        if (!/^[a-z][a-z0-9_]*$/.test(name)) {
          this.error(
            `theme color token \`${name}\` must be a lower-case identifier ` +
            `(letters, digits, underscores; starts with a letter). ` +
            `For Figma nested groups, flatten with underscore: e.g. \`brand_border_subtle\`.`
          );
        }
        if (seen.has(name)) {
          this.error(`Duplicate theme color token \`${name}\`.`);
        }
        seen.add(name);
        this.advance();
        this.consume(TokenType.Colon, 'Expected ":"');
        const valueTok = this.current();
        if (valueTok.type !== TokenType.String) {
          throw new TranspileError(
            `theme color \`${name}\`: value must be a hex string like "#RRGGBB" or "#RGB", got ${valueTok.type}.`,
            valueTok.line, valueTok.column,
          );
        }
        const hex = valueTok.value;
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          throw new TranspileError(
            `theme color \`${name}\`: invalid hex \`${hex}\`. Expected "#RRGGBB" (6-digit hex). ` +
            `Shorthand "#RGB" is not supported — use full 6-digit form to keep one canonical syntax.`,
            valueTok.line, valueTok.column,
          );
        }
        this.advance();
        this.consume(TokenType.Newline, 'Expected newline');
        tokens.push({
          type: 'ThemeColorToken',
          name,
          hex,
          loc: this.loc(nameTok),
        });
      } catch (e) {
        if (e instanceof TranspileError) {
          this.errors.push(e);
          this.synchronizeThemeLine();
        } else {
          throw e;
        }
      }
      this.assertProgress(posBefore);
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return tokens;
  }

  // -- Top-level --

  private parseScreen(): Screen {
    const start = this.current();
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
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint(`screen ${name}:`));
    const body = this.parseScreenBody();
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'Screen', name, params, properties, body, loc: this.loc(start) };
  }

  private parseScreenBody(): ScreenItem[] {
    const items: ScreenItem[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      this.drainComments(items);
      if (this.check(TokenType.Dedent) || this.check(TokenType.EOF)) break;
      const posBefore = this.pos;
      try {
        if (this.isVariableDecl()) {
          items.push(this.parseVariableDecl());
        } else if (
          this.check(TokenType.Identifier) &&
          this.peek(1)?.type === TokenType.LParen
        ) {
          items.push(this.parseFunctionDef());
        } else if (this.check(TokenType.If)) {
          items.push(this.parseIf(true));
        } else if (this.check(TokenType.Every)) {
          items.push(this.parseEvery());
        } else {
          items.push(this.parseUINode());
        }
      } catch (e) {
        if (e instanceof TranspileError) {
          this.errors.push(e);
          this.synchronizeLine();
        } else {
          throw e;
        }
      }
      this.assertProgress(posBefore);
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
    const start = this.current();
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
    return { type: 'VariableDecl', name, value, typeHint, loc: this.loc(start) };
  }

  // -- UI nodes --

  private parseUINode(): UINode {
    const token = this.current();
    switch (token.type) {
      case TokenType.Comment:
        this.advance();
        return { type: 'Comment', text: token.value, loc: this.loc(token) };
      case TokenType.Layout: return this.parseLayout();
      case TokenType.Label:  return this.parseLabel();
      case TokenType.Button: return this.parseButton();
      case TokenType.Input:  return this.parseInput();
      case TokenType.Toggle: return this.parseToggle();
      case TokenType.If:     return this.parseIf(false);
      case TokenType.Each:   return this.parseEach();
      case TokenType.Every:
        // v0.14: `every` is a screen-body-only block. Reaching parseUINode
        // means it appeared inside a layout / each / if / button body. Targeted
        // error mirrors the assign-in-UI-body rejection precedent (v1.0
        // criterion-2): emit specific guidance, not the generic UI-element
        // error.
        return this.error(
          '`every <duration>:` blocks must be at screen body scope (peer to function definitions and the screen\'s top-level layout), not inside a `layout`, `each`, `if`, or other UI block.\n\n' +
          '  Move the `every` block above the `layout` line:\n\n' +
          '    screen MyScreen:\n' +
          '      tick = now()\n\n' +
          '      every 1s:\n' +
          '        tick = now()\n\n' +
          '      layout vertical:\n' +
          '        label tick\n'
        );
      case TokenType.Spinner:
        this.advance();
        this.consume(TokenType.Newline, 'Expected newline');
        return { type: 'Spinner', loc: this.loc(token) };
      case TokenType.Divider:
        this.advance();
        this.consume(TokenType.Newline, 'Expected newline');
        return { type: 'Divider', loc: this.loc(token) };
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
          return { type: 'Body', loc: this.loc(token) };
        }
        if (this.isVariableDecl()) {
          return this.error(
            `\`${token.value} = ...\` — assignments aren't allowed inside \`layout\`, \`each\`, or \`if\` UI blocks. UI blocks render; they don't reassign state.\n\n` +
            `  For per-element values inside an \`each\`, use a function:\n\n` +
            `    color_for(item):\n` +
            `      if item is selected:\n` +
            `        return brand\n` +
            `      return subtle\n\n` +
            `    each item in items:\n` +
            `      label item, color: color_for(item)\n\n` +
            `  Or compute the value at screen scope (above the layout block) and read it inline.`
          );
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
    const start = this.current();
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
      // No colon — could be a legitimate empty layout (v0.13 `fill:`/`on
      // touch:` interactive surfaces with no children), or the user forgot
      // the colon and indented children below. Disambiguate by peeking past
      // the newline: if next is Indent, it's the latter — error.
      const colonPos = this.current();
      this.consume(TokenType.Newline, 'Expected newline');
      if (this.check(TokenType.Indent)) {
        throw new TranspileError(
          `Expected ":" — this layout has indented content below, so it needs a colon to attach it. (For an empty layout with no children, leave the next line at the same indent.)`,
          colonPos.line,
          colonPos.column,
        );
      }
    }
    return { type: 'Layout', direction, properties, events, children, loc: this.loc(start) };
  }

  private parseLabel(): LabelNode {
    const start = this.current();
    this.consume(TokenType.Label, 'Expected "label"');
    const value = this.parseExpr();
    const { properties, events } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Label', value, properties, events, loc: this.loc(start) };
  }

  private parseButton(): ButtonNode {
    const start = this.current();
    this.consume(TokenType.Button, 'Expected "button"');
    const text = this.parseExpr();
    const { properties, events } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Button', text, properties, events, loc: this.loc(start) };
  }

  // v0.14.1: bind: accepts simple identifier OR `shared.X` for slider/toggle/
  // checkbox/dropdown. `input` keeps the simple-identifier-only rule because
  // its TextEditingController machinery needs a stable Dart identifier. Each-
  // loop field access (`obj.field`) stays rejected pending a future design
  // that auto-wires through `replace()`.
  private extractBindTarget(value: Expr, primitive: string): string {
    if (value.type === 'Ident') return value.name;
    if (
      value.type === 'FieldAccess' &&
      value.object.type === 'Ident' &&
      value.object.name === 'shared'
    ) {
      if (primitive === 'input') {
        const loc = value.loc ?? this.current();
        throw new TranspileError(
          'input bind: doesn\'t accept `shared.X` directly — input needs a stable local variable for its text controller. Use a local var bridged via on change::\n\n' +
          '    draft = shared.title\n' +
          '    input bind: draft, on change: shared.title = draft',
          loc.line,
          loc.column,
        );
      }
      return `shared.${value.field}`;
    }
    const loc = value.loc ?? this.current();
    throw new TranspileError(
      `${primitive} bind: must be a simple variable name or \`shared.X\`. Field access on objects (e.g. \`obj.field\`) is not yet supported — use the canonical reassignment pattern with \`replace()\`.`,
      loc.line,
      loc.column,
    );
  }

  private parseInput(): InputNode {
    const start = this.current();
    this.consume(TokenType.Input, 'Expected "input"');
    const { properties: allProps, events } = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp) return this.error('input requires bind: <variable>');
    return {
      type: 'Input',
      bind: this.extractBindTarget(bindProp.value, 'input'),
      properties: allProps.filter(p => p.name !== 'bind'),
      events,
      loc: this.loc(start),
    };
  }

  private parseToggle(): ToggleNode {
    const start = this.current();
    this.consume(TokenType.Toggle, 'Expected "toggle"');
    const { properties: allProps, events } = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp) return this.error('toggle requires bind: <variable>');
    return {
      type: 'Toggle',
      bind: this.extractBindTarget(bindProp.value, 'toggle'),
      properties: allProps.filter(p => p.name !== 'bind'),
      events,
      loc: this.loc(start),
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
    const start = this.current();
    this.consume(TokenType.Icon, 'Expected "icon"');
    const name = this.parseExpr();
    const { properties, events } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Icon', name, properties, events, loc: this.loc(start) };
  }

  private parseImage(): ImageNode {
    const start = this.current();
    this.consume(TokenType.Image, 'Expected "image"');
    const url = this.parseExpr();
    const { properties, events } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Image', url, properties, events, loc: this.loc(start) };
  }

  private parseSlider(): SliderNode {
    const start = this.current();
    this.consume(TokenType.Slider, 'Expected "slider"');
    const { properties: allProps, events } = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp) return this.error('slider requires bind: <variable>');
    return { type: 'Slider', bind: this.extractBindTarget(bindProp.value, 'slider'), properties: allProps.filter(p => p.name !== 'bind'), events, loc: this.loc(start) };
  }

  private parseCheckbox(): CheckboxNode {
    const start = this.current();
    this.consume(TokenType.Checkbox, 'Expected "checkbox"');
    const { properties: allProps, events } = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp) return this.error('checkbox requires bind: <variable>');
    return { type: 'Checkbox', bind: this.extractBindTarget(bindProp.value, 'checkbox'), properties: allProps.filter(p => p.name !== 'bind'), events, loc: this.loc(start) };
  }

  private parseDropdown(): DropdownNode {
    const start = this.current();
    this.consume(TokenType.Dropdown, 'Expected "dropdown"');
    const { properties: allProps, events } = this.parsePropsNoPositional();
    this.consume(TokenType.Newline, 'Expected newline');
    const bindProp = allProps.find(p => p.name === 'bind');
    if (!bindProp) return this.error('dropdown requires bind: <variable>');
    return { type: 'Dropdown', bind: this.extractBindTarget(bindProp.value, 'dropdown'), properties: allProps.filter(p => p.name !== 'bind'), events, loc: this.loc(start) };
  }

  private parseBadge(): BadgeNode {
    const start = this.current();
    this.consume(TokenType.Badge, 'Expected "badge"');
    const text = this.parseExpr();
    const { properties, events } = this.parseArgs();
    this.consume(TokenType.Newline, 'Expected newline');
    return { type: 'Badge', text, properties, events, loc: this.loc(start) };
  }

  private parseEach(): EachNode {
    const start = this.current();
    this.consume(TokenType.Each, 'Expected "each"');
    const variable = this.consume(TokenType.Identifier, 'Expected iteration variable').value;
    this.consume(TokenType.In, 'Expected "in"');
    const list = this.parseExpr();

    let paginate: number | undefined;
    if (this.check(TokenType.Comma)) {
      this.advance();
      const ident = this.consume(TokenType.Identifier, 'Expected "paginate"');
      if (ident.value !== 'paginate') {
        return this.error(`Unknown modifier "${ident.value}" on \`each\`. Only \`paginate:\` is supported.`);
      }
      this.consume(TokenType.Colon, 'Expected ":" after "paginate"');
      const numTok = this.consume(TokenType.Number, 'Expected page size after "paginate:"');
      const n = parseInt(numTok.value, 10);
      if (!Number.isFinite(n) || n <= 0) {
        return this.error('`paginate:` requires a positive integer');
      }
      paginate = n;
    }

    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint(`each ${variable} in ...:`));
    const children: UINode[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      children.push(this.parseUINode());
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'Each', variable, list, children, paginate, loc: this.loc(start) };
  }

  private parseComponentDef(): ComponentDef {
    const start = this.current();
    this.consume(TokenType.Component, 'Expected "component"');
    const name = this.consume(TokenType.Identifier, 'Expected component name').value;
    // v0.16: parens optional for no-param components — `component Status:` is
    // legal alongside `component Avatar(url, size):`. Models reach for the
    // paren-less form naturally for components without arguments; requiring
    // empty parens (`component Foo():`) was ceremony Igni didn't need.
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
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint(`component ${name}(...):`));
    const body: ComponentItem[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      const posBefore = this.pos;
      try {
        if (this.isVariableDecl()) {
          body.push(this.parseVariableDecl());
        } else if (this.check(TokenType.If)) {
          body.push(this.parseIf(true));
        } else {
          body.push(this.parseUINode());
        }
      } catch (e) {
        if (e instanceof TranspileError) {
          this.errors.push(e);
          this.synchronizeLine();
        } else {
          throw e;
        }
      }
      this.assertProgress(posBefore);
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'ComponentDef', name, params, body, loc: this.loc(start) };
  }

  private parseComponentInvocation(): ComponentInvocation {
    const start = this.current();
    const name = this.consume(TokenType.Identifier, 'Expected component name').value;
    const args: Expr[] = [];
    const properties: Property[] = [];
    const events: EventHandler[] = [];

    // First positional arg (skip if next is `on` event-handler, `,` or end-of-invocation tokens).
    if (
      !this.check(TokenType.Newline) &&
      !this.check(TokenType.Comma) &&
      !this.check(TokenType.On) &&
      !this.check(TokenType.Colon)
    ) {
      args.push(this.parseExpr());
    }

    // v0.16: when no positional was given, an event handler can directly follow the component
    // name with no comma — e.g. `SearchBar on submit(text): ...`. With a positional, the comma
    // before subsequent attrs is still required (`Stepper value, on increment(amount): ...`).
    if (args.length === 0 && this.check(TokenType.On)) {
      events.push(this.parseEventHandler());
    }

    // Rest: comma-separated positional args, named props, or events.
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
      this.consume(TokenType.Indent, 'Expected indent', this.indentHint(`${name} ...:`));
      while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
        children.push(this.parseUINode());
      }
      this.consume(TokenType.Dedent, 'Expected dedent');
    } else {
      this.consume(TokenType.Newline, 'Expected newline');
    }
    return { type: 'ComponentInvocation', name, args, properties, events, children, loc: this.loc(start) };
  }

  private parseIfBodyItem(allowAssignments: boolean): UINode | VariableDecl {
    if (allowAssignments && this.isVariableDecl()) {
      return this.parseVariableDecl();
    }
    return this.parseUINode();
  }

  private parseIf(allowAssignments: boolean): IfNode {
    const start = this.current();
    this.consume(TokenType.If, 'Expected "if"');
    const condition = this.parseExpr();
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint('if ...:'));
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
        this.consume(TokenType.Indent, 'Expected indent', this.indentHint('else if ...:'));
        const body: (UINode | VariableDecl)[] = [];
        while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
          body.push(this.parseIfBodyItem(allowAssignments));
        }
        this.consume(TokenType.Dedent, 'Expected dedent');
        elseIfs.push({ condition: cond, body });
      } else {
        this.consume(TokenType.Colon, 'Expected ":"');
        this.consume(TokenType.Newline, 'Expected newline');
        this.consume(TokenType.Indent, 'Expected indent', this.indentHint('else:'));
        else_ = [];
        while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
          else_.push(this.parseIfBodyItem(allowAssignments));
        }
        this.consume(TokenType.Dedent, 'Expected dedent');
        break;
      }
    }

    return { type: 'If', condition, then, elseIfs, else_, loc: this.loc(start) };
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
    return { name, value, loc: this.loc(tok) };
  }

  private parseEventHandler(): EventHandler {
    const start = this.current();
    this.consume(TokenType.On, 'Expected "on"');
    const eventTok = this.consumeEventName('Expected event name');
    const event = eventTok.value;

    // v0.16: optional `(name)` or `(_)` after event name names the receiver of an emitted payload.
    // Reserved events (`tap`, `change`, `touch`) are payload-less and reject the parens form here at parse time.
    let parameter: string | null = null;
    if (this.check(TokenType.LParen)) {
      if (event === 'tap' || event === 'touch' || event === 'change') {
        this.error(`Reserved event "${event}" is payload-less; remove the "(${this.peek(1)?.value ?? '...'})" parameter. Reserved events: \`tap\`, \`touch\`, \`change\` — they don't carry data. Use \`bind:\` for value channels or define a custom event.`);
      }
      this.consume(TokenType.LParen, 'Expected "("');
      const paramTok = this.consume(TokenType.Identifier, 'Expected parameter name or "_"');
      parameter = paramTok.value;
      this.consume(TokenType.RParen, 'Expected ")"');
    }

    this.consume(TokenType.Colon, 'Expected ":"');
    const action = this.parseStatement();
    return { event, parameter, action, loc: this.loc(start) };
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
    const start = this.current();
    this.consume(TokenType.Emit, 'Expected "emit"');
    const eventTok = this.consumeEventName('Expected event name after "emit"');
    const event = eventTok.value;
    if (event === 'tap' || event === 'change' || event === 'touch') {
      this.error(`"${event}" is a built-in event name, choose a different name for your custom event`);
    }
    let arg: Expr | null = null;
    if (!this.check(TokenType.Newline) && !this.check(TokenType.Comma) && !this.check(TokenType.RParen) && !this.check(TokenType.Dedent) && !this.check(TokenType.EOF) && !this.check(TokenType.Colon)) {
      arg = this.parseExpr();
    }
    return { type: 'EmitStmt', event, arg, loc: this.loc(start) };
  }

  private parseReturn(): ReturnStmt {
    const start = this.current();
    this.consume(TokenType.Return, 'Expected "return"');
    let value: Expr | null = null;
    if (!this.check(TokenType.Newline)) {
      value = this.parseExpr();
    }
    return { type: 'Return', value, loc: this.loc(start) };
  }

  private parseIfStmt(): IfStmt {
    const start = this.current();
    this.consume(TokenType.If, 'Expected "if"');
    const condition = this.parseExpr();
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint('if ...:'));
    const then: Statement[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      then.push(this.parseStatement());
      if (this.check(TokenType.Newline)) this.advance();
    }
    this.consume(TokenType.Dedent, 'Expected dedent');

    let else_: Statement[] | null = null;
    if (this.check(TokenType.Else)) {
      this.advance();
      if (this.check(TokenType.If)) {
        // `else if` — desugar to `else { if ... }`. Matches parseIf's UI-context
        // handling (line 534) so the spec reads the same in both contexts.
        else_ = [this.parseIfStmt()];
      } else {
        this.consume(TokenType.Colon, 'Expected ":"');
        this.consume(TokenType.Newline, 'Expected newline');
        this.consume(TokenType.Indent, 'Expected indent', this.indentHint('else:'));
        else_ = [];
        while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
          else_.push(this.parseStatement());
          if (this.check(TokenType.Newline)) this.advance();
        }
        this.consume(TokenType.Dedent, 'Expected dedent');
      }
    }

    return { type: 'IfStmt', condition, then, else_, loc: this.loc(start) };
  }

  // `every <duration>:` — recurring-timer block at screen-body scope (v0.14).
  // Body is statements (function-body shape), NOT UI nodes — it reassigns
  // state which the lexical-reactivity rule then re-renders. Multi-block per
  // screen is allowed (each block its own Timer.periodic in codegen).
  // v0.18 widened the whitelist with sub-second tokens (16ms / 100ms / 500ms)
  // per Q-D doc 112: animation frames, scrubbers, fast UIs without arbitrary-
  // ms parsing. Everything else is a parse-time reject pointing at the
  // planned extension path.
  private parseEvery(): EveryNode {
    const start = this.current();
    this.consume(TokenType.Every, 'Expected "every"');

    const allowedTokens = '"16ms", "100ms", "500ms", "1s", "5s", or "30s"';
    if (!this.check(TokenType.Number)) {
      const tok = this.current();
      this.error(`every requires a duration token like ${allowedTokens}; got "${tok.value}"`);
    }
    const numTok = this.advance();
    if (numTok.value.includes('.')) {
      this.error(`duration must be an integer; numeric values are not accepted (use ${allowedTokens})`);
    }
    if (!this.check(TokenType.Identifier)) {
      this.error(`duration must include a unit suffix; v0.18 supports ${allowedTokens}`);
    }
    const suffixTok = this.advance();
    const fullToken = numTok.value + suffixTok.value;
    const allowed: Record<string, number> = {
      '16ms': 16,
      '100ms': 100,
      '500ms': 500,
      '1s': 1000,
      '5s': 5000,
      '30s': 30000,
    };
    if (!(fullToken in allowed)) {
      this.error(`duration "${fullToken}" not supported in v0.18 — use ${allowedTokens}. See ROADMAP for planned extensions.`);
    }
    const milliseconds = allowed[fullToken];

    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint(`every ${fullToken}:`));
    const body: Statement[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      body.push(this.parseStatement());
      if (this.check(TokenType.Newline)) this.advance();
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'Every', milliseconds, body, loc: this.loc(start) };
  }

  private parseEachStmt(): EachStmt {
    const start = this.current();
    this.consume(TokenType.Each, 'Expected "each"');
    const variable = this.consume(TokenType.Identifier, 'Expected variable').value;
    this.consume(TokenType.In, 'Expected "in"');
    const list = this.parseExpr();
    this.consume(TokenType.Colon, 'Expected ":"');
    this.consume(TokenType.Newline, 'Expected newline');
    this.consume(TokenType.Indent, 'Expected indent', this.indentHint(`each ${variable} in ...:`));
    const body: Statement[] = [];
    while (!this.check(TokenType.Dedent) && !this.check(TokenType.EOF)) {
      body.push(this.parseStatement());
      if (this.check(TokenType.Newline)) this.advance();
    }
    this.consume(TokenType.Dedent, 'Expected dedent');
    return { type: 'EachStmt', variable, list, body, loc: this.loc(start) };
  }

  private parseSharedAssignment(): Assignment {
    const start = this.current();
    this.consume(TokenType.Shared, 'Expected "shared"');
    this.consume(TokenType.Dot, 'Expected "."');
    const field = this.consume(TokenType.Identifier, 'Expected field name').value;
    this.consume(TokenType.Equals, 'Expected "="');
    const value = this.parseExpr();
    return { type: 'Assignment', target: 'shared.' + field, value, loc: this.loc(start) };
  }

  private parseNavigate(): NavigateTo | NavigateBack {
    const start = this.current();
    this.consume(TokenType.Navigate, 'Expected "navigate"');
    const direction = this.consume(TokenType.Identifier, 'Expected "to" or "back"').value;
    if (direction === 'back') {
      return { type: 'NavigateBack', loc: this.loc(start) };
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
      return { type: 'NavigateTo', screen, args, loc: this.loc(start) };
    }
    return this.error(`Expected "to" or "back" after "navigate", got "${direction}"`);
  }

  private parseAssignment(): Assignment {
    const start = this.current();
    const target = this.consume(TokenType.Identifier, 'Expected variable name').value;
    this.consume(TokenType.Equals, 'Expected "="');
    const value = this.parseExpr();
    return { type: 'Assignment', target, value, loc: this.loc(start) };
  }

  private parseFunctionCall(): FunctionCall {
    const start = this.current();
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
    return { type: 'FunctionCall', name, args, namedArgs: namedArgs.length > 0 ? namedArgs : undefined, loc: this.loc(start) };
  }

  private parseFunctionDef(): FunctionDef {
    const start = this.current();
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
    return { type: 'FunctionDef', name, params, body, loc: this.loc(start) };
  }

  // -- Expressions (with operator precedence) --

  private parseExpr(): Expr {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): Expr {
    let left = this.parseLogicalAnd();
    while (this.check(TokenType.Or)) {
      const opTok = this.advance();
      const right = this.parseLogicalAnd();
      left = { type: 'BinaryExpr', left, op: 'or', right, loc: this.loc(opTok) } as BinaryExpr;
    }
    return left;
  }

  private parseLogicalAnd(): Expr {
    let left = this.parseComparison();
    while (this.check(TokenType.And)) {
      const opTok = this.advance();
      const right = this.parseComparison();
      left = { type: 'BinaryExpr', left, op: 'and', right, loc: this.loc(opTok) } as BinaryExpr;
    }
    return left;
  }

  private parseComparison(): Expr {
    const left = this.parseAdditive();
    if (this.check(TokenType.Is)) {
      const isTok = this.advance();
      const negated = this.check(TokenType.Not);
      if (negated) this.advance();

      // Keyword checks
      if (this.check(TokenType.Identifier)) {
        const word = this.current().value;
        if (word === 'empty') {
          this.advance();
          return { type: 'IsExpr', target: left, check: negated ? 'not empty' : 'empty', loc: this.loc(isTok) } as IsExpr;
        }
        if (word === 'null') {
          this.advance();
          return { type: 'IsExpr', target: left, check: negated ? 'not null' : 'null', loc: this.loc(isTok) } as IsExpr;
        }
        if (word === 'loading' && !negated) {
          this.advance();
          return { type: 'IsExpr', target: left, check: 'loading', loc: this.loc(isTok) } as IsExpr;
        }
        if (word === 'error' && !negated) {
          this.advance();
          return { type: 'IsExpr', target: left, check: 'error', loc: this.loc(isTok) } as IsExpr;
        }
      }

      // is in / is not in
      if (this.check(TokenType.In)) {
        this.advance();
        const list = this.parseAdditive();
        return { type: 'InExpr', target: left, list, negated, loc: this.loc(isTok) } as InExpr;
      }

      // General equality: is <expr> / is not <expr>
      const right = this.parseAdditive();
      return { type: 'EqualityExpr', left, right, negated, loc: this.loc(isTok) } as EqualityExpr;
    }
    // Comparison operators: >, <, >=, <=
    if (
      this.check(TokenType.GreaterThan) || this.check(TokenType.GreaterEqual) ||
      this.check(TokenType.LessThan) || this.check(TokenType.LessEqual)
    ) {
      const op = this.advance().value as '>' | '<' | '>=' | '<=';
      const right = this.parseAdditive();
      return { type: 'BinaryExpr', left, op, right, loc: left.loc };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.check(TokenType.Plus) || this.check(TokenType.Minus)) {
      const opTok = this.advance();
      const op = opTok.value as '+' | '-';
      const right = this.parseMultiplicative();
      left = { type: 'BinaryExpr', left, op, right, loc: this.loc(opTok) } as BinaryExpr;
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parsePrimary();
    while (this.check(TokenType.Star) || this.check(TokenType.Slash)) {
      const opTok = this.advance();
      const op = opTok.value as '*' | '/';
      const right = this.parsePrimary();
      left = { type: 'BinaryExpr', left, op, right, loc: this.loc(opTok) } as BinaryExpr;
    }
    return left;
  }

  private parsePrimary(): Expr {
    if (this.check(TokenType.Not)) {
      const tok = this.advance();
      const operand = this.parsePrimary();
      return { type: 'UnaryExpr', op: 'not', operand, loc: this.loc(tok) };
    }
    if (this.check(TokenType.Number)) {
      const tok = this.advance();
      return this.parsePostfix({ type: 'NumberLit', value: parseFloat(tok.value), isFloat: tok.value.includes('.'), loc: this.loc(tok) });
    }
    if (this.check(TokenType.String)) {
      const tok = this.advance();
      return this.parsePostfix({ type: 'StringLit', value: tok.value, loc: this.loc(tok) });
    }
    if (this.check(TokenType.Identifier) && this.peek(1)?.type === TokenType.Arrow) {
      const tok = this.advance();
      const param = tok.value;
      this.advance(); // consume =>
      const body = this.parseExpr();
      return { type: 'LambdaExpr', param, body, loc: this.loc(tok) } as LambdaExpr;
    }
    if (this.check(TokenType.Identifier) && this.peek(1)?.type === TokenType.LParen) {
      const call = this.parseFunctionCall();
      return this.parsePostfix(call);
    }
    if (this.check(TokenType.Shared)) {
      const tok = this.advance();
      return this.parsePostfix({ type: 'Ident', name: 'shared', loc: this.loc(tok) });
    }
    if (this.check(TokenType.Identifier)) {
      const tok = this.advance();
      return this.parsePostfix({ type: 'Ident', name: tok.value, loc: this.loc(tok) });
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
        const tok = this.advance(); // consume .
        const field = this.consume(TokenType.Identifier, 'Expected field name').value;
        expr = { type: 'FieldAccess', object: expr, field, loc: this.loc(tok) } as FieldAccess;
      } else {
        const tok = this.advance(); // consume [
        const index = this.parseExpr();
        this.consume(TokenType.RBracket, 'Expected "]"');
        expr = { type: 'IndexAccess', object: expr, index, loc: this.loc(tok) } as IndexAccess;
      }
    }
    return expr;
  }

  private parseListLit(): ListLit {
    const start = this.current();
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
    return { type: 'ListLit', elements, loc: this.loc(start) };
  }

  private parseObjectLit(): ObjectLit | ObjectUpdate {
    const start = this.current();
    this.consume(TokenType.LBrace, 'Expected "{"');

    const updateShape = this.detectObjectUpdate();
    if (updateShape === 'valid') {
      return this.parseObjectUpdateBody(start);
    }
    if (updateShape === 'invalid-call') {
      return this.error('`{ base with ... }` requires the base to be a variable or dot-access chain. Function calls are not allowed at the base — bind the result to a local variable first.');
    }
    if (updateShape === 'invalid-index') {
      return this.error('`{ base with ... }` requires the base to be a variable or dot-access chain. Index access is not allowed at the base — bind the element to a local variable first.');
    }

    const entries: { key: string; value: Expr }[] = [];
    if (!this.check(TokenType.RBrace)) {
      if (this.check(TokenType.With)) return this.error('`with` is a reserved keyword and cannot be used as a field name.');
      const key = this.consume(TokenType.Identifier, 'Expected key').value;
      this.consume(TokenType.Colon, 'Expected ":"');
      const value = this.parseExpr();
      entries.push({ key, value });
      while (this.check(TokenType.Comma)) {
        this.advance();
        if (this.check(TokenType.RBrace)) break;
        if (this.check(TokenType.With)) return this.error('`with` is a reserved keyword and cannot be used as a field name.');
        const k = this.consume(TokenType.Identifier, 'Expected key').value;
        this.consume(TokenType.Colon, 'Expected ":"');
        const v = this.parseExpr();
        entries.push({ key: k, value: v });
      }
    }
    this.consume(TokenType.RBrace, 'Expected "}"');
    return { type: 'ObjectLit', entries, loc: this.loc(start) };
  }

  // Scans forward from the current position (just after `{`) for the
  // pattern `BASE with ...`. Returns 'valid' for Ident/FieldAccess bases,
  // 'invalid-call' if the base includes a function call, 'invalid-index'
  // if it includes index access, or 'no' if no `with` is present at the
  // base-end position.
  private detectObjectUpdate(): 'valid' | 'invalid-call' | 'invalid-index' | 'no' {
    if (!this.check(TokenType.Identifier) && !this.check(TokenType.Shared)) return 'no';
    let i = 1;
    let sawCall = false;
    let sawIndex = false;
    while (true) {
      const tok = this.peek(i);
      if (!tok) return 'no';
      if (tok.type === TokenType.Dot) {
        i++;
        if (this.peek(i)?.type !== TokenType.Identifier) return 'no';
        i++;
        continue;
      }
      if (tok.type === TokenType.LParen) {
        let depth = 1; i++;
        while (depth > 0) {
          const t = this.peek(i);
          if (!t) return 'no';
          if (t.type === TokenType.LParen) depth++;
          else if (t.type === TokenType.RParen) depth--;
          i++;
        }
        sawCall = true;
        continue;
      }
      if (tok.type === TokenType.LBracket) {
        let depth = 1; i++;
        while (depth > 0) {
          const t = this.peek(i);
          if (!t) return 'no';
          if (t.type === TokenType.LBracket) depth++;
          else if (t.type === TokenType.RBracket) depth--;
          i++;
        }
        sawIndex = true;
        continue;
      }
      if (tok.type === TokenType.With) {
        if (sawCall) return 'invalid-call';
        if (sawIndex) return 'invalid-index';
        return 'valid';
      }
      return 'no';
    }
  }

  private parseObjectUpdateBody(start: Token): ObjectUpdate {
    const baseTok = this.check(TokenType.Shared) ? this.advance() : this.consume(TokenType.Identifier, 'Expected base identifier');
    const baseName = baseTok.type === TokenType.Shared ? 'shared' : baseTok.value;
    let base: Ident | FieldAccess = { type: 'Ident', name: baseName, loc: this.loc(baseTok) };
    while (this.check(TokenType.Dot)) {
      const dotTok = this.advance();
      const field = this.consume(TokenType.Identifier, 'Expected field name').value;
      base = { type: 'FieldAccess', object: base, field, loc: this.loc(dotTok) };
    }
    this.consume(TokenType.With, 'Expected "with"');
    const updates: { key: string; value: Expr }[] = [];
    const key = this.consume(TokenType.Identifier, 'Expected override key').value;
    this.consume(TokenType.Colon, 'Expected ":"');
    const value = this.parseExpr();
    updates.push({ key, value });
    while (this.check(TokenType.Comma)) {
      this.advance();
      if (this.check(TokenType.RBrace)) break;
      const k = this.consume(TokenType.Identifier, 'Expected override key').value;
      this.consume(TokenType.Colon, 'Expected ":"');
      const v = this.parseExpr();
      updates.push({ key: k, value: v });
    }
    this.consume(TokenType.RBrace, 'Expected "}"');
    return { type: 'ObjectUpdate', base, updates, loc: this.loc(start) };
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

  private consume(type: TokenType, message: string, hint?: string): Token {
    this.skipComments();
    if (this.current().type === type) {
      return this.advance();
    }
    return this.error(`${message}, got "${this.current().value}"`, hint);
  }

  // Build the "Hint: did you forget to indent the line under `<opener>`?"
  // string passed to consume(Indent, ...). Centralised so the wording stays
  // consistent across the 15 block-opener call sites.
  private indentHint(opener: string): string {
    return `did you forget to indent the line under \`${opener}\`?`;
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

  private loc(token: Token): { line: number; column: number } {
    return { line: token.line, column: token.column };
  }

  private error(message: string, hint?: string): never {
    const tok = this.current();
    throw new TranspileError(message, tok.line, tok.column, hint);
  }
}
