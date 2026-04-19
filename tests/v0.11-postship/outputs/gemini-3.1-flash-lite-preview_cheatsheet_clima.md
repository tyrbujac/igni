shared:
  weather_data = null
  query = ""

screen Loading:
  here = locate()
  
  if here is loading:
    spinner
  else if here is error:
    label "Location error"
  else:
    load_weather(here.latitude, here.longitude)
    navigate to Home

  load_weather(lat, lon):
    weather_data = fetch("https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&appid=" + api_key + "&units=metric")

screen Home:
  if weather_data is loading:
    spinner
  else if weather_data is error:
    layout vertical:
      label "Failed to load weather"
      button "Retry", on tap: navigate to Loading
  else:
    temp_int = round(weather_data.main.temp, 0)
    msg = get_message(temp_int)
    icon = get_emoji(weather_data.weather[0].id)
    
    layout vertical, padding: large:
      label weather_data.name, style: heading
      label temp_int + "°"
      label icon, style: heading.small
      label msg + " in " + weather_data.name + "!"
      button "Refresh Location", on tap: navigate to Loading
      button "Search City", on tap: navigate to Search

  get_emoji(id):
    if id < 300: return "🌩"
    else if id < 400: return "🌧"
    else if id < 600: return "☔️"
    else if id < 700: return "☃️"
    else if id < 800: return "🌫"
    else if id is 800: return "☀️"
    else if id <= 804: return "☁️"
    else: return "🤷"

  get_message(t):
    if t > 25: return "It's 🍦 time"
    else if t > 20: return "Time for shorts and 👕"
    else if t < 10: return "You'll need 🧣 and 🧤"
    else: return "Bring a 🧥 just in case"

screen Search:
  layout vertical, padding: large:
    input bind: query, placeholder: "Enter city name"
    button "Get Weather", on tap: search_city()
    button "Back", on tap: navigate back

  search_city():
    weather_data = fetch("https://api.openweathermap.org/data/2.5/weather?q=" + query + "&appid=" + api_key + "&units=metric")
    navigate to Home