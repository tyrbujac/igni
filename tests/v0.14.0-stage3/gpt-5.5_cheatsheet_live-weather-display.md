```igni
screen LondonWeather:
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
      label "Temperature: " + round(weather.temperature, 0) + "°C"
      label "Conditions: " + weather.conditions
```

The first `fetch()` runs when the screen opens. The `every 30s:` block runs while the screen is mounted and visible, reassigning `weather` to a fresh `fetch()` result every 30 seconds. That reassignment triggers Igni’s normal screen reactivity, so the UI updates through `loading`, `error`, or the successful weather data state automatically.