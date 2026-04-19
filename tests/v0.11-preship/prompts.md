# Igni Cold-LLM Test Prompts (v0.11 pre-ship — geolocation primitive proposal)

Cold tests against v0.10. Paste the full cheatsheet (`spec/v0.10.0-cheatsheet.md`) FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**What this validates:** whether frontier models, when asked directly to *propose* a geolocation primitive (rather than invent one as a side-effect of writing a full app, which is what Clima did), converge on the design note's recommended shape. Same template as the v0.10 object-update proposal (`tests/v0.10/prompts.md` #1) which pre-shipped `{target with ...}`.

**Hypothesis under test:**

In the v0.10 Clima cold test, 3/3 frontier models invented a geolocation primitive but landed on three divergent shapes — Shape A `location()` async value (Opus), Shape B split sync-looking functions `device_latitude()` / `device_longitude()` (GPT), Shape C global `device.latitude` / `device.longitude` namespace (Gemini). Design note `docs/private/52_v11_geolocation_design.md` recommends Shape A on principle grounds (one way; no magic; no hidden globals; reuses `is loading:` / `is error:` machinery). This test re-asks the question with explicit framing — does the convergence shift toward A when models are forced to think about the principles rather than reach for the most natural idiom?

**Prediction:** two plausible outcomes —

- **Shape A cluster** (3-4/4 models): validates the design note's recommendation directly. Ship `location()` as proposed. Next step: transpiler implementation + pin Clima as a regression example.
- **Shape B or C cluster** (3+/4 models): pause. The "no magic" principle may not survive contact with the natural idiom; reconsider the design note before shipping.
- **Mixed / no convergence** (split across A/B/C/new): ship Shape A on principle grounds per the design note. Document divergence as "no natural convergence, shipped on principles" — same outcome as the v0.10 object-update round.

**Panel:** Claude Opus 4.7, GPT-5.4, Gemini 3.1 Pro Preview, Gemini 3.1 Flash-Lite Preview. First load-bearing test of the v0.11 panel (rationale: `docs/private/51_v11_panel_change.md`). Run with `--no-grade` — this prompt asks for syntax proposals, not code that transpiles.

---

## 1. Geolocation syntax proposal

> Given the Igni spec above, propose a syntax for getting the user's current device location (latitude + longitude). The syntax should:
> - Fit within Igni's design principles (indentation, no brackets, one way to do everything).
> - Acknowledge that location fetching is asynchronous on real devices.
> - Provide coordinates accessible as `.latitude` / `.longitude` (or fields of equivalent shape).
>
> Respond with: (1) the exact syntax for a screen that reads location and shows "Loading / Error / lat, lon"; (2) a 2-3 sentence justification; (3) any ambiguities you'd want clarified before it ships.

**What to grade:**

- **Shape family.** Which cluster did the model reach for? The three observed in the v0.10 Clima round are: (A) `location()` async value reusing `is loading:` / `is error:`, (B) split sync-looking functions like `device_latitude()` / `device_longitude()`, (C) global `device.latitude` / `device.longitude` namespace. Anything else is a new shape — note it.
- **Consistency with Igni principles.** Did the model reason about the principles in `CLAUDE.md`-style terms (no magic, no hidden globals, one way to do everything, spec budget) or did it drop in an idiom from another language without reasoning? Shape A directly invokes the existing `fetch` + `is loading:` machinery — did the model spot that?
- **Async honesty.** Did the model acknowledge the asynchrony explicitly (Shape A and B handle it, Shape C tends to hide it)? Models that propose Shape C often cite readability — note the reasoning, don't adopt.
- **Edge case coverage.** Did the model raise the permission-prompt question, the multi-call caching question (does each `location()` call re-prompt?), or the high/low accuracy tuning question? These are the real design decisions; a good proposal surfaces them.
- **Spec placement.** Did the model show where in the cheatsheet the new rule would live (the async section, alongside `fetch`)?
- **Design drift.** Any proposals that violate existing non-negotiables (parens on component invocation, ternary operators, string interpolation, mutating-arg patterns)?

**Decision rule** (pre-committed in `docs/private/52_v11_geolocation_design.md` lines 138–142):

- **3+/4 converge on Shape A:** ship A as proposed. Proceed to transpiler implementation + Clima regression example.
- **3+/4 converge on something NOT in {A, B, C}:** new shape family. Write a follow-up design note comparing it to A on the same axes; do not ship blindly.
- **No convergence (mixed across A/B/C/new):** ship A on principle grounds per the design note. Document the cold-test divergence as "no natural convergence, shipped on principles" in the results.
- **Majority on B or C:** pause. Reconsider the design note's conclusion. The "no magic" argument is load-bearing for rejecting C; if models strongly prefer it anyway, the principle may not survive contact with the natural idiom.

**Context tier:** cheatsheet (`spec/v0.10.0-cheatsheet.md`). Tightest teaching surface — same context tier the v0.10 object-update proposal used. If the cheatsheet's existing async (`fetch` + `is loading:` / `is error:`) rules are enough for the model to propose a coherent geolocation extension, the spec has succeeded at teaching its own shape.
