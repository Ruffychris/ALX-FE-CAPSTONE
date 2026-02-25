import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeatherData, getForecastData } from './services/services/weatherService';

const WeatherDetailCard = ({ title, value, icon }) => (
  <div className="bg-white/10 backdrop-blur-2xl p-4 rounded-3xl shadow-xl flex flex-col items-center justify-center border border-white/20 transition-all active:scale-95 hover:bg-white/20">
    <p className="text-white/60 text-[10px] uppercase tracking-tighter mb-1 font-bold">{title}</p>
    <div className="text-2xl mb-1">{icon}</div>
    <p className="font-bold text-base text-white">{value}</p>
  </div>
);

function App() {
  const [view, setView] = useState('landing'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const getBgColor = () => {
    if (!weather) return 'from-[#1e3a8a] via-[#3b82f6] to-[#2dd4bf]';
    const condition = weather.weather[0].main.toLowerCase();
    if (condition.includes('cloud')) return 'from-[#334155] via-[#475569] to-[#94a3b8]';
    if (condition.includes('rain')) return 'from-[#0f172a] via-[#1e293b] to-[#334155]';
    if (condition.includes('clear')) return 'from-[#f59e0b] via-[#ef4444] to-[#db2777]';
    return 'from-[#1e3a8a] via-[#3b82f6] to-[#2dd4bf]';
  };

  const fetchWeather = async (city) => {
    setLoading(true);
    try {
      const data = await getWeatherData(city);
      const forecastData = await getForecastData(city);
      setWeather(data);
      setForecast(forecastData);
      addToRecent(data.name);
      setView('dashboard');
    } catch (err) {
      alert("City not found!");
    } finally {
      setLoading(false);
    }
  };

  const addToRecent = (city) => {
    const updated = [city, ...recentSearches.filter(item => item !== city)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Screen Transition Variants
  const slideVariants = {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBgColor()} font-sans overflow-hidden text-white transition-colors duration-1000`}>
      <AnimatePresence mode="wait">
        
        {/* 1. LANDING VIEW */}
        {view === 'landing' && (
          <motion.div 
            key="landing"
            variants={slideVariants}
            initial="initial" animate="animate" exit="exit"
            className="h-screen flex flex-col items-center justify-between p-10"
          >
            <div className="mt-20 text-center">
              <motion.div 
                animate={{ y: [0, -20, 0] }} 
                transition={{ repeat: Infinity, duration: 4 }}
                className="text-9xl mb-6 drop-shadow-2xl"
              >
                🌤️
              </motion.div>
              <h1 className="text-6xl font-black tracking-tighter italic">SkyCast</h1>
              <p className="text-white/70 font-medium">Adventure awaits outside.</p>
            </div>

            <div className="w-full space-y-4 mb-10">
              <button 
                onClick={() => setView('search')}
                className="w-full bg-white/10 backdrop-blur-md border border-white/30 p-6 rounded-[2.5rem] text-xl font-bold flex justify-between items-center shadow-2xl"
              >
                Explore a city... <span className="text-white/50">🔍</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* 2. SEARCH VIEW */}
        {view === 'search' && (
          <motion.div 
            key="search"
            variants={slideVariants}
            initial="initial" animate="animate" exit="exit"
            className="h-screen p-6 bg-black/20 backdrop-blur-3xl"
          >
            <div className="flex items-center gap-4 mb-10">
              <button onClick={() => setView('landing')} className="text-4xl">←</button>
              <h2 className="text-2xl font-black italic">Search</h2>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); fetchWeather(searchQuery); }} className="relative mb-10">
              <input 
                autoFocus
                className="w-full p-6 pl-16 rounded-[2rem] bg-white/95 text-slate-900 text-xl font-bold outline-none shadow-2xl"
                placeholder="Where to?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-6 top-6 text-2xl text-slate-400">🔍</span>
            </form>

            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-white/50 ml-2">Recent Travels</p>
              {recentSearches.map(city => (
                <button 
                  key={city}
                  onClick={() => fetchWeather(city)}
                  className="w-full bg-white/10 p-6 rounded-[2rem] flex justify-between items-center border border-white/10 hover:bg-white/20 transition-all"
                >
                  <span className="text-xl font-bold italic uppercase">{city}</span>
                  <span className="text-white/50">→</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 3. DASHBOARD VIEW */}
        {view === 'dashboard' && weather && (
          <motion.div 
            key="dashboard"
            variants={slideVariants}
            initial="initial" animate="animate" exit="exit"
            className="min-h-screen p-6 overflow-y-auto no-scrollbar"
          >
            <div className="flex justify-between items-center mt-4 mb-8">
              <button onClick={() => setView('search')} className="bg-white/20 p-4 rounded-3xl border border-white/20">🔍</button>
              <h2 className="text-2xl font-black italic">{weather.name}</h2>
              <button onClick={() => setView('landing')} className="bg-white/20 p-4 rounded-3xl border border-white/20">🏠</button>
            </div>

            {/* SLEEK UPGRADE: The Main Hero Section */}
            <div className="flex flex-col items-center mb-10 relative">
              <motion.h1 
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-[11rem] leading-none font-black tracking-tighter drop-shadow-2xl"
              >
                {Math.round(weather.main.temp)}°
              </motion.h1>
              <div className="bg-black/20 backdrop-blur-md px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-[0.4em] border border-white/10">
                {weather.weather[0].description}
              </div>
            </div>

            {/* ADVENTUROUS ADDITION: AI Insight Card */}
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 mb-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">✨</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Quick Insight</p>
              </div>
              <p className="text-lg font-bold leading-tight italic">
                {weather.main.temp > 25 ? "It's heatwave season. Stay hydrated!" : "A bit chilly. Perfect for a cozy jacket."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <WeatherDetailCard title="Humidity" value={`${weather.main.humidity}%`} icon="💧" />
              <WeatherDetailCard title="Wind Speed" value={`${weather.wind.speed} m/s`} icon="💨" />
              <WeatherDetailCard title="Feels Like" value={`${Math.round(weather.main.feels_like)}°`} icon="🌡️" />
              <WeatherDetailCard title="Pressure" value={`${weather.main.pressure} hPa`} icon="⏲️" />
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black italic">Next 5 Days</h3>
              <div className="h-px flex-1 bg-white/20 mx-4"></div>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-10 no-scrollbar">
              {forecast.map((day, i) => (
                <div key={i} className="min-w-[130px] bg-white/10 p-6 rounded-[2.5rem] flex flex-col items-center border border-white/10 shadow-xl">
                  <p className="text-[10px] font-black uppercase text-white/50 mb-2">
                    {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} alt="icon" className="w-12 h-12" />
                  <p className="text-2xl font-black">{Math.round(day.main.temp)}°</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <motion.div 
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
          />
        </div>
      )}
    </div>
  );
}

export default App;