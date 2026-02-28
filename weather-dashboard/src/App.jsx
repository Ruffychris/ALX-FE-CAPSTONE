import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getWeatherData } from "./services/weatherService";

/* Button */
const HapticButton = ({ children, onClick, className, type }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    whileHover={{ scale: 1.03 }}
    onClick={onClick}
    type={type || "button"}
    className={className}
  >
    {children}
  </motion.button>
);

/* Sun Progress */
const SunProgress = ({ sunrise, sunset }) => {
  const now = Math.floor(Date.now() / 1000);
  const total = sunset - sunrise;
  const progress = Math.max(0, Math.min(1, (now - sunrise) / total));

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-xl p-4 md:p-6 rounded-3xl border border-white/20 shadow-xl w-full"
    >
      <p className="text-[10px] uppercase tracking-widest text-white/60 mb-4 text-center">
        Sun Cycle
      </p>

      <div className="relative flex justify-center">
        <svg className="w-28 h-28 rotate-[-90deg]">
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="8"
          />

          <motion.circle
            cx="56"
            cy="56"
            r={radius}
            fill="transparent"
            stroke="#fbbf24"
            strokeWidth="8"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5 }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-sm">
          <span>☀️</span>
          <span className="font-bold">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      <div className="flex justify-between text-[11px] mt-4 text-white/60">
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

  /* Background */
  const getBgColor = () => {
    if (!weather) return "from-indigo-900 via-blue-700 to-teal-600";

    const c = weather.weather[0].main.toLowerCase();

    if (c.includes("cloud")) return "from-slate-700 to-gray-600";
    if (c.includes("rain")) return "from-slate-900 to-indigo-900";
    if (c.includes("clear")) return "from-orange-500 to-pink-600";

    return "from-indigo-900 via-blue-700 to-teal-600";
  };

  /* Fetch */
  const fetchWeather = async (city) => {
    if (!city) return;

    setLoading(true);

    try {
      const data = await getWeatherData(city);

      setWeather(data);

      const updated = [
        data.name,
        ...recentSearches.filter((c) => c !== data.name),
      ].slice(0, 5);

      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));

      setView("dashboard");
    } catch {
      alert("City not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${getBgColor()} text-white transition-all duration-700`}
    >
      {/* MAIN WRAPPER */}
      <div className="min-h-screen flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md md:max-w-xl lg:max-w-3xl">

          <AnimatePresence mode="wait">

            {/* ================= LANDING ================= */}
            {view === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center gap-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 6 }}
                  className="text-6xl md:text-8xl"
                >
                  🌤️
                </motion.div>

                <h1 className="text-3xl md:text-5xl font-black italic">
                  SkyCast
                </h1>

                <p className="text-white/60 uppercase tracking-widest text-xs">
                  Smart Weather Dashboard
                </p>

                <HapticButton
                  onClick={() => setView("search")}
                  className="w-full bg-white text-slate-900 p-4 md:p-5 rounded-2xl font-bold flex justify-between items-center shadow-xl"
                >
                  Start Exploring <span>🔍</span>
                </HapticButton>
              </motion.div>
            )}

            {/* ================= SEARCH ================= */}
            {view === "search" && (
              <motion.div
                key="search"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                className="space-y-6"
              >
                <HapticButton
                  onClick={() => setView("landing")}
                  className="text-2xl"
                >
                  ←
                </HapticButton>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchWeather(searchQuery);
                  }}
                  className="relative"
                >
                  <input
                    className="w-full p-4 pl-12 rounded-xl bg-white text-black text-base font-bold shadow-lg outline-none"
                    placeholder="Search city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <span className="absolute left-4 top-4 text-lg text-slate-400">
                    🔍
                  </span>
                </form>

                {loading && (
                  <p className="text-center text-sm">Loading...</p>
                )}

                {recentSearches.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase text-white/50 ml-1">
                      Recent
                    </p>

                    {recentSearches.map((city) => (
                      <HapticButton
                        key={city}
                        onClick={() => fetchWeather(city)}
                        className="w-full bg-white p-3 rounded-xl flex justify-between items-center text-slate-900 font-bold shadow"
                      >
                        {city} <span>→</span>
                      </HapticButton>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ================= DASHBOARD ================= */}
            {view === "dashboard" && weather && (
              <motion.div
                key="dashboard"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
              >
                {/* HEADER */}
                <div className="flex justify-between items-center">
                  <HapticButton
                    onClick={() => setView("search")}
                    className="bg-white/20 p-2 rounded-xl"
                  >
                    🔍
                  </HapticButton>

                  <h2 className="text-lg md:text-xl font-black uppercase">
                    {weather.name}
                  </h2>

                  <HapticButton
                    onClick={() => setView("landing")}
                    className="bg-white/20 p-2 rounded-xl"
                  >
                    🏠
                  </HapticButton>
                </div>

                {/* TEMP */}
                <div className="text-center space-y-2">
                  <h1 className="text-6xl md:text-7xl font-black">
                    {Math.round(weather.main.temp)}°
                  </h1>

                  <div className="inline-block bg-white/20 px-4 py-1 rounded-full text-xs uppercase">
                    {weather.weather[0].description}
                  </div>
                </div>

                {/* SUN */}
                <SunProgress
                  sunrise={weather.sys.sunrise}
                  sunset={weather.sys.sunset}
                />

                {/* STATS */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-xl text-center">
                    <p className="text-[10px] uppercase text-white/50">
                      Wind
                    </p>
                    <p className="text-lg font-black">
                      {weather.wind.speed} m/s
                    </p>
                  </div>

                  <div className="bg-white/10 p-4 rounded-xl text-center">
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