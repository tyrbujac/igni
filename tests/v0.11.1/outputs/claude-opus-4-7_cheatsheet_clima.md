```igni
shared:
  city = ""
  coords = ""

screen Loading:
  here = locate()

  layout vertical, padding: large, align: center:
    if here is loading:
      spinner
      label "Getting location..."
    else if here is error:
      label "Couldn't get location"
    else:
      label "Loading weather..."
      spinner
      go(here)

  go(h):
    coords = round(h.latitude, 4) + "," + round(h.longitude, 4)
    city = ""
    navigate to Weather

screen Weather:
  here = locate()
  url = ""
  if city is not "":
    url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + api_key + "&units=metric"
  else if coords is not "":
    url = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat_of(coords) + "&lon=" + lon_of(coords) + "&appid=" + api_key + "&units=metric"

  data = fetch(url)

  layout vertical, padding: large, gap: medium:
    if data is loading:
      spinner
    else if data is error:
      label "Couldn't load weather"
    else:
      temp = round_int(data.main.temp)
      id = data.weather[0].id
      name = data.name

      layout horizontal, gap: medium, align: center:
        label temp + "°", style: heading
        label emoji_for(id), style: heading

      label message_for(temp) + " in " + name + "!", style: heading.small

      layout horizontal, gap: medium:
        button "📍", shape: circle, on tap: use_location()
        button "🔍 City", on tap: navigate to CitySearch

  use_location():
    if here is not loading and here is not error:
      city = ""
      coords = round(here.latitude, 4) + "," + round(here.longitude, 4)

  # NOTE: Igni has no string split / substring builtins in the spec,
  # so splitting "lat,lon" back into two pieces isn't expressible.
  # I'd want the language to add either string.split(",") or
  # to let locate() results be stored as a plain object {latitude, longitude}
  # in shared state. Assuming helpers for now:
  lat_of(c):
    return before(c, ",")
  lon_of(c):
    return after(c, ",")

  # Likewise, rounding-to-integer isn't in the spec's builtins
  # (round(x, N) returns a string with N decimals). I'd want round_int(x)
  # returning an int, or int(x) truncation.
  round_int(x):
    return round(x, 0)

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

screen CitySearch, title: "Search":
  draft = ""

  layout vertical, padding: large, gap: medium:
    input bind: draft, placeholder: "Enter city name"
    button "Get Weather", color: brand, on tap: submit()

  submit():
    city = draft
    coords = ""
    navigate back

# Language gaps I hit:
# 1. No string-split / substring builtins — I can't cleanly pull lat and lon
#    out of a combined "lat,lon" trigger string. I worked around the reactive-
#    fetch footgun by storing coords as a string, but then needed before()/
#    after() helpers that don't exist. Cleanest fix: let shared state hold
#    structured values like {lat: ..., lon: ...} that don't trip the footgun,
#    or add a string.split builtin.
# 2. No integer rounding — round(x, N) returns a string. For the "temp > 25"
#    comparisons I need an int. round_int / int() / floor() would help.
# 3. No string interpolation — concatenation with + works but gets noisy.
```