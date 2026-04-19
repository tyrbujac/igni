#!/usr/bin/env tsx
// Re-runs the transpile grader on every *.md / *.json pair in a directory
// using the current grade.ts logic. Use after changing the extractor or
// transpiler to retro-fit historical runs without re-hitting provider APIs.
//
// Usage: npx tsx backfill-transpile.ts <outputs-dir>

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { transpileCheck } from './grade.js';

const here = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(here, '..', '..', 'transpiler', 'src', 'cli.ts');

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: npx tsx backfill-transpile.ts <outputs-dir>');
  process.exit(1);
}

const abs = resolve(dir);
const files = readdirSync(abs).filter(f => f.endsWith('.json'));

let updated = 0;
let skipped = 0;

for (const f of files) {
  const jsonPath = join(abs, f);
  const mdPath = jsonPath.replace(/\.json$/, '.md');
  const meta = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  let output: string;
  try {
    output = readFileSync(mdPath, 'utf-8');
  } catch {
    console.warn(`  ! ${f}: no matching .md output`);
    skipped++;
    continue;
  }
  const prev = meta.transpile;
  const next = transpileCheck(output, cliPath);
  meta.transpile = next;
  writeFileSync(jsonPath, JSON.stringify(meta, null, 2) + '\n');
  const prevLabel = prev?.passed ? 'pass' : (prev?.extracted_code === false ? 'no-extract' : 'fail');
  const nextLabel = next.passed ? 'pass' : (next.extracted_code === false ? 'no-extract' : 'fail');
  console.log(`  ${f}: ${prevLabel} → ${nextLabel}`);
  updated++;
}

console.log(`\ndone. updated=${updated} skipped=${skipped} total=${files.length}`);
