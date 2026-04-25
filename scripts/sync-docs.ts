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

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
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
  latestSpecChange: string; // "**Latest spec change: v0.13.1** (2026-04-25) — *tagline* See..."
};

// Read CHANGELOG.md, find the first `## vX.Y.Z — DATE` heading (skipping
// `## Unreleased`), extract version + date + the italicised tagline below it.
// Returns a one-paragraph summary suitable for a SYNC region in README.md.
// Empty string if CHANGELOG is missing or unparseable — caller decides how to
// render that case.
function extractLatestSpecChange(repoPath: string): string {
  let changelog: string;
  try { changelog = readFileSync(join(repoPath, 'CHANGELOG.md'), 'utf-8'); }
  catch { return ''; }
  const lines = changelog.split('\n');
  let version = '';
  let date = '';
  let tagline = '';
  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(v\d+\.\d+(?:\.\d+)?)\s*—\s*(\S+)/);
    if (headingMatch && !version) {
      version = headingMatch[1];
      date = headingMatch[2];
      continue;
    }
    if (version && !tagline) {
      const taglineMatch = line.match(/^\*(.+)\*$/);
      if (taglineMatch) {
        tagline = taglineMatch[1];
        break;
      }
    }
  }
  if (!version || !tagline) return '';
  return `**Latest spec change: ${version}** (${date}) — *${tagline}* See [\`CHANGELOG.md\`](CHANGELOG.md) for full history.`;
}

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

  const latestSpecChange = extractLatestSpecChange(REPO);

  return { current, secondNewest, oldest, exampleCount, totalTests, latestSpecChange };
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

// Auto-generate transpiler/examples/GALLERY.md from .igni files paired with
// .expected.dart, joined with curated descriptions parsed from README.md.
// Categories follow README.md's ### headings. Examples not listed in README
// fall under "Uncategorised". Regenerated unconditionally; CI's
// `git diff --exit-code` after sync-docs catches manual drift.
function regenerateGallery(repoPath: string, exampleCount: number): boolean {
  const examplesDir = join(repoPath, 'transpiler/examples');
  const readmePath = join(examplesDir, 'README.md');
  if (!existsSync(readmePath)) return false;
  const readme = readFileSync(readmePath, 'utf-8');

  // Parse README for categories + entries
  const lines = readme.split('\n');
  type Cat = { name: string; entries: string[] };
  const categories: Cat[] = [];
  let current: Cat | null = null;
  for (const line of lines) {
    const cat = line.match(/^###\s+(.+)$/);
    if (cat) {
      current = { name: cat[1], entries: [] };
      categories.push(current);
      continue;
    }
    if (current && line.startsWith('- **')) {
      current.entries.push(line);
    }
  }

  // name → description (rest of the bullet after the bold-name and em-dash)
  const descMap = new Map<string, string>();
  for (const cat of categories) {
    for (const entry of cat.entries) {
      const m = entry.match(/^-\s+\*\*`([^`]+)`\*\*\s*—\s*(.+)$/);
      if (m) descMap.set(m[1], m[2]);
    }
  }

  const files = readdirSync(examplesDir)
    .filter(f => f.endsWith('.igni'))
    .map(f => f.replace(/\.igni$/, ''))
    .sort();

  const lineCount = (path: string): number =>
    readFileSync(path, 'utf-8').split('\n').filter(l => l.length > 0).length;
  const igniLOC = (name: string) => lineCount(join(examplesDir, `${name}.igni`));
  const dartLOC = (name: string): number | null => {
    const p = join(examplesDir, `${name}.expected.dart`);
    return existsSync(p) ? lineCount(p) : null;
  };

  let out = `# Examples gallery

Auto-generated by \`scripts/sync-docs.ts\`. Run \`npx tsx scripts/sync-docs.ts\` to regenerate from current sources.

${exampleCount} \`.igni\` apps with paired \`.expected.dart\` snapshots. For curated descriptions and learning order, browse [README.md](README.md). LOC counts below show the Igni-to-Dart abstraction ratio per fixture (non-blank lines only).

`;

  const seen = new Set<string>();
  for (const cat of categories) {
    const inCat: string[] = [];
    for (const entry of cat.entries) {
      const m = entry.match(/^-\s+\*\*`([^`]+)`\*\*/);
      if (m && files.includes(m[1])) {
        inCat.push(m[1]);
        seen.add(m[1]);
      }
    }
    if (inCat.length === 0) continue;
    out += `## ${cat.name}\n\n`;
    out += `| Example | Igni LOC | Dart LOC | Ratio |\n`;
    out += `|---|---:|---:|---:|\n`;
    for (const name of inCat) {
      const il = igniLOC(name);
      const dl = dartLOC(name);
      const ratio = dl !== null && il > 0 ? (dl / il).toFixed(1) + '×' : '—';
      const dlStr = dl !== null ? String(dl) : '—';
      out += `| [\`${name}\`](${name}.igni) | ${il} | ${dlStr} | ${ratio} |\n`;
    }
    out += '\n';
  }

  const uncategorised = files.filter(f => !seen.has(f));
  if (uncategorised.length > 0) {
    out += `## Uncategorised\n\n`;
    out += `_Examples without a description entry in README.md._\n\n`;
    out += `| Example | Igni LOC | Dart LOC | Ratio |\n`;
    out += `|---|---:|---:|---:|\n`;
    for (const name of uncategorised) {
      const il = igniLOC(name);
      const dl = dartLOC(name);
      const ratio = dl !== null && il > 0 ? (dl / il).toFixed(1) + '×' : '—';
      const dlStr = dl !== null ? String(dl) : '—';
      out += `| [\`${name}\`](${name}.igni) | ${il} | ${dlStr} | ${ratio} |\n`;
    }
    out += '\n';
  }

  const galleryPath = join(examplesDir, 'GALLERY.md');
  const prev = existsSync(galleryPath) ? readFileSync(galleryPath, 'utf-8') : '';
  if (prev === out) return false;
  writeFileSync(galleryPath, out);
  return true;
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
    'latest-spec-changes': facts.latestSpecChange,
  };

  const targets = ['README.md', 'ARCHITECTURE.md', 'CLAUDE.md'];
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

  // Regenerate auto-generated full files (currently: GALLERY.md). These are
  // not SYNC-region-managed; they're regenerated unconditionally and CI's
  // `git diff --exit-code` after sync-docs catches drift.
  const galleryChanged = regenerateGallery(REPO, facts.exampleCount);
  if (galleryChanged) {
    anyDrift = true;
    console.log(`  ${check ? 'DRIFT:  ' : 'updated:'} transpiler/examples/GALLERY.md`);
  } else {
    console.log(`  clean:   transpiler/examples/GALLERY.md`);
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
