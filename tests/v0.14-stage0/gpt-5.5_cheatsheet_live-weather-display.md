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
      label "Could not load weather", color: danger
    else:
      label round(weather.temperature, 0) + "°C", style: heading.small
      label weather.conditions
```

The initial `weather = fetch(...)` runs once when the screen opens.

The `every 30s:` block runs automatically while the screen is visible. Each time it fires, it reassigns `weather` to a new `fetch(...)` result. Because the screen references `weather`, that reassignment triggers Igni’s normal reactivity: the screen re-renders, showing `spinner` while loading, the error label on failure, or the latest temperature and conditions on success.