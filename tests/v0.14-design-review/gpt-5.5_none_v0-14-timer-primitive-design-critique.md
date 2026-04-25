## 1 — Each / every semantic parallel

The parallel holds as a naming and conceptual argument, but it should not be asked to carry too much semantic weight.

I agree with the note that `each` and `every` are siblings in the sense of “language-driven repeated execution”: `each` repeats over collection items; `every` repeats over time intervals. That is a good reason to prefer `every 1s:` over `on tick:`. The near-rhyme is not accidental noise; it teaches the right broad category.

That said, the parallel breaks if presented too strongly. `each` in current Igni is render-structural: it participates in producing UI. `every` is procedural and side-effectful: it exists primarily to reassign variables. So for Q1(a), yes, the parallel survives, but only at the “iteration” level, not at the “same kind of body” level. The spec should say plainly that `every`’s body is function/event-handler shaped, not render shaped.

For Q1(b), no, I would not expect a model to infer mounted-only lifecycle from the `each` parallel. `each` has no lifecycle intuition beyond screen rendering. Mounted-only is the right lifecycle, but it must be explicitly taught. The cheatsheet prose already does this, which is good.

For Q1(c), I think the lexical near-rhyme is a strength, not a hazard, provided examples always include the full shapes: `each item in items:` versus `every 1s:`. The second token disambiguates immediately. A skim reader might momentarily blur them, but the semantic family resemblance is helpful enough to justify the risk.

## 2 — User-action invariant on `on X:`

I find this one of the strongest parts of the note. The argument earns its keep.

For Q2(a), the invariant depends on `on change:` being specified carefully. If `on change:` fires when a bound variable is reassigned programmatically, then the invariant is already broken. But I think Igni should define `on change:` as user-originated primitive change only: typing, selecting, toggling, dragging. Programmatic reassignment of the bound variable should re-render through lexical reactivity, but should not fire `on change:`. If that is not already explicit in the spec, v0.14 should patch it, because this timer discussion exposes the ambiguity.

For Q2(b), future external events like websocket messages or geolocation updates should not automatically go into the `on X:` family if the invariant is adopted. They are not user actions. That does create future design pressure: Igni may eventually need another family for external streams or subscriptions. But that supports the timer argument rather than undermining it. It says the taxonomy matters: user events, time recurrence, async one-shots, and future external streams are distinct reactivity classes.

For Q2(c), I think the new keyword is worth it. Shape B is tempting because `on tick:` is short and familiar, but it spends hidden semantic budget. It teaches that `on` means “an event happened,” not “the user acted.” That broader meaning is common in other frameworks, but Igni’s existing surface is narrower and clearer. Preserving that clarity is worth one keyword, especially because `every` is not arbitrary; it has a natural relation to `each`.

## 3 — Duration token whitelist

Shipping only `1s` is defensible, but it is the part most likely to annoy users and models.

For Q3(a), I read `1s`-only as honest scope discipline for v0.14. The triggering app is Pomodoro/countdown/clock territory, and `1s` covers that. `100ms` pulls in animation/performance expectations. `5s` and `30s` pull in polling, autosave, background behavior, and possibly async overlap semantics. Those are real needs, but not necessarily v0.14 needs.

For Q3(b), yes, the whitelist will cause some churn. Models will absolutely try `every 5s:` or `every 30s:` for polling/autosave prompts. A targeted parse error helps, but it still means the model has to recover. The cheatsheet should therefore be very blunt: “v0.14 supports only `every 1s:`.” Not just in prose; examples should avoid implying general duration support. The syntax name `every <duration>:` is future-facing, but the teaching should foreground the current restriction.

For Q3(c), I would not ship `100ms` yet. That crosses into animation and could create performance/codegen questions. I am more tempted by shipping `1s`, `5s`, and `30s` together because they are low-rate and obvious for real apps. But doing so weakens the methodology claim that tokens are promoted by demonstrated demand. My recommendation: keep v0.14 to `1s`, but make the future whitelist path prominent and make unsupported-token errors excellent. Do not solve higher rates via cancellation machinery; that is a separate concern and would be much more complex than token promotion.

## 4 — One `every` block per screen

This is the weakest decision in the note.

For Q4(a), yes, there are real app cases with multiple meaningful recurrences: autosave every 5s plus refresh every 30s; a visible countdown every 1s plus a slower poll; a clock plus periodic sync; a notification badge refresh plus local UI timer. These are not exotic.

For Q4(b), models will naturally write two `every` blocks if the app has two independent recurring tasks. A parse-time rejection would feel surprising, especially because multiple function definitions and multiple event handlers are already natural in Igni. The analogy to “one `body` per wrapper” does not fully persuade me. `every` is behavior, not the singular visual root of a screen. A screen having multiple recurring behaviors is conceptually normal.

For Q4(c), the workaround is expressive in the narrow v0.14 world because only `1s` exists. You can centralize all periodic work in one `every 1s:` body and gate different tasks with counters or timestamps. But this is not a great LLM target. It encourages modulo counters, drift, hand-rolled scheduling, and bulky imperative code. It also gets worse the moment `100ms`, `5s`, or `30s` are added.

My suggested patch: either allow multiple `every` blocks now, or phrase the one-block rule explicitly as a v0.14 implementation limitation rather than a long-term language principle. If multiple blocks are rejected for v0.14, the note should acknowledge that this is likely to be reopened when the second duration token ships.

## 5 — Lifecycle: mounted-screen-only

Mounted-screen-only is the right default for v0.14, but the note should be more explicit about what it does not solve.

For Q5(a), a global session timer should not be screen-scoped. If it must survive navigation, it belongs at app scope or shared scope eventually. But I would not bundle that into v0.14. Screen recurrence is already a new category. Adding app-scope recurrence simultaneously introduces shared lifecycle, cross-screen state, cancellation, and ownership questions.

For Q5(b), a Settings polling fetch that continues while the user visits a sub-screen is ambiguous. If the parent screen remains mounted under a child route, mounted-only may already work. If navigation replaces the screen, polling pauses. That is probably acceptable for v0.14. A stronger always-on polling primitive would need different lifecycle semantics.

For Q5(c), pausing can create visible glitches, especially for countdowns. A Pomodoro timer implemented as “subtract 1 each tick” will be wrong if the screen is unmounted or the app is backgrounded for a while. But that is not necessarily a reason to make screen timers global. It is a reason to teach that `every` is a screen-local recurrence, not a durable wall-clock guarantee. If Igni has or later adds a non-reactive `clock()`/`now()` read, robust countdowns should store an end time and recompute remaining time on each tick/render.

So I endorse mounted-only for v0.14. Future `shared:` or app-scope `every` is plausible, but it should be a separate design note with its own real-app trigger. The current note should add one sentence: missed ticks are not caught up after unmount/navigation; the block simply pauses and resumes while mounted. That would prevent users from inferring stronger timing guarantees than Igni intends.