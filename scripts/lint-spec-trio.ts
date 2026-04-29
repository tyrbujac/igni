#!/usr/bin/env tsx
// Lints the spec trio (spec/v<X.Y.Z>.md, -cheatsheet.md, -micro.md) against
// the as-shipped lexer + parser. Catches the synthesis-to-cheatsheet drift
// trap class (4+ instances catalogued in docs/private/117 §4b) at PR time —
// every ```igni fenced code block runs through the Lexer + Parser, and any
// block that fails to parse is flagged with file + line + parse error.
//
// Default mode: scan, report findings, exit 0 if clean / 1 if failures.
// --version <X.Y.Z>  override version detection (default: highest in spec/)
// --quiet            print only summary line
//
// Usage:
//   npx tsx scripts/lint-spec-trio.ts          # lint current version
//   npx tsx scripts/lint-spec-trio.ts -q       # quiet mode
//   npx tsx scripts/lint-spec-trio.ts --version 0.20.0
//
// Background: docs/private/117 §4b — synthesis-to-cheatsheet drift.
// Known false-positive class: cheatsheet "❌ wrong" examples that
// deliberately demonstrate broken syntax. v1 reports them as failures;
// future revisions may add a skip-annotation convention.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Lexer } from '../transpiler/src/lexer.js';
import { Parser } from '../transpiler/src/parser.js';
import { TranspileError } from '../transpiler/src/errors.js';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO = join(HERE, '..');
const SPEC_DIR = join(REPO, 'spec');

type Args = { version: string | null; quiet: boolean };
function parseArgs(argv: string[]): Args {
  const args: Args = { version: null, quiet: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--quiet' || a === '-q') args.quiet = true;
    else if (a === '--version') args.version = argv[++i] ?? null;
    else if (a.startsWith('--version=')) args.version = a.slice('--version='.length);
    else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

type VersionParts = [number, number, number];
function parseVersion(name: string): VersionParts | null {
  const m = name.match(/^v(\d+)\.(\d+)(?:\.(\d+))?$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
}
function compareVersions(a: VersionParts, b: VersionParts): number {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}
function detectCurrentVersion(): string {
  const versions = readdirSync(SPEC_DIR)
    .filter(n => n.endsWith('.md') && !n.includes('-cheatsheet') && !n.includes('-micro'))
    .map(n => n.replace(/\.md$/, ''))
    .map(n => ({ name: n, parts: parseVersion(n) }))
    .filter((x): x is { name: string; parts: VersionParts } => x.parts !== null);
  if (versions.length === 0) throw new Error(`no spec/v*.md files found`);
  versions.sort((a, b) => compareVersions(b.parts, a.parts));
  return versions[0].name.slice(1); // strip leading "v"
}

type Block = { source: string; startLine: number };

// Extracts ```igni fenced code blocks. Returns each block's source text + the
// 1-based line number where the opening ``` lives (so the parser's reported
// line can be offset back into the markdown file).
function extractIgniBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Match ```igni or ```igni followed by trailing whitespace; reject
    // ```igni-something (variant fences) for v1 — keep canonical fence only.
    if (/^```igni\s*$/.test(line)) {
      const fenceLine = i + 1; // 1-based
      const bodyStart = i + 1;
      let j = bodyStart;
      while (j < lines.length && !/^```\s*$/.test(lines[j])) j++;
      if (j < lines.length) {
        const body = lines.slice(bodyStart, j).join('\n');
        blocks.push({ source: body, startLine: fenceLine });
        i = j + 1;
        continue;
      } else {
        // Unterminated fence — record and stop scanning this file.
        blocks.push({ source: lines.slice(bodyStart).join('\n'), startLine: fenceLine });
        break;
      }
    }
    i++;
  }
  return blocks;
}

type Failure = {
  file: string;
  blockStartLine: number;   // markdown line of the ``` opener
  parseLine: number;        // line within the igni source where the parser errored
  parseColumn: number;
  message: string;
  source: string;           // the failing block, for context
};

function attemptParse(source: string): TranspileError | null {
  try {
    new Parser(new Lexer(source).tokenize()).parse();
    return null;
  } catch (err) {
    if (err instanceof TranspileError) return err;
    return new TranspileError((err as Error).message, 1, 1);
  }
}

// A "complete program" starts (after blank/comment lines) with a top-level
// keyword: screen, shared:, theme:, theme dark:, component, test. Anything
// else is a snippet — function def, variable decl, layout fragment, etc.
function isCompleteProgram(source: string): boolean {
  for (const raw of source.split('\n')) {
    const t = raw.trim();
    if (t === '' || t.startsWith('#')) continue;
    return /^(screen\b|shared\s*:|theme\s*:|theme\s+dark\s*:|component\b|test\s)/.test(t);
  }
  return false;
}

