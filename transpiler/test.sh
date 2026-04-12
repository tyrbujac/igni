#!/bin/bash
# Usage: ./test.sh path/to/file.igni
# Transpiles, analyzes, and deploys to test_app for browser testing.

set -e

if [ -z "$1" ]; then
  echo "Usage: ./test.sh <file.igni>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FILE="$1"

echo "=== Transpiling $FILE ==="
OUTPUT=$(npx tsx "$SCRIPT_DIR/src/cli.ts" "$FILE" 2>&1) || {
  echo "TRANSPILE FAILED:"
  echo "$OUTPUT"
  exit 1
}

echo "$OUTPUT" > "$SCRIPT_DIR/test_app/lib/main.dart"
echo "=== Transpiled OK ==="

echo "=== Running flutter analyze ==="
cd "$SCRIPT_DIR/test_app"
ANALYZE=$(flutter analyze lib/main.dart 2>&1 || true)
if echo "$ANALYZE" | grep -q "error •"; then
  echo "ANALYZE ERRORS:"
  echo "$ANALYZE"
  exit 1
fi
echo "=== Analyze OK (warnings/info ignored) ==="

echo ""
echo "Ready. Hot reload (r) or run: cd transpiler/test_app && flutter run -d chrome"
