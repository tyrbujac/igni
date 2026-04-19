```igni
# LANGUAGE FEATURE NOTE: Igni prevents state mutations during render to avoid infinite loops,
# meaning a user action (like `on tap:`) is normally required to sequence async calls.
# To satisfy the "On launch: immediately fetches" requirement without a button tap, the language
# needs an event handler for async resolution. Using a hypothetical `on resolve:` syntax here.

shared:
  query = ""

screen Weather:
  here = locate(), on resolve: init_location()
  
  data = null
  if shared.query is not "":
    data = fetch("https://api.openweathermap.org/data/2.5/weather?" + shared.query + "&appid=" + api_key + "&units=metric")

  layout vertical, fill: true, padding: large, align: center, gap: large:
    if shared.query is "":
      if here is error:
        label "Couldn't get location"
      else:
        spinner
    else if data is loading:
      spinner
    else if data is error:
      label "Failed to load weather"
    else if data is not null:
      WeatherDisplay data

      layout horizontal, gap: medium:
        button "Current Location", on tap: use_current()
        button "Search by City", on tap: navigate to CitySearch

  init_location():
    if shared.query is "":
      shared.query = "lat=" + round(here.latitude, 