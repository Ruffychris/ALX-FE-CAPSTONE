import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getWeatherData, getForecastData } from "./services/weatherService";

// Reusable Animated Button
const HapticButton = ({ children, onClick, className }) => (
  <motion.button
    whileTap={{ scale: 0.92, filter: "brightness(0.9)" }}
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={className}
  >
    {children}
  </motion.button>
);

// Sun Progress Component
const SunProgress = ({ sunrise, sunset }) => {
  const now = Math.floor(Date.now() / 1000);
  const total = sunset - sunrise;
  const progress = Math.max(0, Math.min(1, (now - sunrise) / total));
  const percentage = Math.round(progress * 100);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 flex flex-col items-center shadow-2xl w-full"
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-4">
        Sun Orbit
      </p>

      <div className="relative flex items-center justify-center">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />

          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            stroke="#fbbf24"
            strokeWidth="8"
            strokeDasharray={circumference}
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
        <span>
          {new Date(sunrise * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        <span>
          {new Date(sunset * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
};

function App() {
  const [view, setView] = useState("landing");
  const [searchQuery, setSearchQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("recentSearches");
    return saved ? JSON.parse(saved) : [];
  });

  const getBgColor = () => {
    if (!weather) return "from-indigo-900 via-blue-700 to-teal-500";

    const condition = weather.weather[0].main.toLowerCase();

    if (condition.includes("cloud"))
      return "from-slate-700 via-gray-600 to-slate-500";

    if (condition.includes("rain"))
      return "from-black via-slate-900 to-indigo-900";

    if (condition.includes("clear"))
      return "from-orange-500 via-red-500 to-pink-600";

    return "from-indigo-900 via-blue-700 to-teal-500";
  };

  const fetchWeather = async (city) => {
    setLoading(true);

    try {
      const data = await getWeatherData(city);

      setWeather(data);

      const updated = [
        data.name,
        ...recentSearches.filter((item) => item !== data.name),
      ].slice(0, 5);

      setRecentSearches(updated);

      localStorage.setItem("recentSearches", JSON.stringify(updated));

      setView("dashboard");
    } catch {
      alert("City not found!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${getBgColor()} text-white transition-all duration-1000`}
    >
      {/* MAIN RESPONSIVE CONTAINER */}
      <div className="min-h-screen flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md md:max-w-xl lg:max-w-3xl">

          <AnimatePresence mode="wait">

            {/* LANDING */}
            {view === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="mt-20 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 8 }}
                    className="text-8xl md:text-9xl mb-6"
                  >
                    🌤️
                  </motion.div>

                  <h1 className="text-4xl md:text-6xl font-black italic">
                    SkyCast
                  </h1>

                  <p className="text-white/60 font-bold uppercase tracking-[0.3em] text-[10px]">
                    Premium Weather
                  </p>
                </div>

                <HapticButton
                  onClick={() => setView("search")}
                  className="w-full bg-white p-5 rounded-3xl text-lg font-bold flex justify-between items-center shadow-2xl text-slate-900 mt-10"
                >
                  Start Exploring <span>🔍</span>
                </HapticButton>
              </motion.div>
            )}

            {/* SEARCH */}
            {view === "search" && (
              <motion.div
                key="search"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
              >
                <HapticButton
                  onClick={() => setView("landing")}
                  className="text-3xl mb-6"
                >
                  ←
                </HapticButton>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchWeather(searchQuery);
                  }}
                  className="relative mb-8"
                >
                  <input
                    className="w-full p-5 pl-14 rounded-2xl bg-white text-black text-lg font-bold shadow-xl outline-none"
                    placeholder="Enter City Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <span className="absolute left-5 top-5 text-xl text-slate-400">
                    🔍
                  </span>
                </form>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-white/50 ml-2">
                    Recent
                  </p>

                  {recentSearches.map((city) => (
                    <HapticButton
                      key={city}
                      onClick={() => fetchWeather(city)}
                      className="w-full bg-white p-4 rounded-2xl flex justify-between items-center text-slate-900 font-black shadow-lg"
                    >
                      {city} <span>→</span>
                    </HapticButton>
                  ))}
                </div>
              </motion.div>
            )}

            {/* DASHBOARD */}
            {view === "dashboard" && weather && (
              <motion.div
                key="dashboard"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">
                  <HapticButton
                    onClick={() => setView("search")}
                    className="bg-white/20 p-3 rounded-2xl"
                  >
                    🔍
                  </HapticButton>

                  <h2 className="text-xl md:text-2xl font-black uppercase">
                    {weather.name}
                  </h2>

                  <HapticButton
                    onClick={() => setView("landing")}
                    className="bg-white/20 p-3 rounded-2xl"
                  >
                    🏠
                  </HapticButton>
                </div>

                {/* TEMP */}
                <div className="text-center mb-8">
                  <h1 className="text-7xl md:text-8xl font-black">
                    {Math.round(weather.main.temp)}°
                  </h1>

                  <div className="bg-white/20 px-5 py-2 rounded-full text-[10px] uppercase">
                    {weather.weather[0].description}
                  </div>
                </div>

                {/* SUN */}
                <SunProgress
                  sunrise={weather.sys.sunrise}
                  sunset={weather.sys.sunset}
                />

                {/* STATS */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/10 p-4 rounded-2xl text-center">
                    <p className="text-[10px] uppercase text-white/50">Wind</p>
                    <p className="text-lg font-black">
                      {weather.wind.speed} m/s
                    </p>
                  </div>

                  <div className="bg-white/10 p-4 rounded-2xl text-center">
                    <p className="text-[10px] uppercase text-white/50">
                      Humidity
                    </p>
                    <p className="text-lg font-black">
                      {weather.main.humidity}%
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;