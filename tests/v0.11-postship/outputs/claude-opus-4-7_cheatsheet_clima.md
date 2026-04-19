```igni
shared:
  api_key = "YOUR_API_KEY"
  city_query = ""

screen Loading:
  here = locate()
  coords = ""
  weather = fetch("https://api.openweathermap.org/data/2.5/weather?lat=0&lon=0&appid=" + api_key + "&units=metric")

  layout vertical, fill: true, align: center, padding: large:
    if here is loading:
      spinner
      label "Getting location..."
    else if here is error:
      label "Couldn't get location"
      button "Try again", on tap: navigate to Loading
    else:
      if coords is "":
        spinner
        label "Locating..."
        # kick off coord capture via on change would be reactive-fetch footgun;
        # instead auto-advance with a button
        button "Load weather", on tap: coords = round(here.latitude, 4) + "|" + round(here.longitude, 4)
      else:
        if weather is loading:
          spinner
        else if weather is error:
          label "Failed to load weather"
          button "Retry", on tap: navigate to Loading
        else:
          navigate to Weather weather

  # NOTE: Igni can't cleanly express "fetch derived from locate() result, then
  # navigate away once it arrives" in a single screen without the reactive-fetch
  # footgun. I'd want the language to support either:
  #   (a) an `on ready:` handler on async values, or
  #   (b) allowing fetch() URLs built from locate() output when the dependency
  #       is a one-shot async (not a bound input).
  # Below is the shape I'd actually want — a dedicated coord-driven loader:

screen CoordLoader(lat, lon):
  weather = fetch("https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&appid=" + api_key + "&units=metric")

  layout vertical, fill: true, align: center, padding: large:
    if weather is loading:
      spinner
    else if weather is error:
      label "Failed to load weather"
      button "Back", on tap: navigate back
    else:
      navigate to Weather weather

screen CityLoader(city):
  weather = fetch("https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + api_key + "&units=metric")

  layout vertical, fill: true, align: center, padding: large:
    if weather is loading:
      spinner
    else if weather is error:
      label "Couldn't find city"
      button "Back", on tap: navigate back
    else:
      navigate to Weather weather

screen Weather(data), title: "Weather":
  temp = round(data.main.temp, 0)
  condition_id = data.weather[0].id
  city = data.name

  emoji = "🤷"
  if condition_id < 300:
    emoji = "🌩"
  else if condition_id < 400:
    emoji = "🌧"
  else if condition_id < 600:
    emoji = "☔️"
  else if condition_id < 700:
    emoji = "☃️"
  else if condition_id < 800:
    emoji = "🌫"
  else if condition_id is 800:
    emoji = "☀️"
  else if condition_id <= 804:
    emoji = "☁️"

  message = "Bring a 🧥 just in case"
  if data.main.temp > 25:
    message = "It's 🍦 time"
  else if data.main.temp > 20:
    message = "Time for shorts and 👕"
  else if data.main.temp < 10:
    message = "You'll need 🧣 and 🧤"

  layout vertical, padding: large, gap: medium:
    layout horizontal, spread: true:
      button "📍", shape: circle, on tap: refresh_location()
      button "🔍", shape: circle, on tap: navigate to CitySearch

    layout vertical, fill: true, align: center, gap: medium:
      label emoji, style: heading
      label temp + "°", style: heading
      label city, style: heading.small
      label message + " in " + city + "!", style: body

  refresh_location():
    here = locate()
    if here is not loading and here is not error:
      navigate to CoordLoader round(here.latitude, 4), round(here.longitude, 4)

screen CitySearch, title: "Search":
  city = ""

  layout vertical, padding: large, gap: medium:
    input bind: city, placeholder: "Enter city name"
    button "Get Weather", color: brand, on tap: navigate to CityLoader city
    button "Back", color: subtle, on tap: navigate back
```