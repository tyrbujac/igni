#!/bin/bash
# Run all example diff tests. Zero diff = pass.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PASS=0
FAIL=0
FAILURES=()

for f in "$SCRIPT_DIR"/examples/*.igni; do
  name=$(basename "$f" .igni)
  expected="$SCRIPT_DIR/examples/$name.expected.dart"
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

echo ""
echo "$PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then
  echo "Failures: ${FAILURES[*]}"
  exit 1
fi
