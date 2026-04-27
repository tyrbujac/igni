# v0.17.0 `border:` Stage 0 — adoption test

Pre-implementation cold test for the proposed `border:` layout property (design note `docs/private/111`). Cheatsheet draft (`cheatsheet-draft.md`) injected as `--spec`. Three prompts test whether models reach for the new syntax canonically (P1 outlined card, P2 selected radio-tile) and avoid over-declaring it on layouts that don't need an outline (P3).

**Pre-registered ship bar:**

- **Strong:** 3/3 P1 + 3/3 P2 reach for `border: <thin|medium|thick>` correctly; ≥2/3 P3 limit `border:` to the buttons that need it (no over-sprinkling).
- **Soft:** 2/3 P1+P2 — patch the cheatsheet draft (the teaching needs to be sharper), re-run.
- **Fail:** ≤1/3 P1 — design wrong, reopen Q1 width vocabulary or §Proposed shape.

Run with `--no-grade`. v0.17 transpiler doesn't yet exist; auto-grade would falsely fail every cell.

Run via API runner: `npx tsx run.ts --model <id> --spec ../v0.17.0-stage0/cheatsheet-draft.md --prompts ../v0.17.0-stage0/prompts.md --out ../v0.17.0-stage0 --no-grade`.

---

## 1. Outlined settings card

> Build a single-screen Igni app with a list of three settings cards, each with a title and a one-line description. Each card has only an outline — no fill colour — and rounded corners. Cards are visually equivalent (no selection state).

## 2. Selected payment method

> Build a single-screen Igni app showing three payment methods: credit card, PayPal, bank transfer. Each method is a row showing the method name. Tapping a row selects it. The selected method has a thicker, brand-coloured border; unselected methods have a thin subtle border. The selection persists across taps (only one method selected at a time).

## 3. Profile screen with mixed border use

> Build a single-screen Igni app showing a profile screen. At the top: a circular avatar (use the `image` primitive), the user's name as a heading, and an email address as a caption. Below: three labelled action buttons in a row — Edit, Share, Sign Out. The avatar/name/email block has no outline. The action buttons each have a thin outline.
