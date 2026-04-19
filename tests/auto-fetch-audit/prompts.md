# Igni Cold-LLM Test Prompts (auto-fetch scope audit — Stage 0)

**Purpose:** Resolve whether the "auto-fetch on async-value resolution without a user tap" gap signal from the v0.11 Clima rounds is a general language gap or Clima-specific. The existing cold-test corpus has no non-Clima prompt that structurally requires chained async (fetch2 whose URL depends on fetch1's resolved value, with no button-tap in the middle). This prompt supplies one in a non-weather / non-geolocation domain to complete Stage 0 of the `propose → ship-on-principles → validate` template (see memory `project_spec_iteration_template.md`).

**Hypothesis under test:**

If 2+ frontier models on this prompt invent an auto-chain construct (hypothetical `on ready:` / `watch X:` / `on resolve:` / similar) or write structurally-broken trigger patterns, the gap is a general primitive candidate for a future version. If 3+ frontier models express the chain cleanly within existing syntax (screen-body reactive fetch + cascade), the gap is Clima-specific and the design note can be smaller-scope or shelved.

**Prediction** (pre-committed):

Reactive fetch on a screen-body variable *already* handles the common case: if `user = fetch("/api/me")` and later `posts = fetch("/api/users/" + user.id + "/posts")`, the reactivity rule re-evaluates `posts` when `user` resolves. So this prompt MIGHT turn out to be expressible cleanly — in which case the Clima gap is specifically about `locate()` (which resolves once and doesn't trigger its own re-evaluation) plus the v0.11 footgun extension that prevents laundering through `.latitude`/`.longitude`. That would narrow the design-note scope significantly.

**Panel:** Claude Opus 4.7, GPT-5.4, Gemini 3.1 Pro Preview, Gemini 3.1 Flash-Lite Preview. Same v0.11 panel as A4/B4. Graded (transpile check); post-fence-fallback grader.

**Context tier:** `spec/v0.11.1-cheatsheet.md` — latest canonical.

---

## 1. Profile (chained async on launch — fetch user, then fetch their posts)

> Using only the Igni language spec above, write a user profile app in Igni with the behaviours below.
>
> **On launch:** the app fetches the currently-logged-in user from `GET /api/me`. When that response arrives, the app uses the returned `id` to fetch the user's posts from `GET /api/users/<id>/posts`. Show a loading indicator while either fetch is in flight. When both have resolved, render a profile screen.
>
> **Profile screen:** shows the user's name (as a heading), bio (as body text), and a list of their posts (each post as a row with title and date). At the bottom of the screen is a "Refresh" button that re-runs both fetches (user, then posts).
>
> **API facts (use exactly these, don't invent):**
>
> - Current user: `GET /api/me` → JSON `{id, name, bio, avatar_url}`.
> - User's posts: `GET /api/users/<id>/posts` → JSON list of `{id, title, created_at}`.
>
> Don't worry about auth, pagination, visual polish, or error retry UX. Focus on the Igni code expressing the chained-async data flow. If Igni can't express something cleanly, write it in the shape you'd want the language to support and note what you'd need the language to add.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What to grade:**

- **Chain expression.** Did the model express the user → posts dependency cleanly via screen-body reactive fetch (`posts = fetch("..." + user.id + "...")`)? Or did it reach for invented syntax (`on ready:`, `watch user:`, `on resolve:`, lifecycle hooks)?
- **Footgun awareness.** The v0.11 cheatsheet flags reactive-fetch on bound inputs and on `locate()` results. Did the model correctly NOT apply that rule here (user is not a bound input; it's a fetch result that resolves once)?
- **Refresh handling.** How did the model express "Refresh button re-runs both fetches"? Reactivity should make this automatic if `user` is reassigned via a manual function call. Did the model reach for a non-reactive pattern (navigate-back-and-forward, or screen remount)?
- **Language-gap commentary.** Any explicit "Igni needs X" / "hypothetical Y" / "I'd want Z" notes — same detector as the Clima audit.

**Success thresholds:**

- **Clima-specific verdict:** 3-4/4 frontier models express the chain cleanly with no invented syntax. Means the `user = fetch(); posts = fetch(user.id + ...)` pattern works via reactivity; the Clima gap is specifically about `locate()`'s one-shot non-reactive nature + footgun extension, not general async chaining.
- **General-primitive verdict:** 2+ frontier models invent async-chain event syntax. Gap is general; design note for a full primitive is warranted.
- **Mixed / ambiguous:** split result; weight towards whichever axis matters more for the dissertation timeline.
