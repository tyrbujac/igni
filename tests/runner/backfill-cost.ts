#!/usr/bin/env tsx
// Re-computes `cost_usd` on every *.json metadata file in a directory using the
// current pricing.ts table. Use after editing pricing rates or keys to retro-fit
// historical runs without re-hitting APIs.
//
// Usage: npx tsx backfill-cost.ts <outputs-dir>

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { computeCost } from './providers/pricing.js';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: npx tsx backfill-cost.ts <outputs-dir>');
  process.exit(1);
}

const abs = resolve(dir);
const files = readdirSync(abs).filter(f => f.endsWith('.json'));

let updated = 0;
let skipped = 0;
let missing = 0;

for (const f of files) {
  const path = join(abs, f);
  const meta = JSON.parse(readFileSync(path, 'utf-8'));
  if (!meta.model_id || !meta.usage) {
    skipped++;
    continue;
  }
  const next = computeCost(meta.model_id, meta.usage);
  if (next === null) {
    console.warn(`  ! ${f}: no pricing entry for "${meta.model_id}"`);
    missing++;
  }
  const prev = meta.cost_usd ?? null;
  if (prev !== next) {
    meta.cost_usd = next;
    writeFileSync(path, JSON.stringify(meta, null, 2) + '\n');
    console.log(`  ${f}: ${prev} → ${next}`);
    updated++;
  }
}

console.log(`\ndone. updated=${updated} missing_price=${missing} skipped=${skipped} total=${files.length}`);
