import React, { useState, useEffect } from 'react';
import { getWeatherData, getForecastData } from './services/weatherService';

// Reusable Detail Card with readable contrast
const WeatherDetailCard = ({ title, value, icon }) => (
  <div className="bg-white/20 backdrop-blur-2xl p-4 rounded-3xl shadow-xl flex flex-col items-center justify-center border border-white/30 transition-transform active:scale-95">
    <p className="text-white/70 text-[10px] uppercase tracking-widest mb-1 font-bold">{title}</p>
    <div className="text-xl mb-1 drop-shadow-md">{icon}</div>
    <p className="font-bold text-base text-white drop-shadow-sm">{value}</p>
  </div>
);

function App() {
  const [view, setView] = useState('landing'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const getBgColor = () => {
    if (!weather) return 'from-indigo-600 via-blue-700 to-teal-500';
    const condition = weather.weather[0].main.toLowerCase();
    if (condition.includes('cloud')) return 'from-slate-500 via-gray-600 to-slate-700';
    if (condition.includes('rain')) return 'from-blue-800 via-indigo-900 to-slate-900';
    if (condition.includes('clear')) return 'from-orange-400 via-red-500 to-pink-500';
    return 'from-indigo-600 via-blue-700 to-teal-500';
  };

  const fetchWeather = async (city) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeatherData(city);
      const forecastData = await getForecastData(city);
      setWeather(data);
      setForecast(forecastData);
      addToRecent(data.name);
      setView('dashboard');
    } catch (err) {
      setError("City not found.");
      setTimeout(() => setError(null), 3000);
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
      <div className={`min-h-screen bg-gradient-to-br ${getBgColor()} flex flex-col items-center justify-between p-10 text-white font-sans transition-all duration-1000`}>
        <div className="mt-20 text-center animate-in fade-in zoom-in duration-700">
          <div className="text-9xl mb-6 drop-shadow-2xl">🌤️</div>
          <h1 className="text-5xl font-black tracking-tighter drop-shadow-lg italic">WeatherDash</h1>
          <p className="text-white/80 mt-2 text-lg font-medium">Clear Skies, Clean Code.</p>
        </div>
        
        <div className="w-full space-y-4 mb-10">
          <button 
            onClick={() => setView('search')}
            className="w-full bg-white/90 border border-white/30 backdrop-blur-md p-6 rounded-[2rem] text-xl font-medium text-left flex justify-between items-center shadow-2xl transition-all active:scale-95"
          >
            {/* Darker text for landing search trigger */}
            <span className="text-slate-600">Search city...</span> 
            <span className="text-slate-400">🔍</span>
          </button>
          
          <button 
            onClick={handleGeolocation}
            className="w-full bg-white text-indigo-600 p-6 rounded-[2rem] text-xl font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
          >
            📍 USE MY LOCATION
          </button>
        </div>
      </div>
    );
  }

  // 2. SEARCH VIEW - Fixed Contrast
  if (view === 'search') {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${getBgColor()} p-6 font-sans animate-in slide-in-from-bottom-10 duration-500`}>
        <div className="flex items-center gap-4 mb-10 text-white">
            <button onClick={() => setView('landing')} className="text-3xl p-2 font-bold hover:bg-white/10 rounded-full transition-colors">←</button>
            <h2 className="text-2xl font-black tracking-tight italic">Find City</h2>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative mb-10">
          <input 
            autoFocus
            type="text" 
            placeholder="Search e.g. London..." 
            {/* Changed bg to 90% white and text to Slate-800 for visibility */}
            className="w-full p-6 pl-16 rounded-[2rem] bg-white/90 border border-white/30 outline-none focus:ring-4 focus:ring-white/50 text-slate-800 placeholder-slate-400 text-xl font-semibold backdrop-blur-xl shadow-2xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-6 top-6 text-2xl text-slate-400">🔍</span>
        </form>

        <h3 className="text-white/80 uppercase tracking-widest text-xs font-black mb-6 ml-2">History</h3>
        <div className="space-y-4">
          {recentSearches.length > 0 ? (
            recentSearches.map((city) => (
                <button 
                  key={city}
                  onClick={() => fetchWeather(city)}
                  {/* High contrast history buttons */}
                  className="w-full bg-white/90 backdrop-blur-md p-6 rounded-3xl text-left flex justify-between items-center border border-white/10 hover:bg-white transition-all group shadow-lg"
                >
                  <span className="font-bold text-lg text-slate-800 group-hover:translate-x-2 transition-transform italic uppercase">{city}</span>
                  <span className="text-slate-400 group-hover:text-indigo-600 font-bold">→</span>
                </button>
              ))
          ) : (
            <div className="text-center p-16 text-white/60 italic border-2 border-dashed border-white/20 rounded-[3rem]">No recent searches</div>
          )}
        </div>
      </div>
    );
  }

  // 3. DASHBOARD VIEW
  return (
    <div className={`min-h-screen bg-gradient-to-b ${getBgColor()} p-6 text-white font-sans transition-all duration-1000`}>
      {loading ? (
        <div className="h-screen flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <p className="text-white font-black tracking-widest uppercase animate-pulse">Syncing...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="flex justify-between items-center mb-8 mt-4">
            <button onClick={() => setView('search')} className="bg-white/20 p-4 rounded-3xl border border-white/20 backdrop-blur-md shadow-xl active:scale-75 transition-all text-xl">🔍</button>
            <div className="text-center">
                <h2 className="text-2xl font-black tracking-tight drop-shadow-lg italic">{weather?.name}</h2>
                <div className="h-1 w-full bg-white/50 rounded-full"></div>
            </div>
            <button onClick={handleGeolocation} className="bg-white/20 p-4 rounded-3xl border border-white/20 backdrop-blur-md shadow-xl active:scale-75 transition-all text-xl">📍</button>
          </div>

          <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-[10rem] leading-none font-black tracking-tighter mb-4 drop-shadow-2xl">
                {Math.round(weather?.main.temp)}°
            </h1>
            <p className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full uppercase tracking-[0.3em] font-black text-xs border border-white/20 mb-4">
              {weather?.weather[0].description}
            </p>
            <img 
              src={`https://openweathermap.org/img/wn/${weather?.weather[0].icon}@4x.png`} 
              alt="weather"
              className="w-56 h-56 -mt-8 drop-shadow-2xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <WeatherDetailCard title="Humidity" value={`${weather?.main.humidity}%`} icon="💧" />
            <WeatherDetailCard title="Wind" value={`${weather?.wind.speed} m/s`} icon="💨" />
            <WeatherDetailCard title="Feels Like" value={`${Math.round(weather?.main.feels_like)}°`} icon="🌡️" />
            <WeatherDetailCard title="Pressure" value={`${weather?.main.pressure} hPa`} icon="⏲️" />
          </div>

          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="font-black text-xl tracking-tight italic uppercase">Weekly Forecast</h3>
            <span className="text-[10px] bg-black/20 px-3 py-1 rounded-full font-bold uppercase">Swipe →</span>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-12 no-scrollbar scroll-smooth">
            {forecast.map((day, index) => (
              <div key={index} className="min-w-[120px] bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] flex flex-col items-center border border-white/20 shadow-xl">
                <p className="text-[10px] text-white/60 font-black uppercase mb-3">
                  {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} alt="icon" className="w-12 h-12 mb-2 drop-shadow-md" />
                <p className="font-black text-2xl text-white">{Math.round(day.main.temp)}°</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;