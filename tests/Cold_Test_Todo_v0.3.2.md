# Cold-LLM Test: Todo List (Igni v0.3.2)

**Spec version tested:** Igni v0.3.2
**Test run dates:** 2026-04-11 (all three models complete)
**Source prompt:** `tests/prompts.md` → Todo list

## The prompt

> Using only the Igni language spec above, write a todo list app in Igni. The user should be able to type a new todo into a text input, add it to the list with a button, see all todos in a list, mark each one as complete (with a visual indication), and delete items they no longer need.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Claude

**Model version:** Claude Opus 4.6
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen Todos:
  new_todo = ""
  items = []

  layout vertical, gap: medium, padding: large:
    layout horizontal, gap: small:
      input bind: new_todo, placeholder: "New todo"
      button "Add", color: brand, on tap: add_todo()

    each item in items:
      TodoItem item, on tap: toggle(item)

  add_todo():
    if new_todo is not empty:
      items = items + [{text: new_todo, done: false}]
      new_todo = ""

  toggle(item):
    item.done = not item.done

  remove(item):
    items = without(items, item)

component TodoItem(todo):
  layout horizontal, gap: medium, align: center, padding: small:
    checkbox bind: todo.done
    if todo.done:
      label todo.text, style: body, color: subtle
    else:
      label todo.text, style: body
    button "Delete", color: danger, on tap: remove(todo)
```

### Grading

- **Invented syntax not in the spec?** **Yes — two things:** `without(items, item)` (assumed a list-removal builtin), and `item.done = not item.done` (mutates a list element field in place; the spec says screen/component arguments are immutable but is silent on list-element mutation).
- **Used existing syntax wrong?** **Borderline.** The in-place list mutation may or may not work depending on the reactivity model for list items, which the spec doesn't define.
- **Valid Igni on first try?** **No.** `without()` is undefined and the in-place mutation is unspecified. But the structural decomposition is the strongest of the three.
- **Line count:** ~31 lines.

### Notes

- **Cleanest decomposition.** Claude is the only model that extracted a `TodoItem` component AND put `on tap:` on the invocation (`TodoItem item, on tap: toggle(item)`) — exactly the v0.3.2 readability hint pattern.
- **`is not empty` for the empty check** — consistent with Claude's calculator behaviour. Reaches for `is` extensions naturally.
- **Conditional rendering** — uses `if todo.done: ... else: ...` inside `TodoItem` to render different label styles. Clean use of v0.3.2 conditionals.
- **Cross-component function call** — `TodoItem` calls `remove(todo)`, which is defined in the parent `Todos` screen. The spec doesn't say whether this is allowed. Real ambiguity worth resolving in v0.4.
- **`item.done = not item.done`** — direct field mutation on a list element. Cleaner than rebuilding the list functionally, but raises the reactivity question: does this trigger re-render of any screen referencing `items`? The spec is silent.

---

## Gemini

**Model version:** Gemini 3.1 Pro
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen TodoList:
  draft = ""
  todos = []
  next_id = 1

  layout vertical, padding: large, gap: medium:
    label "Tasks", style: heading

    layout horizontal, gap: small, align: center:
      input bind: draft, placeholder: "What needs to be done?"
      button "Add", color: brand, on tap: add_todo()

    divider

    layout vertical, gap: small:
      each item in todos:
        layout horizontal, align: center, spread: true:
          layout horizontal, gap: small, align: center, on tap: toggle_todo(item.id):
            if item.done:
              icon "check", color: green
              label item.text, color: subtle
            else:
              icon "circle", color: subtle
              label item.text

          icon "close", color: danger, on tap: remove_todo(item.id)

  add_todo():
    if draft != "":
      new_item = {id: next_id, text: draft, done: false}
      todos = todos + [new_item]
      next_id = next_id + 1
      draft = ""

  toggle_todo(id):
    updated = []
    each t in todos:
      if t.id == id:
        t_new = {id: t.id, text: t.text, done: not t.done}
        updated = updated + [t_new]
      else:
        updated = updated + [t]
    todos = updated

  remove_todo(id):
    kept = []
    each t in todos:
      if t.id != id:
        kept = kept + [t]
    todos = kept
```

