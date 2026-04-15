#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transpileCheck } from './grade.js';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const TRANSPILER_CLI = resolve(THIS_DIR, '../../transpiler/src/cli.ts');

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('usage: tsx regrade.ts <json-path> [<json-path> ...]');
  process.exit(1);
}

for (const jsonPath of targets) {
  const absJson = resolve(jsonPath);
  const mdPath = absJson.replace(/\.json$/, '.md');
  const meta = JSON.parse(readFileSync(absJson, 'utf8'));
  const raw = readFileSync(mdPath, 'utf8');
  meta.transpile = transpileCheck(raw, TRANSPILER_CLI);
  writeFileSync(absJson, JSON.stringify(meta, null, 2));
  const t = meta.transpile;
  const status = t.passed ? '✓' : t.extracted_code ? '✗' : '—';
  console.log(`${status} ${absJson.split('/').slice(-2).join('/')} (${t.igni_lines}L)${t.error ? ' — ' + t.error.split('\n')[0] : ''}`);
}
