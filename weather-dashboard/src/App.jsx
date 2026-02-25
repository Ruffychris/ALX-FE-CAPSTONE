import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeatherData, getForecastData } from './services/weatherService';

// Sun Progress Component
const SunProgress = ({ sunrise, sunset }) => {
  const now = Math.floor(Date.now() / 1000);
  const total = sunset - sunrise;
  const progress = Math.max(0, Math.min(1, (now - sunrise) / total));
  const percentage = Math.round(progress * 100);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress * circumference);

  return (
    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 flex flex-col items-center shadow-2xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-4">Sun Orbit</p>
      <div className="relative flex items-center justify-center">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <motion.circle 
            cx="64" cy="64" r={radius} fill="transparent" stroke="#fbbf24" strokeWidth="8" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl">☀️</span>
          <span className="text-xs font-bold text-white">{percentage}%</span>
        </div>
      </div>
      <div className="flex justify-between w-full mt-4 text-[10px] font-bold text-white/50 px-2">
        <span>{new Date(sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>{new Date(sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};

const WeatherDetailCard = ({ title, value, icon }) => (
  <div className="bg-white/10 backdrop-blur-2xl p-4 rounded-3xl shadow-xl flex flex-col items-center justify-center border border-white/20 transition-all active:scale-95">
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
    if (!weather) return 'from-indigo-900 via-blue-700 to-teal-500';
    const condition = weather.weather[0].main.toLowerCase();
    if (condition.includes('cloud')) return 'from-slate-700 via-gray-600 to-slate-500';
    if (condition.includes('rain')) return 'from-black via-slate-900 to-indigo-900';
    if (condition.includes('clear')) return 'from-orange-500 via-red-500 to-pink-600';
    return 'from-indigo-900 via-blue-700 to-teal-500';
  };

  const fetchWeather = async (city) => {
    setLoading(true);
    try {
      const data = await getWeatherData(city);
      const forecastData = await getForecastData(city);
      setWeather(data);
      setForecast(forecastData);
      const updated = [data.name, ...recentSearches.filter(item => item !== data.name)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      setView('dashboard');
    } catch (err) {
      alert("City not found!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBgColor()} font-sans text-white transition-all duration-1000 overflow-x-hidden`}>
      <AnimatePresence mode="wait">
        
        {view === 'landing' && (
          <motion.div key="landing" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="h-screen flex flex-col items-center justify-between p-10">
            <div className="mt-20 text-center">
              <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="text-9xl mb-6">🌤️</motion.div>
              <h1 className="text-6xl font-black tracking-tighter italic drop-shadow-2xl">SkyCast</h1>
              <p className="text-white/70 font-medium">Adventure Awaits.</p>
            </div>
            
            {/* FIXED: Dark Text on Landing Search Trigger */}
            <button 
              onClick={() => setView('search')} 
              className="w-full bg-white/95 backdrop-blur-md border border-white/30 p-6 rounded-[2.5rem] text-xl font-bold flex justify-between items-center shadow-2xl mb-10 text-slate-900"
            >
              Explore city... <span className="text-slate-400">🔍</span>
            </button>
          </motion.div>
        )}

        {view === 'search' && (
          <motion.div key="search" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="h-screen p-6 bg-black/10 backdrop-blur-3xl">
            <button onClick={() => setView('landing')} className="text-4xl mb-8 text-white">←</button>
            
            <form onSubmit={(e) => { e.preventDefault(); fetchWeather(searchQuery); }} className="relative mb-10">
              {/* FIXED: Explicitly forced black text and dark placeholder */}
              <input 
                autoFocus 
                className="w-full p-6 pl-16 rounded-[2rem] bg-white border-none text-black text-xl font-bold shadow-2xl placeholder:text-slate-500" 
                placeholder="Search City..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                style={{ color: '#0f172a' }} 
              />
              <span className="absolute left-6 top-6 text-2xl text-slate-400">🔍</span>
            </form>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 ml-2">History</p>
              {recentSearches.map(city => (
                <button 
                  key={city} 
                  onClick={() => fetchWeather(city)} 
                  /* FIXED: Background white, Text Slate-900 (Nearly Black) */
                  className="w-full bg-white p-6 rounded-[2.5rem] flex justify-between items-center border border-white/10 italic font-black uppercase text-slate-900 shadow-lg hover:bg-slate-50 transition-colors"
                >
                  {city} <span className="text-slate-400">→</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'dashboard' && weather && (
          <motion.div key="dashboard" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="p-6">
            <div className="flex justify-between items-center mt-4 mb-8">
              <button onClick={() => setView('search')} className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">🔍</button>
              <h2 className="text-2xl font-black italic tracking-tight uppercase text-white drop-shadow-md">{weather.name}</h2>
              <button onClick={() => setView('landing')} className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">🏠</button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <h1 className="text-[10rem] leading-none font-black tracking-tighter drop-shadow-2xl">{Math.round(weather.main.temp)}°</h1>
              <div className="bg-white/20 px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest border border-white/20">{weather.weather[0].description}</div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
               <SunProgress sunrise={weather.sys.sunrise} sunset={weather.sys.sunset} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <WeatherDetailCard title="Humidity" value={`${weather.main.humidity}%`} icon="💧" />
              <WeatherDetailCard title="Wind" value={`${weather.wind.speed}m/s`} icon="💨" />
              <WeatherDetailCard title="Feels Like" value={`${Math.round(weather.main.feels_like)}°`} icon="🌡️" />
              <WeatherDetailCard title="Pressure" value={`${weather.main.pressure}hPa`} icon="⏲️" />
            </div>

            <div className="flex overflow-x-auto gap-4 pb-10 no-scrollbar">
              {forecast.map((day, i) => (
                <div key={i} className="min-w-[120px] bg-white/10 p-6 rounded-[2.5rem] flex flex-col items-center border border-white/10 shadow-xl">
                  <p className="text-[10px] font-black uppercase text-white/50 mb-2">{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} className="w-12 h-12" alt="icon" />
                  <p className="text-2xl font-black">{Math.round(day.main.temp)}°</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {loading && <div className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-50"><div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" /></div>}
    </div>
  );
}

export default App;