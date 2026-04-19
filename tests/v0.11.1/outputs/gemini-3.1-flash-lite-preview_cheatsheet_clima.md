```igni
shared:
  weather_data = null
  last_query = ""

screen Weather:
  here = locate()
  
  # Reactive-fetch trigger pattern: update shared last_query to trigger fetch
  if last_query is "":
    if here is not loading and here is not error:
      last_query = "lat=" + here.latitude + "&lon=" + here.longitude
  
  forecast = fetch("https://api.openweathermap.org/data/2.5/weather?" + last_query + "&appid=" + api_key + "&units=metric")

  layout vertical, padding: large, gap: medium:
    if forecast is loading:
      spinner
    else if forecast is error:
      label "Could not load weather"
      button "Retry", on tap: last_query = "lat=" + here.latitude + "&lon=" + here.longitude
    else:
      temp_int = round(forecast.main.temp, 0)
      id = forecast.weather[0].id
      
      emoji = "🤷"
      if id < 300: emoji = "🌩"
      else if id < 400: emoji = "🌧"
      else if id < 600: emoji = "☔️"
      else if id < 700: emoji = "☃️"
      else if id < 800: emoji = "🌫"
      else if id is 800: emoji = "☀️"
      else if id <= 804: emoji = "☁️"
      
      msg = "Bring a 🧥 just in case"
      if temp_int > 25: msg = "It's 🍦 time"
      else if temp_int > 20: msg = "Time for shorts and 👕"
      else if temp_int < 10: msg = "You'll need 🧣 and 🧤"

      label temp_int + "°", style: heading
      label emoji, style: heading
      label msg + " in " + forecast.name + "!"
      
      button "Use Current Location", on tap: last_query = "lat=" + here.latitude + "&lon=" + here.longitude
      button "Search by City", on tap: navigate to Search

screen Search:
  city = ""
  
  layout vertical, padding: large, gap: medium:
    input bind: city, placeholder: "Enter city name"
    button "Get Weather", on tap:
      shared.last_query = "q=" + city
      navigate back
```