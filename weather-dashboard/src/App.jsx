import React, { useState, useEffect } from 'react';
import { getWeatherData, getForecastData } from './services/weatherService';

// Reusable Detail Card for Mobile Grid
const WeatherDetailCard = ({ title, value, icon }) => (
  <div className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl shadow-lg flex flex-col items-center justify-center border border-white/20 transition-transform active:scale-95">
    <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1 font-medium">{title}</p>
    <div className="text-xl mb-1">{icon}</div>
    <p className="font-bold text-base text-white">{value}</p>
  </div>
);

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'search', 'dashboard'
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State for Recent Searches using Local Storage
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
      setView('dashboard'); // Switch to dashboard view on success
    } catch (err) {
      setError("City not found.");
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
      const data = await res.json();
      const fData = await fRes.json();
      setWeather(data);
      setForecast(fData.list.filter(r => r.dt_txt.includes("12:00:00")));
      setView('dashboard');
    } catch (err) {
      setError("Location error.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => setError("Permission denied.")
    );
  };

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

  // 1. LANDING VIEW
  if (view === 'landing' && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0d9488] flex flex-col items-center justify-between p-10 text-white">
        <div className="mt-20 text-center animate-in fade-in zoom-in duration-700">
          <div className="text-8xl mb-6 drop-shadow-2xl">🌤️</div>
          <h1 className="text-5xl font-bold tracking-tight">WeatherDash</h1>
          <p className="text-white/60 mt-2 text-lg">Check the weather anywhere</p>
        </div>
        
        <div className="w-full space-y-4 mb-10">
          <button 
            onClick={() => setView('search')}
            className="w-full bg-white/10 border border-white/20 p-5 rounded-3xl text-xl font-light text-left flex justify-between items-center backdrop-blur-md hover:bg-white/20 transition-all"
          >
            <span className="text-white/70">Search for a city...</span> 
            <span className="text-teal-400">🔍</span>
          </button>
          
          <button 
            onClick={handleGeolocation}
            className="w-full bg-teal-500 p-5 rounded-3xl text-xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform"
          >
            📍 Use My Location
          </button>
        </div>
      </div>
    );
  }

  // 2. SEARCH VIEW
  if (view === 'search') {
    return (
      <div className="min-h-screen bg-[#0f172a] p-6 text-white animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('landing')} className="text-3xl text-teal-400 p-2">←</button>
            <h2 className="text-xl font-bold">Search</h2>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative mb-10">
          <input 
            autoFocus
            type="text" 
            placeholder="Enter city name..." 
            className="w-full p-5 pl-14 rounded-3xl bg-white/10 border border-white/20 outline-none focus:ring-2 focus:ring-teal-400 text-white placeholder-white/40 shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-5 top-5 text-xl text-white/40">🔍</span>
        </form>

        <h3 className="text-white/40 uppercase tracking-widest text-[10px] font-bold mb-4 ml-2">Recent Searches</h3>
        <div className="space-y-3">
          {recentSearches.length > 0 ? (
            recentSearches.map((city) => (
                <button 
                  key={city}
                  onClick={() => fetchWeather(city)}
                  className="w-full bg-white/5 p-5 rounded-2xl text-left flex justify-between items-center border border-white/5 active:bg-white/10 transition-colors"
                >
                  <span className="font-medium">{city}</span>
                  <span className="text-teal-400/50">→</span>
                </button>
              ))
          ) : (
            <div className="text-center p-10 text-white/20 italic">No recent searches</div>
          )}
        </div>
      </div>
    );
  }

  // 3. DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a8a] to-[#0f172a] p-6 text-white">
      {loading ? (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin shadow-lg shadow-teal-500/20"></div>
          <p className="animate-pulse text-teal-400 font-medium">Fetching Data...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-8 mt-4">
            <button onClick={() => setView('search')} className="bg-white/10 p-3 rounded-2xl border border-white/10 active:scale-90 transition-all">🔍</button>
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">{weather?.name}</h2>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Current Weather</p>
            </div>
            <button onClick={handleGeolocation} className="bg-white/10 p-3 rounded-2xl border border-white/10 active:scale-90 transition-all">📍</button>
          </div>

          <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-[10rem] leading-none font-extralight tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                {Math.round(weather?.main.temp)}°
            </h1>
            <p className="text-teal-400 uppercase tracking-[0.3em] font-bold text-sm mb-2">{weather?.weather[0].description}</p>
            <img 
              src={`https://openweathermap.org/img/wn/${weather?.weather[0].icon}@4x.png`} 
              alt="weather"
              className="w-48 h-48 -mt-6 drop-shadow-2xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <WeatherDetailCard title="Humidity" value={`${weather?.main.humidity}%`} icon="💧" />
            <WeatherDetailCard title="Wind" value={`${weather?.wind.speed} m/s`} icon="💨" />
            <WeatherDetailCard title="Feels Like" value={`${Math.round(weather?.main.feels_like)}°`} icon="🌡️" />
            <WeatherDetailCard title="Pressure" value={`${weather?.main.pressure} hPa`} icon="⏲️" />
          </div>

          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-bold text-lg">Next 5 Days</h3>
            <span className="text-[10px] text-white/