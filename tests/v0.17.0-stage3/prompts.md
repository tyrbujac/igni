# v0.17.0 `border:` Stage 3 — post-implementation ship validation

Post-implementation cold test against the SHIPPED `spec/v0.17.0-cheatsheet.md` (not the Stage 0 draft). 4-model panel including the noise tier (`gemini-3.1-flash-lite-preview`) — confirms the cheatsheet teaching survives wider model reach plus the post-Stage-0 patches (two-helper selected-state + outlined-button pin).

**Pre-registered ship bar:**

- **Strong:** 4/4 P1 + 4/4 P2 reach for `border: <thin|medium|thick>` correctly; ≥3/4 P3 limit `border:` to the buttons that need it (no over-sprinkling).
- **Soft:** 3/4 P1 or P2 — patch the v0.17 cheatsheet for v0.17.1 docs-only iteration; re-run if patch is non-trivial.
- **Fail:** ≤2/4 P1 — reopen design (this would be a surprise — Stage 0 already strong-passed against the same prompts at 3/3).

Run with `--no-grade` per cycle convention (transpiler check separate from adoption signal). The shipped transpiler does support `border:` now, so a stricter Stage 3 with `--grade` is also a valid follow-on if any cell looks borderline.

Run via API runner: `npx tsx run.ts --model <id> --spec ../../spec/v0.17.0-cheatsheet.md --prompts ../v0.17.0-stage3/prompts.md --out ../v0.17.0-stage3 --no-grade`.

---

## 1. Outlined settings card

> Build a single-screen Igni app with a list of three settings cards, each with a title and a one-line description. Each card has only an outline — no fill colour — and rounded corners. Cards are visually equivalent (no selection state).

## 2. Selected payment method

> Build a single-screen Igni app showing three payment methods: credit card, PayPal, bank transfer. Each method is a row showing the method name. Tapping a row selects it. The selected method has a thicker, brand-coloured border; unselected methods have a thin subtle border. The selection persists across taps (only one method selected at a time).

## 3. Profile screen with mixed border use

> Build a single-screen Igni app showing a profile screen. At the top: a circular avatar (use the `image` primitive), the user's name as a heading, and an email address as a caption. Below: three labelled action buttons in a row — Edit, Share, Sign Out. The avatar/name/email block has no outline. The action buttons each have a thin outline.
