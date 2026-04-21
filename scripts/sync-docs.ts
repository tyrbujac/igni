#!/usr/bin/env tsx
// Syncs mechanical facts (current spec version, example count, etc.) into
// README.md and CLAUDE.md by replacing `<!-- SYNC:name -->...<!-- /SYNC:name -->`
// regions with values computed from the repo state.
//
// Default mode: rewrite files in place, log which ones changed.
// --check / -c:  dry-run, exit 1 if any drift detected.
//
// Narrative prose ("Latest language change" paragraph, CHANGELOG entries,
// the currently-supported-features list body) is NOT synced — those are
// human-edited and stay outside any SYNC region.
//
// Usage:
//   npx tsx scripts/sync-docs.ts          # apply updates
//   npx tsx scripts/sync-docs.ts --check  # fail if drift

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO = join(HERE, '..');

type VersionParts = [number, number, number];

function parseVersion(name: string): VersionParts | null {
  const m = name.match(/^v(\d+)\.(\d+)(?:\.(\d+))?$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
}

function compareVersions(a: VersionParts, b: VersionParts): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

type Facts = {
  current: string;          // "v0.10.0"
  secondNewest: string | null;  // "v0.9.1" or null
  oldest: string;           // "v0.2"
  exampleCount: number;     // 34 — positive .igni examples
  totalTests: number;       // 46 — positive examples + negative error tests
};

function computeFacts(): Facts {
  // Historical spec versions live under spec/archive/ (moved there for navigability);
  // the current canonical version stays at spec/ top level. Scan both.
  const topLevel = readdirSync(join(REPO, 'spec'));
  let archive: string[] = [];
  try { archive = readdirSync(join(REPO, 'spec/archive')); } catch { /* optional */ }
  const specFiles = [...topLevel, ...archive];
  const canonical = specFiles
    .filter(f => f.endsWith('.md') && !f.includes('-cheatsheet') && !f.includes('-micro'))
    .map(f => f.replace(/\.md$/, ''))
    .map(v => ({ name: v, parts: parseVersion(v) }))
    .filter((x): x is { name: string; parts: VersionParts } => x.parts !== null)
    .sort((a, b) => compareVersions(a.parts, b.parts));

  if (canonical.length === 0) {
    throw new Error('No canonical spec/vX.Y.Z.md files found.');
  }

  const current = canonical[canonical.length - 1].name;
  const secondNewest = canonical.length >= 2 ? canonical[canonical.length - 2].name : null;
  const oldest = canonical[0].name;

  const exampleCount = readdirSync(join(REPO, 'transpiler/examples'))
    .filter(f => f.endsWith('.igni')).length;

  let negativeCount = 0;
  try {
    negativeCount = readdirSync(join(REPO, 'transpiler/examples-errors'))
      .filter(f => f.endsWith('.igni')).length;
  } catch { /* directory optional */ }
  const totalTests = exampleCount + negativeCount;

  return { current, secondNewest, oldest, exampleCount, totalTests };
}

// Replace every `<!-- SYNC:name -->...<!-- /SYNC:name -->` occurrence. The region
// body can span newlines; non-greedy so adjacent regions don't collapse.
function syncRegions(source: string, regions: Record<string, string>): { out: string; changed: boolean } {
  let out = source;
  for (const [name, content] of Object.entries(regions)) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(<!--\\s*SYNC:${esc}\\s*-->)([\\s\\S]*?)(<!--\\s*/SYNC:${esc}\\s*-->)`, 'g');
    out = out.replace(re, `$1${content}$3`);
  }
  return { out, changed: out !== source };
}

function main(): void {
  const check = process.argv.includes('--check') || process.argv.includes('-c');
  const facts = computeFacts();

  const regions: Record<string, string> = {
    'version': facts.current,
    'cheatsheet-path': `spec/${facts.current}-cheatsheet.md`,
    'micro-path': `spec/${facts.current}-micro.md`,
    'example-count': String(facts.exampleCount),
    'total-tests': String(facts.totalTests),
    'historical-range': facts.secondNewest
      ? `${facts.oldest} → ${facts.secondNewest}`
      : '(none yet)',
    'historical-range-files': facts.secondNewest
      ? `${facts.oldest}.md → ${facts.secondNewest}.md`
      : '(none yet)',
    'historical-range-paths': facts.secondNewest
      ? `spec/archive/${facts.oldest}.md → spec/archive/${facts.secondNewest}.md`
      : '(none yet)',
  };

  const targets = ['README.md', 'CLAUDE.md'];
  let anyDrift = false;

  console.log(`spec: current=${facts.current}, historical=${facts.oldest} → ${facts.secondNewest ?? '—'}`);
  console.log(`examples: ${facts.exampleCount} positive, ${facts.totalTests} total (incl. negative)`);
  console.log('');

  for (const rel of targets) {
    const full = join(REPO, rel);
    const original = readFileSync(full, 'utf-8');
    const { out, changed } = syncRegions(original, regions);

    if (!changed) {
      console.log(`  clean:   ${rel}`);
      continue;
    }
    anyDrift = true;
    if (check) {
      console.log(`  DRIFT:   ${rel}`);
    } else {
      writeFileSync(full, out);
      console.log(`  updated: ${rel}`);
    }
  }

  if (check) {
    console.log('');
    if (anyDrift) {
      console.log('drift detected — run `npx tsx scripts/sync-docs.ts` to fix.');
      process.exit(1);
    }
    console.log('all synced.');
  }
}

main();
