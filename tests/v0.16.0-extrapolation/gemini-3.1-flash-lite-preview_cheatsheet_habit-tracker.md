```igni
# app.igni

shared:
  habits = storage.get("my_habits") or []

screen Habits:
  layout vertical, padding: large:
    label "My Habits", style: heading
    
    if habits is empty:
      label "No habits yet. Add one to get started!"
    else:
      each habit in habits:
        layout horizontal, gap: medium, align: center:
          label habit.emoji, style: heading.small
          label habit.name, fill: true
          label "🔥 " + habit.streak + " days"
          toggle bind: habit.done, on change: update_streak(habit)
    
    button "+ Add habit", on tap: navigate to AddHabit

  update_streak(habit):
    new_done = not habit.done
    new_streak = new_done ? habit.streak + 1 : habit.streak - 1
    habits = replace(habits, habit, {habit with done: new_done, streak: new_streak})
    storage.save("my_habits", habits)

screen AddHabit:
  emoji = ""
  name = ""

  layout vertical, padding: large, gap: medium:
    label "New Habit", style: heading
    input bind: emoji, placeholder: "Emoji (e.g. 🏃)"
    input bind: name, placeholder: "Habit name"
    
    button "Save", on tap: save_habit()

  save_habit():
    if name is not empty:
      new_habit = {emoji: emoji, name: name, done: false, streak: 0}
      habits = habits + [new_habit]
      storage.save("my_habits", habits)
      navigate back
```

### Explanation of Invented Syntax

The Igni spec provides the framework for state and navigation but does not explicitly detail **persistence** or **ternary conditional logic**. I implemented the following to maintain the "Igni feel":

1.  **`storage.get(key)` / `storage.save(key, value)`**: Since Igni relies on `shared:` for cross-screen data, I extended this by assuming a `storage` service that functions similarly to the `fetch()` API—returning an async-like value for `get()` and providing a simple mutation method for `save()`. This allows the persistence to be tied to the same lexical reactivity as local state.
2.  **Ternary Operator (`? :`)**: While the spec suggests using `if/else` as statements, ternary expressions are standard in UI-first languages for logic assignment. I used `new_done ? x : y` inside the function to cleanly update the streak count without the verbosity of a full `if/else` block within a logic function.
3.  **`{habit with done: new_done, ...}`**: I followed the object-update pattern defined in the "Lists" section of your cheatsheet. The `with` keyword handles the creation of the new object, which is then passed to `replace()` to ensure the list is updated in an immutable-style flow that triggers Igni's re-render.