# v0.20 dark-mode + spacing tokens — Stage 0 cold-test

Pre-implementation cold test for the v0.20 bundle: Workstream A (dark-mode propagation, post-Stage-2 reshape `(a) ∪ (b)` per `docs/private/118`) + Workstream B (wider spacing tokens 4/8/12/16/20/24/32 per `docs/private/119`). Cheatsheet draft (`cheatsheet-draft.md`) injected as `--spec`. The 6 post-Stage-2 patches are inlined into the cheatsheet draft so the panel sees the locked semantics: Q2 explicit-enum `shared.theme_mode: "system" | "light" | "dark"`, Q3 auto-fall-back for missing dark tokens, Q4 reshape (`theme: color:` user-defined + `theme: scaffold:` / `theme: appbar:` / `theme: text:` structural sub-blocks + `theme dark:` mirroring both), Q5 active-variant resolution scoped to theme tokens, theme-transition instant-snap rule, generic-selector forward-compat note.

**Pre-registered ship bar (mirror v0.19 shape):**

- **Strong:** 3/3 P1 + 3/3 P2 reach for the canonical syntax — `theme dark:` variant pair + `shared.theme_mode` string enum (P1); `spacing/N` numeric tokens or word-token aliases used in `gap:` / `padding:` (P2). ≥2/3 P3 use auto-fall-back correctly (don't redeclare brand colours in `theme dark:`) AND keep `transition: fade` off top-level theme switches.
- **Soft:** 2/3 P1 + P2 — patch the cheatsheet draft (teaching needs to be sharper on the divergent point), re-run.
- **Fail:** ≤1/3 P1 — design wrong, reopen Q1 / Q4 sub-decisions in doc 118.

Run with `--no-grade`. v0.20 transpiler hasn't shipped yet; auto-grade would falsely fail every output.

Run via API runner:

```bash
cd tests/runner
npx tsx run.ts --model claude-opus-4-7 --spec ../v0.20-stage0/cheatsheet-draft.md --prompts ../v0.20-stage0/prompts.md --out ../v0.20-stage0 --no-grade
npx tsx run.ts --model gpt-5.5 --spec ../v0.20-stage0/cheatsheet-draft.md --prompts ../v0.20-stage0/prompts.md --out ../v0.20-stage0 --no-grade
npx tsx run.ts --model gemini-3.1-pro-preview --spec ../v0.20-stage0/cheatsheet-draft.md --prompts ../v0.20-stage0/prompts.md --out ../v0.20-stage0 --no-grade
```

Or via cold-test wrapper:

```bash
npx tsx tests/runner/cold-test.ts \
  --prompts /abs/path/tests/v0.20-stage0/prompts.md \
  --out /abs/path/tests/v0.20-stage0 \
  --spec /abs/path/tests/v0.20-stage0/cheatsheet-draft.md \
  --no-grade \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview
```

Outputs land as `<model>_cheatsheet_<prompt-slug>.{md,json}`. Cost target: ~$0.40 (3 models × 3 prompts; mirrors v0.19 Stage 0 cost of $0.63 for spec-injected, but spec is smaller for v0.20 so should land lower).

---

## 1. Settings screen with light/dark theme toggle

> Build a `Settings` screen that lets the user toggle between three theme states: follow-OS, force-light, force-dark. The screen renders three radio-button-style options (one per state). Above the options is a preview card showing what `theme: color: card:` and `theme: color: text:` look like in the currently-active variant. Then build the `theme:` and `theme dark:` declarations the screen depends on.
>
> Constraints:
>
> - The app has at minimum: `brand`, `surface`, `text`, `card` colour tokens declared in `theme:`. The dark variant overrides at least `surface`, `text`, `card` to dark-appropriate values; `brand` stays the same in dark.
> - The scaffold and AppBar background should follow `surface` so the app's chrome respects the active variant.
> - The Settings screen has a `title:` of "Settings" so the AppBar appears.
> - The radio group controls `shared.theme_mode` — three options: "Follow system", "Light", "Dark" (with the active option visibly selected).
> - The preview card shows two labels: one in the default text colour and one explicitly using `card` background.
>
> Write `Settings.igni` (the full app — `theme:` + `theme dark:` + `shared:` block + `Settings` screen). Use idiomatic Igni per the cheatsheet. If two equally-canonical shapes exist for any decision, pick one and explain briefly.

## 2. Greeting card with fine-grained typography spacing

> Build a `Card` screen that displays a greeting card preview — title, body, sender — with carefully-tuned typography spacing. Use the new spacing tokens (`spacing/N` numeric scale or word-token aliases — your choice; explain which you reached for and why).
>
> Constraints:
>
> - The card has three vertically-stacked text elements: a title (style `heading`), a body paragraph (style `body`), and a sender line (style `caption`).
> - Spacing between title and body is ~12 px; between body and sender is ~20 px. Use the right tokens.
> - Outer padding around the card is ~32 px. The card itself has 16 px internal padding.
> - The card has a soft `surface_elevated` background and rounded corners (medium rounding — 16 px).
> - Light-and-dark variants: body text colour follows `theme: color: text:` so it flips between light and dark mode.
>
> Write the full `Card.igni` (theme block + screen). Demonstrate fluency with the spacing-token surface — pick whichever token style (numeric or word) you find more readable for this case and explain.

## 3. Notes app with theme-aware borders, scaffold chrome, and a manual theme animation

> Build a `Notes` screen for a notes app that demonstrates three composition patterns from the cheatsheet at once: theme-aware `border:` colour (flips with active variant via the active-variant-resolution rule), `theme: scaffold:` background propagation (chrome respects the active variant), and an *explicit* user-built theme-switch transition (because automatic theme transitions are explicitly NOT a thing per the cheatsheet — instant-snap is the rule).
>
> Constraints:
>
> - Three notes in a list, each with a `border: thin, color: subtle` outline and a `background: card`. The border colour is `subtle` (a colour token) so it flips with theme.
> - A "Toggle theme" button at the top of the screen flips `shared.theme_mode` between `"light"` and `"dark"` (without going through `"system"`).
> - The scaffold + AppBar honour the active variant. AppBar `title:` is "My Notes."
> - **The theme switch is INSTANT-SNAP per the cheatsheet — `transition: fade` does NOT apply at the theme level.** If your app *visibly* fades the theme switch, you must build the fade explicitly via a screen-level `if shared.theme_mode is "dark":` conditional render that wraps the body in `transition: fade`. (Most panel cells will probably skip this and accept the instant snap — that's fine and canonical. The constraint is: do NOT try to put `transition: fade` on the `theme:` block directly. That's not a thing.)
> - User-defined token `subtle_border: "#CFCFCF"` declared once in `theme: color:`. It should NOT need redeclaring in `theme dark:` — auto-fall-back inherits the light value. (Pressure-test: do panel cells over-declare?)
>
> Write the full `Notes.igni`. Demonstrate the auto-fall-back rule by NOT redeclaring `brand` and `subtle_border` in `theme dark:`. Demonstrate the active-variant-resolution rule by using `border: thin, color: subtle` (subtle's value resolves to whichever variant is active). If you choose to add the explicit theme-switch transition, do it as a separate screen-body conditional render — not as a `theme:` block property.
