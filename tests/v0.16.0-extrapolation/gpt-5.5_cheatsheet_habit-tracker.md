```igni
shared:
  habits = persist("habits", [])

screen Habits, title: "Habits":
  today_key = today()

  every 30s:
    today_key = today()

  layout vertical, gap: medium, padding: large:
    label "Habits", style: heading

    if shared.habits is empty:
      layout vertical, padding: medium, background: card, rounded: medium:
        label "No habits yet"
        label "Add one to start building a streak.", style: caption
    else:
      each habit in shared.habits:
        layout horizontal, gap: medium, padding: medium, align: center, background: card, rounded: medium, on tap: toggle(habit):
          label habit.emoji, style: heading
          layout vertical, fill: true:
            label habit.name
            label streak_text(habit), style: caption
          label checked_text(habit), style: heading

    button "+ Add habit", color: brand, on tap: navigate to AddHabit

  toggle(habit):
    dates = habit.completed_dates + [today_key]
    if today_key is in habit.completed_dates:
      dates = without(habit.completed_dates, today_key)

    shared.habits = replace(shared.habits, habit, {habit with completed_dates: dates})

  checked_text(habit):
    if today_key is in habit.completed_dates:
      return "✅"
    return "⬜"

  streak_count(habit):
    return streak(habit.completed_dates, through: today_key)

  streak_text(habit):
    days = streak_count(habit)
    word = "days"
    if days is 1:
      word = "day"

    return "🔥 " + round(days, 0) + " " + word


screen AddHabit, title: "Add habit":
  emoji = ""
  habit_name = ""

  layout vertical, gap: medium, padding: large:
    label "Add habit", style: heading

    input bind: emoji, placeholder: "Emoji, e.g. 🧘"
    input bind: habit_name, placeholder: "Habit name"

    if habit_name is empty:
      label "Habit name is required.", style: caption

    button "Save", color: brand, on tap: save()
    button "Cancel", color: subtle, on tap: navigate back

  save():
    if habit_name is not empty:
      icon = emoji
      if icon is empty:
        icon = "✅"

      shared.habits = shared.habits + [{emoji: icon, name: habit_name, completed_dates: []}]
      navigate back
```

Brief notes on invented syntax:

- `persist("habits", [])` is not in the cheatsheet. I’m treating it as an Igni-style persistence helper: it loads the saved value for `"habits"` on app start, falls back to `[]`, and writes back whenever `shared.habits` is reassigned.
- `today()` is an invented date helper that returns today’s local date key, such as `"2026-04-27"`.
- `streak(dates, through: today_key)` is an invented date helper that counts consecutive completed dates up to today. The app stores `completed_dates` rather than only a number, so streaks can be recalculated correctly after restarts or missed days.
- The `every 30s:` block keeps `today_key` fresh if the app stays open across midnight.