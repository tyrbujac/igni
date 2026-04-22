# Igni spec

The language definition. Three tiers of the same spec, plus the history.

## Current (v0.11.6)

- **[`v0.11.6.md`](v0.11.6.md)** — **full spec.** Canonical definition in learning order: hello world → screens → display → variables → interaction → layout → state → conditionals → lists → functions → components → navigation → shared state → async → reference. Read this once; refer back by section.
- **[`v0.11.6-cheatsheet.md`](v0.11.6-cheatsheet.md)** — **cheatsheet.** Same language, condensed to ~2,500 words. Optimised for cold-LLM context and human skim-reading. Primary input for test runs.
- **[`v0.11.6-micro.md`](v0.11.6-micro.md)** — **micro reference.** ~700 words, rules-only, no prose, no tradeoffs. Third context tier for cold tests that want to vary context size as an independent variable.

Pick the tier that matches your need: full for understanding, cheatsheet for writing Igni, micro for squeezing context.

## Archive

Historical spec versions (v0.2 → v0.11.5) live in [`archive/`](archive/). Moved there for navigability — prior to v0.11.5, all versions sat at `spec/` top level. Historical cold-test writeups in `tests/vX.Y/` may reference the old `spec/vX.Y.Z.md` paths; the file you want is now at `spec/archive/vX.Y.Z.md`.

See [`../CHANGELOG.md`](../CHANGELOG.md) for the version-by-version evolution narrative.

## Editing rules

- **Never edit a shipped spec file.** Each version is an immutable historical snapshot. To propose a change, fork the current canonical to a new version (`vX.Y.Z.md` + `-cheatsheet.md` + `-micro.md`), update `CHANGELOG.md`, and run `npx tsx scripts/sync-docs.ts`.
- **Cheatsheet has a size discipline** (~2,500 words). Context-specific callouts belong in the full spec's reference sections, not the cheatsheet's learning path. See `ROADMAP.md` "Cheatsheet size discipline" process note.
- **Current-version files stay at spec/ top level.** Only historical versions live under `archive/`.
