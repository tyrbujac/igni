```igni
screen Habits, title: "HABITS":
  habit_name = ""
  habits = []

  # Calculate Summary Data
  total = length(habits)
  completed_list = filter(habits, h => h.done)
  completed_count = length(completed_list)

  layout vertical, padding: large, gap: medium:
    # Summary Card
    layout horizontal, padding: medium, background: card, rounded: true, spread: true:
      layout vertical:
        label "Total", style: caption
        label total, style: heading.small
      layout vertical:
        label "Done Today", style: caption
        label completed_count, style: heading.small

    # Main Content Area
    layout vertical, fill: true, gap: small:
      if habits is empty:
        layout vertical, fill: true, align: center:
          icon "calendar", size: large, color: subtle
          label "No habits yet. Add one below!", color: subtle
      else:
        each h in habits:
          HabitRow h, on toggle: toggle_habit(h)

    # Input Section (Anchored to bottom by the fill: true above)
    layout vertical, gap: small, padding: medium, background: card, rounded: true:
      input bind: habit_name, placeholder: "New habit name..."
      button "Add Habit", color: brand, on tap: add_habit()

  add_habit():
    if habit_name is not "":
      new_item = {name: habit_name, streak: 0, done: false}
      habits = habits + [new_item]
      habit_name = ""

  toggle_habit(target):
    # Logic to update streak and status via list replacement
    new_status = not target.done
    new_streak = target.streak
    if new_status:
      new_streak = target.streak + 1
    else:
      new_streak = target.streak - 1
    
    updated = {name: target.name, streak: new_streak, done: new_status}
    habits = replace(habits, target, updated)

component HabitRow(item):
  layout horizontal, padding: medium, background: card, rounded: true, align: center, gap: medium:
    layout vertical, fill: true:
      label item.name, style: body
      badge item.streak + " day streak", color: orange
    
    checkbox bind: item.done, on change: emit toggle

```

### Design Decisions

*   **State Management:** I used `replace(habits, old, new)` to handle updates. Since Igni requires reassignment for reactivity and doesn't allow in-place mutation of list elements, creating a new object and swapping it is the idiomatic approach.
*   **Layout & Fill:** The "Main Content Area" uses `fill: true`. This ensures that the empty state or the list takes up all available middle space, naturally pushing the "Add Habit" input card to the bottom of the screen.
*   **Component Communication:** The `HabitRow` uses `emit toggle`. This keeps the component "dumb" and reusable, delegating the complex logic of incrementing streaks and updating the list to the main screen.
*   **Visual Polish:** 
    *   Used `background: card` and `rounded: true` to create a modern, grouped UI appearance.
    *   Used the `orange` color for the streak badge to make it stand out as a "warm" achievement.
    *   Added an `icon` and `subtle` text for the empty state to improve UX.