### Grading

- **Invented syntax not in the spec?** **Yes — two things:** `==` and `!=` operators (`if draft != ""`, `if t.id == id`, `if t.id != id`), and `each` used in non-rendering context (inside `toggle_todo` and `remove_todo` to build new lists).
- **Used existing syntax wrong?** **Stylistic landmine:** wrote `layout horizontal, gap: small, align: center, on tap: toggle_todo(item.id):` — the double-colon block-opening line that the v0.3.2 readability hint warns against. Technically valid, but the hint says to prefer extracting a component.
- **Valid Igni on first try?** **No.** Uses undefined `==`/`!=` and stretches `each` into function-body context.
- **Line count:** ~50 lines.

### Notes

- **Same equality gap as Calculator.** Gemini consistently reaches for `==`/`!=` instead of extending `is`. Two tests in a row, same outlier behaviour. This is now a pattern, not a one-off.
- **Functional update strategy.** Instead of mutating list items in place (Claude's approach), Gemini constructs new objects and rebuilds the list — for example, `t_new = {id: t.id, text: t.text, done: not t.done}`. Avoids the "is list item mutation reactive?" question entirely. Verbose but unambiguous.
- **Manual ID counter** — Gemini introduced `next_id` for stable identity across the list, useful for the `==` lookups in `toggle_todo` and `remove_todo`. Smart pattern, slightly verbose.
- **Stretched `each` into function bodies** — same gap as ChatGPT. The spec only shows `each` for rendering inside layouts; using it inside a function for list iteration is an extension the spec doesn't sanction.
- **Used the new `icon` primitive correctly** — `icon "check"`, `icon "circle"`, `icon "close"` with `color:` modifiers. v0.3.1 icon addition validated.

---

## GPT

**Model version:** ChatGPT (free tier, model version not displayed)
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen TodoApp:
  todos = []
  draft = ""

  layout vertical, gap: medium, padding: large:
    layout horizontal, gap: small:
      input bind: draft, placeholder: "New todo"
      button "Add", on tap: add_todo()

    each todo in todos:
      layout horizontal, gap: medium, align: center:
        checkbox bind: todo.done
        label todo.text, color: todo.done and subtle
        button "Delete", on tap: delete_todo(todo)

  add_todo():
    if draft is empty:
      return
    todos = todos + [{text: draft, done: false}]
    draft = ""

  delete_todo(target):
    next = []
    each item in todos:
      if item is target:
        continue
      next = next + [item]
    todos = next
```

### Grading

- **Invented syntax not in the spec?** **Yes — three things:** `continue` (statement to skip an iteration of `each`), `color: todo.done and subtle` (JS-style truthy short-circuit producing a value from a boolean expression), and `each` in non-rendering context (used inside `delete_todo` to build a filtered list).
- **Used existing syntax wrong?** **Yes — one case.** `color: todo.done and subtle` mixes a boolean expression with a property value in a way the spec doesn't define. The spec's `if`/`else` rendering split (like Claude's `TodoItem`) is the right pattern.
- **Did NOT invent equality operators** — used `if item is target:` (general equality via `is`) and `if draft is empty:` (the spec's existing `is empty` pattern). **Same as Claude on Calculator: ChatGPT extends `is` naturally.**
- **Valid Igni on first try?** **No.** `continue`, the conditional-color trick, and `each`-in-functions are all undefined.
- **Line count:** ~25 lines (the most compact of the three).

### Notes

- **Used `is X` for general equality** — `if item is target:` to compare a list item against a sentinel. **Same finding as the Calculator: 2/3 models reach for `is` extension naturally.** Combined with Claude's Calculator and Todo behaviour, this is now 4 independent data points (2 models × 2 apps) for the `is X` design.
- **Used `is empty` correctly** — `if draft is empty: return` for the early-return guard.
- **Tried JS-style boolean coercion for conditional styling** — `color: todo.done and subtle`. This is the kind of pattern that's load-bearing in JavaScript but doesn't exist in the spec. ChatGPT also did `if operator:` truthiness coercion in the calculator. This is a consistent ChatGPT tendency to import JS idioms — worth a one-line spec stop-note.
- **Filter-via-loop with `continue`** — pattern: build a new list by iterating over the old one and skipping the deleted item. The `continue` statement is invented; the loop pattern itself is invented (`each` in a non-rendering context).
- **Most compact output** — at ~25 lines, ChatGPT produced the smallest valid-shape Todo app of the three. The terseness is a result of inline rendering (no extracted component) and minimal styling.

---

## Gaps observed (across all three models)

This is the cross-model synthesis for the Todo test. **Universal gaps** (all 3 models hit them) are highest priority for v0.4. Gaps that only one model hit are lower priority.

### The cross-model gap matrix (Todo only)

| Gap | ChatGPT (free) | Claude Opus 4.6 | Gemini 3.1 Pro | Universality |
|---|---|---|---|---|
| List append (`list = list + [x]`) | invented | invented | invented | **3/3** |
| List removal | `each` + `continue` | `without()` builtin | `each` filter loop | **3/3 need it; split on approach** |
| Equality syntax | `is X` (`item is target`) | `is not empty` | `==`, `!=` | 2/3 used `is`; Gemini outlier |
| `each` in non-rendering context | invented | n/a | invented | 2/3 stretched `each` |
| `continue` statement | invented | n/a | n/a | only ChatGPT |
| Conditional value via `and` | invented | n/a | n/a | only ChatGPT |
| List item field mutation | n/a | invented (`item.done = not item.done`) | n/a (functional rebuild) | only Claude |
| `without(list, item)` builtin | n/a | invented | n/a | only Claude |
| Cross-component function call | n/a | yes (`TodoItem` → screen.`remove`) | n/a | only Claude |
| Manual ID counter | n/a | n/a | yes (`next_id`) | only Gemini |

### Universal gaps from this test (highest priority)

1. **List append with `+`** — All three models converged on `list = list + [new_item]` for adding to a list. This is a natural extension of the spec's `+` for string concatenation, applied to lists. **v0.4 fix:** explicitly bless `+` for list concatenation. One sentence in the Lists section.

2. **List removal** — All three models needed it; none agreed on the approach. ChatGPT used `each` + `continue`. Claude invented a `without()` builtin. Gemini used `each` + manual rebuild with no `continue`. **v0.4 decision needed:** define the canonical removal pattern. The fact that all three built it themselves from scratch means the spec has no answer at all. Three options:
   - **Bless a builtin:** `items = without(items, target)` — clean, matches Claude's intuition, costs one new builtin.
   - **Bless filter loop:** require `each` to work in function bodies and accept the verbosity.
   - **Add a primitive:** something like `items = items - [target]` (using `-` for set-difference). Symmetric with `+` for append, but introduces another operator.
   
   Recommend deferring this design call until the Chat app test (which probably also needs deletion) gives more data.

### Strong gap from this test

3. **`each` in non-rendering context** — ChatGPT and Gemini both used `each` inside function bodies to build new lists. The spec only shows `each` for rendering inside layouts. **v0.4 decision needed:** either bless `each` in function bodies (unifying the iteration model) or commit to a separate filtering primitive. Tied to gap #2 (list removal) — if removal becomes a builtin, the need for `each` in functions decreases.

### Single-model gaps (lower priority)

4. **List item field mutation** (Claude only) — `item.done = not item.done`. The spec says screen/component arguments are immutable but is silent on list-element mutation. **v0.4 decision needed:** does mutating a list element field re-render screens that read the list? If yes, document it; if no, document the functional alternative. Reactivity question that needs an answer regardless of which way you go.
5. **Cross-component function call** (Claude only) — `TodoItem` calls `remove(todo)` which lives in the parent `Todos` screen. **v0.4 fix:** one-line clarification — *"A child component invoked from a screen can call functions defined in that screen's body."*
6. **`continue` statement** (ChatGPT only) — falls out for free if list removal becomes a primitive operation rather than a manual loop. No separate fix needed.
7. **Conditional value via boolean expression** (ChatGPT only) — `color: todo.done and subtle`. **v0.4 stop-note:** *"No conditional value selection via boolean expressions; use `if`/`else` blocks for conditional rendering or styling."*
8. **Manual ID counter** (Gemini only) — not really a gap, just a verbose pattern. Lower priority.

### Predicted gaps that did NOT surface

- The original prompt predicted "filter/find for delete-by-id." All three models implemented removal, so the gap *did* surface, but no model used a "find" primitive (Claude's `without()` is the closest). The deeper finding is that **list filtering in general** is unspecified — not just delete-by-id.

---

## Combined Calculator + Todo cross-test findings

With two apps tested, gaps can now be ranked by how many independent tests surfaced them. The Calculator findings come from `Cold_Test_Calculator_v0.3.2.md`.

### Universal across both apps (highest-priority v0.4 work)

| Gap | Calculator | Todo | Combined evidence |
|---|---|---|---|
| **Equality syntax** | 3/3 needed; 2/3 chose `is` | 3/3 needed; 2/3 chose `is` | **4/6 independent data points chose `is X`. Slam dunk.** |

### Universal within one app

| Gap | Test | Models | v0.4 fix |
|---|---|---|---|
| Arithmetic `-` `*` `/` | Calculator | 3/3 | Add operators |
| Operator precedence | Calculator | 3/3 | One-sentence rule |
| List append `+` | Todo | 3/3 | Bless `+` for lists |
| List removal | Todo | 3/3 (no consensus) | Design call needed |

### Strong gaps (2/3 in one app)

| Gap | Test | Models | v0.4 decision |
|---|---|---|---|
| `each` in non-rendering context | Todo | 2/3 | Bless or add filter primitive |

### Single-model gaps that need a one-line spec answer

- **List item mutation** (Claude/Todo) — reactivity rule for list elements
- **Cross-component function calls** (Claude/Todo) — bless or forbid
- **Type conversion** (Claude/Calculator) — already resolved by "primitives auto-render numbers" note
- **Truthiness coercion** (ChatGPT/Calculator + ChatGPT/Todo) — JS-style `if str:` and `color: x and y`. **One stop-note covers both**: *"Conditionals require explicit boolean values. No conditional values via boolean expressions."*

## Provisional v0.4 backlog (combined from two apps)

If v0.4 ships these, **all three model outputs from both Calculator and Todo would compile** (modulo the small logic bugs in the calculator state machines, which aren't language issues):

1. **Arithmetic operators `-`, `*`, `/`** (Calculator universal)
2. **Operator precedence rule**, one sentence (Calculator universal)
3. **Bless `is X` for arbitrary equality** (Calculator + Todo, strongest evidence in the suite — 4/6 data points)
4. **Bless `+` for list concatenation** (Todo universal)
5. **Define the canonical list removal pattern** (Todo universal need; design call deferred until Chat app data arrives)
6. **Decide on `each` in non-rendering context** (Todo, 2/3)
7. **One-line: list item field mutation rule** (Claude/Todo)
8. **One-line: cross-component function calls allowed** (Claude/Todo)
9. **One-line: no truthiness coercion or conditional values via boolean expressions** (ChatGPT/Calculator + ChatGPT/Todo)
10. **One-line: primitives auto-render numeric values** (Claude/Calculator type-conversion fix)

That's **5 operators/operations + 5 clarifying notes** from two apps. The biggest open design question is **#5 (list removal)** — hold until Chat app data is in.

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni, with `# GAP:` comments where you hit walls. This is the "design by trying" data point — your gaps and the LLMs' gaps should mostly overlap.

```igni
(paste your hand-written attempt here)
```
