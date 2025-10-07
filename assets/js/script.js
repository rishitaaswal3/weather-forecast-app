import Capitals from "./Capitals.js";
import CITY from "./City.js";
import { translations, getUserLanguage } from "../../lang/translation.js";
import config from "./../../config/config.js";

// Initialize custom background system
const initializeBackground = () => {
  const bgElement = document.getElementById("background");
  console.log("Initializing background system...");
  
  // Force refresh the background element to use CSS background
  bgElement.style.backgroundImage = "";
  
  // Check if custom background image exists
  const checkCustomBackground = () => {
    const customImageFormats = ['jpg', 'png', 'webp'];
    let foundCustomImage = false;
    let checkedCount = 0;
    
    customImageFormats.forEach(format => {
      const img = new Image();
      img.onload = function() {
        if (!foundCustomImage) {
          foundCustomImage = true;
          console.log(`✅ Custom background found and loaded: default-background.${format}`);
        }
        checkedCount++;
        checkComplete();
      };
      img.onerror = function() {
        console.log(`❌ Custom background not found: default-background.${format}`);
        checkedCount++;
        checkComplete();
      };
      img.src = `assets/backgrounds/default-background.${format}`;
    });
    
    const checkComplete = () => {
      if (checkedCount === customImageFormats.length) {
        if (!foundCustomImage) {
          console.log("No custom background found, using gradient fallback");
          // Optionally load dynamic backgrounds after delay
          setTimeout(() => {
            const hour = new Date().getHours();
            const timeOfDay = (hour >= 6 && hour < 18) ? "day" : "night";
            fetchNewBackground("clear", timeOfDay);
          }, 2000);
        } else {
          console.log("Custom background is being used from CSS");
        }
      }
    };
  };
  
  checkCustomBackground();
};

// focus the search input as the DOM loads
window.onload = function () {
  document.getElementsByName("search-bar")[0].focus();
  initializeBackground();
};

function changeBackgroundImage() {
  // Get current weather data if available for more accurate background
  const currentCondition = document.getElementById("description").innerText;
  const hour = new Date().getHours();
  const timeOfDay = (hour >= 6 && hour < 18) ? "day" : "night";
  
  if (currentCondition && currentCondition !== "") {
    fetchNewBackground(currentCondition, timeOfDay);
  } else {
    fetchNewBackground("landscape", timeOfDay);
  }
}

// Function to reset to custom background
function resetToCustomBackground() {
  const bgElement = document.getElementById("background");
  bgElement.style.backgroundImage = "";
  console.log("Reset to custom background image");
}

const userLang = getUserLanguage() || "en-US";
const place = document.querySelector("#place");

for (let i in CITY) {
  let option = document.createElement("option");
  option.value = CITY[i];
  option.text = CITY[i];
  place.appendChild(option);
}

