# v0.6.3 Cold-LLM Test Summary

**Date:** 2026-04-12
**Spec:** v0.6.3
**Test:** Contacts app (same prompt as v0.6.2)
**Models:** Claude Opus 4.6, Gemini 3.1 Pro, ChatGPT 5.3

---

## Results at a glance

| | Claude Opus 4.6 | Gemini 3.1 Pro | ChatGPT 5.3 |
|---|---|---|---|
| **Spec grade** | PASS | PASS | PASS |
| **Transpiles?** | Yes (1 fix) | Yes (0 fixes) | Yes (1 fix) |
| **Analyze?** | Clean | Clean | Clean |
| **`shared:` correct?** | Yes | Yes | Yes |
| **List mutation?** | `replace` | `replace` | `replace` |
| **`toggle label:`** | Used correctly | Used correctly | Used correctly |
| **Conditional assignment** | Used (works) | Used (works) | Used (works) |

---

## The headline

**Gemini 3.1 Pro produced code that transpiled and analyzed with zero modifications.** LLM read the spec, wrote the code, transpiler compiled it — zero human intervention. This is the first time any model has achieved this.

---

## v0.6.2 → v0.6.3 comparison

| | v0.6.2 fixes needed | v0.6.3 fixes needed | Improvement |
|---|---|---|---|
| Claude Opus 4.6 | 2 (type hint, toggle label) | 1 (type hint only) | toggle label fix worked |
| Gemini 3.1 Pro | 2 (toggle label, restructure conditional assignment) | **0** | Both fixes worked |
| ChatGPT | FAIL (no shared state, in-place mutation) | 1 (type hint only) | FAIL → PASS |

Every v0.6.3 spec improvement directly drove better output:

1. **`toggle label:`** — 3/3 models used it in v0.6.2 and it broke. 3/3 use it in v0.6.3 and it works. Confirmed fix.
2. **Conditional assignment at screen body level** — 2/3 models used it in v0.6.2 and it broke (transpiler gap, fixed). 3/3 use it in v0.6.3 and it works.
3. **ChatGPT's in-place mutation** — FAIL in v0.6.2 (`contact.favourite = not contact.favourite`). v0.6.3 ChatGPT uses `replace` correctly. The spec improvement (or model update to 5.3) fixed the fundamental error.

---

## Codegen bugs found this round

| Bug | Fix |
|---|---|
| `icon "user"` not in icon map | Added `user` → `Icons.person`, plus `person`, `home`, `mail` |
| Derived variables before conditional `if` generated as field initializers | Extended build-local detection to walk dependency chain backwards |

---

## Remaining transpiler gap

**Type hints** (`contacts: [Contact] = [...]`) — 2/3 models used them. This is the only remaining fix needed for Claude and ChatGPT. Not an LLM error — the spec documents type hints, the transpiler doesn't support them yet.

---

## Per-model notes

**Claude Opus 4.6** — Used `filter` → conditional `if` → `sorted` chain at screen body level. Used `find` with predicate lambda to look up contacts in the detail screen. Cleanest overall structure.

**Gemini 3.1 Pro** — Zero fixes needed. Used the same conditional assignment pattern. Named screen param `initial` (not `contact`) to avoid confusion with the loop variable. Used `find` by phone number for identity. Clean separation.

**ChatGPT 5.3** — Massive improvement from v0.6.2. Used `replace` correctly (was in-place mutation before). Used `badge "★"` with a unicode star. Used `badge "Not favourite"` for the non-favourite state — creative. Only fix: type hint.
