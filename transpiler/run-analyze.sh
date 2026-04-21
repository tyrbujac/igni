#!/bin/bash
# Semantic smoke test: transpile a handful of representative examples and run
# `flutter analyze` on the generated Dart. Catches drift that byte-diff cannot:
# a committed .expected.dart file that became semantically broken (e.g. after
# a Flutter version bump), or a latent bug in a reference file that never got
# a runtime check.
#
# Not run by `npm test` — it needs Flutter and is slower (~1s per example).
# Opt-in: `npm run test:analyze`.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/test_app"
PASS=0
FAIL=0
FAILURES=()

if ! command -v flutter >/dev/null 2>&1; then
  echo "flutter not found — skipping analyze suite"
  exit 0
fi

if [ ! -d "$APP_DIR/lib" ]; then
  echo "Expected scratchpad at $APP_DIR — run \`igni run\` once from test_app/ or create it manually"
  exit 1
fi

# Representative slice: simplest stateful, list+input, shared state + components
# + events. Enough to exercise the major codegen paths without running analyze
# on all 33 examples.
EXAMPLES=(counter todo shopping fetch stepper contacts pagination)

for name in "${EXAMPLES[@]}"; do
  src="$SCRIPT_DIR/examples/$name.igni"
  if [ ! -f "$src" ]; then
    echo "SKIP  $name (missing source)"
    continue
  fi
  npx tsx "$SCRIPT_DIR/src/cli.ts" "$src" > "$APP_DIR/lib/main.dart"
  # Capture analyze output, strip info-level lints (style suggestions —
  # e.g. snake_case identifiers from Igni). Fail only on ` error ` or
  # ` warning ` severities which indicate real semantic problems.
  output=$(cd "$APP_DIR" && flutter analyze lib/ 2>&1)
  real_issues=$(echo "$output" | grep -E " error | warning " || true)
  if [ -z "$real_issues" ]; then
    echo "PASS  $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $name"
    echo "$real_issues" | head -5 | sed 's/^/        /'
    FAIL=$((FAIL + 1))
    FAILURES+=("$name")
  fi
done

echo ""
echo "$PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then
  echo "Failures: ${FAILURES[*]}"
  exit 1
fi
