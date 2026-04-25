#!/bin/bash
# Regenerate every .expected.dart snapshot from its corresponding .igni source.
# Run after a codegen change that affects multiple fixtures, then `git diff` to
# eyeball the pattern of changes. Zero diff means no fixture drifted.
#
# Usage: bash regen-snapshots.sh
#        npm run regen-snapshots

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COUNT=0
for f in "$SCRIPT_DIR"/examples/*.igni; do
  name=$(basename "$f" .igni)
  npx tsx "$SCRIPT_DIR/src/cli.ts" "$f" > "$SCRIPT_DIR/examples/$name.expected.dart" 2>/dev/null
  COUNT=$((COUNT + 1))
done
echo "Regenerated $COUNT snapshots in examples/."
