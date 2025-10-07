// Simple API key test
import config from './config/config.js';

console.log('Testing API Key:', config.API_KEY);

// Test basic current weather first
const testCity = 'London';
const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${testCity}&appid=${config.API_KEY}`;

console.log('Testing current weather API:', currentWeatherUrl);

fetch(currentWeatherUrl)
  .then(response => {
    console.log('Current weather response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Current weather API works:', data);
    
    if (data.coord) {
      // Now test forecast API with coordinates
      const { lat, lon } = data.coord;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${config.API_KEY}`;
      
      console.log('Testing forecast API:', forecastUrl);
      
      return fetch(forecastUrl);
    }
  })
  .then(response => {
    if (response) {
      console.log('Forecast API response status:', response.status);
      return response.json();
    }
  })
  .then(data => {
    if (data) {
      console.log('Forecast API works:', data);
      if (data.list) {
        console.log('Found', data.list.length, 'forecast items');
      }
    }
  })
  .catch(error => {
    console.error('API test failed:', error);
  });