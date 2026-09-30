import { BACKEND_URL } from '../../api';
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Eye, Wind } from 'lucide-react';

export default function WeatherAnalysis() {
 const [weather, setWeather] = useState(null);
 const [weatherError, setWeatherError] = useState('');
 const [station] = useState(() => localStorage.getItem('activeStation') || 'maitri');

 useEffect(() => {
  let active = true;
  const controller = new AbortController();
  const loadWeather = async () => {
   try {
    const response = await fetch(`${BACKEND_URL}/api/v1/aws/current?station=${station}`, { signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Live weather unavailable');
    if (active) {
     setWeather(data);
     setWeatherError('');
    }
   } catch (error) {
    if (active && error.name !== 'AbortError') setWeatherError(error.message || 'Live weather unavailable');
   }
  };

  loadWeather();
  const refreshTimer = setInterval(loadWeather, 15 * 60 * 1000);
  return () => {
   active = false;
   controller.abort();
   clearInterval(refreshTimer);
  };
 }, [station]);

 const windForecast = weather?.wind_forecast || [];

 return (
  <div className="bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border border-border/50 rounded-2xl p-4 sm:p-6 min-h-full flex flex-col">
    <div className="flex items-center justify-between gap-3 mb-6">
     <h2 className="text-[var(--accent-primary)] font-['Space_Grotesk'] font-bold text-2xl tracking-wide">WEATHER ANALYSIS</h2>
     <span className={`text-[10px] font-mono ${weather?.stale ? 'text-amber-400' : weather ? 'text-[var(--ok)]' : 'text-[var(--text-secondary)]'}`}>
      {weather?.stale ? 'STALE WEATHER' : weather ? `${weather.station} · ${weather.source}` : 'LOADING WEATHER'}
     </span>
    </div>
    {weatherError && <p role="alert" className="mb-4 text-xs text-[var(--critical)]">{weatherError}</p>}

   {/* Current Stats */}
   <div className="flex flex-col sm:flex-row gap-4 mb-8 text-[var(--text-primary)] font-['Work_Sans']">
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md p-4 rounded-xl border border-border/50">
     <div className="flex items-center gap-2 mb-2">
      <Thermometer size={18} className="text-[var(--accent-primary)]" />
      <span className="text-[var(--text-secondary)]">Temp</span>
     </div>
    <span className="text-[var(--accent-primary)] font-bold text-2xl">{weather ? `${weather.temperature.toFixed(1)}°C` : '—'}</span>
    </div>

    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md p-4 rounded-xl border border-border/50">
     <div className="flex items-center gap-2 mb-2">
      <Eye size={18} className="text-[var(--accent-primary)]" />
      <span className="text-[var(--text-secondary)]">Visibility</span>
     </div>
    <span className="text-[var(--accent-primary)] font-bold text-2xl">{Number.isFinite(weather?.visibility_km) ? `${weather.visibility_km.toFixed(1)} km` : '—'}</span>
    </div>

    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md p-4 rounded-xl border border-border/50">
     <div className="flex items-center gap-2 mb-2">
      <Wind size={18} className="text-[var(--critical)]" />
      <span className="text-[var(--text-secondary)]">Wind</span>
     </div>
    <span className="text-[var(--critical)] font-bold text-2xl">{weather ? `${weather.wind_kmh.toFixed(0)} km/h` : '—'}</span>
    </div>
   </div>

   {/* 7-Day Forecast Graph */}
     <h3 className="text-[var(--text-secondary)] font-bold text-sm mb-4 uppercase tracking-wider">7-Day Wind Speed Forecast (km/h)</h3>
   <div className="flex-1 w-full mt-2">
        {windForecast.length > 0 ? <ResponsiveContainer width="100%" height={300}>
         <AreaChart data={windForecast} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
      <defs>
       <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
       </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
      <XAxis dataKey="day" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} dy={10} />
      <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
      <Tooltip
       contentStyle={{ backgroundColor: 'var(--bg-panel-raised)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
       itemStyle={{ fontWeight: 'bold' }}
      />
      <Area type="monotone" dataKey="wind" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorWind)" strokeWidth={2} />
     </AreaChart>
    </ResponsiveContainer> : <p className="py-12 text-center text-xs text-[var(--text-secondary)]">{weatherError || 'Waiting for forecast data.'}</p>}
   </div>
  </div>
 );
}