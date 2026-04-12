# Cold-LLM Test: Greeting Screen (Igni v0.5.1)

**Spec version tested:** Igni v0.5.1
**Test run date:** 2026-04-12
**Source prompt:** `prompts.md` → Greeting screen
**Transpiler-validated test — expected to surface gaps.**

## The prompt

> Using only the Igni language spec above, write a Greeting screen in Igni. It should have a text input for the user's name and a greeting below it. When the name field is not empty, show "Hello, " followed by the name. When the name field is empty, show "Type your name above" in a subtle style.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Claude

```igni
screen Greeting:
  name = ""

  layout vertical, gap: medium, padding: large:
    input bind: name, placeholder: "Your name"
    if name is empty:
      label "Type your name above", color: subtle
    else:
      label "Hello, " + name, style: heading
```

### Spec grading
- **Invented syntax?** No.
- **Valid Igni?** Yes.

### Transpiler result (pre-fix)
**FAIL** — `is empty` and string `+` in label not supported. After adding both: **PASS**.

---

## Gemini

```igni
screen Greeting:
  name = ""

  layout vertical, gap: medium, padding: large:
    input bind: name, placeholder: "Name"
    if name is not empty:
      label "Hello, " + name
    else:
      label "Type your name above", color: subtle
```

### Spec grading
- **Invented syntax?** No.
- **Valid Igni?** Yes.

### Transpiler result (pre-fix)
**FAIL** — `is not empty` and string `+` in label. After adding both: **PASS**.

---

## ChatGPT

```igni
screen Greeting:
  name = ""

  layout vertical, gap: medium, padding: large:
    input bind: name, placeholder: "Your name"
    if name is empty:
      label "Type your name above", style: body, color: subtle
    else:
      label "Hello, " + name, style: heading
```

### Spec grading
- **Invented syntax?** No.
- **Valid Igni?** Yes.

### Transpiler result (pre-fix)
**FAIL** — `is empty` and string `+` in label. After adding both: **PASS**.

---

## Cross-model findings

| Feature | Claude | Gemini | ChatGPT |
|---|---|---|---|
| `is empty` / `is not empty` | `is empty` | `is not empty` | `is empty` |
| String `+` in label | ✓ | ✓ | ✓ |
| `color: subtle` | ✓ | ✓ | ✓ |
| `style:` on labels | `heading` | none | `body`, `heading` |
| Branch order | empty first | not-empty first | empty first |
| **Spec verdict** | **PASS** | **PASS** | **PASS** |
| **Transpiler verdict (post-fix)** | **PASS** | **PASS** | **PASS** |

### Headline findings

1. **3/3 models used `is empty` or `is not empty`.** Universal pattern — correctly surfaced as the next transpiler feature.
2. **3/3 models used string `+` for greeting.** `"Hello, " + name` is the canonical Igni concatenation pattern. Codegen had a nested-quote bug with BinaryExpr in display strings — fixed.
3. **3/3 models used `color: subtle`.** Transpiler ignores this property for now (cosmetic, not structural).
4. **Branch order split:** Claude and ChatGPT checked `is empty` first (negative case), Gemini checked `is not empty` first (positive case). Both are valid.

### Features added to close this test
- `is` keyword in lexer
- `IsExpr` AST node with `empty` / `not empty` checks
- `parseComparison` level in expression parser
- `is empty` → `.isEmpty`, `is not empty` → `.isNotEmpty` in codegen
- BinaryExpr display fix (use `exprToDart` directly, not string interpolation wrapper)
