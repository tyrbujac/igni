#!/bin/bash
# Igni smoke harness — runs `flutter analyze` on the generated Dart for each
# example. Catches scaffold-level + Dart-compile bugs that the diff-test suite
# (`run-tests.sh`) misses, since diff-tests only validate codegen output, not
# whether the generated Dart compiles in a real Flutter project.
#
# Surfaced 2026-04-26 by the pomodonut browser-test (4 real bugs in 2 minutes,
# none caught by `npm test`). See ROADMAP Stream 2 #1 for context.
#
# Setup (one-time):
#   - Uses `transpiler/test_app/.igni/` as the shared scaffold (gitignored).
#   - Pubspec must include audioplayers / http / geolocator (kitchen-sink deps
#     for any example that uses play() / fetch() / locate()). Pre-flight runs
#     `flutter pub get` if the deps are missing.
#
# Usage: from `transpiler/`, run `npm run smoke` (or `bash run-smoke.sh`).
#
# Fail-strictness: errors only. flutter analyze emits info / warning / error
# tiers; we exit non-zero only when at least one error is reported. Warnings
# and info-level lints (e.g. unused imports in generated Dart) are tolerated
# because they're often artefacts of codegen patterns we don't control.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCAFFOLD="$SCRIPT_DIR/test_app/.igni"
EXAMPLES="$SCRIPT_DIR/examples"
CLI="$SCRIPT_DIR/src/cli.ts"

if [ ! -d "$SCAFFOLD" ]; then
  echo "ERROR: scaffold $SCAFFOLD doesn't exist."
  echo "Run 'igni run' once on transpiler/test_app/app.igni first to bootstrap it."
  exit 1
fi

# Pre-flight: ensure kitchen-sink deps are in pubspec.
PUBSPEC="$SCAFFOLD/pubspec.yaml"
NEED_PUB_GET=0
for entry in "audioplayers: ^6.1.0" "http: ^1.2.0" "geolocator: ^13.0.1"; do
  key=$(echo "$entry" | cut -d: -f1)
  if ! grep -qE "^  $key:" "$PUBSPEC"; then
    # macOS sed needs the empty .bak extension; we delete it after.
    sed -i.bak "s|^  cupertino_icons:.*|&\\
  $entry|" "$PUBSPEC" && rm -f "$PUBSPEC.bak"
    echo "Added $key to scaffold pubspec.yaml"
    NEED_PUB_GET=1
  fi
done

if [ "$NEED_PUB_GET" = "1" ]; then
  echo "Running flutter pub get in scaffold..."
  (cd "$SCAFFOLD" && flutter pub get >/dev/null 2>&1)
fi

# Loop over examples.
PASS=0
FAIL=0
TOTAL=0
FAILURES=()

for f in "$EXAMPLES"/*.igni "$EXAMPLES"/*/*.igni; do
  [ -f "$f" ] || continue
  name=$(basename "$f" .igni)
  TOTAL=$((TOTAL + 1))

  # Transpile to main.dart. If transpile fails (shouldn't — diff-tests should
  # have caught those), surface as a smoke-suite failure rather than aborting.
  if ! npx tsx "$CLI" "$f" > "$SCAFFOLD/lib/main.dart" 2>/dev/null; then
    echo "FAIL  $name  (transpile error — surprising; check run-tests.sh diff suite)"
    FAIL=$((FAIL + 1))
    FAILURES+=("$name (transpile)")
    continue
  fi

  # flutter analyze. Use --no-pub to skip the pub-get check on every iteration
  # (we did it once in pre-flight). Capture stdout+stderr; exit code is non-
  # zero on any issue (info / warning / error), but we filter for "error -"
  # lines so we only fail on actual errors per pre-registered ship bar.
  output=$(cd "$SCAFFOLD" && flutter analyze --no-pub 2>&1 || true)
  errors=$(printf "%s\n" "$output" | grep -cE "error -" || true)

  if [ "$errors" = "0" ]; then
    echo "PASS  smoke/$name"
    PASS=$((PASS + 1))
  else
    echo "FAIL  smoke/$name  ($errors error(s))"
    printf "%s\n" "$output" | grep -E "error -" | head -5 | sed 's/^/      /'
    FAIL=$((FAIL + 1))
    FAILURES+=("$name")
  fi
done

echo ""
echo "$PASS / $TOTAL passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo "Failures: ${FAILURES[*]}"
  exit 1
fi
