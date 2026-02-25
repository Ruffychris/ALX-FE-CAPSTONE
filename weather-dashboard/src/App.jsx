import React, { useState, useEffect } from 'react';
import { getWeatherData } from './services/weatherService';

const WeatherDetailCard = ({ title, value, icon }) => (
  <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center border border-white/20">
    <p className="text-gray-500 text-sm mb-2">{title}</p>
    <div className="text-2xl mb-1">{icon}</div>
    <p className="font-bold text-lg">{value}</p>
  </div>
);

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState(null);
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
      setWeather(data);
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
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWeather(data);
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

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeather(searchQuery);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-[#e3edf7] p-4 md:p-8 font-sans text-slate-800 transition-all">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR */}
        <div className="lg:col-span-4 bg-white/40 backdrop-blur-lg rounded-[2rem] p-6 shadow-xl border border-white/50 flex flex-col">
          <form onSubmit={handleSearchSubmit} className="relative mb-8">
            <input 
              type="text" 
              placeholder="Search city..." 
              className="w-full p-4 pl-12 rounded-2xl bg-white/80 border-none shadow-inner focus:ring-2 focus:ring-blue-300 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute left-4 top-4 text-gray-400 hover:text-blue-500">🔍</button>
          </form>

          {error && <div className="bg-red-100 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">{error}</div>}

          <div className="flex-1 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-500 font-semibold flex items-center gap-2">
                  <span>🕒</span> Recent Searches
                </h3>
                {recentSearches.length > 0 && (
                  <button onClick={clearHistory} className="text-xs text-red-400 hover:underline">Clear</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.length > 0 ? (
                  recentSearches.map((city) => (
                    <button 
                      key={city}
                      onClick={() => fetchWeather(city)}
                      className="bg-white/60 px-4 py-2 rounded-xl text-sm hover:bg-white hover:shadow-md transition-all active:scale-95"
                    >
                      {city}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No recent searches yet.</p>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={handleGeolocation}
            className="mt-8 flex items-center justify-center gap-2 bg-green-500/80 hover:bg-green-600 text-white px-6 py-4 rounded-2xl transition-all shadow-lg font-bold"
          >
            <span className="bg-white text-green-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px]">📍</span>
            Use My Location
          </button>
        </div>

        {/* MAIN DASHBOARD */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loading ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 italic">Loading weather data...</p>
            </div>
          ) : weather ? (
            <>
              <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] p-10 shadow-2xl border border-white/60 flex flex-col items-center text-center">
                <h1 className="text-8xl font-light mb-2 tracking-tighter">{Math.round(weather.main.temp)}°C</h1>
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`} 
                  alt="condition"
                  className="w-32 h-32 -my-4"
                />
                <h2 className="text-4xl font-bold">{weather.name}</h2>
                <p className="text-gray-500 text-lg uppercase tracking-widest mt-2">{weather.weather[0].description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <WeatherDetailCard title="Humidity" value={`${weather.main.humidity}%`} icon="💧" />
                <WeatherDetailCard title="Wind Speed" value={`${weather.wind.speed} m/s`} icon="💨" />
                <WeatherDetailCard title="Pressure" value={`${weather.main.pressure} hPa`} icon="⏲️" />
                <WeatherDetailCard title="Feels Like" value={`${Math.round(weather.main.feels_like)}°C`} icon="🌡️" />
                <WeatherDetailCard title="Temp Max" value={`${Math.round(weather.main.temp_max)}°C`} icon="📈" />
                <WeatherDetailCard title="Temp Min" value={`${Math.round(weather.main.temp_min)}°C`} icon="📉" />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white/30 rounded-[3rem] border border-dashed border-gray-400">
               <div className="text-7xl mb-6">🌤️</div>
               <h2 className="text-2xl font-bold">Ready to check the weather?</h2>
               <p className="text-gray-500 mt-2">Search for a city or use your location to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;