# v0.16 event-payload binding Stage 0 — adoption test

Pre-implementation cold test for the proposed `on X(name):` syntax (design note 109). Cheatsheet draft (`cheatsheet-draft.md`) injected as `--spec`. Three prompts test whether models reach for the new syntax on the cases that need it (P1, P2) and preserve the bare `on X:` form on the case that doesn't (P3 — closure-over-loop-var).

**Pre-registered ship bar:**

- **Strong:** 3/4 P1 + 3/4 P2 reach for `on X(name):` correctly; ≥2/4 P3 use bare `on X:` form (closure-over-loop-var preserved).
- **Soft:** 2/4 P1+P2 — patch the cheatsheet draft and re-run, or surface what alternative shape models reached for.
- **Fail:** ≤1/4 P1 — design wrong, reopen Shape A.

Run with `--no-grade` (transpiler doesn't yet support the new syntax — auto-grade would falsely fail). Q2 LOCKED at (b) explicit-discard per Tyr decision 2026-04-27.

---

## 1. SearchBar with submit

> Using only the Igni cheatsheet above, build a single-screen Igni app with a `SearchBar` component and a parent `Search` screen.
>
> **The `SearchBar` component:**
> - A text input (placeholder: "Search").
> - A "Search" button.
> - When the user taps Search, the component emits the typed query.
>
> **The parent `Search` screen:**
> - Uses the `SearchBar` component.
> - When the search is submitted, fetches from `"/api/search?q=" + query`.
> - Shows the results in a vertical list — each result has a `.title` field.
> - Show a spinner while loading; show "No results" if the search returns empty.
>
> Show the complete Igni code first, then briefly explain the design choices you made — especially around how the parent receives the emitted query.

## 2. LoginForm with object payload

> Using only the Igni cheatsheet above, build a two-screen Igni app: a `Login` screen with a `LoginForm` component, and a `Home` screen.
>
> **The `LoginForm` component:**
> - An email input.
> - A password input (placeholder: "Password").
> - A "Sign in" button.
> - When the user taps Sign In, the form emits both the email and password to its parent in a single payload.
>
> **The parent `Login` screen:**
> - Uses the `LoginForm` component.
> - When sign-in is submitted, calls `authenticate(email, password)` — assume that function returns a result object with `.success` and `.error_message` fields.
> - On `.success`, navigate to `Home`.
> - On failure, show the error message below the form.
>
> **The `Home` screen:**
> - Just a label that says "Welcome".
>
> Show the complete Igni code, then briefly explain how you packaged the multi-value payload from the form to the parent.

## 3. Notes list with delete

> Using only the Igni cheatsheet above, build an Igni app with a single `Notes` screen and a `NoteRow` component.
>
> **Initial state:**
>
> ```igni
> notes = [{id: 1, text: "buy milk"}, {id: 2, text: "call mum"}, {id: 3, text: "pay rent"}]
> ```
>
> **The `NoteRow` component:**
> - Takes a single `note` argument.
> - Displays the note's text.
> - Has a delete button next to the text (label: "✕").
> - When delete is tapped, signals the parent to remove this specific note.
>
> **The parent `Notes` screen:**
> - Renders each note as a `NoteRow` in a vertical list.
> - When a row signals delete, removes that note from the list.
>
> Show the complete Igni code, then briefly explain the design choice for how the row communicates "remove me" to the parent.