// Cheatsheet + micro blocks are usually snippets — function defs, variable
// decls, layout fragments, UI bodies, test bodies. Try parsing as-is first,
// then as a wrapped snippet in each of the canonical contexts the snippet
// might teach. Returns null if any wrapper makes the block parse; returns
// the as-is error (most informative) if all wrappers fail.
function lintBlock(source: string): TranspileError | null {
  const asIs = attemptParse(source);
  if (asIs === null) return null;
  if (isCompleteProgram(source)) return asIs;

  const indent = (s: string, n: number) =>
    s.split('\n').map(l => ' '.repeat(n) + l).join('\n');

  const wrappers: Array<(s: string) => string> = [
    // Screen body — var decls, function defs, every blocks, layout blocks
    (s) => `screen __W:\n${indent(s, 2)}\n`,
    // UI body — label, button, if, each at UI element level
    (s) => `screen __W:\n  layout vertical:\n${indent(s, 4)}\n`,
    // Test body — render, expect, snapshot, mock, freeze_time
    (s) => `test "demo":\n${indent(s, 2)}\n`,
    // Component body
    (s) => `component __C:\n${indent(s, 2)}\n`,
    // Theme body — color tokens, text tokens
    (s) => `theme:\n${indent(s, 2)}\n`,
    // Shared body — variable decls
    (s) => `shared:\n${indent(s, 2)}\n`,
  ];

  for (const wrap of wrappers) {
    if (attemptParse(wrap(source)) === null) return null;
  }
  return asIs;
}

function lintFile(file: string): Failure[] {
  const md = readFileSync(file, 'utf-8');
  const blocks = extractIgniBlocks(md);
  const failures: Failure[] = [];
  for (const block of blocks) {
    if (block.source.trim() === '') continue; // empty block, skip
    const err = lintBlock(block.source);
    if (err === null) continue;
    failures.push({
      file,
      blockStartLine: block.startLine,
      parseLine: err.line,
      parseColumn: err.column,
      message: err.message,
      source: block.source,
    });
  }
  return failures;
}

function relPath(p: string): string {
  return p.startsWith(REPO + '/') ? p.slice(REPO.length + 1) : p;
}

function reportFailure(f: Failure, quiet: boolean): void {
  const fileLine = f.blockStartLine + f.parseLine; // markdown line of the failing igni line
  if (quiet) {
    console.log(`FAIL  ${relPath(f.file)}:${fileLine}  ${f.message.split('\n')[0]}`);
    return;
  }
  console.log('');
  console.log(`  Error: ${f.message}`);
  console.log('');
  console.log(`    ${relPath(f.file)}:${fileLine} (block opens at :${f.blockStartLine}, igni line ${f.parseLine}, col ${f.parseColumn})`);
  // Show the offending igni line + a couple lines of context within the block.
  const blockLines = f.source.split('\n');
  const idx = f.parseLine - 1;
  const start = Math.max(0, idx - 1);
  const end = Math.min(blockLines.length, idx + 2);
  for (let k = start; k < end; k++) {
    const marker = k === idx ? ' >' : '  ';
    console.log(`    ${marker} ${k + 1} | ${blockLines[k]}`);
  }
}

// A failure is "likely real drift" when the parser's error message is
// specific (Dart-reserved keyword, named-token rejection, etc.) rather than
// the generic "snippet doesn't parse standalone" shapes. The classification
// is heuristic — used to surface signal in v1 output, not to filter strictly.
function isLikelyDrift(f: Failure): boolean {
  const m = f.message;
  // Generic "this isn't a complete program" errors — likely snippet noise.
  const genericSnippetPatterns = [
    /^Expected "screen", got/,
    /^Expected indent, got/,
    /^Unexpected token .+ — expected a UI element/,
    /^Expected parameter name, got/,
    /^Expected property name, got/,
    /^Unexpected token: "(on|navigate|emit|every|each|if|return)"$/,
    /^`(expect|render|snapshot|mock)` requires a prior/,
    /^Expected argument name after ","/,
  ];
  return !genericSnippetPatterns.some(p => p.test(m));
}

function main(): void {
  const args = parseArgs(process.argv);
  const version = args.version ?? detectCurrentVersion();
  const trio = [
    join(SPEC_DIR, `v${version}.md`),
    join(SPEC_DIR, `v${version}-cheatsheet.md`),
    join(SPEC_DIR, `v${version}-micro.md`),
  ];
  const failures: Failure[] = [];
  let totalBlocks = 0;
  for (const file of trio) {
    try {
      const md = readFileSync(file, 'utf-8');
      totalBlocks += extractIgniBlocks(md).length;
    } catch {
      console.error(`missing: ${relPath(file)}`);
      process.exit(2);
    }
    failures.push(...lintFile(file));
  }

  const driftFailures = failures.filter(isLikelyDrift);
  const snippetFailures = failures.filter(f => !isLikelyDrift(f));

  if (driftFailures.length > 0) {
    console.log('=== Likely real drift (review and patch) ===');
    for (const f of driftFailures) reportFailure(f, args.quiet);
  }
  if (snippetFailures.length > 0 && !args.quiet) {
    console.log('');
    console.log(`=== ${snippetFailures.length} snippet-context failures (likely teaching examples that don't parse standalone; v1 linter limitation) ===`);
    if (args.quiet === false) {
      // Only print first 3 in non-quiet mode for context; full list available with verbose flag (future).
      for (const f of snippetFailures.slice(0, 3)) reportFailure(f, true);
      if (snippetFailures.length > 3) console.log(`    ... ${snippetFailures.length - 3} more`);
    }
  }
  console.log('');
  const passed = totalBlocks - failures.length;
  console.log(`v${version}: ${passed} / ${totalBlocks} blocks parse cleanly`);
  console.log(`  ${driftFailures.length} likely-drift failures, ${snippetFailures.length} snippet-context failures`);
  // Exit non-zero only on likely-drift (v1 ship bar). Snippet false positives don't block.
  process.exit(driftFailures.length === 0 ? 0 : 1);
}

main();
