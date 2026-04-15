```igni
component HabitRow(habit):
  streak_text = "Streak: " + habit.streak

  layout horizontal, padding: medium, background: card, rounded: true, align: center, spread: true:
    layout vertical, gap: small:
      label habit.name, style: body
      badge streak_text, color: blue

    checkbox bind: habit.done, label: "Today"

screen Habits, title: "HABITS", background: subtle:
  habits = [
    {name: "Drink Water", streak: 4, done: true},
    {name: "Read 10 Pages", streak: 7, done: false},
    {name: "Walk 20 Minutes", streak: 2, done: true}
  ]
  new_habit = ""

  total_habits = length(habits)
  completed_today = length(filter(habits, habit => habit.done))

  add_habit():
    if new_habit is not empty:
      habits = habits + [{name: new_habit, streak: 0, done: false}]
      new_habit = ""

  layout vertical, padding: large, gap: medium:
    layout vertical, padding: medium, background: card, rounded: true, gap: small:
      label "Today", style: heading.small
      label "Total habits: " + total_habits, style: body
      label "Completed today: " + completed_today, style: body

    if habits is empty:
      layout vertical, fill: true, padding: large, background: card, rounded: true, align: center, gap: small:
        label "No habits yet", style: heading.small, align: center
        label "Add your first habit below to get started.", style: body, align: center
    else:
      layout vertical, fill: true, gap: medium:
        each habit in habits:
          HabitRow habit

    layout vertical, padding: medium, background: card, rounded: true, gap: medium:
      input bind: new_habit, placeholder: "New habit name"
      button "Add Habit", color: brand, on tap: add_habit()
```

Design decisions:
- I used a `HabitRow` component to keep each habit item reusable and visually consistent.
- The UI is grouped into card-like sections using `background: card` and `rounded: true` for a clean mobile feel.
- The summary sits at the top, the list or empty state fills the middle, and the add form stays at the bottom using `fill: true` on the main content area.
- I used a checkbox for today’s completion because it clearly matches the “done/not done” habit check-in pattern.