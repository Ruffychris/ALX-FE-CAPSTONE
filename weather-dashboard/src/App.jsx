import React, { useState, useEffect } from 'react';
import { getWeatherData, getForecastData } from './services/weatherService';

// Reusable component for small weather details
const WeatherDetailCard = ({ title, value, icon }) => (
  <div className="bg-white/20 backdrop-blur-xl p-4 rounded-3xl shadow-lg flex flex-col items-center justify-center border border-white/30 transition-transform hover:scale-105">
    <p className="text-white/70 text-sm mb-2 font-medium">{title}</p>
    <div className="text-2xl mb-1">{icon}</div>
    <p className="font-bold text-lg text-white">{value}</p>
  </div>
);

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchWeather = async (city) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeatherData(city);
      const forecastData = await getForecastData(city);
      setWeather(data);
      setForecast(forecastData);
      addToRecent(data.name); 
    } catch (err) {
      setError("City not found. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
      const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
      
      if (!res.ok || !fRes.ok) throw new Error();
      
      const data = await res.json();
      const fData = await fRes.json();
      
      setWeather(data);
      setForecast(fData.list.filter(r => r.dt_txt.includes("12:00:00")));
    } catch (err) {
      setError("Could not detect weather for your location.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => setError("Location access denied.")
    );
  };

  useEffect(() => {
    handleGeolocation();
  }, []);

  const addToRecent = (city) => {
    const updated = [city, ...recentSearches.filter(item => item !== city)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeather(searchQuery);
      setSearchQuery('');
    }
  };

  return (
    /* Background changed to a rich Indigo/Teal gradient */
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0d9488] p-4 md:p-8 font-sans text-white transition-all duration-700">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR: Translucent darker glass */}
        <div className="lg:col-span-4 bg-black/20 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/10 flex flex-col">
          <form onSubmit={handleSearchSubmit} className="relative mb-8">
            <input 
              type="text" 
              placeholder="Search city..." 
              className="w-full p-4 pl-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 shadow-inner focus:ring-2 focus:ring-teal-400 outline-none backdrop-blur-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute left-4 top-4 text-white/50 hover:text-teal-400 transition-colors">🔍</button>
          </form>

          {error && <div className="bg-red-500/20 text-red-200 border border-red-500/50 p-3 rounded-xl text-sm mb-4 text-center">{error}</div>}

          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-white/60 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                <span>🕒</span> Recent Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((city) => (
                  <button 
                    key={city}
                    onClick={() => fetchWeather(city)}
                    className="bg-white/5 px-4 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleGeolocation}
            className="mt-8 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-4 rounded-2xl transition-all shadow-lg font-bold group"
          >
            <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">📍</span>
            Use My Location
          </button>
        </div>

        {/* MAIN DASHBOARD */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loading ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
              <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin shadow-teal-500/50"></div>
              <p className="text-white/70 italic animate-pulse">Scanning the skies...</p>
            </div>
          ) : weather ? (
            <>
              {/* Hero Section: Bright Glass Card */}
              <div className="bg-white/10 backdrop-blur-3xl rounded-[3rem] p-10 shadow-2xl border border-white/20 flex flex-col items-center text-center">
                <h1 className="text-8xl font-extralight mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                    {Math.round(weather.main.temp)}°C
                </h1>
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`} 
                  alt="condition"
                  className="w-32 h-32 -my-4 drop-shadow-2xl"
                />
                <h2 className="text-4xl font-bold tracking-tight">{weather.name}</h2>
                <p className="text-teal-300 text-lg uppercase tracking-widest mt-2 font-medium">{weather.weather[0].description}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <WeatherDetailCard title="Humidity" value={`${weather.main.humidity}%`} icon="💧" />
                <WeatherDetailCard title="Wind Speed" value={`${weather.wind.speed} m/s`} icon="💨" />
                <WeatherDetailCard title="Feels Like" value={`${Math.round(weather.main.feels_like)}°C`} icon="🌡️" />
              </div>

              {/* 5-Day Forecast */}
              <div className="mt-4">
                <h3 className="text-xl font-bold mb-4 px-2 flex items-center gap-2">
                    <span className="text-teal-400">📅</span> 5-Day Forecast
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {forecast.map((day, index) => (
                    <div key={index} className="bg-white/10 backdrop-blur-md p-4 rounded-3xl flex flex-col items-center shadow-md border border-white/10 hover:bg-white/20 transition-colors">
                      <p className="text-xs font-semibold text-white/50 uppercase">
                        {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <img 
                        src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} 
                        alt="icon" 
                        className="w-12 h-12"
                      />
                      <p className="font-bold text-lg text-white">{Math.round(day.main.temp)}°C</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white/5 rounded-[3rem] border border-dashed border-white/20 backdrop-blur-sm">
               <div className="text-7xl mb-6 animate-bounce">🌤️</div>
               <h2 className="text-2xl font-bold">Search for a city</h2>
               <p className="text-white/50 italic mt-2">The world's weather at your fingertips.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;