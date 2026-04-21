#!/usr/bin/env tsx
// Adds the transpile.error_category field to every sidecar under
// tests/v*/outputs/*.json. Idempotent: safe to re-run.
//
// Background: docs/private/50 (transpile-metric audit) found 42% of recorded
// transpile fails across v0.8.1–v0.10 were infrastructure bugs silently
// counted as model output quality. docs/private/53 retrospective calls for
// splitting transpile.passed==false into {model_error, runner_error,
// transpiler_crash}. grade.ts now emits error_category inline; this script
// backfills historical results so the whole sidecar corpus is bucketed.
//
// Uses categoriseTranspileError from grade.ts so backfill and live runner
// produce identical classifications from identical inputs.
//
// Usage: npx tsx backfill-error-category.ts

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { categoriseTranspileError, TranspileErrorCategory } from './grade.js';

const here = dirname(fileURLToPath(import.meta.url));
const testsRoot = resolve(here, '..');

type Sidecar = {
  transpile?: {
    attempted: boolean;
    extracted_code: boolean;
    passed: boolean;
    error: string | null;
    error_category?: TranspileErrorCategory;
    igni_lines: number;
  };
  [k: string]: unknown;
};

function findSidecars(root: string): string[] {
  const hits: string[] = [];
  for (const entry of readdirSync(root)) {
    // Only scan version-prefixed directories (v0.8, v0.10-preship, etc.).
    if (!entry.startsWith('v')) continue;
    const outputsDir = join(root, entry, 'outputs');
    let stat;
    try { stat = statSync(outputsDir); } catch { continue; }
    if (!stat.isDirectory()) continue;
    for (const f of readdirSync(outputsDir)) {
      if (f.endsWith('.json')) hits.push(join(outputsDir, f));
    }
  }
  return hits.sort();
}

function main(): void {
  const files = findSidecars(testsRoot);

  let touched = 0;
  let already = 0;
  let missing = 0;

  for (const file of files) {
    const json = JSON.parse(readFileSync(file, 'utf8')) as Sidecar;
    if (!json.transpile) {
      missing++;
      continue;
    }
    const { extracted_code, passed, error } = json.transpile;
    const computed = categoriseTranspileError(extracted_code, passed, error);
    if (json.transpile.error_category === computed) {
      already++;
      continue;
    }
    json.transpile.error_category = computed;
    writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
    touched++;
  }

  console.log(
    `backfill complete: ${touched} updated, ${already} already current, ` +
    `${missing} skipped (no transpile block). ${files.length} total sidecars.`
  );
}

main();
