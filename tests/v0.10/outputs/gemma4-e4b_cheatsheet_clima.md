```ni
component WeatherApp {
  // State management for locations and data
  componentState {
    currentCity: String = "London";
    currentWeatherData: WeatherData? = null;
    isLoading: Boolean = true;
  }

  // Data structure for weather details
  type WeatherData {
    temp: Float;
    conditionCode: Int;
  }

  // Constants for API simulation and formatting
  const WEATHER_API_URL: String = "https://api.weather.com/data";

  // --- Lifecycle & Initialization ---
  init {
    // Fetch initial data on component load
    fetchWeather(componentState.currentCity);
  }

  // --- API Simulation (Replaces actual network call) ---
  // Simulates fetching weather data based on city name.
  // In a real app, this would use `fetch(url)`
  async fetchWeather(city: String) : WeatherData? {
    componentState.isLoading = true;
    componentState.currentCity = city;

    // Simulate network delay
    await delay(1000);

    // --- Mock Logic based on City Name ---
    let weatherData: WeatherData
    if (city.toLowerCase() == "london") {
      weatherData = WeatherData { temp: 15.5, conditionCode: 200 }; // Cloudy
    } else if (city.toLowerCase() == "tokyo") {
      weatherData = WeatherData { temp: 24.0, conditionCode: 300 }; // Sunny
    } else if (city.toLowerCase() == "sydney") {
      weatherData = WeatherData { temp: 28.1, conditionCode: 100 }; // Hot/Sunny
    } else {
      weatherData = WeatherData { temp: 20.0, conditionCode: 250 }; // Default
    }

    componentState.currentWeatherData = weatherData;
    componentState.isLoading = false;
    return weatherData;
  }

  // --- Utility Functions ---

  // Maps condition codes to descriptive names (for display purposes)
  get getWeatherConditionName(code: Int): String {
    if (code >= 100 && code < 200) return "Sunny";
    if (code >= 200 && code < 300) return "Cloudy";
    return "Mixed";
  }

  // Determines the primary weather message based on temperature and condition
  get getWeatherMessage(temp: Float, condition: String): String {
    if (temp > 25 && condition == "Sunny") {
      return "It's a beautiful day! Perfect for the beach.";
    }
    if (temp < 15 && condition == "Cloudy") {
      return "A bit gloomy today, maybe grab a book?";
    }
    return "Enjoy the weather!";
  }

  // --- Event Handlers ---

  // Called when the user selects a new city from the suggestion input
  handleCitySearch(cityName: String) {
    if (cityName && cityName.trim() !== "") {
      fetchWeather(cityName);
    }
  }

  // --- UI Rendering ---
  render() {
    // Use the current state to build the UI
    let currentData = componentState.currentWeatherData;
    let city = componentState.currentCity;
    let isLoading = componentState.isLoading;

    if (isLoading) {
      return view {
        text("Loading weather data for " + city + "...")
      }
    }

    if (!currentData) {
      return view {
        text("Could not load weather data for " + city + ".")
      }
    }

    let conditionName = getWeatherConditionName(currentData.conditionCode);
    let message = getWeatherMessage(currentData.temp, conditionName);

    return view {
      column(spacing: 20) {
        // Location Header
        text("Weather Forecast for " + city.toUpperCase()) {
          style: { fontSize: "2em", fontWeight: "bold" }
        }

        // Current Temperature Display
        text("${currentData.temp}°C") {
          style: { fontSize: "4em", fontWeight: "bold" }
        }

        // Detailed Status Cards
        row(spacing: 10) {
          card {
            column(spacing: 5) {
              text("Condition:") { style: { fontSize: "1.2em" } }
              text(conditionName) { style: { fontSize: "1.5em", fontWeight: "bold" } }
            }
          }
          card {
            column(spacing: 5) {
              text("Feels Like:") { style: { fontSize: "1.2em" } }
              text("${currentData.temp - 2.5}°C") { style: { fontSize: "1.5em", fontWeight: "bold" } }
            }
          }
        }

        // Daily Message / Tips
        text("Today's Advice:") {
          style: { fontSize: "1.2em", fontWeight: "bold", marginTop: "15px" }
        }
        text(message) {
          style: { fontSize: "1.1em", color: "#555" }
        }

        // Search/Interaction Area
        searchBar(placeholder: "Enter city name (e.g., Tokyo, Sydney)") {
          onInput: { value: name, handler: handleCitySearch }
          onBlur: { value: name, handler: handleCitySearch }
        }
      }
    }
  }
}

// --- Helper Components (For clean rendering structure) ---

component view {
  (children: Array<Component>) -> Component
  render(children) {
    return div {
      {children}
    }
  }
}

component text {
  (content: String) -> Component
  render(content) {
    return p {
      {content}
    }
  }
}

component row {
  (children: Array<Component>) -> Component
  render(children) {
    return div {
      {children}
    }
  }
}

component column {
  (children: Array<Component>) -> Component
  render(children) {
    return div {
      {children}
    }
  }
}

component card {
    render() {
        return div {
            style: { border: "1px solid #eee", padding: "10px", borderRadius: "8px", flexGrow: 1 }
        }
    }
}

component searchBar {
    (placeholder: String, onInput: (value: String, handler: (value: String) -> Unit) -> Unit, onBlur: (value: String, handler: (value: String) -> Unit) -> Unit) -> Component
    render() {
        return input {
            placeholder: placeholder
            onInput: onInput
            onBlur: onBlur
            style: { width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }
        }
    }
}

// Mock implementation for functional components and types not defined in this scope
// These simulate the structure needed for the component logic above.

// Mock delay function
function delay(ms: Int): Promise<Void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```