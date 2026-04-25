```igni
screen WeatherLondon:
  weather = fetch("https://api.example.com/weather?city=London")

  every 30s:
    weather = fetch("https://api.example.com/weather?city=London")

  layout vertical, gap: medium, padding: large:
    label "London", style: heading
    if weather is loading:
      spinner
    else if weather is error:
      label "Couldn't load weather"
    else:
      label round(weather.temperature, 0)
      label weather.conditions
```

**How the refresh works.** The top-level `weather = fetch(...)` runs once when the screen first opens — this is the initial load, which renders as a spinner until the response lands. The `every 30s:` block then reassigns `weather` to a fresh `fetch(...)` call every thirty seconds while the screen is mounted. Each reassignment triggers lexical reactivity, so the screen re-evaluates: the new `weather` momentarily reads as `is loading`, then resolves and renders the updated temperature and conditions. If the screen is navigated away, the timer pauses; on return it resumes (no missed-tick replay).