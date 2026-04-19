# Note: Igni currently lacks a way to perform an automatic state mutation when an async 
# value resolves, bypassing the reactive-fetch footgun without a button tap.
# I am using a hypothetical `watch` block to handle the "immediately fetches on launch" requirement.

shared:
  query = ""

screen Weather:
  here = locate()

  watch here:
    if here is not loading and here is not error:
      if shared.query is "":
        shared.query = "?lat=" + round(here.latitude, 4) + "&lon=" + round(here.longitude, 4)

  if shared.query is "":
    layout vertical, fill: true, align: center:
      spinner
  else:
    weather = fetch("https://api.openweathermap.org/data/2.5/weather" + shared.query + "&appid=" + api_key + "&units=metric")

    if weather is loading:
      layout vertical, fill: true, align: center:
        spinner
    else if weather is error:
      layout vertical, fill: true, align: center:
        label "Failed to load weather"
        button "Retry location", on tap: refetch_location()
    else:
      raw_temp = weather.main.temp
      display_temp = round(raw_temp, 0)
      
      condition_id = weather.weather[0].id
      emoji = "🤷"