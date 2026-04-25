```igni
screen Weather:
  weather = fetch("https://api.example.com/weather?city=London")

  every 30s:
    weather = fetch("https://api.example.com/weather?city=London")

  layout vertical, padding: large, gap: medium:
    label "London Weather", style: heading

    if weather is loading:
      spinner
    else if weather is error:
      label "Failed to load weather"
    else:
      label "Temperature: " + weather.temperature
      label "Conditions: " + weather.conditions
```

### How the periodic refresh works

1.  **Initial State**: When the screen mounts, the top-level `weather` variable is assigned the result of the first `fetch()`, which is an async object in a `loading` state.
2.  **The Trigger**: The `every 30s:` block runs on a recurring schedule. Every 30 seconds, it executes the `fetch()` function again and reassigns the result to the `weather` variable.
3.  **Lexical Reactivity**: The core rule of Igni is that a screen re-evaluates its body whenever a variable it references is reassigned. By updating `weather` inside the `every` block, the screen automatically re-runs its layout logic, causing the UI to swap between the `spinner` (during the brief network request) and the weather data once the fetch completes.