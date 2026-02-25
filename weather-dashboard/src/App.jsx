import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeatherData, getForecastData } from './services/weatherService';

// Reusable Animated Button for "Haptic" feel
const HapticButton = ({ children, onClick, className, variant = "default" }) => (
  <motion.button
    whileTap={{ scale: 0.92, filter: "brightness(0.9)" }}
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={className}
  >
    {children}
  </motion.button>
);

const SunProgress = ({ sunrise, sunset }) => {
  const now = Math.floor(Date.now() / 1000);
  const total = sunset - sunrise;
  const progress = Math.max(0, Math.min(1, (now - sunrise) / total));
  const percentage = Math.round(progress * 100);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress * circumference);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 flex flex-col items-center shadow-2xl"
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-4">Sun Orbit</p>
      <div className="relative flex items-center justify-center">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <motion.circle 
            cx="64" cy="64" r={radius} fill="transparent" stroke="#fbbf24" strokeWidth="8" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }} 
            animate={{ strokeDashoffset: offset }} 
            transition={{ duration: 2, type: "spring" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl animate-pulse">☀️</span>
          <span className="text-xs font-bold text-white">{percentage}%</span>
        </div>
      </div>
      <div className="flex justify-between w-full mt-4 text-[10px] font-bold text-white/50 px-2">
        <span>{new Date(sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>{new Date(sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </motion.div>
  );
};

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
    } catch (err) { alert("City not found!"); }
    finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBgColor()} font-sans text-white transition-all duration-1000 overflow-hidden`}>
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="h-screen flex flex-col items-center justify-between p-10">
            <div className="mt-20 text-center">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 8 }} className="text-9xl mb-6">🌤️</motion.div>
              <h1 className="text-6xl font-black italic">SkyCast</h1>
              <p className="text-white/60 font-bold uppercase tracking-[0.3em] text-[10px]">Premium Weather</p>
            </div>
            <HapticButton 
              onClick={() => setView('search')} 
              className="w-full bg-white/95 p-6 rounded-[2.5rem] text-xl font-bold flex justify-between items-center shadow-2xl mb-10 text-slate-900"
            >
              Start Exploring <span className="text-slate-400">🔍</span>
            </HapticButton>
          </motion.div>
        )}

        {view === 'search' && (
          <motion.div key="search" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="h-screen p-6 bg-black/20 backdrop-blur-3xl">
            <HapticButton onClick={() => setView('landing')} className="text-4xl mb-8">←</HapticButton>
            <form onSubmit={(e) => { e.preventDefault(); fetchWeather(searchQuery); }} className="relative mb-10">
              <input autoFocus className="w-full p-6 pl-16 rounded-[2rem] bg-white text-black text-xl font-bold shadow-2xl placeholder:text-slate-400 outline-none" placeholder="Enter City Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ color: '#0f172a' }} />
              <span className="absolute left-6 top-6 text-2xl text-slate-400">🔍</span>
            </form>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-2">Recent</p>
              {recentSearches.map((city, i) => (
                <motion.div key={city} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <HapticButton onClick={() => fetchWeather(city)} className="w-full bg-white p-6 rounded-[2rem] flex justify-between items-center text-slate-900 font-black italic uppercase shadow-lg">
                    {city} <span className="text-slate-300">→</span>
                  </HapticButton>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'dashboard' && weather && (
          <motion.div key="dashboard" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-6 h-screen overflow-y-auto no-scrollbar pb-20">
            <div className="flex justify-between items-center mt-4 mb-8">
              <HapticButton onClick={() => setView('search')} className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/20">🔍</HapticButton>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">{weather.name}</h2>
              <HapticButton onClick={() => setView('landing')} className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/20">🏠</HapticButton>
            </div>
            <div className="flex flex-col items-center mb-8">
              <motion.h1 initial={{ y: 20 }} animate={{ y: 0 }} className="text-[10rem] leading-none font-black tracking-tighter drop-shadow-2xl">{Math.round(weather.main.temp)}°</motion.h1>
              <div className="bg-white/20 px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest border border-white/10">{weather.weather[0].description}</div>
            </div>
            <SunProgress sunrise={weather.sys.sunrise} sunset={weather.sys.sunset} />
            <div className="grid grid-cols-2 gap-4 mt-6 mb-10">
              {/* Simplified cards for brevity in this snippet */}
              <div className="bg-white/10 p-4 rounded-3xl border border-white/10 text-center">
                <p className="text-[10px] font-bold text-white/50 uppercase">Wind</p>
                <p className="text-lg font-black">{weather.wind.speed} m/s</p>
              </div>
              <div className="bg-white/10 p-4 rounded-3xl border border-white/10 text-center">
                <p className="text-[10px] font-bold text-white/50 uppercase">Humidity</p>
                <p className="text-lg font-black">{weather.main.humidity}%</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;