function formatAMPM(date) {
  return date.toLocaleString(translations[userLang].formattingLocale, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

let isCelcius = true;
let selectedCity;
$(".checkbox").change(function () {
  isCelcius = !this.checked;
  weather.fetchWeather(selectedCity);
});

const AirQuality = (lat, lon) => {
  fetchAirQuality(lat, lon)
    .then((aqiData) => updateAirQuality(aqiData))
    .catch((error) => {
      console.error("Air quality fetch failed:", error);
      updateAirQuality(null); // Show "Not Available" if API fails
    });
};

const fetchAirQuality = (lat, lon) => {
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${config.API_KEY}`;

  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch air quality data: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      if (data.list && data.list.length > 0) {
        const airData = data.list[0];
        return {
          aqi: airData.main.aqi,
          components: airData.components
        };
      } else {
        throw new Error("No air quality data available");
      }
    });
};

const updateAirQuality = (aqiData) => {
  const airQualityElement = document.querySelector("#AirQuality");
  const aqiText = translations[userLang].airQuality;
  
  if (!aqiData || !aqiData.aqi) {
    airQualityElement.innerText = `${aqiText}: ${translations[userLang].notAvailable}`;
    const qualityDescriptionElement = document.querySelector(".air-quality-label");
    qualityDescriptionElement.innerText = translations[userLang].notAvailable;
    qualityDescriptionElement.classList = "air-quality-label ml-0 not-available";
    return;
  }

  const aqi = aqiData.aqi;
  airQualityElement.innerText = `${aqiText}: ${getAirQualityText(aqi)}`;

  const airQuality = getAirQualityDescription(aqi, userLang);
  const textClass = getAirQualityClass(aqi);
  const qualityDescriptionElement = document.querySelector(".air-quality-label");

  qualityDescriptionElement.innerText = airQuality;
  qualityDescriptionElement.classList = "air-quality-label ml-0 " + textClass;
};

// Helper function to get textual representation of AQI
const getAirQualityText = (aqi) => {
  switch (aqi) {
    case 1: return "Good";
    case 2: return "Fair";
    case 3: return "Moderate";
    case 4: return "Poor";
    case 5: return "Very Poor";
    default: return "Unknown";
  }
};

const getAirQualityDescription = (aqi, userLang) => {
  // OpenWeatherMap uses 1-5 scale
  switch (aqi) {
    case 1:
      return `${translations[userLang].good}`;
    case 2:
      return `${translations[userLang].satisfactory}`;
    case 3:
      return `${translations[userLang].sensitive}`;
    case 4:
      return `${translations[userLang].unhealthy}`;
    case 5:
      return `${translations[userLang].veryUnhealthy}`;
    default:
      return `${translations[userLang].notAvailable}`;
  }
};

const getAirQualityClass = (aqi) => {
  // OpenWeatherMap uses 1-5 scale
  switch (aqi) {
    case 1:
      return "good-quality";
    case 2:
      return "satisfactory-quality";
    case 3:
      return "sensitive-quality";
    case 4:
      return "unhealthy-quality";
    case 5:
      return "hazardous-quality";
    default:
      return "not-available";
  }
};

// Helper function to enhance city names for better API results
const enhanceCityName = (cityName) => {
  const cityEnhancements = {
    // Common city name variations that need country codes
    "London": "London,UK",
    "Paris": "Paris,FR", 
    "Rome": "Rome,IT",
    "Milan": "Milan,IT",
    "Naples": "Naples,IT",
    "Florence": "Florence,IT",
    "Venice": "Venice,IT",
    "Manchester": "Manchester,UK",
    "Birmingham": "Birmingham,UK",
    "Newcastle": "Newcastle,UK",
    "Cambridge": "Cambridge,UK",
    "Oxford": "Oxford,UK",
    "York": "York,UK",
    "Bath": "Bath,UK",
    "Edinburgh": "Edinburgh,UK",
    "Glasgow": "Glasgow,UK",
    "Dublin": "Dublin,IE",
    "Cork": "Cork,IE",
    "Perth": "Perth,AU",
    "Adelaide": "Adelaide,AU",
    "Darwin": "Darwin,AU",
    "Canberra": "Canberra,AU",
    "Melbourne": "Melbourne,AU",
    "Sydney": "Sydney,AU",
    "Brisbane": "Brisbane,AU",
    "Auckland": "Auckland,NZ",
    "Wellington": "Wellington,NZ",
    "Christchurch": "Christchurch,NZ"
  };
  
  return cityEnhancements[cityName] || cityName;
};

let weather = {
  fetchWeather: function (city) {
    let isCountry = false;
    let index;
    let originalCity = city;
    
    // Check if user entered a country name instead of city
    for (let i = 0; i < Capitals.length; i++) {
      if (Capitals[i].country.toUpperCase() === city.toUpperCase()) {
        isCountry = true;
        index = i;
        break;
      }
    }
    if (isCountry) {
      city = Capitals[index].city;
      console.log(`Country "${originalCity}" mapped to capital city "${city}"`);
    }
    
    // Enhance city name for better API results
    city = enhanceCityName(city);
    
    // Enhanced URL building with better international support
    let apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${config.API_KEY}`;
    
    // Add language parameter only if it's available
    if (translations[userLang] && translations[userLang].apiLang) {
      apiUrl += `&lang=${translations[userLang].apiLang}`;
    }
    
    console.log(`Fetching weather for: "${city}" (original: "${originalCity}")`);
    console.log(`API URL: ${apiUrl}`);
    
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          console.error(`Weather API failed for "${city}" with status: ${response.status}`);
          
          // Try fallback without language parameter for international cities
          if (translations[userLang] && translations[userLang].apiLang && !city.includes(',')) {
            console.log(`Retrying without language parameter for "${city}"`);
            const fallbackUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${config.API_KEY}`;
            return fetch(fallbackUrl).then(fallbackResponse => {
              if (!fallbackResponse.ok) {
                throw new Error(`Weather data not found for "${originalCity}"`);
              }
              return fallbackResponse.json();
            });
          }
          
          toastFunction(`${translations[userLang].noWeatherFound}: ${originalCity}`);
          document.getElementById("city").innerHTML = `City "${originalCity}" not Found`;
          document.getElementById("temp").style.display = "none";
          document.querySelector(
            ".weather-component__data-wrapper"
          ).style.display = "none";
          throw new Error(`${translations[userLang].noWeatherFound}: ${originalCity}`);
        }
        return response.json();
      })
      .then((data) => {
        document.getElementById("temp").style.display = "block";
        document.querySelector(
          ".weather-component__data-wrapper"
        ).style.display = "block";
        this.displayWeather(data, city);
        // Update background based on weather
        updateBackgroundForWeather(data);
      });
  },

  displayWeather: function (data, city) {
    const { name } = data;
    const { icon, description } = data.weather[0];
    const { temp, humidity } = data.main;
    const { speed } = data.wind;
    const { sunrise, sunset } = data.sys;
    let date1 = new Date(sunrise * 1000);
    let date2 = new Date(sunset * 1000);
    const { lat, lon } = data.coord;
    AirQuality(lat, lon);

    document
      .getElementById("icon")
      .addEventListener("click", changeBackgroundImage);

    document.getElementById("dynamic").innerText =
      `${translations[userLang].weatherIn} ` + name;

    document.getElementById("city").innerText =
      `${translations[userLang].weatherIn} ` + name;

    document.getElementById(
      "icon"
    ).src = `https://openweathermap.org/img/wn/${icon}.png`;

    document.getElementById("description").innerText = description;

    let temperature = temp;

    if (!isCelcius) {
      temperature = temperature * (9 / 5) + 32;
      temperature = (Math.round(temperature * 100) / 100).toFixed(2);
      temperature = temperature + "°F";
    } else {
      temperature = temperature + "°C";
    }
    document.getElementById("temp").innerText = temperature;

    document.getElementById(
      "humidity"
    ).innerText = `${translations[userLang].humidity}: ${humidity}%`;

    document.getElementById(
      "wind"
    ).innerText = `${translations[userLang].windSpeed}: ${speed}km/h`;

    document.getElementById("weather").classList.remove("loading");

    // Update new standalone sunrise/sunset component
    document.getElementById("sunrise-display").innerHTML = `
        <i class="fas fa-sun" style="color: #ffd700; margin-right: 8px;"></i>
        ${formatAMPM(date1)}
    `;
    
    document.getElementById("sunset-display").innerHTML = `
        <i class="fas fa-moon" style="color: #ff6b35; margin-right: 8px;"></i>
        ${formatAMPM(date2)}
    `;

    // Calculate sun position for progress arc
    const now = new Date();
    const currentTime = now.getTime();
    const sunriseTime = date1.getTime();
    const sunsetTime = date2.getTime();
    
    let sunProgress = 0;
    if (currentTime >= sunriseTime && currentTime <= sunsetTime) {
        // Day time - calculate position
        sunProgress = ((currentTime - sunriseTime) / (sunsetTime - sunriseTime)) * 100;
    } else if (currentTime < sunriseTime) {
        // Before sunrise
        sunProgress = 0;
    } else {
        // After sunset
        sunProgress = 100;
    }
    
    // Update sun position and progress
    const sunProgressElement = document.getElementById('sun-progress');
    const sunPosition = document.getElementById('current-sun-position');
    
    if (sunProgressElement) {
        sunProgressElement.style.width = `${sunProgress}%`;
    }
    
    if (sunPosition) {
        sunPosition.style.left = `${sunProgress}%`;
        
        // Add dynamic styling based on time of day
        if (currentTime >= sunriseTime && currentTime <= sunsetTime) {
            sunPosition.style.opacity = '1';
            sunPosition.classList.add('active');
        } else {
            sunPosition.style.opacity = '0.5';
            sunPosition.classList.remove('active');
        }
    }

    // Try using the forecast/daily endpoint instead of onecall which may require subscription
    console.log('Coordinates for forecast:', { lat, lon });
    let url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${config.API_KEY}`;
    console.log('Forecast URL constructed:', url);
    getWeatherWeekly(url);
    document
      .getElementById("whatsapp-button")
      .replaceWith(document.getElementById("whatsapp-button").cloneNode(true));
    document
      .getElementById("whatsapp-button")
      .addEventListener("click", function () {
        const message = `Weather in ${name} today
      Temperature: ${temperature},
      Humidity: ${humidity}%,
      Wind Speed: ${speed}km/hr,
      Sunrise: ${formatAMPM(date1)},
      Sunset: ${formatAMPM(date2)}.`;
        // console.log(message)

        // Create the WhatsApp share URL
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
          message
        )}`;
        // Open WhatsApp in a new tab to share the message
        window.open(whatsappUrl, "_blank");
      });
  },
  search: function () {
    if (document.querySelector(".weather-component__search-bar").value != "") {
      selectedCity = document.querySelector(
        ".weather-component__search-bar"
      ).value;
      this.fetchWeather(selectedCity);
      const apiKey = "OOjKyciq4Sk0Kla7riLuR2j8C9FwThFzKIKIHrpq7c27KvrCul5rVxJj";
      const apiUrl = `https://api.pexels.com/v1/search?query=${selectedCity}&orientation=landscape`;

      fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: apiKey,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          const randomIndex = Math.floor(Math.random() * 10);
          const url = data.photos[randomIndex].src.large2x;
          document.getElementById(
            "background"
          ).style.backgroundImage = `url(${url})`;
        })
        .catch((error) => {
          console.error(error);
        });
      //url = "";
    } else {
      toastFunction(translations[userLang].pleaseAddLocation);
    }
  },
};

