```igni
screen Launch:
  # Igni doesn't explicitly define a "get location" builtin, 
  # so assuming a standard device utility exists.
  lat = 0.0
  lon = 0.0
  
  on launch:
    lat = device.latitude
    lon = device.longitude
    navigate to Weather(lat, lon, null)

  layout vertical, fill: true, align: center:
    spinner

screen Weather(lat, lon, city_name):
  url = ""
  if city_name is not null:
    url = "https://api.openweathermap.org/data/2.5/weather?q=" + city_name + "&appid=" + api_key + "&units=metric"
  else:
    url = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&appid=" + api_key + "&units=metric"

  data = fetch(url)

  layout vertical, padding: large, fill: true:
    if data is loading:
      layout vertical, fill: true, align: center:
        spinner
    else if data is error:
      layout vertical, fill: true, align: center:
        label "Error loading weather"
        button "Retry", on tap: navigate to Weather(lat, lon, city_name)
    else:
      temp_int = data.main.temp
      condition_id = data.weather[0].id
      city = data.name
      
      layout vertical, fill: true, align: center, gap: medium:
        label get_emoji(condition_id), style: heading
        label round(temp_int, 0) + "°", style: heading
        label get_message(temp_int) + " in " + city, style: body
      
      layout horizontal, gap: medium:
        button "Current Location", on tap: refresh_local()
        button "Search City", on tap: navigate to Search()

  refresh_local():
    navigate to Weather(device.latitude, device.longitude, null)

  get_emoji(id):
    if id < 300:
      return "🌩"
    else if id < 400:
      return "🌧"
    else if id < 600:
      return "☔️"
    else if id < 700:
      return "☃️"
    else if id < 800:
      return "🌫"
    else if id is 800:
      return "☀️"
    else if id <= 804:
      return "☁️"
    else:
      return "🤷"

  get_message(temp):
    if temp > 25:
      return "It's 🍦 time"
    else if temp > 20:
      return "Time for shorts and 👕"
    else if temp < 10:
      return "You'll need 🧣 and 🧤"
    else:
      return "Bring a 🧥 just in case"

screen Search:
  query = ""

  layout vertical, padding: large, gap: medium:
    label "Enter City Name", style: heading.small
    input bind: query, placeholder: "e.g. London"
    button "Get Weather", on tap: submit()

  submit():
    if query is not empty:
      navigate to Weather(0, 0, query)
```