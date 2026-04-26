// Pure function used by ensureDependencies() in igni.ts to patch a Flutter
// pubspec.yaml with packages that the codegen-emitted Dart imports.
//
// Lives in its own module (rather than alongside ensureDependencies) so it
// can be unit-tested without triggering igni.ts's CLI dispatch at import.
//
// Each entry is keyed on a Dart import substring; the matching package is
// added beneath `cupertino_icons:` if not already declared. Audioplayers
// is here (rather than in syncAudio()) because `play()` in source emits
// the audioplayers import regardless of whether the user has any audio
// assets — a play()-using app with no `audio/` folder otherwise compile-
// fails on unresolved AudioPlayer/AssetSource symbols (regression caught
// 2026-04-26 during pomodonut browser-test).

export const SCAFFOLD_DEPS: { import: string; key: string; line: string }[] = [
  { import: 'package:http/',         key: 'http:',         line: '  http: ^1.2.0' },
  { import: 'package:geolocator/',   key: 'geolocator:',   line: '  geolocator: ^13.0.1' },
  { import: 'package:audioplayers/', key: 'audioplayers:', line: '  audioplayers: ^6.1.0' },
];

export function injectDependencies(dart: string, pubspec: string): string {
  let result = pubspec;
  for (const dep of SCAFFOLD_DEPS) {
    if (dart.includes(dep.import) && !result.includes(dep.key)) {
      result = result.replace(
        /(\s*cupertino_icons:[^\n]*)/,
        `$1\n${dep.line}`
      );
    }
  }
  return result;
}
