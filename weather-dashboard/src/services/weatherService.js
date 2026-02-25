const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Fetch current weather data
export const getWeatherData = async (city) => {
  const response = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
  if (!response.ok) throw new Error('City not found');
  return await response.json();
};

// Fetch 5-day forecast data
export const getForecastData = async (city) => {
  const response = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`);
  if (!response.ok) throw new Error('Forecast not found');
  const data = await response.json();
  
  // Filter for readings taken at 12:00 PM to represent each day
  const dailyData = data.list.filter((reading) => reading.dt_txt.includes("12:00:00"));
  return dailyData;
};