# Cold-LLM Test: Sorted Contacts (Igni v0.6)

**Spec version tested:** Igni v0.6
**Test run date:** 2026-04-12
**Source prompt:** `prompts.md` → Sorted contacts
**New test — exercises sorted, filter, reversed composition.**

## The prompt

> Using only the Igni language spec above, write a Contacts screen in Igni. It should show a list of contacts sorted alphabetically by name. Include a search input that filters contacts by name (show only contacts whose name contains the search text). Add a toggle to switch between A-Z and Z-A sort order. Use the list builtins from the spec.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Cross-model results

| Feature | Claude | Gemini | ChatGPT |
|---|---|---|---|
| `sorted` with lambda | `sorted(filtered, c => c.name)` | `sorted(filtered, c => c.name)` | `sorted(filtered, c => c.name)` |
| `filter` with lambda | `filter(contacts, c => contains(...))` | `filter(contacts, c => ... contains ...)` | `filter(contacts, c => contains(...))` |
| `reversed` | `reversed(ordered)` inline in `each` | `reversed(alphabetical)` assigned to var | `reversed(sorted_list)` in conditional expr |
| Sort toggle | `ascending` bool, `if/else` with two `each` | `sort_za` bool, conditional assign | `descending` bool, `if` expression (invented) |
| Components | `ContactRow` | `ContactRow` | None (inline label) |
| String contains | **Invented `contains(name, query)`** | **Invented `name contains text`** | **Invented `contains(name, query)`** |
| Other inventions | `length(filtered)` counter | `divider` | `if` as expression |
| **Spec verdict** | **PASS** (minus contains) | **PASS** (minus contains) | **PARTIAL** (if-expression) |

## Headline findings

### 1. sorted + filter + reversed: universally discovered (3/3)

All three models used `sorted`, `filter`, and `reversed` correctly with lambda syntax. The composition pattern works — models naturally chain operations:
- Claude: filter → sort → conditionally reverse in rendering
- Gemini: filter → sort → conditionally assign reversed
- ChatGPT: filter → sort → conditional expression (invented)

### 2. String contains: the #1 gap (3/3 invented)

The spec has no string containment check. All three models invented one:
- **Claude + ChatGPT:** `contains(c.name, query)` — function-call form
- **Gemini:** `c.name contains search_text` — infix operator form

This is the strongest signal for a future spec addition. 2/3 models chose the function form, suggesting `contains(string, substring)` is the more natural shape.

### 3. ChatGPT invented if-as-expression

```igni
display = if descending:
    reversed(sorted_list)
  else:
    sorted_list
```

The spec explicitly says "conditionals are statements, not expressions." ChatGPT ignored this. The pattern IS useful (conditional assignment without mutation), but it violates a stated rule. Worth watching — if models keep inventing it, it might need to be added.

### 4. Claude's approach was most architecturally clean

Claude used `if ascending:` / `else:` with two separate `each` loops in the layout rather than pre-computing the display list. This avoids the need for conditional expressions and stays within the spec's rules. Gemini's approach (conditional variable assignment) is borderline but arguably valid. ChatGPT's if-expression is a clear invention.

## Gap for future spec versions

**String containment** (`contains` or similar) is the clear next addition. 3/3 models needed it. The function form `contains(string, substring)` matches the existing builtin pattern (`find`, `filter`, `without`, etc.) and was chosen by 2/3 models.
