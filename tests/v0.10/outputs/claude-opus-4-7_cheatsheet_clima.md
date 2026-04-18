```igni
shared:
  api_key = ""
  location = null
  weather = null

screen Loading:
  location = get_location()

  if location is loading:
    layout vertical, align: center, fill: true:
      spinner
  else if location is error:
    layout vertical, align: center, fill: true:
      label "Could not get location"
  else:
    shared.location = location
    navigate to Weather

screen Weather:
  weather = fetch("https://api.openweathermap.org/data/2.5/weather?lat=" + shared.location.latitude + "&lon=" + shared.location.longitude + "&appid=" + shared.api_key + "&units=metric")

  if weather is loading:
    layout vertical, align: center, fill: true:
      spinner
  else if weather is error:
    layout vertical, align: center, fill: true:
      label "Weather unavailable"
      button "Retry", on tap: navigate to Loading
  else:
    layout vertical, padding: large, gap: medium:
      layout horizontal, spread: true:
        button "📍", shape: circle, on tap: navigate to Loading
        button "🔍", shape: circle, on tap: navigate to CitySearch

      layout vertical, fill: true, align: center, gap: medium:
        label round(weather.main.temp, 0) + "°", style: heading
        label emoji_for(weather.weather[0].id), style: heading
        label message_for(round_int(weather.main.temp)) + " in " + weather.name + "!", style: body, align: center

  round_int(t):
    return t - (t - round(t, 0))

  emoji_for(id):
    result = "🤷"
    if id < 300:
      result = "🌩"
    else if id < 400:
      result = "🌧"
    else if id < 600:
      result = "☔️"
    else if id < 700:
      result = "☃️"
    else if id < 800:
      result = "🌫"
    else if id is 800:
      result = "☀️"
    else if id <= 804:
      result = "☁️"
    return result

  message_for(temp):
    result = "Bring a 🧥 just in case"
    if temp > 25:
      result = "It's 🍦 time"
    else if temp > 20:
      result = "Time for shorts and 👕"
    else if temp < 10:
      result = "You'll need 🧣 and 🧤"
    return result

screen CitySearch:
  city = ""

  layout vertical, padding: large, gap: medium:
    input bind: city, placeholder: "City name"
    button "Get Weather", color: brand, on tap: submit()

  submit():
    shared.weather_override_city = city
    navigate to WeatherByCity city

screen WeatherByCity(city):
  weather = fetch("https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + shared.api_key + "&units=metric")

  if weather is loading:
    layout vertical, align: center, fill: true:
      spinner
  else if weather is error:
    layout vertical, align: center, fill: true:
      label "Weather unavailable"
      button "Back", on tap: navigate back
  else:
    layout vertical, padding: large, gap: medium:
      layout horizontal, spread: true:
        button "📍", shape: circle, on tap: navigate to Loading
        button "🔍", shape: circle, on tap: navigate to CitySearch

      layout vertical, fill: true, align: center, gap: medium:
        label round(weather.main.temp, 0) + "°", style: heading
        label emoji_for(weather.weather[0].id), style: heading
        label message_for(round_int(weather.main.temp)) + " in " + weather.name + "!", style: body, align: center

  round_int(t):
    return t - (t - round(t, 0))

  emoji_for(id):
    result = "🤷"
    if id < 300:
      result = "🌩"
    else if id < 400:
      result = "🌧"
    else if id < 600:
      result = "☔️"
    else if id < 700:
      result = "☃️"
    else if id < 800:
      result = "🌫"
    else if id is 800:
      result = "☀️"
    else if id <= 804:
      result = "☁️"
    return result

  message_for(temp):
    result = "Bring a 🧥 just in case"
    if temp > 25:
      result = "It's 🍦 time"
    else if temp > 20:
      result = "Time for shorts and 👕"
    else if temp < 10:
      result = "You'll need 🧣 and 🧤"
    return result

# --- Notes on what Igni would need to express this cleanly ---
#
# 1. `get_location()` — the spec describes fetch() for HTTP but gives no
#    primitive for device geolocation. I've assumed a builtin with the same
#    loading/error/value state shape as fetch(). Igni would need to add it.
#
# 2. Integer rounding — `round(x, 0)` returns a string per the spec, which
#    can't be compared with `>` / `<`. I've written `round_int` as a
#    numeric-returning helper, but really Igni should offer a numeric
#    `round_to_int(x)` or a `to_int(s)` builtin. The `round_int` I wrote
#    is a placeholder shape.
#
# 3. Cross-screen function calls aren't allowed and there's no `import`,
#    so `emoji_for` / `message_for` / `round_int` are duplicated in both
#    weather-rendering screens. Igni would benefit from file-level pure
#    helpers, or from letting components expose pure functions.
#
# 4. The reactive-fetch footgun rule means the "search by city" flow has
#    to route through a screen argument (WeatherByCity(city)) rather than
#    re-fetching inside Weather against a shared mutable city variable.
#    That's what I've done; it's clean but it's the reason there are two
#    weather screens instead of one parameterised by an optional city.
```