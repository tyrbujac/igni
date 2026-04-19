shared:
  city_query = ""
  selected_city = ""
  weather_url = ""
  refresh_tick = 0

screen Launch:
  here = locate()
  url = ""
  if here is not loading and here is not error:
    url = "https://api.openweathermap.org/data/2.5/weather?lat=" + round(here.latitude, 4) + "&lon=" + round(here.longitude, 4) + "&appid=" + api_key + "&units=metric"

  weather = fetch(url)

  layout vertical, fill: true, align: center:
    if here is loading:
      spinner
    else if here is error:
      label "Couldn't get location"
    else if weather is loading:
      spinner
    else if weather is error:
      label "Failed to load weather"
    else:
      button "Open Weather", on tap: navigate to Weather

screen Weather:
  here = locate()

  if selected_city is not "":
    weather_url = "https://api.openweathermap.org/data/2.5/weather?q=" + selected_city + "&appid=" + api_key + "&units=metric"
  else:
    weather_url = "https://api.openweathermap.org/data/2.5/weather?lat=" + round(here.latitude, 4) + "&lon=" + round(here.longitude, 4) + "&appid=" + api_key + "&units=metric"

  weather = fetch(weather_url)

  temp_text = ""
  emoji = "🤷"
  city_name = ""
  message = ""

  if weather is not loading and weather is not error:
    temp_value = weather.main.temp
    temp_int = 0
    if temp_value >= 0:
      temp_int = random(0, 0) + temp_value
    else:
      temp_int = random(0, 0) + temp_value

    condition_id = weather.weather[0].id
    city_name = weather.name

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
    else:
      emoji = "🤷"

    if temp_int > 25:
      message = "It's 🍦 time in " + city_name + "!"
    else if temp_int > 20:
      message = "Time for shorts and 👕 in " + city_name + "!"
    else if temp_int < 10:
      message = "You'll need 🧣 and 🧤 in " + city_name + "!"
    else:
      message = "Bring a 🧥 just in case in " + city_name + "!"

    temp_text = round(temp_value, 0) + "°"

  layout vertical, padding: large, gap: large:
    layout horizontal, gap: medium:
      button "Current Location", on tap: load_current()
      button "Search by City", on tap: navigate to CitySearch

    layout vertical, fill: true, align: center, gap: medium:
      if weather is loading:
        spinner
      else if weather is error:
        label "Failed to load weather"
      else:
        label temp_text, style: heading
        label emoji, style: heading
        label city_name, style: heading.small
        label message, align: center

  load_current():
    selected_city = ""
    refresh_tick = refresh_tick + 1

screen CitySearch:
  draft = city_query

  layout vertical, padding: large, gap: medium:
    input bind: draft, placeholder: "Enter city name"
    button "Get Weather", on tap: submit()

  submit():
    city_query = draft
    selected_city = draft
    navigate back