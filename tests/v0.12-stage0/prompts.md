# v0.12 Stage 0 — `font:` on labels, shape choice (curated token vs arbitrary string)

Cold tests against v0.11.6. Paste the full cheatsheet FIRST, then the prompt BELOW it. Fresh conversation, no prior context.

**Hypothesis under test — Stage 0 (pre-ship shape measurement):**

v0.11.6 exposes no font syntax at all — only `style:` tokens that govern size/weight. Typography-heavy prompts are the first cold-test round that stresses this gap. When a model is told to use a specific font family by name, does it reach for a **token form** (`font: pacifico`, matching the precedent of `style:` / `color:` / `gap:` / `padding:` / `align:` / `background:` — all token-only in v0.11.6) or a **string form** (`font: "Pacifico"`, matching the CSS `font-family: "Pacifico"` prior most code-trained models have)?

Design note: `docs/private/78_v012_font.md` (Shape A recommended; Stage 0 is the pre-ship gate). The primitive is not in v0.11.6's cheatsheet — models must invent the shape cold.

**Pre-registered (locked 2026-04-22 in `docs/private/78` §Decision, before this round runs):**

- **Panel:** 4 frontier models — `claude-opus-4-7`, `gpt-5.4`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview`.
- **Context:** `spec/v0.11.6-cheatsheet.md` (current canonical). No priming toward `font:`. No reference to the design note.
- **Counting basis:** per-model. Each model produces 2 outputs (one per prompt below); grade the model's overall preference across both. "Token-form reach" = the model's majority shape on its `font:`-analogue invocations; ties decided by which shape appears first.
- **Pass bar (Shape A confirmed — ship as v0.12):** 4/4 token form.
- **Partial bar (ship Shape A with cheatsheet anti-pattern callout):** 3/4 token form, 1/4 string form.
- **Fail bar (reopen `docs/private/78`, reconsider Shape B):** 2/4 or below token form.

These thresholds are verbatim from `docs/private/78` §Decision (lines 130–134) and are binding.

**Fonts used in prompts (all six are in the proposed Shape A curated bundle):** Pacifico, Source Sans Pro, Merriweather, Inter, Lora, Fira Code. Prompts name fonts in user language (just the font name as a design requirement); the model's job is to translate that into Igni syntax. No prompt introduces out-of-bundle fonts — this round measures shape choice, not extensibility behaviour (which is deferred to v0.14+ per doc 78 line 59).

**Attribution discipline:** no overlap with v0.13 Stage 3's desktop-layout-stress prompt (doc 79). Both prompts here are typography-focused static layouts; neither uses a landing-page framing or exercises responsive breakpoints.

---

## 1. Profile card (MiCard-style — matches v0.12 motivation, doc 77)

> Using only the Igni language spec above, build a single-screen personal profile card in Igni.
>
> **Screen:**
> - Teal background filling the whole screen.
> - A circular avatar image (use any filename — `avatar.png` is fine).
> - Below the avatar, the person's **name** in large text: "Joe Bloggs". This name must render in the **Pacifico** font — it is the defining visual element of the card.
> - Below the name, a job title in smaller, all-caps text: "IGNI DEVELOPER". This subtitle must render in the **Source Sans Pro** font (a clean industry-standard sans).
> - Below the subtitle, a thin horizontal divider.
> - Two contact rows beneath the divider, each with an icon and a label:
>   - Phone icon + "+44 7700 900123"
>   - Email icon + "joe.bloggs@example.com"
>   Both contact-row labels should also render in **Source Sans Pro**.
>
> **Design constraints:**
> - Centre the content vertically and horizontally.
> - Typography is visually load-bearing — the typography distinctions above are part of the spec, not optional styling flavour.
>
> Show the complete Igni code first, then briefly explain any design decisions — especially how you handled the font-family requirements.

**What to grade (Stage 0 focus — font-invocation shape only):**

- **Shape chosen** for each `font:`-analogue invocation: token form (`font: pacifico`), string form (`font: "Pacifico"`), CSS-style list (`font: "Pacifico, cursive"`), dotted-subkey variant, or dodged-entirely (model ignores the font requirement and uses `style:` alone)?
- **Commentary read:** does the explanation acknowledge the font requirement explicitly or silently drop it?
- **Transpile** auto-graded by the runner — a clean transpile on an invented shape means the codegen permitted the shape; not a correctness signal for this round.

---

## 2. Restaurant menu header (typography-heavy, different framing to de-risk prompt-specific artefacts)

> Using only the Igni language spec above, build a single-screen restaurant menu in Igni.
>
> **Screen:**
> - Cream / light background (use the `card` background token or pick a neutral colour).
> - At the top, the restaurant name as a large centered title: "The Copper Kettle". This title must render in the **Merriweather** serif font — it's the editorial anchor of the menu.
> - Below the title, a short italic-feeling tagline: "Seasonal British cooking since 2012". This tagline must render in the **Lora** serif font (an alternate serif, visually distinct from Merriweather).
> - Below the tagline, a horizontal rule.
> - Then three menu sections ("Starters", "Mains", "Desserts"), each with a bold section-header label and two or three hardcoded item rows. Each item row shows the dish name on the left and the price on the right (e.g. "Roast pumpkin soup — £7.50"). Dish names and prices should render in the **Lora** font; section headers in **Merriweather**.
>
> **Design constraints:**
> - The Merriweather / Lora pairing is the defining visual identity — dishes should not fall back to the default font.
> - Use indentation and Igni's existing `style:` tokens where appropriate (e.g. section headers can be `style: heading`); the font-family is an additional axis on top of existing style.
>
> Show the complete Igni code first, then briefly explain how you handled the two-serif typography pairing.

**What to grade:** same criteria as prompt 1. Two-serif pairing stresses the primitive without a script/sans contrast — if models reach for a different shape for serif-pairings vs script/sans, this prompt surfaces it.

---

## Notes for the grader

- Neither prompt mentions a specific Igni syntax for font-family. Only font names as design requirements. Shape choice is the signal.
- Pre-registration is strict: 4/4, 3/4, or ≤2/4 — the decision follows mechanically from the tally per doc 78 §Decision.
- Commentary *naming* a specific syntax for font-family in passing ("I'd use `font: pacifico` here...") counts even if the code sample doesn't compile around it — it reveals the model's default mental model.
- Transpile pass is **not a pass signal** for this round — the existing transpiler has no `font:` handler, so either outcome (cleanly-transpiled but silently-discarded, or transpile-error on unknown argument) is valid data for shape-choice grading. Grade the shape, not the transpile flag.
- If a model **dodges the font requirement entirely** (renders without attempting any font-family syntax), count that as "no-shape." Pre-register: no-shape responses count as neither token nor string — they go to a separate column. If any model produces 2/2 no-shape, flag as a prompt-shape problem and consider re-running with a sharper requirement phrasing before applying the decision rule. (This clause is added to catch the pathological case where all models dodge; it does not alter the 4/4 / 3/4 / ≤2/4 bars for models that *do* attempt a shape.)

**Cost estimate:** ~30 min wall-clock, ~$0.15 total (per doc 78 §Decision line 138).
