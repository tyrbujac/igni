```igni
screen Weather:
  weather_data = fetch("https://api.example.com/weather?city=London")

  every 30s:
    weather_data = fetch("https://api.example.com/weather?city=London")

  layout vertical, padding: large, align: center, gap: medium:
    label "London", style: heading

    if weather_data is loading:
      spinner
    else if weather_data is error:
      label "Failed to load weather", color: red
    else:
      label weather_data.temperature + "°C", style: heading.small
      label weather_data.conditions
```

### How the periodic refresh works

1. **The `every 30s:` block:** This builtin structure automatically executes its indented body every 30 seconds while the screen is visible.
2. **Lexical reactivity:** Inside the block, `weather_data` is reassigned to a fresh `fetch()` call. Because a screen re-evaluates from the top whenever a referenced variable is reassigned, this single line triggers a complete re-render.
3. **State transitions:** When the `every` block fires, `weather_data` immediately enters the `loading` state. The UI re-renders, hitting the `if weather_data is loading:` condition and displaying the `spinner`. Once the new network request completes, the variable updates to its resolved state (or error state), triggering a final re-render to display the updated temperature and conditions.