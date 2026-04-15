```igni
# --- Components ---

component StatCard(value, title):
  layout vertical, align: center, padding: small:
    label value, style: heading
    label title, style: caption

component HabitRow(habit):
  layout horizontal, padding: medium, background: card, rounded: true, align: center, gap: medium:
    layout vertical, fill: true:
      label habit.name
    badge habit.streak, color: orange
    if habit.done:
      button "✓", shape: circle, color: green, on tap: emit toggle
    else:
      button "○", shape: circle, color: subtle, on tap: emit toggle

# --- Screen ---

screen Habits, title: "HABITS":
  habits = []
  new_name = ""

  completed = filter(habits, h => h.done)
  completed_count = length(completed)
  total = length(habits)

  layout vertical, padding: large, gap: medium:
    # Summary
    layout horizontal, padding: medium, background: card, rounded: true, spread: true:
      StatCard total, title: "Total"
      StatCard completed_count, title: "Done Today"

    # Habit list or empty state
    if habits is empty:
      layout vertical, fill: true, align: center, gap: small:
        icon "star", size: large, color: subtle
        label "No habits yet", style: heading.small
        label "Add your first habit below!", style: caption
    else:
      layout vertical, fill: true, gap: small:
        each habit in habits:
          HabitRow habit, on toggle: toggle_habit(habit)

    # Bottom add section
    divider
    layout horizontal, gap: small, align: center:
      input bind: new_name, placeholder: "New habit"
      button "Add", color: brand, on tap: add_habit()

  toggle_habit(habit):
    new_streak = habit.streak + 1
    new_done = true
    if habit.done:
      new_streak = habit.streak - 1
      new_done = false
    updated = {name: habit.name, streak: new_streak, done: new_done}
    habits = replace(habits, habit, updated)

  add_habit():
    if new_name is not empty:
      habits = habits + [{name: new_name, streak: 0, done: false}]
      new_name = ""
```

---

## Design Decisions

**`emit toggle` instead of `bind:` on a checkbox.** Component arguments are immutable in Igni, so `toggle bind: habit.done` inside `HabitRow` would be illegal. Instead, the circle button emits a `toggle` event and the parent screen owns the state mutation — clean unidirectional data flow.

**Object replacement for toggling.** List elements can't be mutated in place, so `toggle_habit` builds a fresh `{name, streak, done}` object and uses `replace()` to swap it in. The streak increments on check-in and decrements on undo, keeping the logic in one place.

**`StatCard` component.** Extracting the summary stat into a component avoids hitting the 4-level nesting cap (screen → outer layout → summary row → stat column would be 4; the component resets the counter) and makes the summary row read cleanly.

**`fill: true` for the content area.** Both the empty-state and list layouts use `fill: true` so they expand to consume available space, pushing the add-habit input to the bottom — following the bottom-anchored CTA pattern from the spec.

**Conditional appearance instead of conditional rendering.** The done/not-done toggle is two `button` branches (green `✓` vs. subtle `○`) rather than hiding/showing a widget, giving instant visual feedback while keeping one `emit toggle` path.