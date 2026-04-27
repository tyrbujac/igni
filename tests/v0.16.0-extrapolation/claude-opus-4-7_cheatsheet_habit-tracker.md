# Habit Tracker

```igni
shared:
  habits = persist([])

screen Habits, title: "Habits":
  layout vertical, padding: large, gap: medium:
    if shared.habits is empty:
      label "No habits yet. Tap below to add one.", align: center
    else:
      each habit in shared.habits:
        layout horizontal, gap: medium, align: center, padding: medium, background: card, rounded: medium, on tap: toggle(habit):
          label habit.emoji, style: heading
          layout vertical, fill: true:
            label habit.name, style: body
            label "🔥 " + habit.streak + " days", style: caption
          if checked_today(habit):
            icon "check", color: green, size: large
          else:
            icon "circle", color: subtle, size: large

    button "+ Add habit", color: brand, on tap: navigate to Add

  checked_today(habit):
    return habit.last_checked is today()

  toggle(habit):
    updated = habit
    if checked_today(habit):
      # Uncheck: roll back today's tick
      updated = {habit with last_checked: null, streak: habit.streak - 1}
    else:
      # Check: extend streak if yesterday was checked, else restart at 1
      new_streak = 1
      if habit.last_checked is yesterday():
        new_streak = habit.streak + 1
      updated = {habit with last_checked: today(), streak: new_streak}
    shared.habits = replace(shared.habits, habit, updated)


screen Add, title: "New habit":
  emoji = ""
  name = ""

  layout vertical, padding: large, gap: medium:
    input bind: emoji, placeholder: "Emoji (e.g. 💧)"
    input bind: name, placeholder: "Habit name"

    layout vertical, fill: true

    button "Save", color: brand, on tap: save()

  save():
    if emoji is not empty and name is not empty:
      new_habit = {emoji: emoji, name: name, streak: 0, last_checked: null}
      shared.habits = shared.habits + [new_habit]
      navigate back
```

## Where the spec didn't cover what I needed

Two gaps came up:

**1. Persistence.** The cheatsheet shows `shared:` for cross-screen state, but its lifetime is implied to be process-scoped — nothing about surviving an app restart. I introduced `persist(...)` as a wrapper around the initial value:

```igni
shared:
  habits = persist([])
```

Reads and writes look identical to a normal `shared.` field — the wrapper just signals to the runtime that this slot should be read from disk on launch and flushed back on every reassignment. It feels Igni-shaped because it's still a single declarative line at the top of the block: no `onSave` callbacks, no controllers, no keys. The reactivity rule continues to work unchanged (reassign `shared.habits` → screens watching it re-render → runtime debounces a write to disk).

**2. Date handling.** The spec gives `now()` for integer seconds since epoch, but day-granularity comparisons ("was this checked today? yesterday?") need calendar-aware dates, not arithmetic on second counts (timezones, DST, etc. make `now() / 86400` wrong). I added two builtins:

```igni
today()       # today's calendar date in the device's local timezone
yesterday()   # the calendar date one day before today()
```

Both return an opaque date value. Equality works structurally for primitives per the cheatsheet's `is` rule, so `habit.last_checked is today()` does the right thing, and `null` (for never-checked habits) cleanly compares non-equal to any real date. Storing `last_checked` as a date rather than a boolean is what lets the streak survive missed days — if you check Mon, skip Tue, check Wed, the toggle handler sees `last_checked` isn't `yesterday()` and restarts the streak at 1 rather than incrementing.