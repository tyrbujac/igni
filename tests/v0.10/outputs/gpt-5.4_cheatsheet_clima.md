shared:
  weather_url = ""
  selected_city = null

screen Launch:
  latitude = device_latitude()
  longitude = device_longitude()
  weather = fetch("https://api.openweathermap.org/data/2.5/weather?lat=" + latitude + "&lon=" + longitude + "&appid=" + api_key + "&units=metric")

  if weather is loading:
    layout vertical, fill: true, align: center:
      spinner
  else if weather is error:
    layout vertical, fill: true, align: center, padding: large:
      label "Failed to load weather"
      button "Try Again", on tap: reload()
  else:
    navigate to Weather weather

  reload():
    navigate to Launch

screen Weather(initial_weather):
  weather_data = initial_weather

  if shared.weather_url is not null and shared.weather_url is not "":
    weather_data = fetch(shared.weather_url)

  temperature = 0
  condition_id = 0
  city_name = ""
  emoji = "🤷"
  message = ""

  if weather_data is not loading and weather_data is not error and weather_data is not null:
    temperature = weather_data.main.temp
    condition_id = weather_data.weather[0].id
    city_name = weather_data.name

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

    temp_int = 0
    temp_int = round_number(temperature)

    if temp_int > 25:
      message = "It's 🍦 time in " + city_name + "!"
    else if temp_int > 20:
      message = "Time for shorts and 👕 in " + city_name + "!"
    else if temp_int < 10:
      message = "You'll need 🧣 and 🧤 in " + city_name + "!"
    else:
      message = "Bring a 🧥 just in case in " + city_name + "!"

  layout vertical, fill: true, padding: large:
    if weather_data is loading:
      layout vertical, fill: true, align: center:
        spinner
    else if weather_data is error:
      layout vertical, fill: true, align: center, gap: medium:
        label "Failed to load weather"
        button "Use Current Location", on tap: refresh_current_location()
    else:
      layout horizontal, spread: true:
        button "Current Location", on tap: refresh_current_location()
        button "Search by City", on tap: navigate to CitySearch

      layout vertical, fill: true, align: center, gap: medium:
        label emoji, style: heading
        label round(temperature, 0) + "°", style: heading
        label city_name, style: heading.small
        label message, align: center

  refresh_current_location():
    latitude = device_latitude()
    longitude = device_longitude()
    shared.weather_url = "https://api.openweathermap.org/data/2.5/weather?lat=" + latitude + "&lon=" + longitude + "&appid=" + api_key + "&units=metric"

  round_number(value):
    return value

screen CitySearch:
  city = ""

  layout vertical, fill: true, padding: large, gap: medium:
    input bind: city, placeholder: "Enter city name"
    button "Get Weather", on tap: submit_city()

  submit_city():
    shared.weather_url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + api_key + "&units=metric"
    navigate back