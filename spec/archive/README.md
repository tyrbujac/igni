# Igni spec archive

Historical spec snapshots. The current canonical spec lives one directory up at [`../`](../).

## What's here

Every version of Igni from v0.2 (January 2026) through v0.11.4 (April 2026). Each version typically has three files:

- `vX.Y.Z.md` — full spec snapshot
- `vX.Y.Z-cheatsheet.md` — condensed cheatsheet for that version (where one existed)
- `vX.Y.Z-micro.md` — micro reference for that version (from v0.8.0 onward)

Plus five orphan `v0.6.1-cheatsheet.md` → `v0.6.5-cheatsheet.md` fragments — the earliest cheatsheets, which did not have matching full-spec or micro files.

## Why move them

Before v0.11.5 all versions sat at `spec/` top level (65 files). A cold reader had to know the naming convention (`vX.Y.Z[-cheatsheet|-micro].md`) to find the current canonical among the historical clutter. Moving the archive under a subdirectory keeps `spec/` focused on the current version; `spec/archive/` is where you go to study the evolution.

## Path-update notice

Historical cold-test writeups under `tests/vX.Y/` still reference the old `spec/vX.Y.Z.md` paths (pre-v0.11.5). Those writeups are **immutable historical artefacts per the project's snapshot rule** and are NOT retroactively edited. If you're chasing a link from a tests/ writeup, the file you want is at `spec/archive/vX.Y.Z.md`, not the original path cited.

Living docs (README, CLAUDE, CHANGELOG, ROADMAP, tests/README, scripts/sync-docs.ts) reference the new `spec/archive/` paths as of v0.11.5.

## Rule of thumb

- Want to **write Igni today**? Read `spec/v0.11.5-cheatsheet.md` (one up).
- Want to **understand a past design decision**? Read the version that shipped it here + the corresponding `CHANGELOG.md` entry + any `docs/private/*.md` design note (if accessible).
- Want to **reproduce a past cold-test round**? The corresponding tier of the version pointed to in `tests/vX.Y/prompts.md` or the round's `README.md`, as it was at ship time.
