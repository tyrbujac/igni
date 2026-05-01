#!/usr/bin/env tsx
// Phase 4 comparison-test compile checker.
//
// Walks igni/ and flutter/ output directories, extracts code from each .md
// cell, runs the canonical compile-check per framework, emits per-cell
// {compile_success, compile_error} into <cell>.compile.json plus an aggregate
// compile-results.json.
//
// Igni: npx tsx transpiler/src/cli.ts <tmpfile>  → exit 0 = pass
// Flutter: copy to _flutter_check/lib/main.dart, dart analyze → exit 0 = pass
//
// Asset references (avatar.png, ding.wav) cited in prompts are excluded from
// failure — both compile paths don't validate asset existence at compile time
// anyway, but the exclusion is defensive per design-note §"Asset failures
// excluded".

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const TRANSPILER_CLI = join(REPO_ROOT, 'transpiler/src/cli.ts');
const FLUTTER_CHECK_DIR = join(HERE, '_flutter_check');
const FLUTTER_MAIN_DART = join(FLUTTER_CHECK_DIR, 'lib/main.dart');

type Cell = {
  model: string;
  framework: 'igni' | 'flutter';
  app: string;
  source_md: string;
};

type CompileResult = {
  model: string;
  framework: 'igni' | 'flutter';
  app: string;
  extracted_code: boolean;
  compile_success: boolean;
  compile_error: string | null;
};

function extractCode(md: string, framework: 'igni' | 'flutter'): string | null {
  // Try framework-tagged fence first
  const tagPattern = framework === 'igni'
    ? /```(?:igni)\s*\n([\s\S]*?)\n```/
    : /```(?:dart)\s*\n([\s\S]*?)\n```/;
  const tagged = md.match(tagPattern);
  if (tagged && tagged[1].trim()) return tagged[1];

  // Any fenced block
  const anyFenced = md.match(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/);
  if (anyFenced && anyFenced[1].trim()) return anyFenced[1];

  // Unfenced fallback if structurally looks like the framework
  const trimmed = md.trim();
  if (!trimmed) return null;
  if (framework === 'igni') {
    if (/^screen\s+[A-Z]\w*/m.test(trimmed) || /^component\s+[A-Z]\w*/m.test(trimmed) || /^shared:\s*$/m.test(trimmed)) {
      return trimmed;
    }
  } else {
    if (/^\s*import\s+['"]package:flutter\/material\.dart['"]/m.test(trimmed) && /void\s+main\s*\(/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

function checkIgni(code: string): { passed: boolean; error: string | null } {
  const dir = mkdtempSync(join(tmpdir(), 'phase4-igni-'));
  const srcFile = join(dir, 'app.igni');
  writeFileSync(srcFile, code);
  const result = spawnSync('npx', ['tsx', TRANSPILER_CLI, srcFile], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60000,
  });
  const passed = result.status === 0;
  const error = passed ? null : (result.stderr?.trim() || result.stdout?.trim() || `exit ${result.status}`).slice(0, 1500);
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
  return { passed, error };
}

function checkFlutter(code: string): { passed: boolean; error: string | null } {
  // Backup the placeholder, write generated code, analyze, restore.
  const backup = readFileSync(FLUTTER_MAIN_DART, 'utf8');
  writeFileSync(FLUTTER_MAIN_DART, code);
  try {
    const result = spawnSync('dart', ['analyze', 'lib/main.dart'], {
      cwd: FLUTTER_CHECK_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 90000,
    });
    const passed = result.status === 0;
    const error = passed ? null : (result.stdout?.trim() || result.stderr?.trim() || `exit ${result.status}`).slice(0, 1500);
    return { passed, error };
  } finally {
    writeFileSync(FLUTTER_MAIN_DART, backup);
  }
}

// Parse cell metadata from filename: <model-slug>_<spec-tier>_<prompt-slug>.md
// Examples:
//   claude-opus-4-7_cheatsheet_pomodonut.md  (Igni; spec-tier=cheatsheet)
//   gpt-5.5_none_bmi.md                      (Flutter; spec-tier=none)
function parseCellFilename(filename: string, framework: 'igni' | 'flutter'): Cell | null {
  if (!filename.endsWith('.md')) return null;
  const stem = filename.slice(0, -3);
  // Split on _<spec-tier>_ — spec tier is "cheatsheet" or "none"
  const tier = framework === 'igni' ? 'cheatsheet' : 'none';
  const sep = `_${tier}_`;
  const idx = stem.indexOf(sep);
  if (idx === -1) return null;
  const model = stem.slice(0, idx);
  const app = stem.slice(idx + sep.length);
  return { model, framework, app, source_md: filename };
}

function discoverCells(dir: string, framework: 'igni' | 'flutter'): Cell[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map(f => parseCellFilename(f, framework))
    .filter((c): c is Cell => c !== null);
}

function checkCell(cell: Cell, baseDir: string): CompileResult {
  const mdPath = join(baseDir, cell.source_md);
  const md = readFileSync(mdPath, 'utf8');
  const code = extractCode(md, cell.framework);
  if (!code) {
    return {
      model: cell.model,
      framework: cell.framework,
      app: cell.app,
      extracted_code: false,
      compile_success: false,
      compile_error: 'no fenced code block found in output',
    };
  }
  const { passed, error } = cell.framework === 'igni' ? checkIgni(code) : checkFlutter(code);
  return {
    model: cell.model,
    framework: cell.framework,
    app: cell.app,
    extracted_code: true,
    compile_success: passed,
    compile_error: error,
  };
}

function main(): void {
  const igniDir = join(HERE, 'igni');
  const flutterDir = join(HERE, 'flutter');
  const cells: Array<{ cell: Cell; baseDir: string }> = [
    ...discoverCells(igniDir, 'igni').map(c => ({ cell: c, baseDir: igniDir })),
    ...discoverCells(flutterDir, 'flutter').map(c => ({ cell: c, baseDir: flutterDir })),
  ];

  if (cells.length === 0) {
    console.log('No cells found in igni/ or flutter/. Run cold-test first.');
    process.exit(0);
  }

  console.log(`compile-check — ${cells.length} cells\n`);
  const results: CompileResult[] = [];
  for (const { cell, baseDir } of cells) {
    process.stdout.write(`  [${cell.framework}/${cell.model}/${cell.app}] `);
    const result = checkCell(cell, baseDir);
    results.push(result);
    const status = !result.extracted_code ? '— no code' : result.compile_success ? '✓ passed' : '✗ FAILED';
    console.log(status);
    if (!result.compile_success && result.compile_error) {
      console.log(`      ${result.compile_error.split('\n').slice(0, 3).join(' | ')}`);
    }
    // Per-cell sidecar JSON
    const sidecarPath = join(baseDir, cell.source_md.replace(/\.md$/, '.compile.json'));
    writeFileSync(sidecarPath, JSON.stringify(result, null, 2));
  }

  const aggregatePath = join(HERE, 'compile-results.json');
  writeFileSync(aggregatePath, JSON.stringify(results, null, 2));

  console.log(`\n=== summary ===`);
  const igni = results.filter(r => r.framework === 'igni');
  const flutter = results.filter(r => r.framework === 'flutter');
  const igniPass = igni.filter(r => r.compile_success).length;
  const flutterPass = flutter.filter(r => r.compile_success).length;
  console.log(`  igni:    ${igniPass}/${igni.length} passed`);
  console.log(`  flutter: ${flutterPass}/${flutter.length} passed`);
  console.log(`  → ${basename(aggregatePath)}`);
}

main();
