# v0.20 dark-mode + spacing tokens — Stage 3 ship-validation

Post-implementation cold test against the shipped cheatsheet (`spec/v0.20.0-cheatsheet.md`, post-Session-6b + post-Stage-0-patches per `docs/private/118` Cycle status). Same three prompts as Stage 0 (`tests/v0.20-stage0/prompts.md`) run against a 4-model panel (3 frontier + flash-lite noise tier) to confirm the shipped cheatsheet teaches the post-implementation surface.

**Why pre-version-bump-finalise.** The v0.20.0 fork (`scripts/new-spec-version.ts 0.20.0`) shipped in Session 6a; codegen lands in Session 6b. Stage 3 runs against the SHIPPED cheatsheet (the same content the v0.20 user will read) to confirm canonical adoption holds post-implementation. Any teaching-gap findings can land in the v0.20.0 ship's CHANGELOG/ROADMAP narrative or trigger a focused v0.20.1 docs iteration.

**Pre-registered ship bar** (mirrors v0.18 / v0.19 Stage 3 shape):

- **Strong:** 4/4 P1 + 4/4 P2 reach for canonical syntax (`theme dark:` variant pair, `shared.theme_mode` string enum, sub-blocks `theme: scaffold:` / `theme: appbar:`, auto-fall-back of unchanged tokens, `spacing/N` numeric scale OR word-token aliases per Stage 0's empirical heuristic). ≥3/4 P3 use auto-fall-back correctly (don't redeclare brand/subtle_border in `theme dark:`) AND keep `transition: fade` off top-level theme switches. Proceed to ship commit.
- **Soft:** 3/4 on P1 or P2 — log as Tier-A patch for v0.20.0 ship narrative or v0.20.1 docs iteration.
- **Fail:** ≤2/4 P1 — reopen cheatsheet teaching; possible v0.20.x design re-open.

Run with `--no-grade` per v0.19 precedent. The transpiler now compiles all v0.20 surface end-to-end (133 → 137 fixtures green; smoke 82/87 → 85/90 green); auto-grade against panel output would introduce churn (panel cells produce slightly different shapes than canonical fixtures — different colour-token names, different layout-property orderings — that aren't bugs). Synthesise convergence manually per cycle standard.

Run via cold-test wrapper:

```bash
npx tsx tests/runner/cold-test.ts \
  --prompts /Users/tyrbujac/Documents/Projects/experiments/Igni/tests/v0.20-stage3/prompts.md \
  --out /Users/tyrbujac/Documents/Projects/experiments/Igni/tests/v0.20-stage3 \
  --spec /Users/tyrbujac/Documents/Projects/experiments/Igni/spec/v0.20.0-cheatsheet.md \
  --no-grade \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview,gemini-3.1-flash-lite-preview
```

Outputs land as `<model>_cheatsheet_<prompt-slug>.{md,json}`. Cost target: ~$0.50 (4 models × 3 prompts; flash-lite noise tier brings cost down vs frontier-only). Cumulative v0.20 cycle cost so far: $0.30 (Stage 2) + $0.83 (Stage 0) = $1.13. Stage 3 brings to ~$1.63.

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
