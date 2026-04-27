# v0.16.0 extrapolation panel — 3 domain-spanning apps

Pre-implementation cold test measuring **what models invent when the spec runs out**, not whether they comply with it. Cheatsheet (`spec/v0.16.0-cheatsheet.md`) injected as `--spec`. Three prompts span small (utility) → medium (CRUD with persistence gap) → ambitious (interactive beyond spec).

Predictions pre-registered in `predictions.md` (read after runs only).

**Run with `--no-grade`.** Beyond-spec invented syntax will not transpile; auto-grade would falsely fail.

**No ship bar.** This is exploratory measurement, not a design test. Synthesis grades observed-vs-predicted per `predictions.md`, then catalogues invented syntax by convergence count.

---

## 1. Tip calculator

> Using the Igni cheatsheet above as a guide, build a single-screen tip calculator app.
>
> **Features:**
> - Input field for the bill amount (in pounds, e.g. "42.50").
> - Slider for tip percentage (0% to 30%, default 15%).
> - A way for the user to set the number of people splitting (1 to 10, default 1).
> - Display three values: total bill including tip, tip amount, and per-person amount.
> - Currency values should display rounded to 2 decimal places.
>
> Show the complete Igni code first, then briefly explain any places where the cheatsheet didn't cover what you needed. **If the spec doesn't have a primitive for something you need, invent the syntax that feels most natural in Igni's style.** Don't fall back to other languages or import statements.

## 2. Habit tracker

> Using the Igni cheatsheet above as a guide, build a two-screen habit tracker app.
>
> **The Habits screen:**
> - List of habits, each row showing an emoji, the habit name, today's check-off state (checked or unchecked), and the current streak count (e.g. "🔥 5 days").
> - Tapping a habit toggles today's check-off, which updates that habit's streak.
> - A "+ Add habit" button navigates to the Add screen.
> - The list of habits and their streaks should persist across app restarts — the user shouldn't lose their data when they close and reopen the app.
>
> **The Add screen:**
> - Input fields for emoji and habit name.
> - "Save" button creates the habit and returns to the Habits screen.
>
> Show the complete Igni code first, then briefly explain any places where the cheatsheet didn't cover what you needed. **If the spec doesn't have a primitive for something you need (such as persistence or date handling), invent the syntax that feels most natural in Igni's style.** Don't fall back to other languages or import statements.

## 3. Kanban board

> Using the Igni cheatsheet above as a guide, build a single-screen Kanban board app.
>
> **Features:**
> - Three columns side by side: "Todo", "Doing", "Done".
> - Each column shows a vertical list of cards. Each card has a title.
> - Above each column, an input field and an "Add" button let the user create a new card in that column.
> - Each card has a way for the user to delete it.
> - The user can move a card from one column to another by dragging it across.
>
> Show the complete Igni code first, then briefly explain any places where the cheatsheet didn't cover what you needed. **If the spec doesn't have a primitive for something you need (such as drag-and-drop or gestures), invent the syntax that feels most natural in Igni's style.** Don't fall back to other languages or import statements.
