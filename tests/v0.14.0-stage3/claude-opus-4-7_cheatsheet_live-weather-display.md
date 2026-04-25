```igni
screen LondonWeather, title: "London Weather":
  tick = now()
  weather = fetch("https://api.example.com/weather?city=London&t=" + tick)

  every 30s:
    tick = now()

  layout vertical, gap: medium, padding: large, align: center:
    label "London", style: heading
    if weather is loading:
      spinner
    else if weather is error:
      label "Couldn't load weather"
    else:
      label round(weather.temperature, 0), style: heading
      label weather.conditions, style: body
```

**How the refresh is wired.** `tick` is a plain variable initialised once with `now()`. It's concatenated into the fetch URL, so the `fetch(...)` call is lexically dependent on `tick`. The `every 30s:` block reassigns `tick = now()`, which — by the reactivity rule — re-runs the screen body from the top. Because the URL string now contains a different timestamp, `fetch` re-issues the request, cycling back through `is loading` → resolved (or `is error`) on each tick. No manual refresh function, no controller — just one reassignment driving everything downstream.