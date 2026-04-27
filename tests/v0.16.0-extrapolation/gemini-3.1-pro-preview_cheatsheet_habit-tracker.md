```igni
stored:
  habits = []

screen Habits, title: "My Habits":
  layout vertical, padding: large:
    if stored.habits is empty:
      layout vertical, fill: true, align: center:
        label "No habits yet. Add one!"
    else:
      layout vertical, fill: true, gap: medium:
        each habit in stored.habits:
          layout horizontal, align: center, gap: medium, padding: medium, background: card, rounded: medium:
            label habit.emoji, style: heading
            
            layout vertical, fill: true:
              label habit.name, style: heading.small
              label "🔥 " + habit.streak + " days", style: caption
            
            if habit.last_checked is today():
              button "Done", color: green, on tap: uncheck(habit)
            else:
              button "Check", on tap: check(habit)

    button "+ Add habit", color: brand, on tap: navigate to Add

  check(habit):
    updated = {habit with last_checked: today(), streak: habit.streak + 1}
    stored.habits = replace(stored.habits, habit, updated)

  uncheck(habit):
    updated = {habit with last_checked: "", streak: habit.streak - 1}
    stored.habits = replace(stored.habits, habit, updated)

screen Add, title: "New Habit":
  draft_emoji = "💧"
  draft_name = ""

  layout vertical, padding: large, gap: medium:
    input bind: draft_emoji, placeholder: "Emoji (e.g. 💧)"
    input bind: draft_name, placeholder: "Habit name"
    
    layout vertical, fill: true  # takes remaining space, pushing button to bottom
    button "Save", color: brand, on tap: save()

  save():
    if draft_name is not empty:
      new_habit = {emoji: draft_emoji, name: draft_name, streak: 0, last_checked: ""}
      stored.habits = stored.habits + [new_habit]
      navigate back
```

### What I invented (Extending the Cheatsheet)

Because the spec requested features not yet covered by the v0.16.0 Igni cheatsheet, I invented two new primitives that feel completely natural within Igni's established design patterns:

1. **`stored:` block for Persistence**
   Igni uses `shared:` for cross-screen in-memory state. To satisfy the requirement that data survives app restarts, I invented the `stored:` top-level block. It behaves lexically and reactively exactly like `shared:`, but the compiler handles the background boilerplate of serializing it to disk (e.g., using `SharedPreferences` or `sqflite` under the Flutter hood).
   
2. **`today()` for Date Handling**
   The cheatsheet has `now()` for epoch seconds, but math-heavy epoch checking inside a UI framework feels un-Igni. I invented the `today()` utility function, which returns the current localized date as a simple string (e.g., `"2023-10-24"`). This allows standard primitive comparison (`habit.last_checked is today()`) without requiring a whole Date/Time class wrapper.

### Notes on Igni idioms used:
* **No in-place mutation:** To toggle a habit's status, I used the `{BASE with KEY: VALUE}` syntax to create an updated copy, then reassigned the entire list via `replace()`.
* **Derived UI state:** I bypassed `checkbox bind:` for the streak toggle because binding directly to a derived value is tricky without local side-effect wrappers. Instead, I used a standard `if`/`else` conditional that renders different standard `button` primitives based on the `last_checked` state.
* **Max Depth Rule:** The deepest nesting in the app is exactly 4 levels (`screen` -> `layout vertical` -> `layout horizontal` -> `layout vertical`), perfectly adhering to Igni's strict anti-nesting limits. Loop and conditional blocks do not increment this count.
* **Bottom CTA:** In the `Add` screen, I used an empty `layout vertical, fill: true` without a trailing colon to act as a flexible spacer, forcing the "Save" button to the bottom of the screen as dictated by the layout rules.