async function getWeatherWeekly(url) {
  console.log('Fetching weekly weather from:', url);
  
  try {
    const response = await fetch(url);
    console.log('Weekly weather response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      // Show error to user
      const container = document.getElementById("weather-forecast");
      if (container) {
        container.innerHTML = `<div style="text-align: center; padding: 20px; color: #ff6b6b;">
          <p>⚠️ Forecast data unavailable</p>
          <p>Error: ${response.status} - ${response.statusText}</p>
          <small>Please check your API key or try again later</small>
        </div>`;
      }
      
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Weekly weather data received:', data);
    
    if (data.daily && data.daily.length > 0) {
      console.log('Daily forecast data found (OneCall format), items:', data.daily.length);
      showWeatherData(data);
    } else if (data.list && data.list.length > 0) {
      console.log('Forecast data found (5-day format), items:', data.list.length);
      showWeatherData(data);
    } else {
      console.error('No forecast data found in response:', data);
      
      // Show message to user and add mock data for demonstration
      const container = document.getElementById("weather-forecast");
      if (container) {
        console.log('Adding mock forecast data for demonstration...');
        showMockForecastData(container);
      }
    }
  } catch (error) {
    console.error('Error fetching weekly weather:', error);
    
    // Show network error to user
    const container = document.getElementById("weather-forecast");
    if (container) {
      container.innerHTML = `<div style="text-align: center; padding: 20px; color: #ff6b6b;">
        <p>🔌 Network Error</p>
        <p>${error.message}</p>
        <p><small>Please check your internet connection</small></p>
      </div>`;
    }
  }
}

function generateWeatherItem(
  dayString,
  iconName,
  nightTemperature,
  dayTemperature
) {
  let container = document.createElement("div");
  container.className = "forecast-component__item";

  // Day name
  let day = document.createElement("div");
  day.innerText = dayString.toUpperCase();
  day.style.cssText = `
    color: #00dcff;
    font-family: Inter, sans-serif;
    font-weight: bold;
    font-size: 28px;
    margin-bottom: 30px;
    text-align: center;
    letter-spacing: 2px;
  `;

  // Weather icon
  let iconContainer = document.createElement("div");
  iconContainer.style.cssText = `
    display: flex;
    justify-content: center;
    margin-bottom: 30px;
  `;
  
  let icon = document.createElement("img");
  icon.src = `https://openweathermap.org/img/wn/${iconName}@2x.png`;
  icon.style.cssText = `
    width: 100px;
    height: 100px;
  `;

  // Day temperature
  let dayTemp = document.createElement("div");
  if (!isCelcius) {
    dayTemperature = dayTemperature * (9 / 5) + 32;
    dayTemperature = Math.round(dayTemperature);
    dayTemp.innerHTML = `DAY ${dayTemperature}°F`;
  } else {
    dayTemp.innerHTML = `DAY ${Math.round(dayTemperature)}°C`;
  }
  dayTemp.style.cssText = `
    color: white;
    font-family: Inter, sans-serif;
    font-weight: bold;
    font-size: 24px;
    text-align: center;
    margin-bottom: 18px;
  `;

  // Night temperature
  let nightTemp = document.createElement("div");
  if (!isCelcius) {
    nightTemperature = nightTemperature * (9 / 5) + 32;
    nightTemperature = Math.round(nightTemperature);
    nightTemp.innerHTML = `NIGHT ${nightTemperature}°F`;
  } else {
    nightTemp.innerHTML = `NIGHT ${Math.round(nightTemperature)}°C`;
  }
  nightTemp.style.cssText = `
    color: #00dcff;
    font-family: Inter, sans-serif;
    font-weight: bold;
    font-size: 24px;
    text-align: center;
  `;

  container.appendChild(day);
  container.appendChild(iconContainer);
  iconContainer.appendChild(icon);
  container.appendChild(dayTemp);
  container.appendChild(nightTemp);
  
  return container;
}

function showWeatherData(data) {
  console.log('showWeatherData called with:', data);
  let container = document.getElementById("weather-forecast");
  if (!container) {
    console.error('weather-forecast container not found!');
    return;
  }
  console.log('Clearing forecast container');
  container.innerHTML = "";
  
  // Handle both onecall format (data.daily) and forecast format (data.list)
  let forecastData = [];
  
  if (data.daily) {
    // OneCall API format (7-day)
    forecastData = data.daily;
    console.log('Processing', data.daily.length, 'days of forecast data (OneCall format)');
    forecastData.forEach((day, idx) => {
      if (idx < 7) { // Limit to 7 days
        let dayString = window.moment(day.dt * 1000).format("dddd");
        let dateString = window.moment(day.dt * 1000).format("Do");
        console.log(`Creating forecast item ${idx + 1}: ${dayString}`);
        let element = generateWeatherItem(
          translations[userLang][dayString.toLowerCase()] || dayString,
          day.weather[0].icon,
          day.temp.night,
          day.temp.day
        );
        showCurrDay(dayString, parseInt(dateString), element);
        container.appendChild(element);
      }
    });
  } else if (data.list) {
    // 5-day forecast API format (3-hour intervals)
    console.log('Processing forecast data (5-day format)', data.list.length, 'items');
    
    // Group by day and get min/max temperatures
    let dailyData = {};
    data.list.forEach(item => {
      let date = window.moment(item.dt * 1000).format('YYYY-MM-DD');
      let dayName = window.moment(item.dt * 1000).format('dddd');
      
      if (!dailyData[date]) {
        dailyData[date] = {
          day: dayName,
          temps: [],
          icons: [],
          dt: item.dt
        };
      }
      dailyData[date].temps.push(item.main.temp);
      dailyData[date].icons.push(item.weather[0].icon);
    });
    
    // Create forecast items for each day
    Object.keys(dailyData).slice(0, 5).forEach((date, idx) => {
      let dayData = dailyData[date];
      let maxTemp = Math.max(...dayData.temps);
      let minTemp = Math.min(...dayData.temps);
      let mostCommonIcon = dayData.icons[0]; // Use first icon for simplicity
      
      console.log(`Creating forecast item ${idx + 1}: ${dayData.day}`);
      let element = generateWeatherItem(
        translations[userLang][dayData.day.toLowerCase()] || dayData.day,
        mostCommonIcon,
        minTemp,
        maxTemp
      );
      let dateString = window.moment(dayData.dt * 1000).format("Do");
      showCurrDay(dayData.day, parseInt(dateString), element);
      container.appendChild(element);
    });
  } else {
    console.error('No forecast data found in response');
    return;
  }
  
  console.log('Forecast rendering complete');
}

function showMockForecastData(container) {
  console.log('Showing mock forecast data as fallback');
  container.innerHTML = "";
  
  // Mock 7-day forecast data
  const mockDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const mockIcons = ['01d', '02d', '03d', '04d', '09d', '10d', '11d'];
  const mockMaxTemps = [28, 30, 27, 25, 26, 29, 31];
  const mockMinTemps = [18, 20, 17, 15, 16, 19, 21];
  
  mockDays.forEach((day, idx) => {
    let element = generateWeatherItem(
      translations[userLang][day.toLowerCase()] || day,
      mockIcons[idx],
      mockMinTemps[idx],
      mockMaxTemps[idx]
    );
    
    // Add a note that this is mock data
    if (idx === 0) {
      let mockNote = document.createElement('div');
      mockNote.style.cssText = 'position:absolute; top:-25px; left:0; right:0; text-align:center; font-size:12px; color:#ffa500;';
      mockNote.textContent = '⚠️ Demo Data (API Issue)';
      element.style.position = 'relative';
      element.appendChild(mockNote);
    }
    
    container.appendChild(element);
  });
}
//toast function
function toastFunction(val) {
  var x = document.getElementById("toast");
  x.className = "show";
  //change inner text
  document.getElementById("toast").innerText = val;
  setTimeout(function () {
    x.className = x.className.replace("show", "");
  }, 3000);
}
document
  .querySelector(".weather-component__search-button")
  .addEventListener("click", function () {
    weather.search();
  });

document
  .querySelector(".weather-component__search-bar")
  .addEventListener("keyup", function (event) {
    if (event.key == "Enter") {
      weather.search();
    }
  });

// get user city name via ip api with Dehradun fallback

fetch("https://ipapi.co/json/")
  .then((response) => response.json())
  .then((data) => {
    selectedCity = data.city || "Dehradun";
    weather.fetchWeather(selectedCity);
  })
  .catch((error) => {
    console.log("IP geolocation failed, using Dehradun as default");
    selectedCity = "Dehradun";
    weather.fetchWeather("Dehradun");
  });

// Auto-refresh background every 30 minutes for dynamic changes
setInterval(() => {
  if (selectedCity) {
    console.log("Auto-refreshing background...");
    weather.fetchWeather(selectedCity);
  }
}, 30 * 60 * 1000); // 30 minutes

document.getElementsByName("search-bar")[0].placeholder =
  translations[userLang].search;

// Add test forecast button functionality
document.addEventListener('DOMContentLoaded', function() {
  const testBtn = document.getElementById('test-forecast-btn');
  if (testBtn) {
    testBtn.addEventListener('click', function() {
      console.log('Testing forecast manually...');
      // Use Agra coordinates as test
      const lat = 27.1767;
      const lon = 78.0081;
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${config.API_KEY}`;
      getWeatherWeekly(url);
    });
  }
});

// SHOWS CURRENT DAY IN THE RENDERED DAYS
function showCurrDay(dayString, dateString, element) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const date = new Date();
  const dayName = days[date.getDay()];
  const dayNumber = date.getDate();
  if (dayString == dayName && dateString == dayNumber) {
    element.classList.add("forecast-component__item-current-day");
  }
}

// Script for Live Time using SetInterval
var a;
var time;
const weekday = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const month = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const formatLeadingZero=(value)=>{
    //to add leading zeros if value is less than 10
    return value.toString().padStart(2, '0');
}
setInterval(() => {
  a = new Date();
  time =
    weekday[a.getDay()] +
    "  " +
    a.getDate() +
    "  " +
    month[a.getMonth()] +
    " " +
    a.getFullYear() +
    ", " +
    '  "Clock: ' +
    formatLeadingZero(a.getHours()) +
    ":" +
    formatLeadingZero(a.getMinutes()) +
    ":" +
    formatLeadingZero(a.getSeconds()) +
    '"';
  document.getElementById("date-time").innerHTML = time;
}, 1000);

// scrollTop functionality
const scrollTop = function () {
  // create HTML button element
  const scrollBtn = document.createElement("button");
  scrollBtn.innerHTML = "&#8679";
  scrollBtn.setAttribute("id", "scroll-btn");
  document.body.appendChild(scrollBtn);
  // hide/show button based on scroll distance
  const scrollBtnDisplay = function () {
    window.scrollY > window.innerHeight
      ? scrollBtn.classList.add("show")
      : scrollBtn.classList.remove("show");
  };
  window.addEventListener("scroll", scrollBtnDisplay);
  // scroll to top when button clicked
  const scrollWindow = function () {
    if (window.scrollY != 0) {
      setTimeout(function () {
        window.scrollTo(0, window.scrollY - 50);
        window.scroll({ top: 0, behavior: "smooth" });
        scrollWindow();
      }, 10);
    }
  };
  scrollBtn.addEventListener("click", scrollWindow);
};
scrollTop();

//Enhanced Background System with Weather and Time-based Automation
const fetchNewBackground = (weatherCondition = null, timeOfDay = null) => {
  const bgElement = document.getElementById("background");
  
  // Responsive background image sizing
  const getResponsiveImageSize = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    if (screenWidth <= 480) {
      // Mobile Portrait
      return "480x800";
    } else if (screenWidth <= 768) {
      // Mobile Landscape / Small Tablet
      return "768x1024";
    } else if (screenWidth <= 1024) {
      // Tablet / Small Desktop
      return "1024x768";
    } else if (screenWidth <= 1440) {
      // Standard Desktop
      return "1440x900";
    } else {
      // Large Desktop / 4K
      return "1920x1080";
    }
  };
  
  const screenSize = getResponsiveImageSize();
  
  // Background categories based on weather and time
  const backgroundCategories = {
    clear: {
      day: ["sunny", "clear sky", "blue sky", "sunshine"],
      night: ["night sky", "stars", "clear night", "moonlight"]
    },
    clouds: {
      day: ["cloudy", "overcast", "grey clouds", "dramatic sky"],
      night: ["cloudy night", "dark clouds", "stormy night"]
    },
    rain: {
      day: ["rain", "rainy day", "storm", "monsoon"],
      night: ["rain night", "night storm", "rainy evening"]
    },
    snow: {
      day: ["snow", "winter", "snowy landscape", "white snow"],
      night: ["snowy night", "winter night", "snow evening"]
    },
    mist: {
      day: ["mist", "fog", "misty morning", "haze"],
      night: ["misty night", "fog night", "ethereal night"]
    },
    thunderstorm: {
      day: ["thunderstorm", "lightning", "storm clouds", "dramatic weather"],
      night: ["lightning night", "storm night", "thunder clouds"]
    },
    default: {
      day: ["landscape", "nature", "mountains", "beautiful scenery"],
      night: ["night landscape", "evening", "dusk", "twilight"]
    }
  };

  let category = "default";
  let time = "day";

  // Determine weather category
  if (weatherCondition) {
    const condition = weatherCondition.toLowerCase();
    if (condition.includes("clear")) category = "clear";
    else if (condition.includes("cloud")) category = "clouds";
    else if (condition.includes("rain") || condition.includes("drizzle")) category = "rain";
    else if (condition.includes("snow")) category = "snow";
    else if (condition.includes("mist") || condition.includes("fog") || condition.includes("haze")) category = "mist";
    else if (condition.includes("thunder") || condition.includes("storm")) category = "thunderstorm";
  }

  // Determine time of day
  if (timeOfDay) {
    time = timeOfDay;
  } else {
    const hour = new Date().getHours();
    time = (hour >= 6 && hour < 18) ? "day" : "night";
  }

  // Get random keyword from selected category
  const keywords = backgroundCategories[category][time];
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
  
  // Create Unsplash URL with specific query
  const url = `https://source.unsplash.com/${screenSize}/?${encodeURIComponent(randomKeyword)}`;
  
  console.log(`Setting background: ${category} - ${time} - ${randomKeyword}`);
  
  // Create a new image to preload and check if it loads successfully
  const img = new Image();
  img.onload = function() {
    // Image loaded successfully, apply it with transition
    bgElement.style.backgroundImage = `url(${url})`;
    console.log("Background image loaded successfully");
  };
  
  img.onerror = function() {
    // If Unsplash fails, keep the beautiful default gradient
    console.log("Background image failed to load, keeping default gradient");
  };
  
  // Start loading the image
  img.src = url;
  
  // Ensure smooth transition is always set
  bgElement.style.transition = "background-image 1.5s ease-in-out";
};

// Enhanced function to update background based on current weather
const updateBackgroundForWeather = (weatherData) => {
  if (weatherData && weatherData.weather && weatherData.weather[0]) {
    const condition = weatherData.weather[0].main;
    const description = weatherData.weather[0].description;
    
    // Determine if it's day or night based on sunrise/sunset
    const now = Date.now() / 1000;
    const sunrise = weatherData.sys.sunrise;
    const sunset = weatherData.sys.sunset;
    const isDay = now >= sunrise && now <= sunset;
    
    fetchNewBackground(condition, isDay ? "day" : "night");
  } else {
    fetchNewBackground();
  }
};

// Check if the browser supports the SpeechRecognition API
if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  const microphoneButton = document.querySelector(
    ".weather-component__button-microphone"
  );
  const searchBar = document.querySelector(".weather-component__search-bar");

  // Add an event listener to the microphone button to start speech recognition
  microphoneButton.addEventListener("click", () => {
    recognition.start();
  });

  // Add an event listener for when speech recognition results are available
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;

    // Set the value of the search bar to the recognized speech
    searchBar.value = transcript;

    // Optionally, you can submit the form to perform the search
    // searchBar.form.submit();
  };

  // Handle speech recognition errors
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };
} else {
  // Handle the case where the browser does not support speech recognition
  console.error("Speech recognition is not supported in this browser.");
}

let follower = document.getElementById("circle");
let timer = null;

window.addEventListener("mousemove", function (details) {
  let y = details.clientY;
  let x = details.clientX;
  if (timer) {
    clearTimeout(timer);
  }
  if (follower) {
    timer = setTimeout(function () {
      follower.style.top = `${y}px`;
      follower.style.left = `${x}px`;
    }, 50);
  }
});
