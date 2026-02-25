import React, { useState, useEffect } from 'react';
import { getWeatherData, getForecastData } from './services/weatherService';

// Reusable Detail Card for Mobile Grid
const WeatherDetailCard = ({ title, value, icon }) => (
  <div className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-3xl shadow-lg flex flex-col items-center justify-center border border-white/10 transition-transform active:scale-95">
    <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1 font-bold">{title}</p>
    <div className="text-xl mb-1">{icon}</div>
    <p className="font-bold text-base text-white">{value}</p>
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
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-between p-10 text-white font-sans">
        <div className="mt-20 text-center animate-in fade-in zoom-in duration-1000">
          <div className="text-9xl mb-6 drop-shadow-[0_0_35px_rgba(20,184,166,0.3)]">🌤️</div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic">
            WeatherDash
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">Precision forecasting</p>
        </div>
        
        <div className="w-full space-y-4 mb-10">
          <button 
            onClick={() => setView('search')}
            className="w-full bg-slate-900 border border-slate-700 p-6 rounded-3xl text-xl font-medium text-left flex justify-between items-center transition-all active:bg-slate-800"
          >
            <span className="text-slate-400">Search city...</span> 
            <span className="text-teal-400 text-2xl">🔍</span>
          </button>
          
          <button 
            onClick={handleGeolocation}
            className="w-full bg-teal-500 hover:bg-teal-400 p-6 rounded-3xl text-xl font-black text-slate-950 flex items-center justify-center gap-3 shadow-[0_10px_30px_-10px_rgba(20,184,166,0.5)] active:scale-95 transition-all"
          >
            📍 USE MY LOCATION
          </button>
        </div>
      </div>
    );
  }

  // 2. SEARCH VIEW
  if (view === 'search') {
    return (
      <div className="min-h-screen bg-[#020617] p-6 text-white font-sans animate-in slide-in-from-bottom-10 duration-500">
        <div className="flex items-center gap-4 mb-10">
            <button onClick={() => setView('landing')} className="text-3xl text-teal-400 p-2 font-bold hover:bg-white/5 rounded-full transition-colors">←</button>
            <h2 className="text-2xl font-black italic uppercase tracking-widest text-white">Find City</h2>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative mb-10">
          <input 
            autoFocus
            type="text" 
            placeholder="Search e.g. London..." 
            className="w-full p-6 pl-16 rounded-[2rem] bg-slate-900 border border-slate-700 outline-none focus:ring-4 focus:ring-teal-500/20 text-white placeholder-slate-600 text-xl font-semibold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-6 top-6 text-2xl text-teal-400">🔍</span>
        </form>

        <h3 className="text-slate-500 uppercase tracking-widest text-xs font-black mb-6 ml-2">History</h3>
        <div className="space-y-4">
          {recentSearches.length > 0 ? (
            recentSearches.map((city) => (
                <button 
                  key={city}
                  onClick={() => fetchWeather(city)}
                  className="w-full bg-slate-900/50 p-6 rounded-3xl text-left flex justify-between items-center border border-slate-800 hover:border-teal-500/50 transition-all group"
                >
                  <span className="font-bold text-lg group-hover:text-teal-400">{city}</span>
                  <span className="text-teal-500">→</span>
                </button>
              ))
          ) : (
            <div className="text-center p-16 text-slate-700 italic border-2 border-dashed border-slate-900 rounded-[3rem]">No recent searches</div>
          )}
        </div>
      </div>
    );
  }

  // 3. DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#020617] p-6 text-white font-sans">
      {loading ? (
        <div className="h-screen flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-teal-400 font-black tracking-widest uppercase animate-pulse">Scanning Skies</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="flex justify-between items-center mb-8 mt-4">
            <button onClick={() => setView('search')} className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-xl active:scale-75 transition-all text-xl">🔍</button>
            <div className="text-center">
                <h2 className="text-2xl font-black italic tracking-tight text-white">{weather?.name}</h2>
                <div className="h-1 w-full bg-teal-500 mt-1 rounded-full"></div>
            </div>
            <button onClick={handleGeolocation} className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-xl active:scale-75 transition-all text-xl">📍</button>
          </div>

          <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-[10rem] leading-none font-black tracking-tighter mb-4 text-white drop-shadow-[0_10px_50px_rgba(255,255,255,0.1)]">
                {Math.round(weather?.main.temp)}°
            </h1>
            <p className="text-teal-400 uppercase tracking-[0.4em] font-black text-sm px-4 py-1 bg-teal-500/10 rounded-full inline-block">
              {weather?.weather[0].description}
            </p>
            <img 
              src={`https://openweathermap.org/img/wn/${weather?.weather[0].icon}@4x.png`} 
              alt="weather"
              className="w-56 h-56 -mt-8"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <WeatherDetailCard title="Humidity" value={`${weather?.main.humidity}%`} icon="💧" />
            <WeatherDetailCard title="Wind" value={`${weather?.wind.speed} m/s`} icon="💨" />
            <WeatherDetailCard title="Feels Like" value={`${Math.round(weather?.main.feels_like)}°`} icon="🌡️" />
            <WeatherDetailCard title="Pressure" value={`${weather?.main.pressure} hPa`} icon="⏲️" />
          </div>

          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="font-black text-xl italic uppercase tracking-wider">Next 5 Days</h3>
            <span className="text-[10px] text-teal-500 font-bold bg-teal-500/10 px-3 py-1 rounded-full">SWIPE →</span>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-12 no-scrollbar scroll-smooth">
            {forecast.map((day, index) => (
              <div key={index} className="min-w-[120px] bg-slate-900/80 backdrop-blur-md p-6 rounded-[3rem] flex flex-col items-center border border-slate-800 shadow-2xl">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-3">
                  {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} alt="icon" className="w-12 h-12 mb-2" />
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