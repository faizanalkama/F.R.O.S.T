import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
import { BACKEND_URL } from '../../api';
  Activity,
  ArrowLeft,
  CloudRain,
  Gauge,
  MapPin,
  Thermometer,
  Users,
  Wind,
  Zap,
} from 'lucide-react';

const API_BASE = `${BACKEND_URL}/api/v1`;

function StationCard({ station, isSelected, onSelect }) {
  const [liveTemp, setLiveTemp] = useState(null);

  useEffect(() => {
    let lat, lon;
    if (station.id === 'maitri') { lat = -70.766; lon = 11.733; }
    else if (station.id === 'bharati') { lat = -69.400; lon = 76.200; }
    else if (station.id === 'himadri') { lat = 78.933; lon = 11.933; }

    if (!lat || !lon) return;

    let active = true;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`)
      .then(res => res.json())
      .then(data => {
        if (active && data.current?.temperature_2m !== undefined) {
          setLiveTemp(data.current.temperature_2m);
        }
      })
      .catch(err => console.error('Failed to fetch live temp:', err));
    
    return () => { active = false; };
  }, [station.id]);

  const displayTemp = liveTemp !== null ? liveTemp : station.temp;

  return (
    <button
      type="button"
      onClick={() => onSelect(station.id)}
      className={`w-full h-full text-left bg-slate-900/70 border backdrop-blur-sm rounded-xl p-5 flex flex-col gap-5 transition-all duration-300 ease-out cursor-pointer ${
        isSelected
          ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.15)] -translate-y-0.5'
          : 'border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:-translate-y-0.5'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="tracking-widest text-white font-extrabold text-4xl uppercase font-['Space_Grotesk'] drop-shadow-md">{station.name}</h3>
          <p className="text-cyan-400/80 text-sm mt-2 font-mono tracking-wide">{station.coords}</p>
          <p className="text-cyan-400/80 text-sm mt-1 font-mono tracking-wide">{station.region}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
            {station.status}
          </span>
        </div>
      </div>

      {/* Metrics Section (Vertical Stack) */}
      <div className="flex flex-col gap-3 mt-auto">
        
        {/* Row 1: Station Crew */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-cyan-400" />
            <span className="text-slate-300 text-xs font-semibold tracking-wider uppercase">Crew Complement</span>
          </div>
          <div className="text-slate-100 font-bold text-sm font-mono">
            {station.crew} Assigned
          </div>
        </div>

        {/* Row 2: Surface Temperature */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 flex items-center justify-between">
          <div className="flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-cyan-400" />
              <span className="text-slate-300 text-xs font-semibold tracking-wider uppercase">Surface Temp</span>
            </div>
          </div>
          <div className="flex flex-col items-end justify-center">
            <div className="text-slate-100 font-bold text-sm font-mono">
              {liveTemp === null ? (
                <span className="animate-pulse text-slate-500">--.-°C</span>
              ) : (
                `${displayTemp.toFixed(1)}°C`
              )}
            </div>
            <span className="text-slate-500 text-[9px] uppercase tracking-widest mt-0.5">Live Open-Meteo</span>
          </div>
        </div>

        {/* Row 3: Power Grid Stability */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-cyan-400" />
              <span className="text-slate-300 text-xs font-semibold tracking-wider uppercase">Grid Stability</span>
            </div>
            <div className="text-cyan-400 font-bold text-sm font-mono">
              {station.power}%
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-400 rounded-full transition-all duration-500" 
              style={{ width: `${station.power}%` }}
            />
          </div>
        </div>

      </div>
    </button>
  );
}

function DetailPanel({ station, onBack }) {
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveRoster, setLiveRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadWeather = async () => {
      try {
        let lat, lon;
        if (station.id === 'maitri') { lat = -70.766; lon = 11.733; }
        else if (station.id === 'bharati') { lat = -69.400; lon = 76.200; }
        else if (station.id === 'himadri') { lat = 78.933; lon = 11.933; }
        
        if (!lat || !lon) return;

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,visibility`;
        const response = await fetch(url);
        const data = await response.json();
        if (active && data.current) setLiveWeather(data.current);
      } catch (e) {
        console.error('Failed to load detail weather', e);
      }
    };
    loadWeather();
    const interval = setInterval(loadWeather, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [station.id]);

  useEffect(() => {
    let active = true;
    setRosterLoading(true);
    const loadRoster = async () => {
      try {
        const stationName = station.name.split(' ')[0];
        const res = await fetch(`${BACKEND_URL}/api/stations/${stationName}/roster`);
        const data = await res.json();
        if (active && data.success) {
          setLiveRoster(data.roster);
        }
      } catch (e) {
        console.error('Failed to load roster:', e);
      } finally {
        if (active) setRosterLoading(false);
      }
    };
    loadRoster();
    return () => { active = false; };
  }, [station.name]);

  if (!station) return null;

  return (
    <div className="bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--border)] rounded-xl p-5">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> Back to centers
      </button>
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.2em]">Selected center</p>
          <h3 className="mt-2 text-[var(--text-primary)] font-['Space_Grotesk'] text-2xl font-bold">{station.name}</h3>
          <p className="mt-1 text-[var(--text-secondary)] text-sm font-mono">{station.region}</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[var(--ok)] text-xs font-semibold">
            <Activity size={12} />
            {station.status}
          </div>
          <p className="mt-2 text-[var(--text-secondary)] text-xs">{station.leader}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-5">
        <div className="space-y-5">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <div className="flex items-center gap-2 text-[var(--accent-primary)] font-semibold text-sm uppercase tracking-[0.12em]">
              <Users size={15} />
              Active rosters
            </div>
            <div className="mt-4 space-y-2.5">
              {rosterLoading ? (
                <div className="text-center py-4">
                  <p className="text-[var(--text-secondary)] text-sm animate-pulse">Loading roster feed...</p>
                </div>
              ) : liveRoster.length === 0 ? (
                <div className="text-center py-6 px-4 bg-[var(--bg-panel-raised)] rounded-md border border-[var(--border)] border-dashed">
                  <p className="text-[var(--text-secondary)] text-sm">
                    No personnel actively deployed to this station. Assign team members via User Roster.
                  </p>
                </div>
              ) : (
                liveRoster.map((member) => (
                  <div key={member.name} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg-panel-raised)] px-3 py-2">
                    <div>
                      <p className="text-[var(--text-primary)] text-sm font-medium">{member.name}</p>
                      <p className="text-[var(--text-secondary)] text-xs">{member.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.12em]">{member.shift}</p>
                      <p className="text-[var(--ok)] text-xs font-medium">{member.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <div className="flex items-center gap-2 text-[var(--accent-primary)] font-semibold text-sm uppercase tracking-[0.12em]">
              <CloudRain size={15} />
              Current weather
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-xs">Temp</span>
                <span className="text-[var(--text-primary)] text-sm font-medium font-mono">
                  {liveWeather ? `${liveWeather.temperature_2m.toFixed(1)}°C` : '--.-°C'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-xs">Wind</span>
                <span className="text-[var(--text-primary)] text-sm font-medium font-mono">
                  {liveWeather ? `${liveWeather.wind_speed_10m.toFixed(1)} km/h` : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-xs">Humidity</span>
                <span className="text-[var(--text-primary)] text-sm font-medium font-mono">
                  {liveWeather ? `${liveWeather.relative_humidity_2m.toFixed(0)}%` : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-xs">Visibility</span>
                <span className="text-[var(--text-primary)] text-sm font-medium font-mono">
                  {liveWeather && liveWeather.visibility !== undefined ? `${(liveWeather.visibility / 1000).toFixed(1)} km` : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-xs">Pressure</span>
                <span className="text-[var(--text-primary)] text-sm font-medium font-mono">
                  {liveWeather ? `${liveWeather.surface_pressure.toFixed(0)} hPa` : '--'}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg-panel-raised)] px-3 py-2">
              <span className="flex items-center gap-2 text-[var(--text-secondary)] text-xs"><Wind size={12} /> Live API Link</span>
              <span className="text-[var(--ok)] font-semibold text-xs">{liveWeather ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <div className="flex items-center gap-2 text-[var(--accent-primary)] font-semibold text-sm uppercase tracking-[0.12em]">
              <Gauge size={15} />
              Site logistics
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Battery reserve</span>
                <span className="text-[var(--text-primary)] font-medium font-mono">{station.logistics?.batteryReserve || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Sensor health</span>
                <span className="text-[var(--text-primary)] font-medium">{station.logistics?.sensorHealth || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Next maintenance</span>
                <span className="text-[var(--text-primary)] font-medium text-right">{station.logistics?.nextMaintenance || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Runway status</span>
                <span className="text-[var(--text-primary)] font-medium">{station.logistics?.runwayStatus || '--'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResearchCenters() {
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCenters = async () => {
      try {
        const res = await fetch(`${API_BASE}/research-centers`);
        const data = await res.json();
        setStations(data);
      } catch (error) {
        console.error('Failed to load research centers', error);
      } finally {
        setLoading(false);
      }
    };

    loadCenters();
  }, []);

  const selectedStation = stations.find((station) => station.id === selectedStationId);

  return (
    <div className="bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--border)] rounded-xl p-6 h-full flex flex-col overflow-y-auto">
      <h2 className="text-[var(--accent-primary)] font-['Space_Grotesk'] font-bold text-2xl mb-6 tracking-wide">
        RESEARCH CENTERS
      </h2>

      {loading ? (
        <div className="text-[var(--text-secondary)] text-sm">Loading centers…</div>
      ) : (
        <AnimatePresence mode="wait">
          {selectedStation ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <DetailPanel station={selectedStation} onBack={() => setSelectedStationId(null)} />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, x: -20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {stations.map((station) => (
                  <StationCard
                    key={station.id}
                    station={station}
                    isSelected={false}
                    onSelect={setSelectedStationId}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
