# Cold-LLM Test: Settings Screen (Igni v0.5.1)

**Spec version tested:** Igni v0.5.1
**Test run date:** 2026-04-12
**Source prompt:** `prompts.md` → Settings screen
**First transpiler-validated test in the suite.**

## The prompt

> Using only the Igni language spec above, write a Settings screen in Igni with: a username text field, an email text field, a dark mode toggle, a notifications toggle, and a "Save" button at the bottom.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Claude

**Model version:** Claude Opus 4.6
**Date:** 2026-04-12

### Output

```igni
screen Settings:
  username = ""
  email = ""
  dark_mode = false
  notifications = false
  saving = false

  layout vertical, gap: medium, padding: large:
    label "Settings", style: heading
    input bind: username, placeholder: "Username"
    input bind: email, placeholder: "Email"
    toggle bind: dark_mode, label: "Dark mode"
    toggle bind: notifications, label: "Notifications"
    button "Save", color: brand, on tap: save()

    if saving:
      spinner

  save():
    saving = true
    result = fetch("/api/settings", method: "PUT", body: {username: username, email: email, dark_mode: dark_mode, notifications: notifications})
    if result is error:
      saving = false
    else:
      saving = false
```

### Spec grading

- **Invented syntax?** No. All constructs are valid v0.5.1.
- **Used existing syntax wrong?** No.
- **Valid Igni?** Yes.

### Transpiler result

**FAIL** — three unsupported features:
1. `on tap: save()` — function call in event handler (transpiler only handles inline assignments)
2. `save():` function definition — not in transpiler
3. `spinner` — not in transpiler

### Notes

- Most ambitious of the three — added `saving` state, `fetch` with PUT, loading spinner, error handling. All valid Igni, just beyond transpiler scope.
- Used `label:` on toggle (spec shows this for checkbox but not toggle — reasonable inference).
- Used `color: brand` on button.

---

## Gemini

**Model version:** Gemini 3.1 Pro
**Date:** 2026-04-12

### Output

```igni
screen Settings:
  username = ""
  email = ""
  dark_mode = false
  notifications = false

  layout vertical, gap: medium, padding: large:
    input bind: username, placeholder: "Username"
    input bind: email, placeholder: "Email"
    toggle bind: dark_mode, label: "Dark mode"
    toggle bind: notifications, label: "Notifications"
    button "Save", on tap: save()

  save():
    navigate back
```

### Spec grading

- **Invented syntax?** No.
- **Used existing syntax wrong?** No.
- **Valid Igni?** Yes.

### Transpiler result

**FAIL** — two unsupported features:
1. `on tap: save()` — function call in event handler
2. `save():` function definition with `navigate back`

### Notes

- Simplest of the three. No heading label, no loading state, no error handling.
- Missing `label "Settings", style: heading` — the only model that omitted a title.
- `save()` body is just `navigate back` — minimal but valid.

---

## ChatGPT

**Model version:** ChatGPT (free tier)
**Date:** 2026-04-12

### Output

```igni
screen Settings:
  username = ""
  email = ""
  dark_mode = false
  notifications = true

  layout vertical, gap: large, padding: large:
    label "Settings", style: heading

    layout vertical, gap: medium:
      input bind: username, placeholder: "Username"
      input bind: email, placeholder: "Email"

    layout vertical, gap: medium:
      toggle bind: dark_mode, label: "Dark Mode"
      toggle bind: notifications, label: "Notifications"

    layout vertical, align: end:
      button "Save", color: brand, on tap: save()

  save():
    # Save logic placeholder
    navigate back
```

### Spec grading

- **Invented syntax?** No.
- **Used existing syntax wrong?** No.
- **Valid Igni?** Yes.

### Transpiler result

**FAIL** — two unsupported features:
1. `on tap: save()` — function call in event handler
2. `save():` function definition

### Notes

- Most structured — grouped inputs, toggles, and button into separate nested layouts. Valid Igni.
- Used `align: end` on the button's layout to push it to the bottom.
- Used `gap: large` on the outer layout, `gap: medium` on inner groups — intentional visual hierarchy.
- Only model to use `# comment` syntax.
- Set `notifications = true` (others defaulted to false).

---

## Cross-model findings

### All three models

| Feature | Claude | Gemini | ChatGPT |
|---|---|---|---|
| `input bind:` | ✓ | ✓ | ✓ |
| `toggle bind:, label:` | ✓ | ✓ | ✓ |
| `on tap: save()` (function call) | ✓ | ✓ | ✓ |
| `save():` function definition | ✓ | ✓ | ✓ |
| Heading label | ✓ | ✗ | ✓ |
| `color: brand` on button | ✓ | ✗ | ✓ |
| Nested layouts | ✗ | ✗ | ✓ |
| Inventions | None | None | None |
| **Spec verdict** | **PASS** | **PASS** | **PASS** |
| **Transpiler verdict** | **FAIL** | **FAIL** | **FAIL** |

### Headline finding

**3/3 models used function calls in `on tap:`.** This is the strongest signal in the test. The transpiler's next feature must be screen-internal functions — every model reaches for them, even on the simplest interactive screen.

### Transpiler backlog (ordered by this test)

1. **Screen-internal functions** — `save():` definition + `on tap: save()` call (3/3 models)
2. **`label:` property on toggle** — render label text next to the Switch (3/3 models)
3. **`color:` property on button** — map to Flutter button styling (2/3 models)
4. **`spinner`** — loading indicator (1/3 models, Claude only)
5. **`navigate back`** — navigation (2/3 models, but beyond single-screen scope)

### On the absence of comments

None of the three models added comments (ChatGPT's `# Save logic placeholder` is a stub marker, not documentation). The code reads as pseudocode — `toggle bind: dark_mode, label: "Dark mode"` is self-documenting. This validates Igni's readability thesis: when the language is unambiguous enough for LLMs, it's readable enough for humans without annotation.
