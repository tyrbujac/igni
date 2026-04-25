```igni
screen LondonWeather:
  url = "https://api.example.com/weather?city=London"
  weather = fetch(url)

  every 30s:
    weather = fetch(url)

  layout vertical, padding: large, align: center, gap: medium:
    label "London Weather", style: heading
    
    if weather is loading:
      spinner
    else if weather is error:
      label "Failed to load weather data.", color: danger
    else:
      label weather.temperature + "°C", style: heading.small
      label weather.conditions
```

### How the periodic refresh works:

1. **The `every 30s:` block:** Igni supports declarative recurrence. This block automatically executes its body every 30 seconds as long as the screen is visible.
2. **Reassignment triggers fetch:** Inside the block, `weather` is reassigned to the result of a new `fetch(url)` call. 
3. **Lexical Reactivity:** Because the screen references the `weather` variable in its layout (in the `if` conditions and labels), reassigning it immediately triggers a re-evaluation of the screen. 
4. **State transitions:** When `fetch` is called, `weather` instantly becomes an async pending value, causing `weather is loading` to evaluate to true (showing the spinner). Once the network request completes, the screen automatically re-evaluates again, showing either the updated temperature/conditions or the error label. No explicit state controllers or `setState` calls are needed.