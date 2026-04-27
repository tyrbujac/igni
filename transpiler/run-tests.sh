#!/bin/bash
# Run all example diff tests. Zero diff = pass.
# Positive suite: examples/*.igni → stdout == *.expected.dart
# Negative suite: examples-errors/*.igni → non-zero exit and stderr == *.expected.err

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PASS=0
FAIL=0
FAILURES=()

# Positive suite — transpile must succeed and output must match expected Dart.
# Scan top-level + subdirs (e.g. examples/pomodonut/pomodonut.igni — runnable
# demos that need their own folder for clean `igni run` without multi-file
# auto-discovery noise).
for f in "$SCRIPT_DIR"/examples/*.igni "$SCRIPT_DIR"/examples/*/*.igni; do
  [ -f "$f" ] || continue
  name=$(basename "$f" .igni)
  expected="${f%.igni}.expected.dart"
  if [ ! -f "$expected" ]; then
    continue
  fi
  if npx tsx "$SCRIPT_DIR/src/cli.ts" "$f" 2>/dev/null | diff -q - "$expected" >/dev/null 2>&1; then
    echo "PASS  $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $name"
    FAIL=$((FAIL + 1))
    FAILURES+=("$name")
  fi
done

# Negative suite — transpile must fail with exit 1 and stderr byte-matching
# the pinned .expected.err. `cd` so the filename in the error is relative and
# portable across machines.
if [ -d "$SCRIPT_DIR/examples-errors" ]; then
  for f in "$SCRIPT_DIR"/examples-errors/*.igni; do
    name=$(basename "$f" .igni)
    expected="$SCRIPT_DIR/examples-errors/$name.expected.err"
    if [ ! -f "$expected" ]; then
      continue
    fi
    actual=$(cd "$SCRIPT_DIR/examples-errors" && npx tsx "$SCRIPT_DIR/src/cli.ts" "$name.igni" 2>&1 >/dev/null)
    exit_code=$?
    if [ "$exit_code" = "0" ]; then
      echo "FAIL  err/$name  (expected non-zero exit, got 0 — transpile unexpectedly succeeded)"
      FAIL=$((FAIL + 1))
      FAILURES+=("err/$name")
    elif diff -q <(echo "$actual") "$expected" >/dev/null 2>&1; then
      echo "PASS  err/$name"
      PASS=$((PASS + 1))
    else
      echo "FAIL  err/$name"
      FAIL=$((FAIL + 1))
      FAILURES+=("err/$name")
    fi
  done
fi

# Scaffold suite — covers pubspec dep injection and other scaffold-level
# concerns the diff-tests don't catch (since cli.ts is codegen-only).
# Each `*.test.ts` runs as a self-contained TS script that exits non-zero
# on failure.
if [ -d "$SCRIPT_DIR/scaffold-tests" ]; then
  for f in "$SCRIPT_DIR"/scaffold-tests/*.test.ts; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .test.ts)
    if npx tsx "$f" >/dev/null 2>&1; then
      echo "PASS  scaffold/$name"
      PASS=$((PASS + 1))
    else
      echo "FAIL  scaffold/$name"
      FAIL=$((FAIL + 1))
      FAILURES+=("scaffold/$name")
    fi
  done
fi

echo ""
echo "$PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then
  echo "Failures: ${FAILURES[*]}"
  exit 1
fi
