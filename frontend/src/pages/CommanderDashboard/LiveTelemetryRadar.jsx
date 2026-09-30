import { useState, useEffect } from 'react';
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Radio, Activity, Zap, Thermometer } from 'lucide-react';
import { getWsUrl, BACKEND_URL } from '../../api';

const generateInitialData = () => {
 return Array.from({ length: 20 }, (_, i) => {
  const sec = 20 - i;
  return {
   time: `-${sec}s`,
   temp: Number((-45 + (Math.sin(i * 0.5) * 2.5)).toFixed(1)),
   power: Math.round(95 + (Math.cos(i * 0.5) * 3)),
  };
 });
};

export default function LiveTelemetryRadar() {
 const [data, setData] = useState(generateInitialData);
 const [systemStatus, setSystemStatus] = useState('NOMINAL');

 // Real-Time 1000ms telemetry data stream
 useEffect(() => {
  let ws = new WebSocket(getWsUrl('/telemetry'));
  
  ws.onmessage = (event) => {
   try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'telemetry') {
     const { temp, power, time } = msg.data;
     if (temp !== undefined && power !== undefined) {
      setData((prev) => {
       const newPoint = { time: time || new Date().toLocaleTimeString('en-GB'), temp, power };
       return [...prev.slice(1), newPoint];
      });
      if (power < 85) setSystemStatus('CRITICAL');
      else setSystemStatus('NOMINAL');
     }
    }
   } catch (e) {}
  };

  const interval = setInterval(() => {
   const now = new Date();
   const timeStr = now.toLocaleTimeString('en-GB');
   const temp = Number((-42 - Math.random() * 6).toFixed(1));
   const hasPowerDip = Math.random() > 0.95;
   const power = hasPowerDip ? 75 : Math.round(88 + Math.random() * 12);

   fetch(`${BACKEND_URL}/api/v1/telemetry/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temp, power, time: timeStr, node_id: 'radar-1', status: power < 85 ? 'CRITICAL' : 'NOMINAL' })
   }).catch(() => {}); // ignore fetch errors to avoid spamming console
  }, 1000);

  return () => {
   clearInterval(interval);
   if (ws.readyState === 1) ws.close();
  };
 }, []);

 const latestPoint = data[data.length - 1] || { temp: -45, power: 95 };

 return (
  <div className="bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--border)] rounded-xl p-6 min-h-full flex flex-col">
   {/* Header and Live Badge */}
   <div className="flex items-center justify-between mb-4">
    <div>
     <h2 className="text-[var(--accent-primary)] font-['Space_Grotesk'] font-bold text-2xl tracking-wide">
      LIVE TELEMETRY RADAR
     </h2>
    </div>

    {/* Live Stream Active Badge */}
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--border)] text-xs font-mono">
     <Radio size={14} className="text-[var(--accent-primary)] animate-pulse" />
     <span className="text-[var(--text-primary)] font-semibold">Live Stream Active</span>
     <span className="w-2 h-2 rounded-full bg-[var(--ok)] animate-ping ml-1"></span>
    </div>
   </div>

   {/* Dynamic Warning Alert on Critical Grid Drop */}
   <AnimatePresence>
    {systemStatus === 'CRITICAL' && (
     <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-red-500/20 border border-[var(--critical)] text-[var(--critical)] p-3 rounded-lg flex items-center justify-between gap-2 mb-4 animate-pulse"
     >
      <div className="flex items-center gap-2">
       <AlertTriangle size={18} className="shrink-0" />
       <span className="font-bold text-sm tracking-wide">
        WARNING: GRID VOLTAGE DROP DETECTED — AUXILIARY COLD LOAD TRIP IMMINENT
       </span>
      </div>
      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--critical)] text-[var(--text-primary)]">
       VOLTAGE &lt; 85%
      </span>
     </motion.div>
    )}
   </AnimatePresence>

   {/* Current Real-Time Sensor Metrics */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 font-['Work_Sans']">
    <div className="flex items-center gap-3 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] px-4 py-3 rounded-lg border border-[var(--border)]">
     <div className="p-2 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
      <Thermometer size={18} />
     </div>
     <div>
      <p className="text-[var(--text-secondary)] text-[10px] uppercase font-semibold">Core Temp</p>
      <p className="text-[var(--accent-primary)] font-bold text-xl font-mono">{latestPoint.temp}°C</p>
     </div>
    </div>

    <div className="flex items-center gap-3 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] px-4 py-3 rounded-lg border border-[var(--border)]">
     <div className={`p-2 rounded ${latestPoint.power < 85 ? 'bg-[var(--critical)]/20 text-[var(--critical)]' : 'bg-[var(--ok)]/10 text-[var(--ok)]'}`}>
      <Zap size={18} />
     </div>
     <div>
      <p className="text-[var(--text-secondary)] text-[10px] uppercase font-semibold">Grid Stability</p>
      <p className={`font-bold text-xl font-mono ${latestPoint.power < 85 ? 'text-[var(--critical)]' : 'text-[var(--ok)]'}`}>
       {latestPoint.power}%
      </p>
     </div>
    </div>

    <div className="flex items-center gap-3 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] px-4 py-3 rounded-lg border border-[var(--border)]">
     <div className="p-2 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
      <Activity size={18} />
     </div>
     <div>
      <p className="text-[var(--text-secondary)] text-[10px] uppercase font-semibold">Stream Status</p>
      <p className={`font-bold text-sm uppercase ${systemStatus === 'CRITICAL' ? 'text-[var(--critical)]' : 'text-[var(--ok)]'}`}>
       {systemStatus}
      </p>
     </div>
    </div>

    <div className="flex items-center gap-3 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] px-4 py-3 rounded-lg border border-[var(--border)]">
     <div className="p-2 rounded bg-[var(--text-secondary)]/10 text-[var(--text-secondary)]">
      <Radio size={18} />
     </div>
     <div>
      <p className="text-[var(--text-secondary)] text-[10px] uppercase font-semibold">Sampling Window</p>
      <p className="text-[var(--text-primary)] font-bold text-sm font-mono">20s Rolling (1Hz)</p>
     </div>
    </div>
   </div>

   {/* Real-time Streaming Recharts Chart */}
   <div className="w-full mt-8" style={{ height: '400px' }}>
    <ResponsiveContainer width="100%" height="100%">
     <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.5} />
      <XAxis
       dataKey="time"
       stroke="var(--text-secondary)"
       tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
       tickLine={false}
       axisLine={false}
       dy={10}
      />
      <YAxis
       stroke="var(--text-secondary)"
       tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
       tickLine={false}
       axisLine={false}
       dx={-10}
       domain={[-60, 110]}
      />
      <Tooltip
       contentStyle={{
        backgroundColor: 'var(--bg-panel-raised)',
        borderColor: 'var(--border)',
        borderRadius: '8px',
        color: 'var(--text-primary)',
        fontFamily: 'monospace',
       }}
       itemStyle={{ fontWeight: 'bold' }}
      />
      {/* Critical Failure Threshold Line */}
      <ReferenceLine
       y={85}
       stroke="var(--critical)"
       strokeDasharray="3 3"
       strokeWidth={1.5}
       label={{
        value: 'CRITICAL FAILURE THRESHOLD (85%)',
        fill: 'var(--critical)',
        position: 'insideBottomRight',
        fontSize: 10,
        fontWeight: 'bold',
       }}
      />
      <Line
       type="monotone"
       dataKey="temp"
       name="Core Temp (°C)"
       stroke="var(--accent-primary)"
       strokeWidth={2.5}
       dot={false}
       isAnimationActive={false}
      />
      <Line
       type="monotone"
       dataKey="power"
       name="Power Grid (%)"
       stroke="var(--ok)"
       strokeWidth={2.5}
       dot={false}
       isAnimationActive={false}
      />
     </LineChart>
    </ResponsiveContainer>
   </div>
  </div>
 );
}