shared:
  weather_url = ""
  weather_data = null

screen App:
  here = locate()

  if here is loading:
    layout vertical, fill: true, align: center:
      spinner
  else if here is error:
    layout vertical, fill: true, align: center, padding: large:
      label "Couldn't get location"
  else:
    weather_url = "https://api.openweathermap.org/data/2.5/weather?lat=" + round(here.latitude, 4) + "&lon=" + round(here.longitude, 4) + "&appid=" + api_key + "&units=metric"
    shared.weather_url = weather_url
    shared.weather_data = fetch(weather_url)
    navigate to Weather

screen Weather:
  if shared.weather_url is "":
    layout vertical, fill: true, align: center:
      spinner
  else:
    data = fetch(shared.weather_url)

    if data is loading:
      layout vertical, fill: true, align: center:
        spinner
    else if data is error:
      layout vertical, fill: true, align: center, padding: large, gap: medium:
        label "Failed to load weather"
        button "Use Current Location", on tap: navigate to RefreshLocation
        button "Search by City", on tap: navigate to CitySearch
    else:
      temp_value = data.main.temp
      temp_text = round(temp_value, 0) + "°"

      condition_id = data.weather[0].id
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

      temp_int = round(temp_value, 0)
      message = "Bring a 🧥 just in case"
      if temp_value > 25:
        message = "It's 🍦 time"
      else if temp_value > 20:
        message = "Time for shorts and 👕"
      else if temp_value < 10:
        message = "You'll need 🧣 and 🧤"

      layout vertical, fill: true, padding: large, gap: large:
        layout vertical, fill: true, align: center, gap: medium:
          label temp_text, style: heading
          label emoji
          label data.name, style: heading.small
          label message + " in " + data.name + "!", align: center
        layout horizontal, gap: medium, spread: true:
          button "Current Location", on tap: navigate to RefreshLocation
          button "Search by City", on tap: navigate to CitySearch

screen RefreshLocation:
  here = locate()

  if here is loading:
    layout vertical, fill: true, align: center:
      spinner
  else if here is error:
    layout vertical, fill: true, align: center, padding: large, gap: medium:
      label "Couldn't get location"
      button "Back", on tap: navigate back
  else:
    shared.weather_url = "https://api.openweathermap.org/data/2.5/weather?lat=" + round(here.latitude, 4) + "&lon=" + round(here.longitude, 4) + "&appid=" + api_key + "&units=metric"
    navigate to Weather

screen CitySearch:
  city = ""

  layout vertical, padding: large, gap: medium:
    input bind: city, placeholder: "Enter city name"
    button "Get Weather", on tap: get_weather()

  get_weather():
    if city is not "":
      shared.weather_url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + api_key + "&units=metric"
      navigate back