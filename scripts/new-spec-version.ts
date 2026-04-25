#!/usr/bin/env tsx
// Automate the spec-ship dance. Replaces the 6+-step manual sequence
// (cp×3, git mv×3, header edit, Changes-paragraph edit, sync-docs, CHANGELOG
// placeholder) with one command.
//
// Usage:
//   npx tsx scripts/new-spec-version.ts <X.Y.Z>
//
// Per the spec-iteration cycle (docs/cycle.md), this is the stage-9 ship
// command. Run it from a clean working tree on a branch.

import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO = join(HERE, '..');

function die(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function todayUKDate(): string {
  // dd/mm/yy — matches the "**By Tyr | 25/04/26 |** ..." byline format.
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  return `${dd}/${mm}/${yy}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

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

function findCurrentSpecVersion(): string {
  const files = readdirSync(join(REPO, 'spec'));
  const versions = files
    .filter(f => f.endsWith('.md') && !f.includes('-cheatsheet') && !f.includes('-micro'))
    .map(f => f.replace(/\.md$/, ''))
    .map(v => ({ name: v, parts: parseVersion(v) }))
    .filter((x): x is { name: string; parts: VersionParts } => x.parts !== null)
    .sort((a, b) => compareVersions(a.parts, b.parts));
  if (versions.length === 0) die('no current spec/vX.Y.Z.md found');
  return versions[versions.length - 1].name;
}

function usage(): void {
  console.log(`
new-spec-version — automate the spec-ship dance for one new version

Usage:
  npx tsx scripts/new-spec-version.ts <X.Y.Z>

Example:
  npx tsx scripts/new-spec-version.ts 0.13.2

What it does:
  1. Validates X.Y.Z format and that v<X.Y.Z>.md doesn't already exist.
  2. Detects the current canonical version (highest under spec/vN.M.P.md).
  3. cp spec/v<current>.{md,-cheatsheet.md,-micro.md} → spec/v<X.Y.Z>.{...}
  4. git mv spec/v<current>.{...} → spec/archive/v<current>.{...}
  5. In the new spec files: bump # heading title + ** byline date + replace
     "Changes from v<previous>:" paragraph with a placeholder TODO.
  6. CHANGELOG.md: insert a "## v<X.Y.Z> — <date>" placeholder under the
     Unreleased section.
  7. Run scripts/sync-docs.ts to update SYNC markers.
  8. Print next steps.

After running, you'll edit:
  - The Changes-from paragraph in the new spec/cheatsheet/micro.
  - The CHANGELOG.md placeholder with real bullets.
  - Any code/transpiler/fixture changes the new version requires.
`);
}

function main(): void {
  if (process.argv.length < 3 || ['--help', '-h'].includes(process.argv[2])) {
    usage();
    process.exit(process.argv.length < 3 ? 1 : 0);
  }

  const target = process.argv[2];
  const targetParts = parseVersion(`v${target}`);
  if (!targetParts) die(`invalid version "${target}" — expected X.Y.Z (e.g. 0.13.2)`);

  const newVersion = `v${target}`;
  const currentVersion = findCurrentSpecVersion();

  console.log(`Current canonical: ${currentVersion}`);
  console.log(`Target:            ${newVersion}`);

  if (newVersion === currentVersion) die(`${newVersion} is already the current version`);
  const currentParts = parseVersion(currentVersion)!;
  if (compareVersions(targetParts, currentParts) <= 0) {
    die(`${newVersion} is not greater than current ${currentVersion}`);
  }

  const newSpecPath = join(REPO, 'spec', `${newVersion}.md`);
  if (existsSync(newSpecPath)) die(`${newSpecPath} already exists — pick a different version or remove it`);

  // Step 1: cp current → new
  const variants = ['', '-cheatsheet', '-micro'];
  for (const v of variants) {
    const src = join(REPO, 'spec', `${currentVersion}${v}.md`);
    const dst = join(REPO, 'spec', `${newVersion}${v}.md`);
    if (!existsSync(src)) die(`expected source ${src} not found`);
    copyFileSync(src, dst);
    console.log(`  cp ${currentVersion}${v}.md → ${newVersion}${v}.md`);
  }

  // Step 2: git mv current → archive
  for (const v of variants) {
    const src = `spec/${currentVersion}${v}.md`;
    const dst = `spec/archive/${currentVersion}${v}.md`;
    execSync(`git mv ${src} ${dst}`, { cwd: REPO });
    console.log(`  git mv ${src} → ${dst}`);
  }

  // Step 3: edit headers in new files (title, byline date, Changes paragraph placeholder)
  const date = todayUKDate();
  const isoDate = todayISO();
  for (const v of variants) {
    const path = join(REPO, 'spec', `${newVersion}${v}.md`);
    let content = readFileSync(path, 'utf-8');
    // Bump heading: "# Igni Language Spec vX.Y.Z" → new version. Cheatsheet/micro
    // headings have their own conventions; replace the version string anywhere.
    content = content.replace(new RegExp(`\\b${currentVersion}\\b`, 'g'), newVersion);
    // Bump byline date: "**By Tyr | DD/MM/YY |" → today
    content = content.replace(/(\*\*By Tyr \| )\d{2}\/\d{2}\/\d{2}/, `$1${date}`);
    // Replace the existing Changes-from paragraph (single line starting **Changes from)
    content = content.replace(
      /\*\*Changes from [^:]+:\*\*[^\n]+/,
      `**Changes from ${currentVersion}:** TODO — describe what changed in ${newVersion}. Edit this paragraph before shipping.`
    );
    writeFileSync(path, content);
    console.log(`  edited ${newVersion}${v}.md (heading, byline, changes-from placeholder)`);
  }

  // Step 4: CHANGELOG placeholder
  const changelogPath = join(REPO, 'CHANGELOG.md');
  let changelog = readFileSync(changelogPath, 'utf-8');
  const placeholder = `## ${newVersion} — ${isoDate}
*TODO: one-line tagline describing what ${newVersion} ships.*

- **TODO**: bullet point describing the change. Replace before shipping.

---

`;
  // Insert after `---` that ends the Unreleased section, before the first `## v`
  const insertMatch = changelog.match(/(\n---\n+)(## v\d)/);
  if (insertMatch) {
    changelog = changelog.replace(insertMatch[0], `${insertMatch[1]}${placeholder}${insertMatch[2]}`);
    writeFileSync(changelogPath, changelog);
    console.log(`  inserted CHANGELOG placeholder for ${newVersion}`);
  } else {
    console.log(`  ! could not find Unreleased→first-version anchor in CHANGELOG; skipping placeholder`);
  }

  // Step 5: run sync-docs
  console.log(`  running sync-docs...`);
  execSync(`npx tsx ../scripts/sync-docs.ts`, { cwd: join(REPO, 'transpiler'), stdio: 'inherit' });

  console.log(`
✓ ${newVersion} scaffold ready.

Next steps:
  1. Edit the **Changes from ${currentVersion}** paragraph in spec/${newVersion}.md
     (and the cheatsheet + micro variants — same string).
  2. Edit the CHANGELOG.md placeholder with real bullets describing the change.
  3. Make any transpiler/fixture/test changes the new version requires.
  4. Run \`npm test\` in transpiler/ to verify nothing regressed.
  5. Commit when ready (suggested: feat(spec): ${newVersion} — <summary>).
`);
}

main();
