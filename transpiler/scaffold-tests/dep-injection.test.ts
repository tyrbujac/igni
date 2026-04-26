// Scaffold-suite test — covers `injectDependencies()` from src/igni.ts.
//
// The diff-test suite (run-tests.sh) only validates Dart codegen; scaffold
// logic (pubspec.yaml injection, asset folder copy, font registration) is
// untested by it. This file is the start of a `scaffold-tests/` suite for
// regressions in scaffold-level concerns.
//
// First case: pomodonut shipped 2026-04-26 with `play()` in source but the
// scaffolded pubspec.yaml didn't include `audioplayers:`, so `flutter run`
// compile-failed on unresolved AudioPlayer/AssetSource. Bug was that the
// audioplayers injection was gated on the user having files in `audio/`,
// but the codegen emits the audioplayers import based on `play()` usage
// alone. Fix: drive injection from the Dart import string instead.
//
// Run: `npx tsx scaffold-tests/dep-injection.test.ts` (added to run-tests.sh).

import { injectDependencies } from '../src/scaffold-deps.js';

const PUBSPEC_BASE = `name: test_app
description: "A new Flutter project."
version: 1.0.0+1

environment:
  sdk: ^3.9.2

dependencies:
  flutter:
    sdk: flutter

  cupertino_icons: ^1.0.8

dev_dependencies:
  flutter_test:
    sdk: flutter
`;

let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, detail?: string): void {
  if (cond) {
    console.log(`PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
    fail += 1;
    failures.push(name);
  }
}

// --- audioplayers (the regression that drove this test) ---

{
  const dart = `import 'package:flutter/material.dart';\nimport 'package:audioplayers/audioplayers.dart';\n`;
  const out = injectDependencies(dart, PUBSPEC_BASE);
  check(
    'play() source → audioplayers: in pubspec',
    out.includes('audioplayers: ^6.1.0'),
    'audioplayers not injected'
  );
  check(
    'audioplayers placed under cupertino_icons',
    /cupertino_icons:[^\n]*\n  audioplayers:/.test(out),
    'audioplayers not under cupertino_icons'
  );
}

// --- http (existing behaviour, regression-protected) ---

{
  const dart = `import 'package:http/http.dart' as http;\n`;
  const out = injectDependencies(dart, PUBSPEC_BASE);
  check(
    'fetch() source → http: in pubspec',
    out.includes('http: ^1.2.0')
  );
}

// --- geolocator (existing behaviour, regression-protected) ---

{
  const dart = `import 'package:geolocator/geolocator.dart';\n`;
  const out = injectDependencies(dart, PUBSPEC_BASE);
  check(
    'locate() source → geolocator: in pubspec',
    out.includes('geolocator: ^13.0.1')
  );
}

// --- multiple packages in one app ---

{
  const dart = `import 'package:audioplayers/audioplayers.dart';\nimport 'package:http/http.dart' as http;\nimport 'package:geolocator/geolocator.dart';\n`;
  const out = injectDependencies(dart, PUBSPEC_BASE);
  check(
    'multi-package source → all three injected',
    out.includes('audioplayers: ^6.1.0') &&
      out.includes('http: ^1.2.0') &&
      out.includes('geolocator: ^13.0.1')
  );
}

// --- no-op when source has no relevant imports ---

{
  const dart = `import 'package:flutter/material.dart';\n`;
  const out = injectDependencies(dart, PUBSPEC_BASE);
  check(
    'plain source → pubspec unchanged',
    out === PUBSPEC_BASE,
    'pubspec was modified for a no-import app'
  );
}

// --- idempotent: already-present deps are not duplicated ---

{
  const dart = `import 'package:audioplayers/audioplayers.dart';\n`;
  const pubspecWithDep = PUBSPEC_BASE.replace(
    /cupertino_icons: \^1\.0\.8/,
    'cupertino_icons: ^1.0.8\n  audioplayers: ^6.1.0'
  );
  const out = injectDependencies(dart, pubspecWithDep);
  const matches = out.match(/audioplayers: \^6\.1\.0/g) ?? [];
  check(
    'idempotent — re-running does not duplicate audioplayers',
    matches.length === 1,
    `expected 1 audioplayers entry, got ${matches.length}`
  );
}

// --- summary ---

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log(`Failures: ${failures.join(', ')}`);
  process.exit(1);
}
